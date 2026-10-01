#!/usr/bin/env python3
"""Réécrit les douze captures avant/après de `captures/`.

Les deux versions sont servies en parallèle, dans les mêmes conditions : même
navigateur, même fenêtre, même densité, même thème, même cadrage. Les
conditions sont décrites dans `captures/conditions.md`.
"""
import http.server
import functools
import shutil
import socketserver
import subprocess
import tempfile
import threading
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
AVANT = '36744fb'          # dernier commit avant la refonte
ECRANS = [('accueil', 'index.html'),
          ('tableau-de-bord', 'tableau-demo.html'),
          ('ecran-intermediaire', 'bilan.html')]
VUES = [('desktop', 1440, 900), ('mobile', 390, 844)]


def sert(dossier):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(dossier))
    serveur = socketserver.TCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur, 'http://127.0.0.1:%d/' % serveur.server_address[1]


def main():
    from playwright.sync_api import sync_playwright
    sortie = RACINE / 'captures'
    sortie.mkdir(exist_ok=True)
    temp = Path(tempfile.mkdtemp())
    archive = subprocess.run(['git', 'archive', AVANT, 'web/'], cwd=RACINE,
                             capture_output=True, check=True).stdout
    (temp / 'a.tar').write_bytes(archive)
    shutil.unpack_archive(temp / 'a.tar', temp, 'tar')

    s_avant, url_avant = sert(temp / 'web')
    s_apres, url_apres = sert(RACINE / 'web')
    try:
        with sync_playwright() as p:
            navigateur = p.chromium.launch()
            for etat, base in (('avant', url_avant), ('apres', url_apres)):
                for vue, largeur, hauteur in VUES:
                    ctx = navigateur.new_context(viewport={'width': largeur, 'height': hauteur},
                                                 device_scale_factor=2)
                    page = ctx.new_page()
                    for nom, fichier in ECRANS:
                        page.goto(base + fichier, wait_until='networkidle')
                        page.evaluate("document.documentElement.setAttribute('data-theme','light')")
                        page.wait_for_timeout(500)
                        page.evaluate('window.scrollTo(0,0)')
                        page.screenshot(path=str(sortie / ('%s--%s--%s.png' % (nom, vue, etat))),
                                        clip={'x': 0, 'y': 0, 'width': largeur, 'height': hauteur})
                    ctx.close()
            navigateur.close()
    finally:
        s_avant.shutdown(); s_apres.shutdown()
        shutil.rmtree(temp, ignore_errors=True)
    print('douze captures réécrites dans', sortie)


if __name__ == '__main__':
    main()
