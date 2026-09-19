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
  const reculeMois = (d, n) => {
    const x = new Date(d.getFullYear(), d.getMonth() - n, 1);
    const dernier = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(d.getDate(), dernier));
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  };
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
  vrai("occasion : limite sur les 12 mois signalée",
       rocc.limites.some(l => /douze mois|douzième mois/.test(l)));

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


  /* ---- Frontière du 12e au 13e mois : occasion chez un professionnel ----
     C'est le point que le brief demande de fiabiliser : la garantie dure deux
     ans dans les deux cas, seule la présomption change de durée. */
  const occ = m => orienter({ categorie:'electro_grand', canal:'magasin', probleme:'panne_apres',
                              etat:'occasion', vendeur:'pro', dateAchat: reculeMois(AUJ, m) }, AUJ);
  const neu = m => orienter({ categorie:'electro_grand', canal:'magasin', probleme:'panne_apres',
                              etat:'neuf', vendeur:'pro', dateAchat: reculeMois(AUJ, m) }, AUJ);
  const aConformite = r => r.voies.some(v => v.regle === 'conformite-duree');
  const aPresomption = r => r.voies.some(v => v.regle === 'conformite-presomption');

  eq("occasion 11 mois : mois calculés", occ(11).mois, 11);
  vrai("occasion 11 mois : garantie ouverte ET présomption active", aConformite(occ(11)) && aPresomption(occ(11)));
  vrai("occasion 12 mois : garantie ouverte, présomption TERMINÉE", aConformite(occ(12)) && !aPresomption(occ(12)));
  vrai("occasion 13 mois : garantie ouverte, présomption terminée", aConformite(occ(13)) && !aPresomption(occ(13)));
  vrai("occasion 23 mois : garantie encore ouverte", aConformite(occ(23)));
  vrai("occasion 24 mois : garantie fermée, vice caché proposé",
       !aConformite(occ(24)) && occ(24).voies.some(v => v.regle === 'vices-caches'));
  vrai("occasion 13 mois : le texte dit que la preuve change de camp",
       /preuve a changé de camp|à vous d'établir/i.test(occ(13).faits.map(f => f.texte).join(' ')));
  vrai("occasion 13 mois : la limite dit que la voie ne se ferme pas",
       occ(13).limites.some(l => /charge de la preuve qui se déplace/i.test(l)));
  vrai("occasion 11 mois : la présomption est formulée précisément",
       /pas à prouver que le défaut existait déjà lors de la délivrance/i.test(occ(11).faits.map(f => f.texte).join(' ')));
  vrai("occasion 11 mois : ce qui reste à la charge de l'acheteur est dit",
       /établir l'achat et sa date|preuve d'achat, sa date/i.test(occ(11).faits.map(f => f.texte).join(' ') + occ(11).voies.map(v => v.texte || '').join(' ')));
  vrai("plus aucune formule « rien à prouver »",
       !/rien à prouver/i.test(JSON.stringify([occ(11), neu(11), REGLES['conformite-presomption']])));
  vrai("neuf 23 mois : présomption encore active", aPresomption(neu(23)));
  vrai("neuf 24 mois : garantie fermée", !aConformite(neu(24)));
  vrai("la durée de deux ans est annoncée identique quel que soit l'état",
       /neuf, reconditionné ou d'occasion/i.test(occ(11).faits.map(f => f.texte).join(' ')));

  /* ---- Règle télécom : deux périodes, aucun montant affiché -------------- */
  const tel = (debut, duree) => pistes({ periodicite:'mensuelle', montant: 2499, categorie:'telecom',
                                          engagementDebut: debut, engagementMois: duree }, AUJ);
  const t24 = tel(reculeMois(AUJ, 18), 24);   // engagement de 24 mois, 18e mois
  const t24tot = t24.map(p => p.titre + ' ' + p.texte).join(' ');
  vrai("télécom 24 mois, après le 12e : règle des deux périodes citée",
       /douze premiers mois/.test(t24tot) && /25 %/.test(t24tot));
  vrai("télécom : aucun montant en euros n'est affiché", !/\d\s*€/.test(t24tot));
  vrai("télécom : les motifs légitimes sont mentionnés quelque part",
       /motif légitime/i.test(t24tot) || REGLES['engagement-telecom'].exceptions.some(e => /motif légitime/i.test(e)));
  const t24avant = tel(reculeMois(AUJ, 5), 24);
  vrai("télécom 24 mois, avant le 12e : la réduction n'est pas annoncée comme acquise",
       /seule la fraction postérieure/.test(t24avant.map(p => p.texte).join(' ')));
  const telDouze = tel(reculeMois(AUJ, 6), 12);
  vrai("télécom 12 mois : pas de repère du 12e mois (l'article ne s'applique pas)",
       !telDouze.some(p => p.regle === 'engagement-telecom'));
  vrai("engagement non télécom : pas de règle télécom",
       !pistes({ periodicite:'mensuelle', montant: 3500, categorie:'sport',
                 engagementDebut: reculeMois(AUJ, 18), engagementMois: 24 }, AUJ)
          .some(p => p.regle === 'engagement-telecom'));

  /* ================= VOL RETARDÉ =================
     Le barème du règlement (CE) n° 261/2004, tel que la DGAC le présente au
     18/09/2026. C'est le seul endroit du site qui affiche un montant : il est
     testé palier par palier, y compris le cas intracommunautaire de plus de
     3 500 km, qui vaut 400 € et non 600 €. */
  const vol = (o) => orienterVol(Object.assign({
    depart:'ue', compagnieEuropeenne:null, retard:'plus4', tranche:'courte',
    intraUE:null, arrive:true, dateVol:null }, o), AUJ);

  eq("vol ≤1500 km, retard 3-4 h -> 250 €",  montantForfaitaire({tranche:'courte', intraUE:false, retard:'de3a4'}), 250);
  eq("vol ≤1500 km, retard >4 h -> 250 €",   montantForfaitaire({tranche:'courte', intraUE:false, retard:'plus4'}), 250);
  eq("vol 1500-3500 km -> 400 €",            montantForfaitaire({tranche:'moyenne', intraUE:false, retard:'de3a4'}), 400);
  eq("vol >3500 km hors UE, 3-4 h -> 300 €", montantForfaitaire({tranche:'longue', intraUE:false, retard:'de3a4'}), 300);
  eq("vol >3500 km hors UE, >4 h -> 600 €",  montantForfaitaire({tranche:'longue', intraUE:false, retard:'plus4'}), 600);
  eq("vol >3500 km INTRA-UE -> 400 €",       montantForfaitaire({tranche:'longue', intraUE:true,  retard:'plus4'}), 400);
  eq("tranche inconnue -> aucun montant",    montantForfaitaire({tranche:'inconnue', intraUE:false, retard:'plus4'}), null);
  eq(">3500 km sans savoir si intra-UE -> aucun montant",
     montantForfaitaire({tranche:'longue', intraUE:null, retard:'plus4'}), null);

  vrai("retard sous 3 h : aucun montant et étiquette « exclu »",
       vol({retard:'moins3'}).somme.montant === null && vol({retard:'moins3'}).somme.certitude === 'exclu');
  vrai("départ hors UE sur compagnie non européenne : hors champ",
       vol({depart:'tiers', compagnieEuropeenne:false}).rapide.etat === 'hors-champ');
  vrai("départ hors UE sur compagnie européenne : dans le champ",
       vol({depart:'tiers', compagnieEuropeenne:true}).rapide.etat === 'ouvert');
  vrai("voyage non effectué : aucun montant",
       vol({arrive:false}).somme.montant === null);
  vrai("tranche connue et retard ≥3 h : le montant porte l'étiquette « barème »",
       vol({}).somme.certitude === 'barème' && vol({}).somme.montant === 250);
  vrai("tranche inconnue : fourchette annoncée, jamais un montant",
       vol({tranche:'inconnue'}).somme.montant === null &&
       /250/.test(vol({tranche:'inconnue'}).somme.texte) && /600/.test(vol({tranche:'inconnue'}).somme.texte));

  /* Prescription : cinq ans à compter de l'incident (DGAC). Un vol trop ancien
     ne doit PAS afficher un montant présenté comme fixé par un texte. */
  const volVieux = vol({dateVol:'2019-03-01'});
  vrai("vol de plus de cinq ans : marqué prescrit", volVieux.prescrit === true);
  vrai("vol prescrit : le montant n'est plus présenté comme dû",
       volVieux.somme.montant === null && volVieux.somme.certitude === 'exclu' && /hors délai/.test(volVieux.somme.texte));
  vrai("vol prescrit : le constat commence par le délai dépassé",
       /Délai de recours dépassé/.test(volVieux.constat[0].titre));
  const volRecent = vol({dateVol:'2026-06-10'});
  vrai("vol récent : non prescrit, délai restant positif",
       volRecent.prescrit === false && volRecent.joursRestants > 0);
  vrai("date de vol future refusée", typeof vol({dateVol:'2027-01-01'}).invalide === 'string');

  vrai("aucune piste n'affirme que la compagnie paiera",
       [...vol({}).verification, ...vol({}).action].every(x => !/vous serez indemnisé|la compagnie paiera|vous obtiendrez/i.test(x.texte)));
  vrai("le motif du retard est toujours signalé comme l'inconnue décisive",
       vol({}).verification.some(v => v.regle === 'vol-exoneration'));
  vrai("la démarche citée est gratuite et sans intermédiaire",
       vol({}).action.some(a => a.gratuit === true) &&
       vol({}).limites.some(l => /commission|intermédiaire/i.test(l)));

  /* ---- Saisie par aéroports : plus personne n'a à connaître une distance -- */
  const tj = (a, b) => resoudreTrajet(a, b);
  eq("Paris–Berlin : tranche courte",       tj('CDG','BER').tranche, 'courte');
  eq("Paris–Athènes : tranche moyenne",     tj('CDG','ATH').tranche, 'moyenne');
  eq("Paris–New York : tranche longue",     tj('CDG','JFK').tranche, 'longue');
  vrai("Paris–La Réunion : long ET intracommunautaire (400 €, pas 600 €)",
       tj('CDG','RUN').tranche === 'longue' && tj('CDG','RUN').intraUE === true &&
       montantForfaitaire({tranche:'longue', intraUE:true, retard:'plus4'}) === 400);
  vrai("Paris–Papeete : hors Union, donc palier à 600 €",
       tj('CDG','PPT').intraUE === false &&
       montantForfaitaire({tranche:'longue', intraUE:false, retard:'plus4'}) === 600);
  vrai("Paris–Londres : dans le champ mais pas intracommunautaire",
       tj('CDG','LHR').reconnu === true && tj('CDG','LHR').intraUE === false);
  vrai("distance à moins de 100 km d'un seuil : aucune tranche retenue",
       tj('CDG','TUN').reconnu === true && tj('CDG','TUN').tranche === null &&
       tj('CDG','TUN').limite === 1500);
  vrai("aéroport inconnu : rien de reconnu, aucune tranche",
       tj('CDG','ZZZ').reconnu === false && tj('CDG','ZZZ').tranche === null);
  vrai("saisie par ville acceptée", tj('Paris','Marseille').reconnu === true);
  vrai("saisie « Nom (CODE) » acceptée",
       tj('Paris Charles-de-Gaulle (CDG)','Nice Côte d’Azur (NCE)').reconnu === true);
  vrai("distances cohérentes avec les valeurs publiées (± 1 %)",
       Math.abs(tj('CDG','JFK').km - 5837) / 5837 < 0.01 &&
       Math.abs(tj('CDG','RUN').km - 9346) / 9346 < 0.01);

  /* Un trajet non reconnu ne doit JAMAIS produire de montant. */
  const volAero = (t) => orienterVol({ depart:'ue', retard:'plus4', arrive:true, trajet:t }, AUJ);
  vrai("trajet non reconnu : aucun montant, fourchette annoncée",
       volAero(tj('CDG','ZZZ')).somme.montant === null &&
       volAero(tj('CDG','ZZZ')).somme.certitude === 'indeterminee');
  vrai("trajet à la limite d'un seuil : aucun montant tranché",
       volAero(tj('CDG','TUN')).somme.montant === null &&
       /moins de 100 km du seuil/.test(volAero(tj('CDG','TUN')).somme.pourquoi));
  vrai("trajet reconnu : montant du barème et distance rappelée dans le constat",
       volAero(tj('CDG','JFK')).somme.montant === 600 &&
       volAero(tj('CDG','JFK')).constat.some(c => /5.8\d\d km/.test(c.titre)));

  /* ---- Abonnements : ni économie annoncée, ni montant remboursable ------- */
  const abo = (o) => resultat4Abonnement(Object.assign({
    id:'x', nom:'Test', montant: 9900, periodicite:'annuelle', categorie:'',
    echeance:null, engagementDebut:null, engagementMois:null,
    souscritEnLigne:false, recent:false }, o), AUJ);

  vrai("la case somme porte le COÛT ACTUEL, étiqueté comme un fait",
       abo({}).somme.certitude === 'fait' && /par an/.test(abo({}).somme.texte));
  vrai("le mot « économie » n'est jamais affirmé sur le montant",
       !/\bd.économie\b/i.test(abo({}).somme.texte) &&
       /pas une économie/.test(abo({}).somme.pourquoi));
  vrai("aucun second montant n'est renvoyé",
       abo({ echeance: iso(new Date(AUJ.getFullYear(), AUJ.getMonth() + 2, 20)) }).remboursement === undefined);
  vrai("dans la fenêtre de reconduction : une vérification, pas un montant",
       abo({ echeance: iso(new Date(AUJ.getFullYear(), AUJ.getMonth() + 2, 20)) })
         .verification.some(v => /cinq faits|Cinq choses/i.test(v.titre + ' ' + v.texte)));
  vrai("les limites disent qu'aucun montant remboursable n'est affiché",
       abo({}).limites.some(l => /aucun montant remboursable/i.test(l)));
  vrai("la fonction de prorata a bien été retirée",
       typeof rembourseableCentimes === 'undefined');

  /* ---- Inventaire : anciennes données locales, sans migration -----------
     La clé de stockage et le schéma sont inchangés. `normaliserLignes` ne
     fait que rendre inoffensive une ligne abîmée ; elle ne réinterprète
     jamais ce qui est lisible — en particulier une périodicité que le
     formulaire rapide ne propose plus. */
  const ancien = [
    { id:'a1', nom:'Salle de sport', montant: 2990, periodicite:'trimestrielle', categorie:'sport',
      echeance:null, engagementDebut:null, engagementMois:null, souscritEnLigne:false, recent:false },
    { id:'a2', nom:'Hebdo', montant: 500, periodicite:'hebdomadaire' },
  ];
  const norm = normaliserLignes(ancien);
  eq("ancienne ligne trimestrielle : périodicité préservée", norm[0].periodicite, 'trimestrielle');
  eq("ancienne ligne hebdomadaire : périodicité préservée", norm[1].periodicite, 'hebdomadaire');
  eq("anciennes lignes : le total ne bouge pas", totaux(norm).annuel, 2990 * 4 + 500 * 52);

  eq("ligne sans montant : écartée", normaliserLignes([{ nom:'X' }]).length, 0);
  eq("montant en texte : converti en centimes", normaliserLignes([{ nom:'X', montant:'12,99' }])[0].montant, 1299);
  eq("périodicité inconnue : repli sur mensuelle", normaliserLignes([{ nom:'X', montant:100, periodicite:'lunaire' }])[0].periodicite, 'mensuelle');
  eq("catégorie inconnue : effacée", normaliserLignes([{ nom:'X', montant:100, categorie:'crypto' }])[0].categorie, '');
  eq("date impossible : écartée", normaliserLignes([{ nom:'X', montant:100, echeance:'2026-02-31' }])[0].echeance, null);
  eq("nom absent : nom de repli", normaliserLignes([{ montant:100 }])[0].nom, 'Contrat sans nom');
  const engBoiteux = normaliserLignes([{ nom:'X', montant:100, engagementDebut:'2026-01-01' }])[0];
  eq("début d'engagement sans durée : les deux tombent", [engBoiteux.engagementDebut, engBoiteux.engagementMois], [null, null]);
  vrai("identifiant impropre : remplacé par un identifiant sûr",
       /^reprise-/.test(normaliserLignes([{ id:'x" onerror=1', nom:'X', montant:100 }])[0].id));
  eq("identifiants dupliqués : rendus uniques",
     new Set(normaliserLignes([{ id:'z', nom:'A', montant:100 }, { id:'z', nom:'B', montant:100 }]).map(l => l.id)).size, 2);
  eq("indicateur « archive » préservé : il pèse sur le total",
     totaux(normaliserLignes([{ id:'w', nom:'A', montant:100, archive:true }])).annuel, 0);

  /* ---- Ce qui distingue une ligne d'inventaire d'une ligne vérifiable --- */
  const socleAbo = { id:'b1', nom:'B', montant: 999, periodicite:'mensuelle', categorie:'' };
  vrai("montant seul : contrat non approfondi", contratApprofondi(socleAbo) === false);
  vrai("catégorie seule : contrat non approfondi (elle est préremplie, pas vérifiée)",
       contratApprofondi(Object.assign({}, socleAbo, { categorie:'telecom' })) === false);
  vrai("échéance renseignée : contrat approfondi",
       contratApprofondi(Object.assign({}, socleAbo, { echeance:'2026-12-01' })) === true);
  vrai("souscription en ligne : contrat approfondi",
       contratApprofondi(Object.assign({}, socleAbo, { souscritEnLigne:true })) === true);

  /* ---- Répartition : un tri, pas une recommandation --------------------- */
  const rep = repartition([
    { id:'p1', nom:'Petit', montant: 500,  periodicite:'mensuelle' },
    { id:'p2', nom:'Gros',  montant: 5000, periodicite:'mensuelle' },
  ]);
  eq("répartition : coût annuel décroissant", rep.map(r => r.ligne.nom), ['Gros', 'Petit']);
  eq("répartition : parts en pourcentage", rep.map(r => r.part), [91, 9]);

  /* ---- Inventaire : le total est exact à 1, 5 et 10 contrats ------------ */
  const inv = ls => resultat4Inventaire(ls, AUJ);
  const un = [{ id:'u1', nom:'Netflix', montant: 1349, periodicite:'mensuelle', categorie:'streaming' }];
  eq("un contrat : total annuel exact", inv(un).annuel, 16188);
  eq("un contrat : mensuel exact", inv(un).mensuel, 1349);

  const cinq = [
    { id:'c1', nom:'A', montant:  999, periodicite:'mensuelle' },
    { id:'c2', nom:'B', montant: 9900, periodicite:'annuelle' },
    { id:'c3', nom:'C', montant: 2500, periodicite:'trimestrielle' },
    { id:'c4', nom:'D', montant: 1000, periodicite:'mensuelle' },
    { id:'c5', nom:'E', montant: 4999, periodicite:'annuelle' },
  ];
  eq("cinq contrats, rythmes mêlés : total annuel exact", inv(cinq).annuel, 48887);
  eq("cinq contrats : mensuel calculé sur l'annuel, pas comme somme d'arrondis", inv(cinq).mensuel, 4074);
  eq("cinq contrats : nombre exact", inv(cinq).nombre, 5);

  const dix = Array.from({ length: 10 }, (_, k) => ({ id:'d' + k, nom:'Contrat ' + k, montant: 999, periodicite:'mensuelle' }));
  eq("dix contrats : total annuel exact", inv(dix).annuel, 119880);
  eq("dix contrats : mensuel exact", inv(dix).mensuel, 9990);
  eq("suppression d'un contrat : le total suit exactement", inv(dix.slice(0, 9)).annuel, 107892);

  /* ---- Inventaire : ce que le total n'est pas --------------------------- */
  vrai("la case somme porte le total comme un fait",
       inv(cinq).somme.certitude === 'fait' && inv(cinq).somme.montant === 48887);
  vrai("le total n'est jamais présenté comme une économie",
       /pas une économie/.test(inv(cinq).somme.pourquoi) && !/économie/i.test(inv(cinq).somme.texte));
  vrai("le total n'est jamais présenté comme récupérable",
       /pas une somme récupérable/.test(inv(cinq).somme.pourquoi));
  vrai("la répartition est un constat arithmétique, sans invitation à résilier",
       inv(cinq).constat.some(c => /^Répartition de vos dépenses récurrentes$/.test(c.titre)) &&
       inv(cinq).constat.some(c => /constat arithmétique, pas une recommandation/.test(c.texte)));
  vrai("les limites rappellent que le total n'est ni une économie ni une somme récupérable",
       inv(cinq).limites.some(l => /pas une économie ni une somme récupérable/.test(l)));

  /* ---- Inventaire : une seule prochaine action par contrat approfondi --- */
  vrai("aucun contrat approfondi : une seule action, et elle est générique",
       inv(cinq).action.length === 1 && /Vérifier ce contrat/.test(inv(cinq).action[0].titre));

  const approfondi = cinq.concat([
    { id:'c6', nom:'Mobile', montant: 2499, periodicite:'mensuelle', categorie:'telecom',
      engagementDebut: reculeMois(AUJ, 6), engagementMois: 24 },
    { id:'c7', nom:'Presse', montant: 9900, periodicite:'annuelle',
      echeance: iso(new Date(AUJ.getFullYear(), AUJ.getMonth() + 2, 20)) },
  ]);
  eq("une seule prochaine action par contrat approfondi", inv(approfondi).action.length, 2);
  vrai("chaque action nomme le contrat auquel elle se rapporte",
       inv(approfondi).action.every(a => /^(Mobile|Presse) — /.test(a.titre)));
  vrai("vérification télécom avec engagement : la règle est citée",
       inv(approfondi).verification.some(v => v.regle === 'engagement-telecom'));
  vrai("les contrats restés sommaires sont regroupés en une seule ligne",
       inv(approfondi).verification.filter(v => /sans vérification possible/.test(v.titre)).length === 1);
  vrai("le total ne change pas selon qu'un contrat est approfondi ou non",
       inv(approfondi).annuel === 48887 + 2499 * 12 + 9900);

  /* Contrat sans catégorie : la règle télécom est signalée, jamais appliquée
     d'office — rien ne dit que ce contrat en relève. */
  const sansCategorie = [{ id:'s1', nom:'Contrat X', montant: 2499, periodicite:'mensuelle', categorie:'',
                           engagementDebut: reculeMois(AUJ, 6), engagementMois: 24 }];
  vrai("contrat sans catégorie : la règle télécom est signalée, jamais appliquée",
       inv(sansCategorie).verification.some(v => /règle particulière existe pour la téléphonie/i.test(v.titre)) &&
       !inv(sansCategorie).verification.some(v => v.regle === 'engagement-telecom'));

  /* ---- Choix rapides : des noms pour éviter de taper, rien d'autre ------ */
  eq("choix rapides : huit entrées", CHOIX_RAPIDES.length, 8);
  vrai("choix rapides : chaque catégorie existe dans CATEGORIES, ou est vide",
       CHOIX_RAPIDES.every(c => c.categorie === '' || !!CATEGORIES[c.categorie]));
  vrai("« Autre » ne préremplit aucune catégorie : le chemin sans catégorie reste praticable",
       CHOIX_RAPIDES.some(c => c.cle === 'autre' && c.categorie === '' && c.exemples.length === 0));
  vrai("suggestions : ordre alphabétique, sans mise en avant",
       CHOIX_RAPIDES.every(c => JSON.stringify(c.exemples) ===
         JSON.stringify(c.exemples.slice().sort((a, b) => a.localeCompare(b, 'fr')))));
  vrai("suggestions : aucun prix, aucun lien",
       CHOIX_RAPIDES.every(c => c.exemples.every(n =>
         typeof n === 'string' && !/\d+[.,]\d|€|https?:/i.test(n))));

  /* ---- Registre : les règles aériennes sont datées et sourcées ---------- */
  vrai("règle des montants : source DGAC et source secondaire EUR-Lex",
       /aviation-civile\.gouv\.fr/.test(REGLES['vol-montants'].source.url) &&
       /eur-lex/.test(REGLES['vol-montants'].source_secondaire.url));
  vrai("règle des montants : la divergence entre sources officielles est signalée",
       REGLES['vol-montants'].exceptions.some(e => /Commission européenne/.test(e)));
  vrai("réforme 2026 : signalée comme non applicable",
       REGLES['vol-reforme-2026'].statut === 'reforme-attendue' &&
       REGLES['vol-reforme-2026'].applicable === null);
  vrai("exonération : la preuve incombe à la compagnie",
       /compagnie/i.test(REGLES['vol-exoneration'].concerne) &&
       /preuve|prouver/i.test(REGLES['vol-exoneration'].concerne));

  /* ---- Registre : les trois règles fiabilisées --------------------------- */
  vrai("règle télécom : source Service-Public et source secondaire Légifrance",
       /service-public/.test(REGLES['engagement-telecom'].source.url) &&
       /legifrance/.test(REGLES['engagement-telecom'].source_secondaire.url));
  vrai("règle télécom : dit explicitement qu'aucun montant n'est chiffré",
       REGLES['engagement-telecom'].exceptions.some(e => /ne chiffre pas/i.test(e)));
  vrai("règle présomption : annonce la bascule de la preuve",
       /c'est à vous d'établir/i.test(REGLES['conformite-presomption'].titre));
  vrai("règle durée : annonce les deux ans quel que soit l'état",
       /neuf, reconditionné ou d'occasion/i.test(REGLES['conformite-duree'].titre));


  /* ---- Date de délivrance : le point de départ réel des délais ---------
     Sans elle, l'outil doit annoncer des délais APPROXIMATIFS plutôt que de
     laisser l'utilisateur rectifier un résultat présenté comme exact. */
  const socle = { categorie:'electro_grand', canal:'distance', probleme:'panne_apres',
                 etat:'neuf', vendeur:'pro' };
  const sansLivraison = orienter({ ...socle, dateAchat: reculeMois(AUJ, 14) }, AUJ);
  vrai("sans date de livraison : délais marqués approximatifs", sansLivraison.approximatif === true);
  vrai("sans date de livraison : le fait le dit", /approximatif/i.test(sansLivraison.faits[0].titre + sansLivraison.faits[0].texte));
  vrai("sans date de livraison : le sens de l'écart est donné (jamais moins de temps)",
       /plus de temps|plus\b[^.]*jamais moins/i.test(sansLivraison.faits[0].texte));
  vrai("sans date de livraison : une limite dédiée est ajoutée",
       sansLivraison.limites.some(l => /approximatifs/i.test(l)));

  const avecLivraison = orienter({ ...socle, dateAchat: reculeMois(AUJ, 14), dateReception: reculeMois(AUJ, 13) }, AUJ);
  vrai("avec date de livraison : délais exacts", avecLivraison.approximatif === false);
  eq("avec date de livraison : le décompte part d'elle", avecLivraison.mois, 13);
  vrai("avec date de livraison : le fait nomme la livraison", /livraison/i.test(avecLivraison.faits[0].titre.toLowerCase() + avecLivraison.faits[0].texte.toLowerCase()));
  vrai("avec date de livraison : plus de limite « approximatif »",
       !avecLivraison.limites.some(l => /approximatifs/i.test(l)));

  /* La livraison tardive peut rouvrir un droit : achetée à 24 mois, livrée à
     23, la garantie est encore ouverte. C'est exactement le cas que
     l'utilisateur ne devrait pas avoir à rectifier lui-même. */
  const limite24 = orienter({ ...socle, dateAchat: reculeMois(AUJ, 24) }, AUJ);
  const limite24livre = orienter({ ...socle, dateAchat: reculeMois(AUJ, 24), dateReception: reculeMois(AUJ, 23) }, AUJ);
  vrai("achat à 24 mois sans livraison : garantie présentée comme fermée",
       !limite24.voies.some(v => v.regle === 'conformite-duree'));
  vrai("livré à 23 mois : garantie encore ouverte",
       limite24livre.voies.some(v => v.regle === 'conformite-duree'));

  /* Rétractation : 20 jours après l'achat mais 3 jours après la réception. */
  const retr = orienter({ ...socle, dateAchat: '2026-08-28', dateReception: '2026-09-14' }, AUJ);
  vrai("rétractation ouverte d'après la réception, pas l'achat",
       retr.voies.some(v => v.regle === 'retractation-14-jours'));

  /* Occasion : la bascule du 12e mois suit aussi la livraison. */
  const occLivre = m => orienter({ categorie:'electro_grand', canal:'magasin', probleme:'panne_apres',
                                   etat:'occasion', vendeur:'pro', dateAchat: reculeMois(AUJ, m + 2),
                                   dateReception: reculeMois(AUJ, m) }, AUJ);
  vrai("occasion livrée il y a 11 mois : présomption active",
       occLivre(11).voies.some(v => v.regle === 'conformite-presomption'));
  vrai("occasion livrée il y a 13 mois : présomption terminée, garantie ouverte",
       !occLivre(13).voies.some(v => v.regle === 'conformite-presomption') &&
       occLivre(13).voies.some(v => v.regle === 'conformite-duree'));

  /* Dates incohérentes : refusées avec un message utile. */
  vrai("réception antérieure à l'achat : refusée",
       /précède la date d'achat/.test(orienter({ ...socle, dateAchat:'2026-05-01', dateReception:'2026-04-01' }, AUJ).invalide || ''));
  vrai("réception dans le futur : refusée",
       /futur/.test(orienter({ ...socle, dateAchat:'2026-09-01', dateReception:'2027-01-01' }, AUJ).invalide || ''));

  return T;
}
"""


async def executer():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await (await nav.new_context()).new_page()
        await page.goto("about:blank")
        for f in ("regles.js", "aeroports.js", "abonnements.js", "garanties.js", "vol.js"):
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
