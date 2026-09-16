"""
Tests unitaires du moteur de pré-diagnostic.

Ils portent sur les règles elles-mêmes. La vérification que le moteur Python
et le moteur de production donnent le même résultat est dans
`test_parite_moteurs.py` — les deux suites sont complémentaires : celle-ci dit
si la règle est correcte, l'autre si les deux implémentations sont d'accord.
"""

import unittest
from pathlib import Path

from diagnostic_engine import (
    SURFACE_MAX_M2,
    SURFACE_MIN_M2,
    UserInput,
    charger_market_stats,
    comparables_agreges,
    compute_market_stats,
    fixed0,
    load_comparables,
    run_diagnostic,
    vente_autorisee,
)

DATA_PATH = Path(__file__).parent.parent / "data" / "dvf_44_2024.csv"
NANTES = "44109"


def entree(**kwargs) -> UserInput:
    """Construit une entrée avec des valeurs par défaut neutres."""
    base = dict(
        code_commune=NANTES,
        code_dept="44",
        nom_commune="Nantes",
        type_local="Appartement",
        a_la_fiche=True,
        surface_reelle_actuelle_m2=60,
        source_surface="mesuree",
        surface_fiche_m2=60,
    )
    base.update(kwargs)
    return UserInput(**base)


class TestDonneesReelles(unittest.TestCase):
    """Vérifie qu'on travaille bien sur de vraies transactions DVF."""

    def test_agregats_charges(self):
        stats = charger_market_stats("44")
        self.assertGreater(len(stats), 100)
        self.assertIn(NANTES, {s["code_commune"] for s in stats})

    def test_comparables_nantes_appartements(self):
        comps = comparables_agreges(charger_market_stats("44"), NANTES, "Appartement", 60)
        self.assertIsNotNone(comps)
        self.assertGreaterEqual(comps["n"], 5)
        # Garde-fou très large : le marché nantais se situe entre 1 000 et
        # 10 000 €/m², pas sur un chiffre absurde.
        self.assertTrue(1000 < comps["prix_median"] < 10000, comps["prix_median"])

    def test_csv_brut_toujours_lisible(self):
        """Le CSV brut sert à reconstruire les agrégats : il doit rester exploitable."""
        data = load_comparables(DATA_PATH)
        self.assertGreater(len(data), 1000)
        stats = compute_market_stats([r for r in data if r["code_commune"] == NANTES][:50])
        self.assertGreater(stats.n, 0)


class TestRegleSurface(unittest.TestCase):
    """La règle de surface et sa condition d'application."""

    def test_sans_fiche_aucune_comparaison_de_surface(self):
        # Même avec un écart énorme : sans la fiche, la surface administrative
        # est inconnue, donc rien n'est comparé. C'est la règle centrale.
        r = run_diagnostic(entree(
            a_la_fiche=False, type_local="Maison",
            surface_fiche_m2=140, surface_reelle_actuelle_m2=100,
        ))
        self.assertNotIn("surface_surevaluee", {a["code"] for a in r["anomalies"]})

    def test_avec_fiche_ecart_important_gravite_haute(self):
        r = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=140, surface_reelle_actuelle_m2=100,
        ))
        surf = next(a for a in r["anomalies"] if a["code"] == "surface_surevaluee")
        self.assertEqual(surf["gravite"], "haute")

    def test_ecart_entre_5_et_15_pct_gravite_moyenne(self):
        r = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=108, surface_reelle_actuelle_m2=100,
        ))
        surf = next(a for a in r["anomalies"] if a["code"] == "surface_surevaluee")
        self.assertEqual(surf["gravite"], "moyenne")

    def test_seuil_exact_ne_declenche_pas(self):
        # 5 m² pile et 5 % pile : les deux conditions sont strictes (>), donc rien.
        r = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=105, surface_reelle_actuelle_m2=100,
        ))
        self.assertNotIn("surface_surevaluee", {a["code"] for a in r["anomalies"]})

    def test_petit_ecart_pas_de_faux_positif(self):
        r = run_diagnostic(entree(surface_fiche_m2=62, surface_reelle_actuelle_m2=60))
        self.assertNotIn("surface_surevaluee", {a["code"] for a in r["anomalies"]})

    def test_petite_surface_angle_mort_documente(self):
        # 4 m² sur 40 = 10 %, mais le seuil absolu de 5 m² n'est pas franchi.
        # Limite connue, assumée sur le site, à réévaluer après le test T1.
        r = run_diagnostic(entree(surface_fiche_m2=44, surface_reelle_actuelle_m2=40))
        self.assertNotIn("surface_surevaluee", {a["code"] for a in r["anomalies"]})

    def test_fiche_inferieure_a_la_mesure_ne_declenche_rien(self):
        # Sous-imposition possible : hors du périmètre du produit.
        r = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=100, surface_reelle_actuelle_m2=140,
        ))
        self.assertNotIn("surface_surevaluee", {a["code"] for a in r["anomalies"]})

    def test_surface_fiche_absente_ne_plante_pas(self):
        r = run_diagnostic(entree(surface_fiche_m2=None))
        self.assertIsInstance(r["score_vigilance"], int)

    def test_surface_reelle_nulle_ne_plante_pas(self):
        r = run_diagnostic(entree(surface_fiche_m2=100, surface_reelle_actuelle_m2=0))
        self.assertIsInstance(r["score_vigilance"], int)


class TestRegleConfort(unittest.TestCase):
    def test_element_disparu_detecte(self):
        r = run_diagnostic(entree(
            type_local="Maison",
            elements_confort_factures=["piscine", "garage"],
            elements_confort_existants=["garage"],
        ))
        self.assertIn("elements_confort_obsoletes", {a["code"] for a in r["anomalies"]})

    def test_deux_elements_disparus_gravite_haute(self):
        r = run_diagnostic(entree(
            type_local="Maison",
            elements_confort_factures=["piscine", "dependance"],
            elements_confort_existants=[],
        ))
        conf = next(a for a in r["anomalies"] if a["code"] == "elements_confort_obsoletes")
        self.assertEqual(conf["gravite"], "haute")

    def test_aucun_element_ne_declenche_rien(self):
        r = run_diagnostic(entree(
            elements_confort_factures=[], elements_confort_existants=[],
        ))
        self.assertNotIn("elements_confort_obsoletes", {a["code"] for a in r["anomalies"]})

    def test_confiance_degradee_sans_fiche(self):
        r = run_diagnostic(entree(
            a_la_fiche=False, elements_confort_factures=["piscine"], elements_confort_existants=[],
        ))
        conf = next(a for a in r["anomalies"] if a["code"] == "elements_confort_obsoletes")
        self.assertEqual(conf["confiance"]["niveau"], "faible")


class TestIncertitudeEtVente(unittest.TestCase):
    """Une incertitude dégrade la confiance ; elle ne fabrique jamais de signal."""

    def test_source_estimee_ne_cree_pas_de_signal(self):
        # Même entrée, deux sources : le signal est identique, seule la
        # confiance change. L'incertitude ne crée rien.
        commun = dict(type_local="Maison", surface_fiche_m2=130, surface_reelle_actuelle_m2=100)
        mesuree = run_diagnostic(entree(source_surface="mesuree", **commun))
        estimee = run_diagnostic(entree(source_surface="estimee", **commun))
        self.assertEqual(
            [a["code"] for a in mesuree["anomalies"]],
            [a["code"] for a in estimee["anomalies"]],
        )
        self.assertEqual(mesuree["score_vigilance"], estimee["score_vigilance"])

    def test_sans_fiche_jamais_de_vente(self):
        r = run_diagnostic(entree(
            a_la_fiche=False, type_local="Maison",
            elements_confort_factures=["piscine", "dependance"], elements_confort_existants=[],
        ))
        self.assertGreater(r["n_signaux_reels"], 0)
        self.assertFalse(r["vente_autorisee"])

    def test_le_contexte_de_marche_seul_n_ouvre_jamais_la_vente(self):
        r = run_diagnostic(entree())
        self.assertEqual([a["gravite"] for a in r["anomalies"]], ["info"])
        self.assertFalse(vente_autorisee(r["anomalies"]))

    # ---- Garde-fou T1 : l'écart de surface seul ne vend pas ----------------
    # Décision du 16/09/2026 : tant que la comparaison « surface réelle de la
    # fiche » / « surface habitable mesurée » n'a pas été validée sur de
    # vraies fiches, un écart de surface peut venir de la question posée.

    def test_ecart_de_surface_seul_n_ouvre_pas_la_vente(self):
        for source in ("mesuree", "acte"):
            with self.subTest(source=source):
                r = run_diagnostic(entree(
                    type_local="Maison", source_surface=source,
                    surface_fiche_m2=150, surface_reelle_actuelle_m2=100,
                ))
                self.assertIn("surface_surevaluee", {a["code"] for a in r["anomalies"]},
                              "le signal doit rester affiché")
                self.assertGreater(r["n_signaux_reels"], 0)
                self.assertFalse(r["vente_autorisee"],
                                 "un écart de surface seul ne doit pas ouvrir la vente")

    def test_confort_fiable_ouvre_la_vente(self):
        r = run_diagnostic(entree(
            type_local="Maison",
            elements_confort_factures=["piscine"], elements_confort_existants=[],
        ))
        self.assertTrue(r["vente_autorisee"])

    def test_surface_plus_confort_ouvre_la_vente(self):
        r = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=150, surface_reelle_actuelle_m2=100,
            elements_confort_factures=["piscine"], elements_confort_existants=[],
        ))
        self.assertEqual(r["n_signaux_reels"], 2)
        self.assertTrue(r["vente_autorisee"])

    def test_confort_non_fiable_plus_surface_ne_vend_pas(self):
        # Sans fiche : le confort est de confiance faible et la surface n'est
        # même pas évaluée. Rien ne doit ouvrir la vente.
        r = run_diagnostic(entree(
            a_la_fiche=False, type_local="Maison",
            surface_fiche_m2=150, surface_reelle_actuelle_m2=100,
            elements_confort_factures=["piscine"], elements_confort_existants=[],
        ))
        self.assertFalse(r["vente_autorisee"])


class TestClassificationEtRobustesse(unittest.TestCase):
    def test_classification_suit_le_score(self):
        self.assertEqual(run_diagnostic(entree())["classification"], "aucun")
        modere = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=108, surface_reelle_actuelle_m2=100,
        ))
        self.assertEqual(modere["classification"], "modere")
        fort = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=140, surface_reelle_actuelle_m2=100,
        ))
        self.assertEqual(fort["classification"], "fort")

    def test_aucun_montant_en_euros_nulle_part(self):
        """L'estimation financière a été retirée : plus aucun champ ne doit la porter."""
        r = run_diagnostic(entree(
            type_local="Maison", surface_fiche_m2=140, surface_reelle_actuelle_m2=100,
        ))
        self.assertNotIn("impact_estime_eur_par_an", r)
        texte = repr(r)
        for mot in ("eur_min", "eur_max", "€/an", "économie"):
            self.assertNotIn(mot, texte, f"« {mot} » ne doit plus apparaître")

    def test_commune_inconnue_degrade_proprement(self):
        r = run_diagnostic(entree(
            code_commune="99999", type_local="Maison",
            surface_fiche_m2=140, surface_reelle_actuelle_m2=100,
        ))
        self.assertEqual(r["marche_local"]["n_transactions_comparables"], 0)
        self.assertIn("surface_surevaluee", {a["code"] for a in r["anomalies"]})

    def test_departement_absent_degrade_proprement(self):
        r = run_diagnostic(entree(code_dept="00", code_commune="00001"))
        self.assertEqual(r["marche_local"]["n_transactions_comparables"], 0)

    def test_echantillon_faible_pas_de_prix_publie(self):
        r = run_diagnostic(entree(code_commune="99999"))
        self.assertNotIn("contexte_marche", {a["code"] for a in r["anomalies"]})
        self.assertIsNone(r["marche_local"]["prix_m2_median"])

    def test_bornes_de_surface_alignees_sur_le_dataset(self):
        """Les bornes ne sont pas un choix métier : ce sont celles de DVF."""
        self.assertEqual((SURFACE_MIN_M2, SURFACE_MAX_M2), (8.0, 400.0))


class TestParitesNumeriques(unittest.TestCase):
    """fixed0 doit se comporter comme Number.toFixed(0) de JavaScript."""

    def test_arrondi_a_l_ecart_de_zero(self):
        self.assertEqual(fixed0(2.5), "3")      # Python brut donnerait "2"
        self.assertEqual(fixed0(3.5), "4")
        self.assertEqual(fixed0(2.4), "2")
        self.assertEqual(fixed0(30.0), "30")
        self.assertEqual(fixed0(-2.5), "-3")


if __name__ == "__main__":
    unittest.main()
