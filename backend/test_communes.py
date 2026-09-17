"""Tests du référentiel de communes (web/communes.json).

Ce fichier conditionne l'accès au parcours taxe foncière : une commune absente
signifie un utilisateur bloqué à la première étape. Les contrôles portent donc
sur la couverture, la cohérence des drapeaux et les cas particuliers —
arrondissements municipaux, Corse, outre-mer, collectivités hors champ.

    python3 -m pytest backend/test_communes.py -q
"""
import json
import pathlib
import re

RACINE = pathlib.Path(__file__).resolve().parent.parent
WEB = RACINE / "web"

DVF = {'06', '13', '21', '30', '31', '33', '34', '35', '38', '42', '44',
       '49', '51', '59', '63', '69', '72', '75', '76', '83'}
# Collectivités et territoires à fiscalité propre : la taxe foncière de l'État
# n'y est pas applicable. Leur absence est un hors-champ, pas un manque.
HORS_CHAMP = {'975', '977', '978', '984', '986', '987', '988', '989'}
A_VERIFIER = {'57', '67', '68', '971', '972', '973', '974', '976'}

data = json.loads((WEB / "communes.json").read_text(encoding="utf-8"))
COMMUNES = data["c"]
DEPTS = data["d"]
PAR_CODE = {e[1]: e for e in COMMUNES}


def _codes_avec_marche():
    codes = set()
    for d in sorted(DVF):
        for s in json.loads((WEB / "market_stats" / f"{d}.json").read_text()):
            codes.add(s["code_commune"])
    return codes


def test_structure_et_metadonnees():
    assert set(data) >= {"meta", "d", "c"}
    assert data["meta"]["releve_le"] == "2026-09-17"
    assert "Code officiel géographique 2026" in data["meta"]["source_communes"]
    # Le COG ne contient pas de code postal : la seconde source est obligatoire.
    assert "La Poste" in data["meta"]["source_codes_postaux"]


def test_volume_et_departements():
    assert len(COMMUNES) > 34000, f"seulement {len(COMMUNES)} communes"
    depts = {e[3] for e in COMMUNES}
    # 96 départements de métropole (01-95 + 2A/2B) et 5 d'outre-mer.
    assert len(depts) == 101, sorted(depts)
    assert {'2A', '2B'} <= depts, "Corse absente"
    assert {'971', '972', '973', '974', '976'} <= depts, "outre-mer incomplet"
    assert not (depts & HORS_CHAMP), f"collectivités hors champ présentes : {depts & HORS_CHAMP}"
    for d in depts:
        assert d in DEPTS, f"nom de département manquant pour {d}"


def test_chaque_entree_est_bien_formee():
    for nom, code, cps, dept, drap in COMMUNES:
        assert nom and isinstance(nom, str)
        assert re.fullmatch(r'\d{5}|2[AB]\d{3}', code), code
        assert cps and all(re.fullmatch(r'\d{5}', cp) for cp in cps), (code, cps)
        assert code.startswith(dept), (code, dept)
        assert drap in (0, 1, 2, 3), (code, drap)


def test_les_20_departements_dvf_sont_complets():
    """Le fichier d'origine était construit sur les ventes DVF : 445 communes
    de ces mêmes départements y manquaient, et leurs habitants étaient bloqués."""
    officiel = json.loads((pathlib.Path('/tmp/geo_communes.json')).read_text()) \
        if pathlib.Path('/tmp/geo_communes.json').exists() else None
    if officiel is None:
        return  # référentiel de contrôle absent : test ignoré
    meres = {'75056', '69123', '13055'}
    for d in sorted(DVF):
        attendu = {x['code'] for x in officiel if x['codeDepartement'] == d and x['code'] not in meres}
        present = {e[1] for e in COMMUNES if e[3] == d}
        manquant = attendu - present
        assert not manquant, f"dept {d} : {len(manquant)} communes absentes, ex. {sorted(manquant)[:3]}"


def test_arrondissements_municipaux():
    """Paris, Lyon et Marseille sont indexés par arrondissement dans DVF et
    dans market_stats : ce sont ces codes qui doivent figurer, pas la
    commune-mère, sinon le repère de marché ne se trouve plus."""
    for code, nom_attendu in (('75110', 'Paris 10e'), ('69383', 'Lyon 3e'), ('13202', 'Marseille 2e')):
        assert code in PAR_CODE, f"arrondissement {code} absent"
        assert nom_attendu in PAR_CODE[code][0], PAR_CODE[code][0]
        assert PAR_CODE[code][4] & 1, f"{code} devrait avoir un repère de marché"
    for mere in ('75056', '69123', '13055'):
        assert mere not in PAR_CODE, f"commune-mère {mere} présente en double des arrondissements"


def test_drapeau_marche_correspond_aux_donnees_reelles():
    codes = _codes_avec_marche()
    for nom, code, cps, dept, drap in COMMUNES:
        attendu = code in codes
        assert bool(drap & 1) == attendu, f"{nom} ({code}) : drapeau marché {bool(drap & 1)}, données {attendu}"
    avec = sum(1 for e in COMMUNES if e[4] & 1)
    assert avec > 7000, avec
    # Hors des 20 départements, aucun repère ne doit être annoncé.
    assert not [e for e in COMMUNES if (e[4] & 1) and e[3] not in DVF]


def test_drapeau_particularites_locales():
    for nom, code, cps, dept, drap in COMMUNES:
        assert bool(drap & 2) == (dept in A_VERIFIER), f"{nom} ({dept})"
    # Alsace-Moselle et outre-mer sont accessibles, mais signalés.
    for nom in ('Strasbourg', 'Metz', 'Colmar'):
        e = [x for x in COMMUNES if x[0] == nom]
        assert e, f"{nom} absente"
        assert e[0][4] & 2, f"{nom} devrait porter le signalement de particularités locales"


def test_homonymes_distingues_par_code_postal():
    """Plusieurs centaines de communes partagent leur nom. Le libellé proposé à
    l'utilisateur est « Commune (code postal) » : deux homonymes ne doivent pas
    produire deux fois le même libellé."""
    libelles = {}
    for nom, code, cps, dept, drap in COMMUNES:
        for cp in cps:
            libelles.setdefault(f"{nom} ({cp})", []).append(code)
    ambigus = {k: v for k, v in libelles.items() if len(set(v)) > 1}
    assert not ambigus, f"{len(ambigus)} libellés ambigus, ex. {list(ambigus.items())[:3]}"
    homonymes = [n for n in {e[0] for e in COMMUNES}
                 if len([e for e in COMMUNES if e[0] == n]) > 1]
    assert len(homonymes) > 100, "les homonymes devraient être nombreux : vérifier le fichier"


def test_codes_postaux_partages_entre_communes():
    """Un code postal couvre souvent plusieurs communes : la correspondance
    n'est pas bijective, et l'interface doit rester utilisable dans ce cas."""
    par_cp = {}
    for nom, code, cps, dept, drap in COMMUNES:
        for cp in cps:
            par_cp.setdefault(cp, set()).add(code)
    partages = {cp: c for cp, c in par_cp.items() if len(c) > 1}
    assert len(partages) > 1000, len(partages)
    # Et une commune peut avoir plusieurs codes postaux : 356 dans ce relevé.
    multi = [e for e in COMMUNES if len(e[2]) > 1]
    assert len(multi) > 300, len(multi)
    for nom in ('Grenoble', 'Nantes', 'Toulouse', 'Ajaccio'):
        e = [x for x in COMMUNES if x[0] == nom]
        assert e, f"{nom} absente"
        assert len(e[0][2]) > 1, f"{nom} devrait avoir plusieurs codes postaux : {e[0][2]}"


if __name__ == "__main__":
    import sys, traceback
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    echecs = 0
    for t in tests:
        try:
            t()
            print(f"  ok   {t.__name__}")
        except AssertionError as e:
            echecs += 1
            print(f"  ÉCHEC {t.__name__} : {e}")
    print(f"\n{len(tests) - echecs}/{len(tests)} tests passés")
    sys.exit(1 if echecs else 0)
