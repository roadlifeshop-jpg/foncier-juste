"""Tests des calculs des deux nouveaux outils (abonnements, garanties).

Les fonctions testées vivent dans web/abonnements.js et web/garanties.js. On ne
les réimplémente pas ici : le test charge les vrais fichiers dans un navigateur
et appelle les vraies fonctions. C'est le même principe que
backend/capture_production.js pour le moteur de taxe foncière — tester le code
réellement servi, pas une copie qui pourrait divergerus.

    python3 -m pytest backend/test_outils_web.py -q
    (ou : python3 backend/test_outils_web.py)

Priorité des cas retenus : ceux qui peuvent réellement induire l'utilisateur en
erreur — périodicités, arrondis cumulés, fins de mois, années bissextiles,
bascule de la présomption d'antériorité, dates impossibles.
"""
import asyncio
import json
import os
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
  const AUJ = new Date(2026, 8, 17);           // 17 septembre 2026, heure locale
  const iso = d => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : null;

  /* ---------------- Montants ---------------- */
  eq("centimes « 12,99 »", enCentimes('12,99'), 1299);
  eq("centimes « 12.99 »", enCentimes('12.99'), 1299);
  eq("centimes « 12 »", enCentimes('12'), 1200);
  eq("centimes « 1 299,50 » (espace)", enCentimes('1 299,50'), 129950);
  eq("centimes « 29,99 € »", enCentimes('29,99 €'), 2999);
  eq("centimes texte invalide", enCentimes('abc'), null);
  eq("centimes négatif refusé", enCentimes('-3'), null);
  eq("centimes 3 décimales refusé", enCentimes('12,999'), null);
  // Le séparateur de milliers de toLocaleString('fr-FR') est une espace
  // insécable fine (U+202F), pas une espace ordinaire : on normalise avant de
  // comparer, sinon le test échoue sur une différence invisible.
  const normEsp = s => s.replace(/[  ]/g, ' ');
  eq("affichage 129950 centimes", normEsp(euros(129950)), '1 299,50 €');
  eq("affichage 5 centimes", euros(5), '0,05 €');

  /* ---------------- Périodicités ---------------- */
  eq("9,99 €/mois -> annuel", annuelCentimes(999, 'mensuelle'), 11988);
  eq("99 €/an -> annuel", annuelCentimes(9900, 'annuelle'), 9900);
  eq("99 €/an -> mensuel", mensuelCentimes(9900, 'annuelle'), 825);
  eq("25 €/trimestre -> annuel", annuelCentimes(2500, 'trimestrielle'), 10000);
  eq("5 €/semaine -> annuel (52 sem.)", annuelCentimes(500, 'hebdomadaire'), 26000);
  eq("30 €/semestre -> annuel", annuelCentimes(3000, 'semestrielle'), 6000);
  eq("10 €/2 mois -> annuel", annuelCentimes(1000, 'bimestrielle'), 6000);

  /* ---------------- Totaux : l'arrondi ne doit pas s'accumuler ---------- */
  const douze = Array.from({length: 12}, (_, i) => ({ id: 'x'+i, montant: 1000, periodicite: 'annuelle' }));
  const t12 = totaux(douze);
  eq("12 x 10 €/an -> annuel exact", t12.annuel, 12000);
  eq("12 x 10 €/an -> mensuel calculé sur l'annuel", t12.mensuel, 1000);
  vrai("mensuel != somme des mensuels arrondis (996)", t12.mensuel !== 12 * Math.round(1000/12));

  const melange = [
    { id:'a', montant: 999,  periodicite:'mensuelle' },
    { id:'b', montant: 9900, periodicite:'annuelle' },
    { id:'c', montant: 1550, periodicite:'trimestrielle', aArreter: true },
    { id:'d', montant: 3500, periodicite:'mensuelle', aArreter: true },
  ];
  const tm = totaux(melange);
  eq("mélange -> annuel", tm.annuel, 11988 + 9900 + 6200 + 42000);
  eq("mélange -> nombre", tm.nombre, 4);
  eq("hypothèse d'arrêt : annuel des seules lignes marquées", tm.annuelAArreter, 6200 + 42000);
  eq("hypothèse d'arrêt : nombre", tm.nombreAArreter, 2);
  vrai("dépense et hypothèse d'arrêt sont deux nombres distincts", tm.annuel !== tm.annuelAArreter);
  const archive = totaux([{ id:'z', montant: 1000, periodicite:'mensuelle', archive: true }]);
  eq("ligne archivée exclue", archive.annuel, 0);

  /* ---------------- Dates : cas limites ---------------- */
  eq("31 janv. + 1 mois = 28 fév. (2026)", iso(ajouterMois(new Date(2026,0,31), 1)), '2026-02-28');
  eq("31 janv. + 1 mois = 29 fév. (2024, bissextile)", iso(ajouterMois(new Date(2024,0,31), 1)), '2024-02-29');
  eq("31 mai + 1 mois = 30 juin", iso(ajouterMois(new Date(2026,4,31), 1)), '2026-06-30');
  eq("15 déc. + 3 mois = 15 mars (année suivante)", iso(ajouterMois(new Date(2026,11,15), 3)), '2027-03-15');
  eq("30 fév. rejeté", versDate('2026-02-30'), null);
  eq("mois 13 rejeté", versDate('2026-13-01'), null);
  eq("format libre rejeté", versDate('17/09/2026'), null);
  eq("date valide acceptée", iso(versDate('2026-09-17')), '2026-09-17');

  /* ---------------- Prochaine échéance ---------------- */
  eq("échéance mensuelle passée -> prochaine à venir",
     iso(prochaineEcheance('2026-03-05', 'mensuelle', AUJ)), '2026-10-05');
  eq("échéance annuelle passée -> année suivante",
     iso(prochaineEcheance('2026-05-20', 'annuelle', AUJ)), '2027-05-20');
  eq("échéance future inchangée",
     iso(prochaineEcheance('2026-12-01', 'annuelle', AUJ)), '2026-12-01');

  /* ---------------- Fenêtre de non-reconduction (L215-1) --------------- */
  const f1 = fenetreNonReconduction('2026-11-15', 'annuelle', AUJ);
  eq("fenêtre : début à 3 mois", iso(f1.debut), '2026-08-15');
  eq("fenêtre : fin à 1 mois", iso(f1.fin), '2026-10-15');
  vrai("17 sept. est dans la fenêtre d'une échéance au 15 nov.", f1.dedans);
  const f2 = fenetreNonReconduction('2027-06-01', 'annuelle', AUJ);
  vrai("échéance lointaine : hors fenêtre", f2.dedans === false && f2.passee === false);
  const f3 = fenetreNonReconduction('2026-10-01', 'annuelle', AUJ);
  vrai("fenêtre déjà close (échéance au 1er oct.)", f3.passee);

  /* ---------------- Engagement ---------------- */
  const e1 = engagement('2025-03-01', 24, AUJ);
  eq("fin d'un engagement de 24 mois", iso(e1.fin), '2027-03-01');
  vrai("engagement non terminé", e1.termine === false);
  vrai("douzième mois dépassé", e1.apresDouziemeMois);
  const e2 = engagement('2026-06-01', 24, AUJ);
  vrai("douzième mois non atteint", e2.apresDouziemeMois === false);
  const e3 = engagement('2024-01-01', 12, AUJ);
  vrai("engagement terminé", e3.termine);
  eq("engagement sans durée -> null", engagement('2025-01-01', 0, AUJ), null);

  /* ---------------- Pistes : jamais d'affirmation ---------------- */
  const p1 = pistes({ periodicite:'mensuelle', souscritEnLigne:true }, AUJ);
  vrai("souscription en ligne -> piste de vérification", p1.some(p => p.regle === 'resiliation-trois-clics' && p.type === 'verification'));
  const p2 = pistes({ periodicite:'mensuelle', categorie:'telecom', engagementDebut:'2025-03-01', engagementMois:24 }, AUJ);
  vrai("engagement télécom en cours -> fait + repère du 12e mois",
       p2.some(p => p.type === 'fait') && p2.some(p => p.regle === 'engagement-telecom'));
  const p3 = pistes({ periodicite:'mensuelle' }, AUJ);
  vrai("aucune donnée -> aucune conclusion", p3.length === 1 && p3[0].regle === null);
  vrai("aucune piste n'affirme qu'un contrat est résiliable",
       [...p1, ...p2, ...p3].every(p => !/est résiliable|vous pouvez résilier sans/i.test(p.texte)));

  /* ================= GARANTIES ================= */
  eq("mois révolus : veille de l'anniversaire", moisRevolus(new Date(2025,0,15), new Date(2026,0,14)), 11);
  eq("mois révolus : jour de l'anniversaire", moisRevolus(new Date(2025,0,15), new Date(2026,0,15)), 12);
  eq("mois révolus : 0", moisRevolus(new Date(2026,8,1), new Date(2026,8,30)), 0);

  const base = { categorie:'electro_grand', canal:'magasin', probleme:'panne_apres' };
  const r14 = orienter({ ...base, etat:'neuf', vendeur:'pro', dateAchat:'2025-07-17' }, AUJ);
  eq("neuf, pro, 14 mois -> 14 mois calculés", r14.mois, 14);
  vrai("neuf 14 mois -> garantie de conformité proposée", r14.voies.some(v => v.regle === 'conformite-duree'));
  vrai("neuf 14 mois -> présomption mentionnée", r14.voies.some(v => v.regle === 'conformite-presomption'));
  vrai("pièces à réunir non vides", r14.pieces.length >= 2);
  vrai("limites toujours présentes", r14.limites.some(l => /n'a accès à aucun dossier/.test(l)));
  vrai("jamais de promesse d'aboutissement", r14.voies.every(v => !/aboutira|vous obtiendrez|remboursement garanti/i.test(v.texte || '')));

  const rocc = orienter({ ...base, etat:'occasion', vendeur:'pro', dateAchat:'2025-03-17' }, AUJ);
  eq("occasion, pro, 18 mois", rocc.mois, 18);
  vrai("occasion 18 mois : garantie ouverte mais présomption dépassée",
       rocc.voies.some(v => v.regle === 'conformite-duree') && !rocc.voies.some(v => v.regle === 'conformite-presomption'));
  vrai("occasion : limite sur les 12 mois signalée", rocc.limites.some(l => /douze mois/.test(l)));

  const rpart = orienter({ ...base, etat:'occasion', vendeur:'particulier', dateAchat:'2024-01-10' }, AUJ);
  vrai("entre particuliers : pas de garantie de conformité",
       !rpart.voies.some(v => v.regle === 'conformite-duree'));
  vrai("entre particuliers : vice caché proposé", rpart.voies.some(v => v.regle === 'vices-caches'));
  vrai("entre particuliers : limite explicite", rpart.limites.some(l => /Entre particuliers/.test(l)));

  const rvieux = orienter({ ...base, etat:'neuf', vendeur:'pro', dateAchat:'2023-01-10' }, AUJ);
  vrai("au-delà de 2 ans : conformité fermée", !rvieux.voies.some(v => v.regle === 'conformite-duree'));
  vrai("au-delà de 2 ans : vice caché reste", rvieux.voies.some(v => v.regle === 'vices-caches'));

  const rdist = orienter({ ...base, canal:'distance', etat:'neuf', vendeur:'pro', dateAchat:'2026-09-12' }, AUJ);
  vrai("achat à distance de 5 jours : rétractation en premier",
       rdist.voies[0] && rdist.voies[0].regle === 'retractation-14-jours');
  const rdist2 = orienter({ ...base, canal:'distance', etat:'neuf', vendeur:'pro', dateAchat:'2026-08-01' }, AUJ);
  vrai("achat à distance ancien : pas de rétractation proposée",
       !rdist2.voies.some(v => v.regle === 'retractation-14-jours'));

  const rcasse = orienter({ ...base, probleme:'casse', etat:'neuf', vendeur:'pro', dateAchat:'2026-01-10' }, AUJ);
  vrai("casse : pas de garantie de conformité", !rcasse.voies.some(v => v.regle === 'conformite-duree'));
  vrai("casse : limite explicite", rcasse.limites.some(l => /chute, un liquide/.test(l)));

  vrai("date future refusée", !!orienter({ ...base, etat:'neuf', vendeur:'pro', dateAchat:'2027-01-01' }, AUJ).invalide);
  vrai("date absente refusée", !!orienter({ ...base, etat:'neuf', vendeur:'pro', dateAchat:'' }, AUJ).invalide);

  /* ---- La directive non transposée ne doit jamais servir d'orientation --- */
  const toutesVoies = [r14, rocc, rpart, rvieux, rdist, rcasse].flatMap(r => r.voies.map(v => v.regle));
  vrai("le droit à la réparation européen n'oriente aucun cas",
       !toutesVoies.includes('droit-reparation-ue'));
  eq("statut de la directive dans le registre", REGLES['droit-reparation-ue'].statut, 'non-transpose');
  vrai("toute règle du registre porte une source et une date de vérification",
       Object.values(REGLES).every(r => r.source && r.source.url && /^\d{4}-\d{2}-\d{2}$/.test(r.verifiee)));

  return T;
}
"""


async def executer():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await (await nav.new_context()).new_page()
        await page.goto("about:blank")
        for f in ("regles.js", "abonnements.js", "garanties.js"):
            await page.add_script_tag(content=(WEB / f).read_text(encoding="utf-8"))
        resultats = await page.evaluate(SCRIPT_TESTS)
        await nav.close()
        return resultats


def test_calculs_des_outils():
    res = asyncio.run(executer())
    echecs = [r for r in res if not r["ok"]]
    for r in echecs:
        print(f"  ÉCHEC {r['nom']}\n    obtenu  : {r['obtenu']}\n    attendu : {r['attendu']}")
    assert not echecs, f"{len(echecs)} test(s) en échec sur {len(res)}"
    return res


if __name__ == "__main__":
    res = asyncio.run(executer())
    echecs = [r for r in res if not r["ok"]]
    for r in res:
        if not r["ok"]:
            print(f"ÉCHEC  {r['nom']}\n   obtenu  : {r['obtenu']}\n   attendu : {r['attendu']}")
    print(f"\n{len(res) - len(echecs)}/{len(res)} tests passés")
    sys.exit(1 if echecs else 0)
