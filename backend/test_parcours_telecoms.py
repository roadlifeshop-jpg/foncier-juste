"""Parcours Télécoms et bilan — tests d'intégration sur les vraies pages.

Les tests de `test_outils_web.py` chargent les moteurs ; ceux-ci chargent les
pages telles qu'elles sont servies, et les parcourent. Ce qu'ils couvrent ne se
voit pas dans une fonction pure : un raccourci qui écrit un montant faux, une
adresse qui perd son intention, une phrase démentie par le code de sa page.

    python3 -m pytest backend/test_parcours_telecoms.py -q

Prérequis : playwright et Chromium.
"""
import http.server
import functools
import socketserver
import threading
from pathlib import Path
import pytest

WEB = Path(__file__).resolve().parents[1] / 'web'


@pytest.fixture(scope='module')
def site():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(WEB))
    serveur = socketserver.TCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        nav = p.chromium.launch()
        yield nav, 'http://127.0.0.1:%d/' % serveur.server_address[1]
        nav.close()
    serveur.shutdown()


@pytest.fixture
def page(site):
    nav, base = site
    ctx = nav.new_context(viewport={'width': 390, 'height': 844})
    pg = ctx.new_page()
    pg.erreurs = []
    pg.on('pageerror', lambda e: pg.erreurs.append(str(e)))
    pg.base = base
    yield pg
    ctx.close()


# --------------------------------------------------------------------------
# Le repère énergie : un raccourci qui ne doit jamais écrire un montant faux.
# --------------------------------------------------------------------------

@pytest.mark.parametrize('rythme,attendu,libelle', [
    ('mensuelle', '173', 'par mois'),
    ('trimestrielle', '518', 'par trimestre'),
    ('annuelle', '2071', 'par an'),
])
def test_repere_energie_suit_la_frequence(page, rythme, attendu, libelle):
    """Il inscrivait 173 quelle que soit la fréquence : avec « Par an », le
    bilan enregistrait 173 € sur l'année, soit 14,42 € par mois."""
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.locator('input[name="rythme"][value="%s"]' % rythme).check()
    bouton = page.locator('#raccourcis button')
    assert libelle in bouton.inner_text(), bouton.inner_text()
    bouton.click()
    assert page.input_value('#f-montant').replace(',00', '').replace('\u202f', '') == attendu
    # Cliquer ne change jamais la fréquence choisie.
    assert page.evaluate("document.querySelector('input[name=rythme]:checked').value") == rythme
    assert not page.erreurs


def test_repere_energie_part_dune_base_unique(page):
    """Une seule base annoncée — les 2 071 € annuels — et elle est affichée."""
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    note = page.locator('#note-raccourcis').inner_text()
    assert '2 071' in note.replace('\u202f', ' ')
    assert 'annuels' in note


@pytest.mark.parametrize('poste', ['Forfait mobile', 'Logement', 'Transport', 'Assurances'])
def test_aucun_autre_poste_ne_propose_de_montant(page, poste):
    """Trente-deux raccourcis inventés ont été retirés ; seul l'énergie porte un
    repère, parce qu'une source publique existe pour elle."""
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name=poste, exact=True).click()
    page.wait_for_timeout(150)
    assert page.locator('#raccourcis button').count() == 0, poste
    assert page.locator('#note-raccourcis').inner_text().strip() == ''


# --------------------------------------------------------------------------
# Le guide PRM : ce qu'on affirme doit rester vrai.
# --------------------------------------------------------------------------

def test_le_guide_prm_ne_pretend_plus_etre_le_seul_envoi(page):
    """`bilan.html` appelle sendBeacon vers /api/track au chargement : dire que
    le PRM est « le seul endroit du site où une donnée sort » était faux."""
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.fill('#f-montant', '150')
    page.get_by_role('button', name='Ajouter').first.click()
    guide = page.locator('.guide-avant').inner_text()
    assert 'seul endroit' not in guide
    assert 'ne le recevons jamais' in guide
    assert 'facultative' in guide
    assert 'reste possible' in guide
    assert 'moins de douze mois' in guide
    assert not page.erreurs


# --------------------------------------------------------------------------
# Les anciennes adresses : l'intention mobile ou box doit survivre.
# --------------------------------------------------------------------------

@pytest.mark.parametrize('depart,champ', [
    ('telecoms.html?mode=mobile', 'f-prix'),
    ('telecoms.html?mode=box', 'f-prix-box'),
    ('comparer-mobile.html', 'f-prix'),
    ('comparer-box.html', 'f-prix-box'),
])
def test_les_anciennes_adresses_ouvrent_le_bon_champ(page, depart, champ):
    """Une ancre ne suffisait pas : elle visait un titre situé dans la zone de
    résultats, masquée tant qu'on n'a pas répondu."""
    page.goto(page.base + depart, wait_until='networkidle')
    page.wait_for_timeout(900)
    assert page.url.rsplit('/', 1)[1].startswith('telecoms.html')
    assert page.evaluate('document.activeElement.id') == champ
    assert not page.erreurs


def test_les_anciennes_adresses_gardent_un_lien_de_secours(page):
    """Si la redirection ne part pas, il reste un lien cliquable."""
    for ancienne in ('comparer-mobile.html', 'comparer-box.html'):
        html = page.request.get(page.base + ancienne).text()
        assert 'telecoms.html?mode=' in html
        assert '<a class="btn btn-primary"' in html


# --------------------------------------------------------------------------
# Lot 2 — la reprise, poste par poste, et la démarche selon ce qu'on sait.
# --------------------------------------------------------------------------

HORLOGE_20_OCT = """(() => { const F=new Date('2026-10-20T10:00:00'); const V=Date;
  function D(...a){ return a.length ? new V(...a) : new V(F); }
  D.prototype=V.prototype; D.now=()=>F.getTime(); D.parse=V.parse; D.UTC=V.UTC; window.Date=D; })();"""

def _bilan(poste, montant):
    return {'id': 'd-' + poste, 'poste': poste, 'libelle': '', 'montant': montant,
            'periodicite': 'mensuelle'}


def _ouvrir_avec(page, bilan=None, contrats=None):
    page.goto(page.base + 'telecoms.html')
    page.evaluate("""([b, c]) => {
        if (b) localStorage.setItem('dj_bilan_v1', JSON.stringify(b));
        if (c) localStorage.setItem('dj_abonnements_v1', JSON.stringify(c));
    }""", [bilan, contrats])
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(400)


def test_bilan_avec_une_box_seule_reprend_le_montant(page):
    """La box n'était reprise qu'à l'intérieur de la branche mobile : un bilan
    sans mobile ne la reprenait jamais."""
    _ouvrir_avec(page, bilan=[_bilan('box', 3200)])
    assert page.input_value('#f-prix-box') == '32,00'
    assert page.input_value('#f-prix') == ''
    assert 'repris de votre bilan' in page.locator('#repris').inner_text()
    assert not page.erreurs


def test_bilan_avec_un_mobile_seul_reprend_le_montant(page):
    _ouvrir_avec(page, bilan=[_bilan('mobile', 2490)])
    assert page.input_value('#f-prix') == '24,90'
    assert page.input_value('#f-prix-box') == ''
    assert not page.erreurs


def test_bilan_avec_les_deux_reprend_les_deux(page):
    _ouvrir_avec(page, bilan=[_bilan('mobile', 2490), _bilan('box', 3200)])
    assert page.input_value('#f-prix') == '24,90'
    assert page.input_value('#f-prix-box') == '32,00'
    texte = page.locator('#repris').inner_text()
    assert texte.count('repris de votre bilan') == 2
    assert not page.erreurs


def test_la_provenance_distingue_les_deux_listes(page):
    """Mobile du bilan, box des contrats : deux origines, deux phrases. Les
    confondre créerait une association que le visiteur n'a pas faite."""
    _ouvrir_avec(page, bilan=[_bilan('mobile', 2490)],
                 contrats=[{'id': 'c1', 'nom': 'Freebox Pop', 'categorie': 'telecom',
                            'montant': 3999, 'periodicite': 'mensuelle'}])
    texte = page.locator('#repris').inner_text()
    assert 'repris de votre bilan' in texte
    assert 'Dépense mensuelle' in texte
    assert 'Freebox Pop' in texte
    assert not page.erreurs


def test_le_comparateur_ne_reecrit_aucune_des_deux_listes(page):
    avant = [_bilan('mobile', 2490), _bilan('box', 3200)]
    _ouvrir_avec(page, bilan=avant)
    page.fill('#f-prix', '9,99')
    page.select_option('#f-donnees', index=2)
    page.click('#f-comparer')
    page.wait_for_timeout(500)
    apres = page.evaluate("JSON.parse(localStorage.getItem('dj_bilan_v1'))")
    assert apres == avant


@pytest.mark.parametrize('engagement,attendu,interdit', [
    ('non', 'engagement est terminé', None),
    ('oui', 'encore engagé', None),
    ('inconnu', 'n’est pas la même chose qu’un engagement terminé', 'sans frais.'),
])
def test_un_engagement_inconnu_ne_devient_pas_sans_engagement(page, engagement, attendu, interdit):
    """Un engagement inconnu n'autorise aucune conclusion de départ sans frais."""
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.fill('#f-prix', '24,90')
    page.select_option('#f-donnees', index=2)
    page.locator('input[name="box"][value="oui"]').check()
    page.fill('#f-prix-box', '32')
    page.select_option('#f-box-engagement', engagement)
    page.click('#f-comparer')
    page.wait_for_timeout(500)
    texte = page.locator('#intro-box').inner_text()
    assert attendu in texte, texte
    assert not page.erreurs


def test_sans_box_la_demarche_ne_parle_pas_dun_operateur_box(page):
    """Elle demandait « contactez votre opérateur » à qui venait de répondre
    ne pas avoir de box."""
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.fill('#f-prix', '24,90')
    page.select_option('#f-donnees', index=2)
    page.locator('input[name="box"][value="non"]').check()
    page.click('#f-comparer')
    page.wait_for_timeout(500)
    texte = page.locator('#intro-box').inner_text()
    assert 'opérateur' not in texte, texte
    assert 'dépense nouvelle' in texte
    assert not page.erreurs


def test_registre_box_vide_etat_utile_et_aucun_prix_couple(page):
    """Au 20 octobre les deux dernières offres sont sorties du relevé."""
    ctx = page.context
    ctx.add_init_script(HORLOGE_20_OCT)
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.fill('#f-prix', '24,90')
    page.select_option('#f-donnees', index=2)
    page.locator('input[name="box"][value="oui"]').check()
    page.fill('#f-prix-box', '32')
    page.click('#f-comparer')
    page.wait_for_timeout(600)
    assert page.locator('#liste-box-offres .offre').count() == 0
    vide = page.locator('#liste-box-offres').inner_text()
    assert 'ne peut être présentée' in vide
    assert 'n’est d’ailleurs pas' in vide or "n'est d'ailleurs pas" in vide
    # Le couple box+mobile ne se chiffre pas quand sa box est sortie du relevé.
    couple = page.locator('#liste-box').inner_text()
    assert 'ne figure plus dans notre relevé' in couple or 'ne chiffrons donc pas' in couple
    assert not page.erreurs


# --------------------------------------------------------------------------
# Lot 3 — le mode, et le statut d'estimation.
# --------------------------------------------------------------------------

@pytest.mark.parametrize('mode,visibles', [
    ('mobile', {'mobile'}), ('box', {'box'}), ('deux', {'mobile', 'box'}),
])
def test_le_mode_ne_montre_que_son_perimetre(page, mode, visibles):
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.locator('input[name="mode"][value="%s"]' % mode).check()
    page.wait_for_timeout(150)
    vus = page.evaluate("[...document.querySelectorAll('[data-pan]')].filter(e=>!e.hidden).map(e=>e.dataset.pan)")
    assert set(vus) == visibles
    assert not page.erreurs


def test_changer_de_mode_conserve_les_reponses(page):
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.fill('#f-prix', '24,90')
    page.fill('#f-prix-box', '32')
    page.select_option('#f-donnees', index=2)
    page.locator('input[name="mode"][value="mobile"]').check()
    page.wait_for_timeout(120)
    page.locator('input[name="mode"][value="deux"]').check()
    page.wait_for_timeout(120)
    assert page.input_value('#f-prix') == '24,90'
    assert page.input_value('#f-prix-box') == '32'
    assert page.input_value('#f-donnees') == '20'


def test_un_champ_masque_ne_produit_aucun_resultat(page):
    """Un prix de box saisi puis masqué ne doit pas faire apparaître un résultat
    que personne n'a demandé — ni le couple, qui chiffrerait une remise à partir
    d'un contrat hors périmètre."""
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.fill('#f-prix-box', '32')
    page.locator('input[name="box"][value="oui"]').check()
    page.locator('input[name="mode"][value="mobile"]').check()
    page.fill('#f-prix', '24,90')
    page.select_option('#f-donnees', index=2)
    page.click('#f-comparer')
    page.wait_for_timeout(500)
    assert page.locator('#groupe-box').is_hidden()
    assert page.locator('#liste-box').inner_text().strip() == ''
    assert not page.erreurs


def test_le_couple_n_existe_qu_en_mode_les_deux(page):
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.fill('#f-prix', '24,90')
    page.select_option('#f-donnees', index=2)
    page.locator('input[name="box"][value="oui"]').check()
    page.fill('#f-prix-box', '32')
    page.click('#f-comparer')
    page.wait_for_timeout(500)
    assert page.locator('#liste-box').inner_text().strip() != ''


def test_le_resultat_recoit_le_focus(page):
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    page.fill('#f-prix', '24,90')
    page.select_option('#f-donnees', index=2)
    page.click('#f-comparer')
    page.wait_for_timeout(500)
    assert 'Votre mobile' in page.evaluate('document.activeElement.textContent')


def test_un_engagement_mobile_inconnu_reste_inconnu(page):
    """Le champ est une déclaration, pas une lecture de contrat, et « je ne sais
    pas » ne devient jamais « sans engagement »."""
    page.goto(page.base + 'telecoms.html', wait_until='networkidle')
    legende = page.locator('text=Êtes-vous engagé sur votre forfait mobile').first
    assert legende.is_visible()
    aide = page.locator('#forme-cm').inner_text()
    assert 'pas une lecture de votre contrat' in aide
    assert 'sans engagement' in aide
    assert 'aucun départ sans frais' in aide
    coche = page.evaluate("document.querySelector('input[name=eng-mobile]:checked').value")
    assert coche == ''


# ----- Le statut d'estimation -----

def test_le_repere_cree_une_ligne_marquee_estimation(page):
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.locator('#raccourcis button').click()
    page.get_by_role('button', name='Ajouter').first.click()
    page.wait_for_timeout(400)
    assert page.locator('.et-estim').count() == 1
    assert page.evaluate("JSON.parse(localStorage.getItem('dj_bilan_v1'))[0].estimation") is True


def test_le_statut_survit_au_rechargement(page):
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.locator('#raccourcis button').click()
    page.get_by_role('button', name='Ajouter').first.click()
    page.wait_for_timeout(400)
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(400)
    assert page.locator('.et-estim').count() == 1
    assert page.locator('[data-estim]:not([hidden])').count() >= 1


def test_le_total_dit_quil_contient_une_estimation(page):
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.locator('#raccourcis button').click()
    page.get_by_role('button', name='Ajouter').first.click()
    page.wait_for_timeout(400)
    mention = page.locator('[data-estim]:not([hidden])').first.inner_text()
    assert 'contient une estimation' in mention
    assert 'moyenne nationale' in mention


def test_un_montant_saisi_ne_porte_pas_le_statut(page):
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.locator('#raccourcis button').click()
    page.fill('#f-montant', '140')          # la frappe annule la provenance
    page.get_by_role('button', name='Ajouter').first.click()
    page.wait_for_timeout(400)
    assert page.locator('.et-estim').count() == 0
    assert page.evaluate("JSON.parse(localStorage.getItem('dj_bilan_v1'))[0].estimation") is False


def test_corriger_le_montant_retire_le_statut(page):
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.locator('#raccourcis button').click()
    page.get_by_role('button', name='Ajouter').first.click()
    page.wait_for_timeout(400)
    champ = page.locator('.ligne-d input[data-corr="montant"]').first
    champ.fill('140')
    champ.dispatch_event('input')
    page.wait_for_timeout(400)
    assert page.locator('.et-estim').count() == 0
    assert page.evaluate("JSON.parse(localStorage.getItem('dj_bilan_v1'))[0].estimation") is False


def test_remplacer_par_mon_montant_vide_le_champ_et_y_amene(page):
    page.goto(page.base + 'bilan.html', wait_until='networkidle')
    page.get_by_role('button', name='Énergie', exact=True).click()
    page.locator('#raccourcis button').click()
    page.get_by_role('button', name='Ajouter').first.click()
    page.wait_for_timeout(400)
    page.locator('[data-remplacer]').first.click()
    page.wait_for_timeout(200)
    champ = page.locator('.ligne-d input[data-corr="montant"]').first
    assert champ.input_value() == ''
    assert page.evaluate("document.activeElement.getAttribute('data-corr')") == 'montant'


def test_les_anciennes_lignes_restent_lisibles(page):
    """Une ligne enregistrée avant l'existence du champ n'en a pas : elle doit
    rester utilisable, sans perte et sans être requalifiée en estimation."""
    ancien = [{'id': 'vieux1', 'poste': 'mobile', 'libelle': '', 'montant': 1999,
               'periodicite': 'mensuelle'}]
    page.goto(page.base + 'bilan.html')
    page.evaluate("d => localStorage.setItem('dj_bilan_v1', JSON.stringify(d))", ancien)
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(400)
    assert page.locator('.ligne-d').count() == 1
    assert page.locator('.et-estim').count() == 0
    stocke = page.evaluate("JSON.parse(localStorage.getItem('dj_bilan_v1'))")
    assert stocke[0]['montant'] == 1999
    assert stocke[0]['poste'] == 'mobile'
    assert not page.erreurs
