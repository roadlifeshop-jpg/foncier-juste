"""
Test de non-régression : le moteur Python et le moteur de production
(JavaScript, embarqué dans web/index.html) doivent produire EXACTEMENT le même
résultat sur les mêmes entrées.

Comment la comparaison est produite
-----------------------------------
1. `backend/cas_parite.json` décrit les cas de test — une seule liste, lue par
   les deux moteurs, pour qu'aucun des deux ne puisse être testé sur des
   entrées différentes de l'autre.
2. Côté production, les cas sont rejoués dans un vrai navigateur, sur la vraie
   page : le formulaire est rempli, le parcours exécuté, et l'objet
   `dernierDiagnostic` capturé. Le script correspondant est
   `backend/capture_production.js` ; sa sortie est enregistrée dans
   `backend/parite_production.json`.
3. Côté Python, `resultat_normalise()` ci-dessous exécute `run_diagnostic`.
4. Les deux sorties sont réduites à la même forme normalisée, puis comparées
   champ par champ.

Usage :
    python3 -m unittest test_parite_moteurs          # compare
    python3 test_parite_moteurs.py --python-json     # sortie Python seule
    python3 test_parite_moteurs.py --table           # tableau de comparaison
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

from diagnostic_engine import UserInput, run_diagnostic

ICI = Path(__file__).resolve().parent
CAS_PATH = ICI / "cas_parite.json"
PRODUCTION_PATH = ICI / "parite_production.json"

# Champs comparés. Tout ce qui est affiché à l'utilisateur ou qui détermine une
# décision produit doit figurer ici.
CHAMPS = [
    "classification", "classification_label", "score", "vente_autorisee",
    "n_signaux_reels", "codes", "gravites", "confiances", "figures",
    "messages", "n_comparables", "prix_median", "impact_min", "impact_max",
]


def charger_cas() -> list[dict]:
    with open(CAS_PATH, encoding="utf-8") as f:
        return json.load(f)


def user_input(cas: dict) -> UserInput:
    return UserInput(
        code_commune=cas["code_commune"],
        code_dept=cas["code_dept"],
        nom_commune=cas["nom_commune"],
        type_local=cas["type_local"],
        a_la_fiche=cas["a_la_fiche"],
        surface_reelle_actuelle_m2=cas["surface_reelle"],
        source_surface=cas["source_surface"],
        surface_fiche_m2=cas["surface_fiche"],
        elements_confort_factures=cas["factures"],
        elements_confort_existants=cas["existants"],
        taxe_fonciere_annuelle_eur=cas["taxe"],
    )


def resultat_normalise(cas: dict) -> dict:
    """Exécute le moteur Python et réduit sa sortie à la forme comparable."""
    r = run_diagnostic(user_input(cas))
    anomalies = r["anomalies"]
    impact = r["impact_estime_eur_par_an"]
    prix = r["marche_local"]["prix_m2_median"]
    return {
        "classification": r["classification"],
        "classification_label": r["classification_label"],
        "score": r["score_vigilance"],
        "vente_autorisee": r["vente_autorisee"],
        "n_signaux_reels": r["n_signaux_reels"],
        "codes": [a["code"] for a in anomalies],
        "gravites": [a["gravite"] for a in anomalies],
        "confiances": [a["confiance"]["niveau"] for a in anomalies],
        "figures": [a["figure"] for a in anomalies],
        "messages": [a["message"] for a in anomalies],
        "n_comparables": r["marche_local"]["n_transactions_comparables"],
        "prix_median": round(prix, 6) if prix is not None else None,
        "impact_min": impact["eur_min"] if impact else None,
        "impact_max": impact["eur_max"] if impact else None,
    }


class TestPariteMoteurs(unittest.TestCase):
    """Compare la sortie Python à la capture du moteur de production."""

    @classmethod
    def setUpClass(cls):
        cls.cas = charger_cas()
        if not PRODUCTION_PATH.exists():
            raise unittest.SkipTest(
                f"{PRODUCTION_PATH.name} absent — rejouer backend/capture_production.js "
                "dans un navigateur sur web/index.html pour le régénérer."
            )
        with open(PRODUCTION_PATH, encoding="utf-8") as f:
            cls.production = {r["id"]: r for r in json.load(f)}

    def test_tous_les_cas_ont_ete_captures(self):
        manquants = [c["id"] for c in self.cas if c["id"] not in self.production]
        self.assertEqual(manquants, [], f"cas absents de la capture production : {manquants}")

    def test_parite_champ_par_champ(self):
        divergences = []
        for cas in self.cas:
            attendu = self.production.get(cas["id"])
            if attendu is None:
                continue
            obtenu = resultat_normalise(cas)
            for champ in CHAMPS:
                a, b = attendu.get(champ), obtenu.get(champ)
                if champ == "prix_median" and a is not None and b is not None:
                    # Flottants : même calcul, mais on tolère l'epsilon de
                    # représentation entre les deux runtimes.
                    if abs(a - b) < 1e-6:
                        continue
                if a != b:
                    divergences.append(f"{cas['id']} · {champ}\n  production : {a!r}\n  python     : {b!r}")
        self.assertEqual(divergences, [], "\n\n" + "\n\n".join(divergences))


def _tableau():
    """Imprime le tableau de comparaison demandé."""
    cas = charger_cas()
    prod = {}
    if PRODUCTION_PATH.exists():
        with open(PRODUCTION_PATH, encoding="utf-8") as f:
            prod = {r["id"]: r for r in json.load(f)}

    def resume(r):
        if r is None:
            return "—"
        vente = "vente" if r["vente_autorisee"] else "pas de vente"
        sig = "+".join(
            f"{c.split('_')[0]}/{g[0].upper()}/{cf[0].upper()}"
            for c, g, cf in zip(r["codes"], r["gravites"], r["confiances"])
        ) or "aucun signal"
        return f"{r['classification']} · {sig} · {vente}"

    largeur = max(len(c["libelle"]) for c in cas)
    print(f"\n{'ENTRÉE':<{largeur}} | {'MOTEUR PRODUCTION':<52} | {'MOTEUR PYTHON':<52} | IDENTIQUE ?")
    print("-" * (largeur + 52 + 52 + 20))
    tous_ok = True
    for c in cas:
        p = prod.get(c["id"])
        y = resultat_normalise(c)
        ok = all(
            (abs(p[ch] - y[ch]) < 1e-6 if ch == "prix_median" and p and p[ch] is not None and y[ch] is not None
             else (p or {}).get(ch) == y.get(ch))
            for ch in CHAMPS
        ) if p else False
        tous_ok &= ok
        print(f"{c['libelle']:<{largeur}} | {resume(p):<52} | {resume(y):<52} | {'OUI' if ok else 'NON'}")
    print("-" * (largeur + 52 + 52 + 20))
    print(f"{len(cas)} cas · {'TOUS IDENTIQUES' if tous_ok else 'DIVERGENCES DÉTECTÉES'}\n")
    return 0 if tous_ok else 1


if __name__ == "__main__":
    if "--python-json" in sys.argv:
        print(json.dumps(
            [dict(id=c["id"], **resultat_normalise(c)) for c in charger_cas()],
            ensure_ascii=False, indent=2,
        ))
    elif "--table" in sys.argv:
        sys.exit(_tableau())
    else:
        unittest.main()
