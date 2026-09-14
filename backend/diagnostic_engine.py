"""
Foncier Juste — moteur de pré-diagnostic (prototype).

IMPORTANT — ce que ce module fait et ne fait PAS :
- Il calcule un SCORE INDICATIF de vigilance à partir de règles transparentes
  (écarts de surface, éléments de confort obsolètes, cohérence avec le marché
  local). Ce n'est PAS un calcul officiel de valeur locative cadastrale et ne
  remplace pas une vérification par les services fiscaux ou un professionnel.
- Il compare la situation déclarée par l'utilisateur à des TRANSACTIONS
  IMMOBILIÈRES RÉELLES ET PUBLIQUES (source : DVF / data.gouv.fr, extraction
  du 14/09/2026 pour Nantes et communes limitrophes, département 44).
  C'est un indicateur de plausibilité, pas une preuve.
- Toute anomalie détectée doit être confirmée par la fiche d'évaluation
  officielle (formulaire 6675-M, disponible sur impots.gouv.fr) avant tout
  dépôt de réclamation.

Usage :
    from diagnostic_engine import load_comparables, run_diagnostic

    comparables = load_comparables("../data/dvf_nantes_2023.csv")
    resultat = run_diagnostic(user_input, comparables)
"""

from __future__ import annotations

import csv
import statistics
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# --------------------------------------------------------------------------
# Chargement des données publiques (DVF)
# --------------------------------------------------------------------------

def load_comparables(csv_path: str | Path) -> list[dict]:
    """Charge les transactions immobilières réelles (DVF) depuis le CSV filtré."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            row["surface_m2"] = float(row["surface_m2"])
            row["pieces"] = float(row["pieces"])
            row["valeur_fonciere"] = float(row["valeur_fonciere"])
            row["prix_m2"] = float(row["prix_m2"])
            rows.append(row)
    return rows


def find_comparables(
    data: list[dict],
    code_commune: str,
    type_local: str,
    surface_m2: float,
    tolerance_pct: float = 20.0,
    min_results: int = 5,
) -> list[dict]:
    """Retourne les transactions comparables (même commune, même type, surface proche).

    Élargit progressivement la tolérance de surface si trop peu de résultats,
    pour toujours renvoyer un échantillon exploitable quand la donnée existe.
    """
    tol = tolerance_pct
    for _ in range(4):
        low, high = surface_m2 * (1 - tol / 100), surface_m2 * (1 + tol / 100)
        matches = [
            r for r in data
            if r["code_commune"] == code_commune
            and r["type_local"] == type_local
            and low <= r["surface_m2"] <= high
        ]
        if len(matches) >= min_results:
            return matches
        tol += 15
    return matches  # meilleur échantillon trouvé, même s'il est petit


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
# Entrée utilisateur (ce que le questionnaire du site doit collecter)
# --------------------------------------------------------------------------

@dataclass
class UserInput:
    code_commune: str
    type_local: str  # "Maison" ou "Appartement"
    surface_cadastrale_m2: float  # surface utilisée pour calculer la taxe actuelle
    surface_reelle_actuelle_m2: float  # surface réelle du bien aujourd'hui
    elements_confort_factures: list[str] = field(default_factory=list)
    # ex: ["piscine", "garage", "dependance"] déjà comptés dans le calcul actuel
    elements_confort_existants: list[str] = field(default_factory=list)
    # ex: ["garage"] -> la piscine et la dépendance facturées n'existent plus / jamais existé
    taxe_fonciere_annuelle_eur: Optional[float] = None


# --------------------------------------------------------------------------
# Règles de détection (transparentes, explicables — pas de boîte noire)
# --------------------------------------------------------------------------

SURFACE_ECART_SEUIL_M2 = 5.0
SURFACE_ECART_SEUIL_PCT = 5.0


def _check_surface(u: UserInput) -> Optional[dict]:
    ecart = u.surface_cadastrale_m2 - u.surface_reelle_actuelle_m2
    ecart_pct = (ecart / u.surface_reelle_actuelle_m2 * 100) if u.surface_reelle_actuelle_m2 else 0
    if ecart > SURFACE_ECART_SEUIL_M2 and ecart_pct > SURFACE_ECART_SEUIL_PCT:
        return {
            "code": "surface_surevaluee",
            "gravite": "haute" if ecart_pct > 15 else "moyenne",
            "message": (
                f"La surface utilisée pour votre taxe ({u.surface_cadastrale_m2:.0f} m²) "
                f"dépasse de {ecart:.0f} m² ({ecart_pct:.0f}%) la surface réelle actuelle "
                f"que vous avez déclarée ({u.surface_reelle_actuelle_m2:.0f} m²)."
            ),
        }
    return None


def _check_elements_confort(u: UserInput) -> Optional[dict]:
    obsoletes = [e for e in u.elements_confort_factures if e not in u.elements_confort_existants]
    if obsoletes:
        return {
            "code": "elements_confort_obsoletes",
            "gravite": "haute" if len(obsoletes) > 1 else "moyenne",
            "message": (
                "Ces éléments comptent dans le calcul de votre taxe mais n'existeraient "
                f"plus (ou jamais construits) selon vos réponses : {', '.join(obsoletes)}."
            ),
        }
    return None


def _check_coherence_marche(u: UserInput, stats: MarketStats) -> Optional[dict]:
    if stats.n < 5 or not u.taxe_fonciere_annuelle_eur:
        return None
    # Signal faible, à titre indicatif seulement : une surface cadastrale très
    # supérieure à ce qui se vend habituellement dans la commune pour ce type
    # de bien peut indiquer une fiche à vérifier en priorité.
    if u.surface_cadastrale_m2 > 0 and stats.prix_m2_max and u.surface_reelle_actuelle_m2 > 0:
        return {
            "code": "a_verifier_avec_marche",
            "gravite": "info",
            "message": (
                f"Sur {stats.n} transactions réelles comparables à {u.code_commune} "
                f"(même type de bien, surface proche), le prix médian observé est de "
                f"{stats.prix_m2_median:.0f} €/m². Ce repère peut aider à documenter "
                "votre réclamation mais ne prouve pas une erreur à lui seul."
            ),
        }
    return None


# --------------------------------------------------------------------------
# Estimation d'impact (prudente, fourchette basse/haute)
# --------------------------------------------------------------------------

def estimate_impact_eur(u: UserInput, anomalies: list[dict]) -> Optional[dict]:
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

def run_diagnostic(u: UserInput, data: list[dict]) -> dict:
    comparables = find_comparables(data, u.code_commune, u.type_local, u.surface_reelle_actuelle_m2)
    stats = compute_market_stats(comparables)

    anomalies = [
        a for a in (
            _check_surface(u),
            _check_elements_confort(u),
            _check_coherence_marche(u, stats),
        )
        if a
    ]

    score = min(100, sum({"haute": 40, "moyenne": 20, "info": 5}[a["gravite"]] for a in anomalies))

    return {
        "score_vigilance": score,
        "niveau": "élevé" if score >= 40 else ("moyen" if score >= 20 else "faible"),
        "anomalies": anomalies,
        "marche_local": {
            "n_transactions_comparables": stats.n,
            "prix_m2_median": stats.prix_m2_median,
        },
        "impact_estime_eur_par_an": estimate_impact_eur(u, anomalies),
        "prochaine_etape": (
            "Demandez votre fiche d'évaluation (formulaire 6675-M) sur impots.gouv.fr "
            "pour confirmer ces écarts avant toute réclamation."
            if anomalies else
            "Aucun signal détecté avec les informations fournies — ne rien réclamer sur cette seule base."
        ),
    }
