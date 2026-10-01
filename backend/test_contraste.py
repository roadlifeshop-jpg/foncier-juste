"""Les ratios écrits dans base.css doivent rester vrais.

Un commentaire qui annonce « 5,49:1 » devient faux dès qu'on retouche la
couleur et qu'on oublie la ligne d'à côté. Ce fichier relit les jetons tels
qu'ils sont servis et recalcule chaque couple, pour les deux thèmes.
"""
import re
from pathlib import Path
import pytest

BASE = Path(__file__).resolve().parents[1] / 'web' / 'base.css'


def luminance(hexa):
    hexa = hexa.lstrip('#')
    canaux = [int(hexa[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    canaux = [c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4 for c in canaux]
    return .2126 * canaux[0] + .7152 * canaux[1] + .0722 * canaux[2]


def ratio(a, b):
    l1, l2 = luminance(a), luminance(b)
    return (max(l1, l2) + .05) / (min(l1, l2) + .05)


def jetons(bloc):
    """Les variables d'un bloc :root, dernière déclaration gagnante."""
    trouve = {}
    for nom, valeur in re.findall(r'(--[\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})', bloc):
        trouve[nom] = valeur
    return trouve


def bloc(nom):
    css = BASE.read_text(encoding='utf-8')
    if nom == 'clair':
        debut = css.index(':root{')
        return jetons(css[debut:css.index('@media (prefers-color-scheme: dark)', debut)])
    debut = css.index(':root[data-theme="dark"]{')
    return jetons(css[debut:css.index('}', debut)])


CLAIR = [
    ('--ink', '--bg', 7.0), ('--ink', '--surface', 7.0),
    ('--ink-muted', '--bg', 4.5), ('--ink-muted', '--surface', 4.5),
    ('--ink-faint', '--bg', 4.5), ('--ink-faint', '--surface', 4.5),
    ('--accent', '--bg', 4.5), ('--accent', '--surface', 4.5),
    ('--accent-ink', '--accent', 4.5),
    ('--ok', '--bg', 4.5), ('--ok', '--ok-soft', 4.5), ('--ok-ink', '--ok', 4.5),
    ('--warn', '--bg', 4.5), ('--warn', '--warn-soft', 4.5),
    ('--alert', '--bg', 4.5), ('--alert', '--alert-soft', 4.5),
    ('--accent', '--accent-soft', 4.5),
]

SOMBRE = [
    ('--ink', '--bg', 7.0), ('--ink', '--surface', 7.0),
    ('--ink-muted', '--bg', 4.5), ('--ink-muted', '--surface', 4.5),
    ('--ink-faint', '--bg', 4.5), ('--ink-faint', '--surface', 4.5),
    ('--accent', '--bg', 4.5), ('--accent', '--surface', 4.5),
    ('--accent-ink', '--accent', 4.5),
    ('--ok', '--bg', 4.5), ('--ok', '--ok-soft', 4.5),
    ('--warn', '--bg', 4.5), ('--warn', '--warn-soft', 4.5),
    ('--alert', '--bg', 4.5), ('--alert', '--alert-soft', 4.5),
]


@pytest.mark.parametrize('theme,couples', [('clair', CLAIR), ('sombre', SOMBRE)])
def test_texte_sur_fond_atteint_AA(theme, couples):
    t = bloc(theme)
    faibles = []
    for encre, fond, seuil in couples:
        mesure = ratio(t[encre], t[fond])
        if mesure < seuil:
            faibles.append('%s sur %s : %.2f:1 (exigé %.1f)' % (encre, fond, mesure, seuil))
    assert not faibles, 'thème %s — ' % theme + ' ; '.join(faibles)


@pytest.mark.parametrize('theme', ['clair', 'sombre'])
def test_contour_interactif_atteint_3_pour_1(theme):
    """WCAG 1.4.11 : le contour d'un élément avec lequel on interagit."""
    t = bloc(theme)
    for fond in ('--bg', '--surface'):
        mesure = ratio(t['--line-strong'], t[fond])
        assert mesure >= 3.0, '%s : --line-strong sur %s vaut %.2f:1' % (theme, fond, mesure)


@pytest.mark.parametrize('theme', ['clair', 'sombre'])
def test_les_quatre_niveaux_d_encre_sont_distincts(theme):
    """Quatre noms qui rendraient la même nuance ne hiérarchisent rien.

    Le classement se lit en contraste sur le fond, et non en clarté : en thème
    sombre l'encre principale est la plus claire, pas la plus foncée.
    """
    t = bloc(theme)
    niveaux = [t['--ink'], t['--ink-muted'], t['--ink-faint'], t['--ink-disabled']]
    assert len(set(niveaux)) == 4
    mesures = [ratio(c, t['--bg']) for c in niveaux]
    assert mesures == sorted(mesures, reverse=True), \
        '%s : les niveaux ne décroissent pas — %s' % (theme, ['%.2f' % m for m in mesures])


def test_les_ratios_annonces_en_commentaire_sont_vrais():
    """Chaque « n,nn:1 » écrit dans base.css est recalculé.

    Le commentaire donne la mesure sur le fond de page de son thème, ou sur le
    jeton nommé après une barre — « 5,68:1 / --accent ».
    """
    css = BASE.read_text(encoding='utf-8')
    faux = []
    for theme in ('clair', 'sombre'):
        t = bloc(theme)
        debut = css.index(':root{') if theme == 'clair' else css.index(':root[data-theme="dark"]{')
        fin = css.index('@media (prefers-color-scheme: dark)', debut) if theme == 'clair' else css.index('}', debut)
        motif = r'(--[\w-]+):#[0-9A-Fa-f]{6};?\s*/\*\s*([\d]+,[\d]+):1(?:\s*/\s*(--[\w-]+))?'
        for nom, annonce, reference in re.findall(motif, css[debut:fin]):
            attendu = float(annonce.replace(',', '.'))
            reel = ratio(t[nom], t[reference or '--bg'])
            if abs(reel - attendu) > 0.05:
                faux.append('%s (%s) : annoncé %.2f, mesuré %.2f' % (nom, theme, attendu, reel))
    assert not faux, ' ; '.join(faux)
