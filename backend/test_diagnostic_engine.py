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

    # ---- Cas limites (robustesse avant calibrage sur de vrais dossiers) ----

    def test_petit_ecart_ne_declenche_pas_de_faux_positif(self):
        # 2 m² d'écart : du bruit de mesure normal, pas une anomalie à signaler.
        # C'est exactement le genre de cas qui, mal réglé, décrédibiliserait l'outil.
        u = UserInput(
            code_commune=NANTES,
            type_local="Appartement",
            surface_cadastrale_m2=62,
            surface_reelle_actuelle_m2=60,
        )
        r = run_diagnostic(u, self.data)
        self.assertEqual(r["anomalies"], [])
        self.assertEqual(r["score_vigilance"], 0)

    def test_commune_inconnue_ne_plante_pas(self):
        # Code commune qui n'existe pas dans le jeu de données : doit dégrader
        # proprement (0 comparable), jamais planter.
        u = UserInput(
            code_commune="99999",
            type_local="Maison",
            surface_cadastrale_m2=140,
            surface_reelle_actuelle_m2=100,
        )
        r = run_diagnostic(u, self.data)
        self.assertEqual(r["marche_local"]["n_transactions_comparables"], 0)
        self.assertIn("surface_surevaluee", {a["code"] for a in r["anomalies"]})

    def test_surface_reelle_nulle_ne_plante_pas(self):
        # Saisie aberrante (0 m²) : ne doit pas provoquer de division par zéro.
        u = UserInput(
            code_commune=NANTES,
            type_local="Maison",
            surface_cadastrale_m2=100,
            surface_reelle_actuelle_m2=0,
        )
        r = run_diagnostic(u, self.data)  # ne doit lever aucune exception
        self.assertIsInstance(r["score_vigilance"], int)

    def test_type_de_bien_rare_dans_la_commune(self):
        # Peu de maisons individuelles dans le très dense 44109 (Nantes intra-muros)
        # comparé aux appartements : le moteur doit quand même répondre, sans crash,
        # même avec un échantillon local potentiellement faible.
        u = UserInput(
            code_commune=NANTES,
            type_local="Maison",
            surface_cadastrale_m2=250,  # grande maison, rare
            surface_reelle_actuelle_m2=250,
        )
        r = run_diagnostic(u, self.data)
        self.assertIsInstance(r["marche_local"]["n_transactions_comparables"], int)

    def test_aucun_element_de_confort_ne_declenche_rien(self):
        u = UserInput(
            code_commune=NANTES,
            type_local="Maison",
            surface_cadastrale_m2=100,
            surface_reelle_actuelle_m2=100,
            elements_confort_factures=[],
            elements_confort_existants=[],
        )
        r = run_diagnostic(u, self.data)
        self.assertEqual(r["anomalies"], [])


if __name__ == "__main__":
    unittest.main()
