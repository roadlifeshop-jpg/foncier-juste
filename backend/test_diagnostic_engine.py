import unittest
from pathlib import Path

from diagnostic_engine import (
    UserInput,
    load_comparables,
    find_comparables,
    compute_market_stats,
    run_diagnostic,
)

DATA_PATH = Path(__file__).parent.parent / "data" / "dvf_44_2024.csv"
NANTES = "44109"


class TestDonneesReelles(unittest.TestCase):
    """Vérifie qu'on charge bien de vraies transactions DVF (pas des données inventées)."""

    @classmethod
    def setUpClass(cls):
        cls.data = load_comparables(DATA_PATH)

    def test_donnees_chargees(self):
        self.assertGreater(len(self.data), 1000, "le dataset réel devrait contenir plusieurs milliers de lignes")

    def test_communes_attendues(self):
        communes = {r["code_commune"] for r in self.data}
        self.assertIn(NANTES, communes)

    def test_comparables_nantes_appartements(self):
        comps = find_comparables(self.data, NANTES, "Appartement", surface_m2=60)
        self.assertGreaterEqual(len(comps), 5)
        stats = compute_market_stats(comps)
        # sanity check très large : le marché nantais 2023 est raisonnablement
        # entre 1500 et 8000 €/m², pas un chiffre absurde
        self.assertTrue(1000 < stats.prix_m2_median < 10000, stats.prix_m2_median)


class TestMoteurDiagnostic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_comparables(DATA_PATH)

    def test_aucune_anomalie_si_coherent(self):
        u = UserInput(
            code_commune=NANTES,
            type_local="Appartement",
            surface_cadastrale_m2=60,
            surface_reelle_actuelle_m2=60,
        )
        r = run_diagnostic(u, self.data)
        self.assertEqual(r["score_vigilance"], 0)
        self.assertEqual(r["niveau"], "faible")

    def test_surface_surevaluee_detectee(self):
        u = UserInput(
            code_commune=NANTES,
            type_local="Maison",
            surface_cadastrale_m2=140,   # facturé sur 140 m²
            surface_reelle_actuelle_m2=100,  # dépendance démolie il y a 10 ans, jamais déclarée
            taxe_fonciere_annuelle_eur=1800,
        )
        r = run_diagnostic(u, self.data)
        codes = {a["code"] for a in r["anomalies"]}
        self.assertIn("surface_surevaluee", codes)
        self.assertGreater(r["score_vigilance"], 0)
        self.assertIsNotNone(r["impact_estime_eur_par_an"])
        self.assertLess(r["impact_estime_eur_par_an"]["eur_min"], r["impact_estime_eur_par_an"]["eur_max"])

    def test_element_confort_obsolete_detecte(self):
        u = UserInput(
            code_commune=NANTES,
            type_local="Maison",
            surface_cadastrale_m2=100,
            surface_reelle_actuelle_m2=100,
            elements_confort_factures=["piscine", "garage"],
            elements_confort_existants=["garage"],  # la piscine a été comblée
        )
        r = run_diagnostic(u, self.data)
        codes = {a["code"] for a in r["anomalies"]}
        self.assertIn("elements_confort_obsoletes", codes)

    def test_pas_de_diagnostic_agressif_sans_donnees(self):
        # Sans taxe annuelle renseignée, pas d'estimation d'impact inventée
        u = UserInput(
            code_commune=NANTES,
            type_local="Appartement",
            surface_cadastrale_m2=80,
            surface_reelle_actuelle_m2=60,
        )
        r = run_diagnostic(u, self.data)
        self.assertIsNone(r["impact_estime_eur_par_an"])


if __name__ == "__main__":
    unittest.main()
