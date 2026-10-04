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
