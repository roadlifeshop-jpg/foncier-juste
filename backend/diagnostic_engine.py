"""
Foncier·Juste — moteur de pré-diagnostic.

SOURCE DE VÉRITÉ DES RÈGLES MÉTIER
==================================
Ce module et le moteur JavaScript embarqué dans `web/index.html` appliquent
EXACTEMENT les mêmes règles, sur les mêmes données agrégées
(`web/market_stats/<dept>.json`). Toute divergence est un bug.

Les deux implémentations existent pour une raison : le diagnostic doit être
calculé dans le navigateur du visiteur (ses réponses ne partent sur aucun
serveur), tandis que le dépouillement des tests T1 et les tests de
non-régression se font hors ligne, en Python. Il n'y a donc pas une règle
« du site » et une règle « des tests » : il y a une règle, écrite deux fois,
et `backend/test_parite_moteurs.py` vérifie qu'elles ne divergent pas.

Toute modification d'une règle ici DOIT être répercutée dans `web/index.html`,
et inversement. Les points de synchronisation sont signalés par le marqueur
« PARITÉ » dans les deux fichiers.

Ce que ce module fait, et ne fait pas
-------------------------------------
- Il applique des règles transparentes et explicables — jamais de boîte noire.
- Il ne calcule PAS une valeur locative cadastrale : seule l'administration
  fiscale peut le faire.
- Sans la fiche d'évaluation 6675-M, il n'effectue AUCUNE comparaison de
  surface : la surface retenue par l'administration ne figure sur aucun autre
  document, et comparer une surface mesurée à un chiffre approximatif
  fabriquerait un signal qui n'existe pas.
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
    sur les valeurs à mi-chemin — une divergence invisible mais réelle.
    """
    if x < 0:
        return "-" + fixed0(-x)
    return str(int(math.floor(x + 0.5)))


# --------------------------------------------------------------------------
# Données de marché agrégées — identiques à celles servies au navigateur
# --------------------------------------------------------------------------

BUCKET = 20  # PARITÉ : const BUCKET dans web/index.html

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
    """PARITÉ : fonction `comparablesAgreges` de web/index.html.

    Élargit le rayon de recherche par paliers d'une tranche de 20 m² jusqu'à
    réunir au moins 5 transactions, puis renvoie leur nombre et le prix médian
    pondéré par les effectifs de chaque tranche.
    """
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
# Entrée utilisateur — miroir exact du questionnaire du site
# --------------------------------------------------------------------------

@dataclass
class UserInput:
    code_commune: str
    code_dept: str
    nom_commune: str
    type_local: str                       # "Maison" ou "Appartement"

    # Étape 2 du questionnaire.
    a_la_fiche: bool                      # la fiche 6675-M est-elle sous les yeux ?
    surface_reelle_actuelle_m2: float     # surface habitable mesurée aujourd'hui
    source_surface: str = "acte"          # "mesuree" | "acte" | "estimee"
    surface_fiche_m2: Optional[float] = None
    # ^ ligne « surface réelle » de la fiche 6675-M — JAMAIS la surface
    #   pondérée, qui dépasse normalement la surface mesurée de 20 à 40 %.

    # Étape 3.
    elements_confort_factures: list[str] = field(default_factory=list)
    elements_confort_existants: list[str] = field(default_factory=list)

    # Étape 4 (facultative) : n'intervient que dans le chiffrage, jamais dans
    # la détection.
    taxe_fonciere_annuelle_eur: Optional[float] = None


# --------------------------------------------------------------------------
# Niveaux de confiance
# --------------------------------------------------------------------------
# PARITÉ : constante CONFIANCE_SURFACE de web/index.html.

CONFIANCE_SURFACE = {
    "mesuree": {
        "niveau": "elevee",
        "texte": "Élevée — surface que vous avez mesurée vous-même.",
    },
    "acte": {
        "niveau": "moyenne",
        "texte": (
            "Modérée — la surface d’un acte de vente (loi Carrez) ne retient pas "
            "exactement les mêmes espaces que l’évaluation fiscale. L’écart reste "
            "exploitable, mais devra être confirmé par une mesure."
        ),
    },
    "estimee": {
        "niveau": "faible",
        "texte": (
            "Faible — surface estimée de mémoire. Ce constat ne suffit pas à fonder "
            "une réclamation : mesurez avant d’aller plus loin."
        ),
    },
}

CONFIANCE_CONFORT_AVEC_FICHE = {
    "niveau": "elevee",
    "texte": "Élevée — éléments relevés directement sur votre fiche d’évaluation.",
}
CONFIANCE_CONFORT_SANS_FICHE = {
    "niveau": "faible",
    "texte": (
        "Faible — vous avez répondu de mémoire. Ce que l’administration facture "
        "réellement ne figure que sur la fiche 6675-M ; tant que vous ne l’avez pas "
        "lue, ce constat reste une hypothèse."
    ),
}
CONFIANCE_MARCHE = {
    "niveau": "contexte",
    "texte": "Élément de contexte, versable à un dossier. Ce n’est pas un motif de réclamation.",
}


# --------------------------------------------------------------------------
# Règles de détection
# --------------------------------------------------------------------------
# PARITÉ : seuils identiques à web/index.html. NE PAS MODIFIER sans décision
# explicite : ils sont en cours de validation par le test T1.

SURFACE_ECART_SEUIL_M2 = 5.0
SURFACE_ECART_SEUIL_PCT = 5.0
SURFACE_GRAVITE_HAUTE_PCT = 15.0


def _check_surface(u: UserInput) -> Optional[dict]:
    """Règle 1 — surface.

    Évaluée UNIQUEMENT lorsque la fiche 6675-M fournit le chiffre de référence.
    Sans elle il n'existe aucune surface administrative comparable : la surface
    retenue ne figure ni sur l'avis d'imposition, ni sur l'acte de vente.
    """
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
        "figure": f"+{fixed0(ecart)} m² · {fixed0(ecart_pct)} %",
        "confiance": conf,
        "message": (
            f"La surface réelle retenue sur la fiche ({fixed0(u.surface_fiche_m2)} m²) "
            f"dépasse de {fixed0(ecart)} m² ({fixed0(ecart_pct)} %) la surface habitable "
            f"actuelle déclarée ({fixed0(u.surface_reelle_actuelle_m2)} m²)."
        ),
    }


def _check_elements_confort(u: UserInput) -> Optional[dict]:
    """Règle 2 — éléments de confort disparus.

    Évaluable dans les deux modes : la disparition d'un élément est un fait que
    le propriétaire connaît. Mais sans la fiche, il ne sait pas ce qui lui est
    réellement facturé — d'où une confiance faible, qui n'ouvre pas la vente.
    """
    obsoletes = [e for e in u.elements_confort_factures if e not in u.elements_confort_existants]
    if not obsoletes:
        return None
    return {
        "code": "elements_confort_obsoletes",
        "gravite": "haute" if len(obsoletes) > 1 else "moyenne",
        "kind": "Éléments de confort",
        "figure": " · ".join(o.capitalize() for o in obsoletes),
        "confiance": CONFIANCE_CONFORT_AVEC_FICHE if u.a_la_fiche else CONFIANCE_CONFORT_SANS_FICHE,
        "message": (
            "Ces éléments sont pris en compte dans votre évaluation mais n'existeraient "
            f"plus : {', '.join(obsoletes)}."
        ),
    }


def _check_contexte_marche(u: UserInput, comps: Optional[dict]) -> Optional[dict]:
    """Règle 3 — contexte de marché.

    Jamais un motif de réclamation, et aucun chiffre publié sur un échantillon
    de moins de 5 transactions.
    """
    if not comps or comps["n"] < 5:
        return None
    return {
        "code": "contexte_marche",
        "gravite": "info",
        "kind": "Contexte de marché",
        "figure": f"{fixed0(comps['prix_median'])} €/m² médian",
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
    """PARITÉ : bloc `classif` de web/index.html.

    Le score reste calculé en interne — il sert de référence partagée entre les
    deux moteurs — mais n'est plus affiché : il ne peut prendre que huit valeurs
    distinctes, ce qui donnait une impression de précision inexistante.
    """
    if score >= 40:
        return {"cle": "fort", "label": "Vérification fortement recommandée"}
    if score >= 20:
        return {"cle": "modere", "label": "Vérification recommandée"}
    return {"cle": "aucun", "label": "Aucun élément notable détecté"}


def vente_autorisee(anomalies: list[dict]) -> bool:
    """PARITÉ : fonction `venteAutorisee` de web/index.html.

    Deux conditions cumulatives : un écart réel, et une donnée assez fiable pour
    fonder un dossier. La seconde implique la fiche 6675-M, que la réclamation
    exige de produire en pièce jointe.
    """
    return any(
        a["gravite"] in ("haute", "moyenne")
        and a.get("confiance", {}).get("niveau") in ("elevee", "moyenne")
        for a in anomalies
    )


# --------------------------------------------------------------------------
# Estimation d'impact
# --------------------------------------------------------------------------

def estimate_impact_eur(u: UserInput, anomalies: list[dict]) -> Optional[dict]:
    """PARITÉ : fonction `calculerImpact` de web/rapport.js."""
    if not u.taxe_fonciere_annuelle_eur or not anomalies:
        return None
    haute = any(a["gravite"] == "haute" for a in anomalies)
    moyenne = any(a["gravite"] == "moyenne" for a in anomalies)
    if haute:
        pct_low, pct_high = 8, 20
    elif moyenne:
        pct_low, pct_high = 3, 10
    else:
        return None
    return {
        "eur_min": round(u.taxe_fonciere_annuelle_eur * pct_low / 100),
        "eur_max": round(u.taxe_fonciere_annuelle_eur * pct_high / 100),
        "avertissement": (
            "Fourchette indicative basée sur la gravité des écarts détectés, "
            "pas sur un recalcul officiel de la valeur locative cadastrale."
        ),
    }


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
        "impact_estime_eur_par_an": estimate_impact_eur(u, anomalies),
        "prochaine_etape": (
            "Demandez votre fiche d'évaluation (formulaire 6675-M) sur impots.gouv.fr : "
            "sans elle, aucune comparaison de surface n'est possible."
            if not u.a_la_fiche else
            "Vérifiez la catégorie de confort sur votre fiche, puis réunissez vos "
            "justificatifs avant tout dépôt de réclamation."
        ),
    }
