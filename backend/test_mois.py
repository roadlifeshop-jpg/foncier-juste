"""Tests du rendez-vous mensuel — web/mois.js.

Même principe que backend/test_outils_web.py : le test charge le vrai fichier
servi dans un navigateur et appelle les vraies fonctions, plutôt qu'une copie
qui finirait par diverger.

    python3 -m pytest backend/test_mois.py -q
    (ou : python3 backend/test_mois.py)

Les cas retenus sont ceux qui peuvent induire en erreur : confondre un montant
confirmé et un montant repris, faire survivre un historique à une modification
du bilan, présenter un ajout comme une hausse, ou laisser passer une donnée
abîmée venue du stockage.
"""
import asyncio
import pathlib
import sys

WEB = pathlib.Path(__file__).resolve().parent.parent / "web"

SCRIPT_TESTS = r"""
() => {
  const T = [];
  const eq = (nom, obtenu, attendu) => T.push({
    nom, ok: JSON.stringify(obtenu) === JSON.stringify(attendu), obtenu, attendu
  });
  const vrai = (nom, v) => T.push({ nom, ok: v === true, obtenu: v, attendu: true });

  const BILAN = [
    { id: 'd0', poste: 'mobile',    libelle: '', montant: 3000,  periodicite: 'mensuelle' },
    { id: 'd1', poste: 'box',       libelle: '', montant: 3500,  periodicite: 'mensuelle' },
    { id: 'd2', poste: 'assurance', libelle: '', montant: 24000, periodicite: 'annuelle'  },
  ];
  const OCT = new Date(2026, 9, 3);   // 3 octobre 2026

  /* ---------------- Clés de mois ---------------- */
  eq('clé du mois', moisCle(new Date(2026, 9, 3)), '2026-10');
  eq('clé : janvier bien cadré', moisCle(new Date(2026, 0, 31)), '2026-01');
  eq('clé : date invalide ne devine rien', moisCle('pas une date'), null);
  eq('mois précédent', moisPrecedent('2026-10'), '2026-09');
  eq('mois précédent : janvier remonte d_année', moisPrecedent('2026-01'), '2025-12');
  eq('mois précédent : clé illisible', moisPrecedent('bidon'), null);
  eq('nom français', moisEnFrancais('2026-10'), 'octobre 2026');
  eq('nom français : clé illisible rendue telle quelle', moisEnFrancais('zzz'), 'zzz');

  /* ---------------- Nettoyage du stockage ---------------- */
  eq('historique : rien n_est accepté d_un tableau', normaliserHistorique([1,2]), {});
  eq('historique : clé de mois impossible rejetée',
     Object.keys(normaliserHistorique({ '2026-13': { lignes: {} } })), []);
  eq('historique : mois valide conservé',
     Object.keys(normaliserHistorique({ '2026-10': { lignes: {} } })), ['2026-10']);
  eq('ligne : confirmation sans montant rejetée',
     normaliserLigne({ etat: 'confirme', montant: 0 }), null);
  eq('ligne : état inconnu rejeté', normaliserLigne({ etat: 'peut-être' }), null);
  eq('ligne : cause inconnue ramenée à « inconnue »',
     normaliserLigne({ etat: 'confirme', montant: 100, cause: 'parce que' }).cause, 'inconnue');
  eq('ligne : passée ne porte pas de montant',
     Object.keys(normaliserLigne({ etat: 'passe', le: '2026-10-03' })).sort(), ['etat','le']);

  /* ---------------- Ouvrir un mois ne copie rien ---------------- */
  let h = ouvrirMois({}, '2026-10', OCT);
  eq('ouvrir : le mois existe', Object.keys(h), ['2026-10']);
  eq('ouvrir : aucune dépense n_y est copiée', Object.keys(h['2026-10'].lignes), []);
  eq('ouvrir : la date est notée', h['2026-10'].ouvert, '2026-10-03');
  const h2 = confirmerLigne(h, '2026-10', 'd0', { montant: 3000, periodicite: 'mensuelle' }, OCT);
  eq('ouvrir deux fois ne vide pas les lignes',
     Object.keys(ouvrirMois(h2, '2026-10', OCT)['2026-10'].lignes), ['d0']);
  vrai('ouvrir rend un nouvel objet', ouvrirMois({}, '2026-10', OCT) !== h);
  eq('ouvrir : clé invalide ne crée rien', Object.keys(ouvrirMois({}, '2026-99', OCT)), []);

  /* ---------------- État du mois : confirmé et repris ne se mélangent pas ---- */
  let e = etatDuMois({}, '2026-10', BILAN);
  eq('mois neuf : trois à confirmer', e.nbAConfirmer, 3);
  eq('mois neuf : rien de confirmé', e.nbConfirmes, 0);
  eq('mois neuf : total confirmé nul', e.annuelConfirme, 0);
  eq('mois neuf : total à confirmer = 30+35 par mois + 240 par an',
     e.annuelAConfirmer, 3000*12 + 3500*12 + 24000);
  vrai('mois neuf : pas terminé', e.termine === false);

  h = confirmerLigne({}, '2026-10', 'd0', { montant: 3000, periodicite: 'mensuelle' }, OCT);
  e = etatDuMois(h, '2026-10', BILAN);
  eq('une confirmation : deux restent', e.nbAConfirmer, 2);
  eq('une confirmation : annuel confirmé = 360 €', e.annuelConfirme, 36000);
  eq('une confirmation : annuel à confirmer exclut la confirmée',
     e.annuelAConfirmer, 3500*12 + 24000);

  /* Le montant confirmé est celui qu_on inscrit, pas celui du bilan. */
  h = confirmerLigne(h, '2026-10', 'd1', { montant: 4000, periodicite: 'mensuelle', cause: 'tarif' }, OCT);
  e = etatDuMois(h, '2026-10', BILAN);
  eq('corriger : le montant confirmé prime sur le bilan',
     e.confirmes.find(c => c.depense && c.depense.id === 'd1').montant, 4000);
  eq('corriger : la cause déclarée est conservée',
     e.confirmes.find(c => c.depense && c.depense.id === 'd1').cause, 'tarif');

  /* ---------------- Passer n_est pas confirmer ---------------- */
  h = passerLigne(h, '2026-10', 'd2', OCT);
  e = etatDuMois(h, '2026-10', BILAN);
  eq('passer : la ligne reste à confirmer', e.nbAConfirmer, 1);
  eq('passer : elle est marquée comme passée', e.passes.length, 1);
  vrai('passer : elle est signalée dans la liste',
       e.aConfirmer.find(a => a.depense.id === 'd2').passe === true);
  eq('passer : elle ne compte pas dans le confirmé', e.nbConfirmes, 2);
  vrai('passer : le mois n_est pas terminé', e.termine === false);

  h = confirmerLigne(h, '2026-10', 'd2', { montant: 24000, periodicite: 'annuelle' }, OCT);
  e = etatDuMois(h, '2026-10', BILAN);
  vrai('tout confirmé : le mois est terminé', e.termine === true);
  eq('tout confirmé : plus rien à confirmer', e.nbAConfirmer, 0);

  /* ---------------- L_historique survit au bilan ---------------- */
  const SANS_BOX = BILAN.filter(d => d.id !== 'd1');
  e = etatDuMois(h, '2026-10', SANS_BOX);
  eq('poste supprimé : la confirmation d_octobre subsiste', e.nbConfirmes, 3);
  eq('poste supprimé : son montant confirmé est conservé',
     e.confirmes.find(c => c.depense === null).montant, 4000);
  eq('poste supprimé : il n_y a plus rien à confirmer pour lui', e.nbAConfirmer, 0);

  /* Un poste ajouté en cours de mois apparaît à confirmer. */
  const AVEC_ENERGIE = BILAN.concat([{ id: 'd3', poste: 'energie', libelle: '', montant: 9000, periodicite: 'mensuelle' }]);
  eq('poste ajouté : il apparaît à confirmer', etatDuMois(h, '2026-10', AVEC_ENERGIE).nbAConfirmer, 1);

  /* ---------------- Annuler une décision ---------------- */
  eq('annuler : la ligne redevient à confirmer',
     etatDuMois(annulerLigne(h, '2026-10', 'd0'), '2026-10', BILAN).nbAConfirmer, 1);

  /* ---------------- Ce qui a changé ---------------- */
  let hh = {};
  hh = confirmerLigne(hh, '2026-09', 'd0', { montant: 3000, periodicite: 'mensuelle' }, new Date(2026, 8, 3));
  hh = confirmerLigne(hh, '2026-09', 'd1', { montant: 3500, periodicite: 'mensuelle' }, new Date(2026, 8, 3));
  hh = confirmerLigne(hh, '2026-09', 'd2', { montant: 24000, periodicite: 'annuelle' }, new Date(2026, 8, 3));
  hh = confirmerLigne(hh, '2026-10', 'd0', { montant: 3500, periodicite: 'mensuelle', cause: 'tarif' }, OCT);
  hh = confirmerLigne(hh, '2026-10', 'd1', { montant: 3000, periodicite: 'mensuelle', cause: 'usage' }, OCT);
  hh = confirmerLigne(hh, '2026-10', 'd3', { montant: 9000, periodicite: 'mensuelle' }, OCT);

  const c = changementsEntreMois(hh, '2026-09', '2026-10');
  eq('changements : une hausse', c.hausses.map(x => x.id), ['d0']);
  eq('changements : écart de la hausse', c.hausses[0].ecart, 500);
  eq('changements : la cause déclarée suit', c.hausses[0].cause, 'tarif');
  eq('changements : une baisse', c.baisses.map(x => x.id), ['d1']);
  eq('changements : écart de la baisse', c.baisses[0].ecart, -500);
  eq('changements : une ligne apparue', c.apparues.map(x => x.id), ['d3']);
  eq('changements : une ligne disparue', c.disparues.map(x => x.id), ['d2']);
  eq('changements : écart net nul, hausse et baisse se compensent', c.ecartNet, 0);
  eq('changements : seules deux lignes sont comparables', c.compares, 2);
  vrai('changements : une ligne apparue n_est pas une hausse',
       c.hausses.every(x => x.id !== 'd3'));

  /* Une ligne passée n_est comparée à rien : passer ne vaut pas confirmer. */
  let hp = confirmerLigne({}, '2026-09', 'd0', { montant: 3000, periodicite: 'mensuelle' }, new Date(2026, 8, 3));
  hp = passerLigne(hp, '2026-10', 'd0', OCT);
  eq('changements : une ligne passée ressort comme disparue, pas comme stable',
     changementsEntreMois(hp, '2026-09', '2026-10').disparues.map(x => x.id), ['d0']);
  eq('changements : rien de comparable alors', changementsEntreMois(hp, '2026-09', '2026-10').compares, 0);

  /* Deux mois inconnus ne produisent aucun changement inventé. */
  eq('changements : mois inconnus donnent zéro',
     changementsEntreMois({}, '2025-01', '2025-02').compares, 0);

  /* ---------------- Mois connus ---------------- */
  eq('mois connus : du plus récent au plus ancien', moisConnus(hh), ['2026-10', '2026-09']);
  eq('mois connus : historique vide', moisConnus({}), []);

  /* ---------------- Le bilan n_est jamais modifié ---------------- */
  eq('le bilan reçu reste intact', BILAN.map(d => d.montant), [3000, 3500, 24000]);

  return T;
}
"""


async def executer():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await (await nav.new_context()).new_page()
        await page.goto("about:blank")
        for f in ("abonnements.js", "bilan.js", "mois.js"):
            await page.add_script_tag(content=(WEB / f).read_text(encoding="utf-8"))
        resultats = await page.evaluate(SCRIPT_TESTS)
        await nav.close()
        return resultats


def test_rendez_vous_mensuel():
    res = asyncio.run(executer())
    echecs = [r for r in res if not r["ok"]]
    for r in echecs:
        print(f"  ÉCHEC {r['nom']}\n    obtenu  : {r['obtenu']}\n    attendu : {r['attendu']}")
    assert not echecs, f"{len(echecs)} test(s) en échec sur {len(res)}"


if __name__ == "__main__":
    res = asyncio.run(executer())
    echecs = [r for r in res if not r["ok"]]
    for r in echecs:
        print(f"ÉCHEC  {r['nom']}\n   obtenu  : {r['obtenu']}\n   attendu : {r['attendu']}")
    print(f"\n{len(res) - len(echecs)}/{len(res)} tests passés")
    sys.exit(1 if echecs else 0)
