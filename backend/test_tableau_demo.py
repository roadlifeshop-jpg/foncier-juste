"""Prototype isolated from real tools: browser behavior and storage boundaries."""
import functools
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

@pytest.fixture(scope='module')
def browser():
    handler = functools.partial(SimpleHTTPRequestHandler, directory=str(ROOT / 'web'))
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b, 'http://127.0.0.1:%s/tableau-demo.html' % server.server_port
        b.close()
    server.shutdown()
    server.server_close()

@pytest.fixture
def page(browser):
    b, url = browser
    ctx = b.new_context(viewport={'width':390,'height':844})
    page = ctx.new_page()
    page.goto(url)
    yield page
    ctx.close()

def amount(page, selector='#total'):
    return ''.join(c for c in page.locator(selector).inner_text() if c.isdigit())

def test_month_confirmation_history_and_no_assumed_savings(page):
    assert amount(page) == '95000'
    assert amount(page,'#annual') == '1140000'
    page.select_option('#month','1')
    assert '7 montants à confirmer' in page.locator('#confirmation').inner_text()
    page.get_by_role('button',name='Modifier Énergie').click()
    page.fill('#amount','102,50')
    assert '102,50' in page.locator('#preview').inner_text()
    page.click('#save')
    assert amount(page)=='96250'
    assert '6 montants à confirmer' in page.locator('#confirmation').inner_text()
    page.locator('[data-view=changements]').click()
    text=page.locator('#changes').inner_text()
    assert '+12,50' in text and 'Cause à vérifier' in text
    assert 'Aucune économie ni hausse de tarif déduite' in text
    page.select_option('#month','0')
    page.locator('[data-view=depenses]').click()
    assert amount(page)=='95000'
    page.select_option('#month','1')
    assert amount(page)=='96250'

def test_single_expense_annual_and_rounded_total(page):
    while page.get_by_role('button',name='Supprimer').count():
        page.get_by_role('button',name='Supprimer').first.click()
    assert amount(page)=='000'
    assert page.locator('#empty').is_visible()
    page.click('#add'); page.select_option('#category','assurance')
    page.fill('#amount','100');page.select_option('#frequency','annuelle');page.click('#save')
    assert amount(page)=='833'
    assert amount(page,'#annual')=='10000'
    page.click('#add');page.select_option('#category','courses');page.fill('#amount','20,01');page.click('#save')
    assert amount(page)=='2834'
    page.get_by_role('button',name='Supprimer Courses').click()
    assert amount(page)=='833'
    page.click('#add');page.fill('#amount','<img src=x>');page.click('#save')
    assert page.locator('#error').inner_text()
    assert page.locator('#amount img').count()==0
    page.fill('#amount','-1');page.click('#save')
    assert page.locator('#editor').is_visible()

def test_pistes_all_categories_dismissal_and_new_tab(page):
    page.locator('[data-view=pistes]').click()
    seen=[]
    for _ in range(7):
        first=page.locator('#ideas .card').first
        seen.append(first.locator('.chip').inner_text().split(' · ')[0])
        first.locator('.primary').click()
        assert page.locator('#guide').is_visible()
        if len(seen)==1:
            assert page.locator('#guide a').get_attribute('href')=='comparer-mobile.html'
            assert page.locator('#guide a').get_attribute('target')=='_blank'
            assert 'sans les montants fictifs' in page.locator('#guide').inner_text()
        page.keyboard.press('Escape')
        first.get_by_role('button',name='Pas maintenant').click()
    assert set(seen)=={'Mobile','Box internet','Énergie','Assurances','Abonnements','Logement','Transport'}
    assert 'Aucune relance' in page.locator('#ideas').inner_text()
    page.click('#restore');assert page.locator('#ideas .card').count()==2

def test_no_storage_writes_and_reload_reset(page):
    page.evaluate("""() => {localStorage.setItem('dj_bilan_v1','[{"id":"temoin","montant":1234}]');localStorage.setItem('dj_abonnements_v1','[{"nom":"Ancien contrat"}]');sessionStorage.setItem('temoin','conserver');} """)
    before=page.evaluate('() => [JSON.stringify(localStorage),JSON.stringify(sessionStorage)]')
    page.select_option('#month','1');page.get_by_role('button',name='Modifier Mobile').click()
    page.fill('#amount','7');page.click('#save')
    page.reload()
    assert amount(page)=='95000'
    assert before==page.evaluate('() => [JSON.stringify(localStorage),JSON.stringify(sessionStorage)]')

def test_keyboard_focus_and_escape(page):
    page.focus('#add');page.keyboard.press('Enter')
    assert page.locator('#amount').evaluate('(el)=>el===document.activeElement')
    page.keyboard.press('Escape')
    assert page.locator('#add').evaluate('(el)=>el===document.activeElement')
    page.focus('[data-view=changements]');page.keyboard.press('Enter')
    assert page.locator('#changes-title').evaluate('(el)=>el===document.activeElement')

@pytest.mark.parametrize('size',[(320,568),(375,667),(390,844),(1440,1000)])
def test_layout_errors_links_and_dark(page,size):
    page.set_viewport_size({'width':size[0],'height':size[1]})
    errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
    page.reload()
    for theme in ['light','dark']:
        page.locator('[data-theme-val=%s]' % theme).click()
        for view in ['depenses','changements','pistes']:
            page.locator('[data-view=%s]' % view).click()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.click('#add')
        assert page.locator('#editor').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        page.keyboard.press('Escape')
    assert not errors
    for href in page.locator('a[href]').evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))'):
        if not href.startswith('#'):
            assert page.request.get(page.url.rsplit('/',1)[0]+'/'+href).status==200
