"""
Foncier·Juste — moteur de pré-diagnostic.

SOURCE DE VÉRITÉ DES RÈGLES MÉTIER
==================================
Ce module et `web/moteur.js` appliquent EXACTEMENT les mêmes règles, sur les
mêmes données agrégées (`web/market_stats/<dept>.json`). Toute divergence est
un bug, et `backend/test_parite_moteurs.py` la détecte.

Les deux implémentations existent parce que le diagnostic doit être calculé
dans le navigateur du visiteur — ses réponses ne partent sur aucun serveur
pendant le pré-diagnostic gratuit — tandis que le dépouillement du test T1 et
les tests de non-régression se font hors ligne, en Python.

Les points de synchronisation portent le marqueur « PARITÉ » dans les deux
fichiers. Toute modification d'une règle ici DOIT être répercutée là-bas.

Ce que ce module fait, et ne fait pas
-------------------------------------
- Il applique des règles transparentes et explicables — jamais de boîte noire.
- Il ne calcule PAS de valeur locative cadastrale, et n'estime AUCUN montant
  d'économie : aucune méthode fondée n'existe pour cela à partir d'un
  pré-diagnostic. Cette estimation a été retirée le 16/09/2026.
- Sans la fiche d'évaluation 6675-M, il n'effectue AUCUNE comparaison de
  surface : la surface retenue par l'administration ne figure sur aucun autre
  document.
- Une donnée incertaine ne crée jamais d'anomalie : elle dégrade le niveau de
  confiance attaché au signal.

Données de marché : DVF (data.gouv.fr), transactions 2024, 20 départements,
extraction du 15/09/2026. L'Alsace-Moselle est exclue (Livre foncier).
"""

from __future__ import annotations

import csv
import json
import math
import statistics
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

RACINE = Path(__file__).resolve().parent.parent
MARKET_STATS_DIR = RACINE / "web" / "market_stats"


# --------------------------------------------------------------------------
# Utilitaires de parité numérique
# --------------------------------------------------------------------------

def fixed0(x: float) -> str:
    """Reproduit `Number.prototype.toFixed(0)` de JavaScript.

    Python arrondit au pair le plus proche (`f"{2.5:.0f}"` donne "2"),
    JavaScript arrondit à l'écart de zéro (`(2.5).toFixed(0)` donne "3").
    Sans ce correctif, les deux moteurs produiraient des libellés différents
    sur les valeurs à mi-chemin.
    """
    if x < 0:
        return "-" + fixed0(-x)
    return str(int(math.floor(x + 0.5)))


# --------------------------------------------------------------------------
# Données de marché agrégées — identiques à celles servies au navigateur
# --------------------------------------------------------------------------

BUCKET = 20  # PARITÉ : const BUCKET dans web/moteur.js

_cache_stats: dict[str, list[dict]] = {}


def charger_market_stats(code_dept: str) -> list[dict]:
    """Charge le fichier d'agrégats servi au navigateur pour ce département."""
    if code_dept not in _cache_stats:
        chemin = MARKET_STATS_DIR / f"{code_dept}.json"
        with open(chemin, encoding="utf-8") as f:
            _cache_stats[code_dept] = json.load(f)
    return _cache_stats[code_dept]


def comparables_agreges(
    stats: list[dict], code_commune: str, type_local: str, surface: float
) -> Optional[dict]:
    """PARITÉ : fonction `comparablesAgreges` de web/moteur.js."""
    bucket_cible = math.floor(surface / BUCKET) * BUCKET
    meme_commune_type = [
        s for s in stats
        if s["code_commune"] == code_commune and s["type_local"] == type_local
    ]
    for rayon in range(0, 4):
        retenus = [
            s for s in meme_commune_type
            if abs(s["surface_bucket_min"] - bucket_cible) <= rayon * BUCKET
        ]
        n = sum(r["n"] for r in retenus)
        if n >= 5 or rayon == 3:
            if not retenus:
                return None
            total = 0.0
            for r in retenus:                       # même ordre qu'en JS
                total += r["prix_m2_median"] * r["n"]
            return {"n": n, "prix_median": total / n}
    return None


# --------------------------------------------------------------------------
# Accès aux transactions brutes — utilisé pour CONSTRUIRE les agrégats et pour
# les contrôles de cohérence du dataset, jamais par le diagnostic lui-même.
# --------------------------------------------------------------------------

def load_comparables(csv_path: str | Path) -> list[dict]:
    """Charge les transactions DVF filtrées depuis le CSV."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = []
        for row in csv.DictReader(f):
            row["surface_m2"] = float(row["surface_m2"])
            row["valeur_fonciere"] = float(row["valeur_fonciere"])
            row["prix_m2"] = float(row["prix_m2"])
            rows.append(row)
    return rows


@dataclass
class MarketStats:
    n: int
    prix_m2_median: Optional[float]
    prix_m2_min: Optional[float]
    prix_m2_max: Optional[float]


def compute_market_stats(comparables: list[dict]) -> MarketStats:
    if not comparables:
        return MarketStats(n=0, prix_m2_median=None, prix_m2_min=None, prix_m2_max=None)
    prix = sorted(c["prix_m2"] for c in comparables)
    return MarketStats(
        n=len(prix),
        prix_m2_median=round(statistics.median(prix), 2),
        prix_m2_min=round(prix[0], 2),
        prix_m2_max=round(prix[-1], 2),
    )


# --------------------------------------------------------------------------
# Entrée utilisateur — miroir exact du questionnaire du site (3 étapes)
# --------------------------------------------------------------------------

@dataclass
class UserInput:
    code_commune: str
    code_dept: str
    nom_commune: str
    type_local: str                       # "Maison" ou "Appartement"

    # Étape 2.
    a_la_fiche: bool                      # la fiche 6675-M est-elle sous les yeux ?
    surface_reelle_actuelle_m2: float     # surface habitable mesurée aujourd'hui
    source_surface: str = "acte"          # "mesuree" | "acte" | "estimee"
    surface_fiche_m2: Optional[float] = None
    # ^ ligne « surface réelle » de la fiche 6675-M — JAMAIS la surface
    #   pondérée, qui dépasse normalement la surface mesurée de 20 à 40 %.

    # Étape 3.
    elements_confort_factures: list[str] = field(default_factory=list)
    elements_confort_existants: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------
# Bornes de saisie
# --------------------------------------------------------------------------
# PARITÉ : SURFACE_MIN_M2 / SURFACE_MAX_M2 de web/moteur.js.
# Ce ne sont pas des seuils métier : ce sont les bornes de filtrage du jeu de
# données DVF (backend/build_dataset.py), donc le domaine sur lequel le
# produit sait travailler.
SURFACE_MIN_M2 = 8.0
SURFACE_MAX_M2 = 400.0


# --------------------------------------------------------------------------
# Niveaux de confiance — PARITÉ : constantes de web/moteur.js
# --------------------------------------------------------------------------

# Ces libellés décrivent la SOURCE que l'utilisateur déclare, pas la qualité de
# ce qu'il a fait. Nous n'avons aucun moyen de contrôler un relevé : dire qu'une
# mesure est fiable parce que quelqu'un déclare l'avoir faite serait une
# affirmation que nous ne pouvons pas soutenir.
CONFIANCE_SURFACE = {
    "mesuree": {
        "niveau": "elevee",
        "texte": (
            "Vous déclarez avoir mesuré cette surface vous-même. C’est la source la "
            "plus directe, mais nous ne pouvons pas contrôler votre relevé : ce "
            "constat vaut ce que vaut la mesure."
        ),
        "origine": (
            "Votre relevé, tel que vous nous l’avez communiqué, confronté au chiffre "
            "que vous avez lu sur votre fiche."
        ),
    },
    "acte": {
        "niveau": "moyenne",
        "texte": (
            "Vous déclarez tenir cette surface d’un acte de vente ou d’un diagnostic. "
            "Une surface loi Carrez ne retient pas exactement les mêmes espaces que "
            "l’évaluation fiscale : l’écart reste exploitable, mais devra être "
            "confirmé par une mesure."
        ),
        "origine": (
            "Un document que vous détenez, dont la définition de surface diffère de "
            "celle de l’administration."
        ),
    },
    "estimee": {
        "niveau": "faible",
        "texte": (
            "Vous déclarez avoir estimé cette surface de mémoire. Ce constat ne suffit "
            "pas à fonder une réclamation : mesurez avant d’aller plus loin."
        ),
        "origine": "Votre estimation. Aucun document ne l’appuie pour l’instant.",
    },
}

CONFIANCE_CONFORT_AVEC_FICHE = {
    "niveau": "elevee",
    "texte": (
        "Vous déclarez avoir lu cette information sur votre fiche d’évaluation. C’est "
        "le document qui fait foi, mais nous n’y avons pas accès : vérifiez votre "
        "relevé avant de vous en prévaloir."
    ),
    "origine": "Votre fiche 6675-M, telle que vous l’avez lue.",
}
CONFIANCE_CONFORT_SANS_FICHE = {
    "niveau": "faible",
    "texte": (
        "Vous avez répondu de mémoire, sans consulter votre fiche. Ce que "
        "l’administration prend réellement en compte n’y figure pas ailleurs : tant "
        "que vous ne l’avez pas lue, ce constat reste une hypothèse."
    ),
    "origine": "Votre déclaration seule.",
}
CONFIANCE_MARCHE = {
    "niveau": "contexte",
    "texte": (
        "Donnée publique, que vous pouvez verser à un dossier pour situer votre bien. "
        "Ce n’est pas un motif de réclamation."
    ),
    "origine": "Le fichier public DVF des ventes réellement enregistrées en 2024.",
}


# --------------------------------------------------------------------------
# Règles de détection
# --------------------------------------------------------------------------
# PARITÉ : seuils identiques à web/moteur.js. EN COURS DE VALIDATION PAR LE
# TEST T1. Ne pas modifier sans constat étayé sur de vraies fiches 6675-M.

SURFACE_ECART_SEUIL_M2 = 5.0
SURFACE_ECART_SEUIL_PCT = 5.0
SURFACE_GRAVITE_HAUTE_PCT = 15.0


def _check_surface(u: UserInput) -> Optional[dict]:
    """Règle 1 — surface. Évaluée uniquement si la fiche fournit la référence."""
    if not u.a_la_fiche:
        return None
    if not u.surface_fiche_m2 or u.surface_fiche_m2 <= 0:
        return None
    if not u.surface_reelle_actuelle_m2 or u.surface_reelle_actuelle_m2 <= 0:
        return None

    ecart = u.surface_fiche_m2 - u.surface_reelle_actuelle_m2
    ecart_pct = ecart / u.surface_reelle_actuelle_m2 * 100
    if not (ecart > SURFACE_ECART_SEUIL_M2 and ecart_pct > SURFACE_ECART_SEUIL_PCT):
        return None

    conf = CONFIANCE_SURFACE.get(u.source_surface, CONFIANCE_SURFACE["estimee"])
    return {
        "code": "surface_surevaluee",
        "gravite": "haute" if ecart_pct > SURFACE_GRAVITE_HAUTE_PCT else "moyenne",
        "kind": "Surface",
        "titre": "Les deux surfaces que vous avez saisies ne concordent pas",
        "figure": f"{fixed0(ecart)} m² · {fixed0(ecart_pct)} % de la surface mesurée",
        "vosReponses": (
            f"Vous avez relevé {fixed0(u.surface_fiche_m2)} m² sur votre fiche d'évaluation "
            f"et mesuré {fixed0(u.surface_reelle_actuelle_m2)} m² aujourd'hui."
        ),
        "calcul": (
            f"Différence : {fixed0(ecart)} m², soit {fixed0(ecart_pct)} % de la surface mesurée."
        ),
        "aVerifier": (
            "Trois explications au moins sont possibles, et une seule serait une anomalie : les "
            "deux chiffres ne couvrent peut-être pas les mêmes pièces, la fiche n'a peut-être pas "
            "été mise à jour après des travaux, ou la mesure est approximative. Commencez par "
            "vérifier lesquelles des pièces de votre logement entrent dans chacun des deux chiffres."
        ),
        "confiance": conf,
        "message": (
            f"La surface réelle relevée sur la fiche ({fixed0(u.surface_fiche_m2)} m²) dépasse "
            f"de {fixed0(ecart)} m² ({fixed0(ecart_pct)} %) la surface habitable mesurée "
            f"déclarée ({fixed0(u.surface_reelle_actuelle_m2)} m²)."
        ),
    }


def _check_elements_confort(u: UserInput) -> Optional[dict]:
    """Règle 2 — éléments de confort disparus. Évaluable dans les deux modes."""
    obsoletes = [e for e in u.elements_confort_factures if e not in u.elements_confort_existants]
    if not obsoletes:
        return None
    libelles = [o.capitalize() for o in obsoletes]
    pluriel = len(obsoletes) > 1
    return {
        "code": "elements_confort_obsoletes",
        "gravite": "haute" if pluriel else "moyenne",
        "kind": "Éléments de confort",
        "titre": (
            "Plusieurs éléments que vous avez déclarés n’existent plus" if pluriel
            else "Un élément que vous avez déclaré n’existe plus"
        ),
        "figure": " · ".join(libelles),
        # PARITÉ : mêmes textes côté JS, conditionnés de la même façon.
        # Sans la fiche, l'utilisateur n'a PAS vu ce que l'administration
        # retient : affirmer que l'élément « entre dans son évaluation » ou que
        # ses réponses « se contredisent » serait affirmer ce qu'il ne peut pas
        # savoir. On formule une hypothèse, et on dit comment la confirmer.
        "vosReponses": (
            (
                "Vous avez indiqué que ces éléments entrent dans votre évaluation alors qu'ils "
                f"n’existent plus aujourd'hui : {', '.join(obsoletes)}."
                if pluriel else
                "Vous avez indiqué que cet élément entre dans votre évaluation alors qu'il "
                f"n’existe plus aujourd'hui : {', '.join(obsoletes)}."
            ) if u.a_la_fiche else (
                "Vous avez indiqué de mémoire, sans consulter votre fiche, que ces éléments "
                f"entrent dans votre évaluation alors qu'ils n’existent plus aujourd'hui : {', '.join(obsoletes)}."
                if pluriel else
                "Vous avez indiqué de mémoire, sans consulter votre fiche, que cet élément "
                f"entre dans votre évaluation alors qu'il n’existe plus aujourd'hui : {', '.join(obsoletes)}."
            )
        ),
        "calcul": (
            (
                "Vos deux réponses se contredisent : "
                + ("ces éléments sont portés" if pluriel else "cet élément est porté")
                + " à votre évaluation mais "
                + ("n’existent plus." if pluriel else "n’existe plus.")
            ) if u.a_la_fiche else (
                "Hypothèse à confirmer, et non contradiction établie : "
                + ("SI ces éléments figurent sur votre fiche d’évaluation, ils entrent encore "
                   "dans le calcul alors qu’ils n’existent plus."
                   if pluriel else
                   "SI cet élément figure sur votre fiche d’évaluation, il entre encore dans le "
                   "calcul alors qu’il n’existe plus.")
                + " Seule la fiche permet de le savoir — demandez-la, c’est gratuit."
            )
        ),
        "aVerifier": (
            "Aucune mise à jour n'est automatique : ni une démolition, ni le comblement d'une "
            "piscine ne sont signalés d'office aux services fiscaux. Reste à confirmer, sur "
            "votre fiche, que l'élément y figure bien — et à pouvoir dater sa disparition."
        ),
        "confiance": CONFIANCE_CONFORT_AVEC_FICHE if u.a_la_fiche else CONFIANCE_CONFORT_SANS_FICHE,
        "message": (
            f"Les éléments suivants sont pris en compte dans mon évaluation alors qu'ils "
            f"n'existent plus : {', '.join(obsoletes)}."
            if pluriel else
            f"L'élément suivant est pris en compte dans mon évaluation alors qu'il "
            f"n'existe plus : {', '.join(obsoletes)}."
        ),
    }


def _check_contexte_marche(u: UserInput, comps: Optional[dict]) -> Optional[dict]:
    """Règle 3 — contexte de marché. Jamais un motif de réclamation."""
    if not comps or comps["n"] < 5:
        return None
    return {
        "code": "contexte_marche",
        "gravite": "info",
        "kind": "Contexte de marché",
        "titre": f"{comps['n']} ventes comparables à {u.nom_commune}",
        "figure": f"{fixed0(comps['prix_median'])} €/m² médian",
        "vosReponses": (
            f"Vous avez indiqué un bien de type {u.type_local.lower()} d'environ "
            f"{fixed0(u.surface_reelle_actuelle_m2)} m² à {u.nom_commune}."
        ),
        "calcul": (
            f"Prix médian de {comps['n']} ventes réellement enregistrées en 2024 pour des "
            "biens de même type et de surface voisine."
        ),
        "aVerifier": (
            "Rien, du point de vue de votre taxe. La valeur locative cadastrale repose sur des "
            "valeurs de 1970 revalorisées, pas sur les prix actuels : ce chiffre situe votre "
            "bien dans son marché, il ne dit pas si votre imposition est juste."
        ),
        "confiance": CONFIANCE_MARCHE,
        "message": (
            f"Sur {comps['n']} transactions réelles comparables à {u.nom_commune}, le prix "
            f"médian observé est de {fixed0(comps['prix_median'])} €/m². Repère utile pour "
            "documenter une réclamation, pas une preuve à lui seul."
        ),
    }


# --------------------------------------------------------------------------
# Classification et règle de vente
# --------------------------------------------------------------------------

GRAVITE_POIDS = {"haute": 40, "moyenne": 20, "info": 5}


def classifier(score: int) -> dict:
    """PARITÉ : classifier() de web/moteur.js."""
    if score >= 40:
        return {"cle": "fort", "label": "Vérification fortement recommandée"}
    if score >= 20:
        return {"cle": "modere", "label": "Vérification recommandée"}
    return {"cle": "aucun", "label": "Aucun élément notable détecté"}


# PARITÉ : CODES_NE_DECLENCHANT_PAS_LA_VENTE de web/moteur.js.
#
# Décision produit du 16/09/2026, volontairement conservatrice. Tant que le
# test T1 n'a pas établi, sur de vraies fiches, que la « surface réelle » de
# la fiche 6675-M et la surface habitable mesurée recouvrent bien le même
# périmètre, un écart de surface peut être un artefact de la question posée.
# Il reste affiché et expliqué ; il ne déclenche simplement aucune vente.
#
# À LEVER après T1 si la comparaison est validée — des deux côtés.
CODES_NE_DECLENCHANT_PAS_LA_VENTE = ("surface_surevaluee",)


def vente_autorisee(anomalies: list[dict]) -> bool:
    """PARITÉ : venteAutorisee() de web/moteur.js.

    Trois conditions cumulatives : un écart réel, une donnée assez fiable pour
    fonder un dossier (ce qui implique la fiche 6675-M, que la réclamation
    exige de produire), et un motif autre que le seul écart de surface.
    """
    return any(
        a["gravite"] in ("haute", "moyenne")
        and a.get("confiance", {}).get("niveau") in ("elevee", "moyenne")
        and a["code"] not in CODES_NE_DECLENCHANT_PAS_LA_VENTE
        for a in anomalies
    )


# --------------------------------------------------------------------------
# Point d'entrée
# --------------------------------------------------------------------------

def run_diagnostic(u: UserInput, stats: Optional[list[dict]] = None) -> dict:
    """Exécute le diagnostic complet.

    `stats` est la liste d'agrégats du département ; si elle n'est pas fournie,
    elle est chargée depuis `web/market_stats/<code_dept>.json` — le fichier
    exact que le navigateur télécharge.
    """
    if stats is None:
        try:
            stats = charger_market_stats(u.code_dept)
        except FileNotFoundError:
            stats = []

    comps = None
    if u.surface_reelle_actuelle_m2 and u.surface_reelle_actuelle_m2 > 0:
        comps = comparables_agreges(
            stats, u.code_commune, u.type_local, u.surface_reelle_actuelle_m2
        )

    anomalies = [
        a for a in (
            _check_surface(u),
            _check_elements_confort(u),
            _check_contexte_marche(u, comps),
        )
        if a
    ]

    score = min(100, sum(GRAVITE_POIDS[a["gravite"]] for a in anomalies))
    classif = classifier(score)
    reels = [a for a in anomalies if a["gravite"] != "info"]

    return {
        "score_vigilance": score,
        "niveau": "élevé" if score >= 40 else ("moyen" if score >= 20 else "faible"),
        "classification": classif["cle"],
        "classification_label": classif["label"],
        "anomalies": anomalies,
        "n_signaux_reels": len(reels),
        "vente_autorisee": vente_autorisee(anomalies),
        "marche_local": {
            "n_transactions_comparables": comps["n"] if comps else 0,
            "prix_m2_median": comps["prix_median"] if comps else None,
        },
        "prochaine_etape": (
            "Demandez votre fiche d'évaluation (formulaire 6675-M) sur impots.gouv.fr : "
            "sans elle, aucune comparaison de surface n'est possible."
            if not u.a_la_fiche else
            "Vérifiez la catégorie de confort sur votre fiche, puis réunissez vos "
            "justificatifs avant tout dépôt de réclamation."
        ),
    }
