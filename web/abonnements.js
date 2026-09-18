/* ==========================================================================
   OUTIL « ABONNEMENTS ET CONTRATS » — calculs.
   --------------------------------------------------------------------------
   Aucune donnée ne sort du navigateur : pas de compte, pas de relevé
   bancaire, pas d'appel réseau. Ce fichier ne contient que des fonctions
   pures, pour qu'elles soient testables (backend/test_outils_web.py).

   Deux principes qui gouvernent tout le fichier :

   1. LES MONTANTS SONT DES ENTIERS DE CENTIMES. Additionner des flottants
      produit 29.99 + 9.99 = 39.980000000000004, et ce genre d'écart finit
      par s'afficher. La conversion se fait une seule fois, à la saisie.

   2. UNE DÉPENSE N'EST PAS UNE ÉCONOMIE. Le total annuel est un fait : il
      découle de ce que l'utilisateur a saisi. Une « économie potentielle »
      est une hypothèse : elle suppose que l'abonnement soit effectivement
      arrêté, ce qui dépend du contrat et parfois d'un engagement en cours.
      Les deux ne sont jamais additionnés ni présentés du même côté.
   ========================================================================== */

/* Occurrences par an. L'hebdomadaire retient 52 semaines — approximation
   assumée (une année en compte 52,18), signalée à l'utilisateur. */
const PERIODICITES = {
  hebdomadaire: { nom: 'par semaine', parAn: 52,  mois: null },
  mensuelle:    { nom: 'par mois',    parAn: 12,  mois: 1 },
  bimestrielle: { nom: 'tous les 2 mois', parAn: 6, mois: 2 },
  trimestrielle:{ nom: 'par trimestre', parAn: 4, mois: 3 },
  semestrielle: { nom: 'par semestre', parAn: 2,  mois: 6 },
  annuelle:     { nom: 'par an',      parAn: 1,   mois: 12 },
};

/* --------------------------------------------------------------------------
   Montants
   -------------------------------------------------------------------------- */

/** Texte saisi -> centimes entiers. Accepte « 12,99 », « 12.99 », « 12 ,99 ».
 *  Renvoie null si ce n'est pas un montant positif exploitable. */
function enCentimes(saisie) {
  if (typeof saisie === 'number') {
    if (!Number.isFinite(saisie) || saisie < 0) return null;
    return Math.round(saisie * 100);
  }
  if (typeof saisie !== 'string') return null;
  const nettoye = saisie.replace(/\s| |€/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(nettoye)) return null;
  const v = Number(nettoye);
  if (!Number.isFinite(v) || v < 0) return null;
  return Math.round(v * 100);
}

/** Centimes -> « 12,99 € ». */
function euros(centimes) {
  const signe = centimes < 0 ? '−' : '';
  const abs = Math.abs(Math.round(centimes));
  return `${signe}${Math.floor(abs / 100).toLocaleString('fr-FR')},${String(abs % 100).padStart(2, '0')} €`;
}

/** Coût annuel, en centimes, d'une ligne. Exact : le montant est un entier
 *  multiplié par un entier. C'est le seul calcul qui ne perd rien. */
function annuelCentimes(montantCentimes, periodicite) {
  const p = PERIODICITES[periodicite];
  if (!p) return 0;
  return montantCentimes * p.parAn;
}

/** Coût mensuel « moyen », en centimes, arrondi au centime.
 *  Un abonnement annuel de 99 € ne coûte rien onze mois sur douze : ce
 *  chiffre est une moyenne lissée, pas un prélèvement. L'interface le dit. */
function mensuelCentimes(montantCentimes, periodicite) {
  return Math.round(annuelCentimes(montantCentimes, periodicite) / 12);
}

/** Totaux d'une liste de lignes. `aArreter` isole l'hypothèse d'arrêt. */
function totaux(lignes) {
  const actives = lignes.filter(l => !l.archive);
  const somme = (liste, f) => liste.reduce((t, l) => t + f(l.montant, l.periodicite), 0);
  const marquees = actives.filter(l => l.aArreter);
  return {
    nombre: actives.length,
    annuel: somme(actives, annuelCentimes),
    // Le mensuel total se calcule sur l'annuel, pas comme somme d'arrondis :
    // douze lignes arrondies au centime dérivent jusqu'à 6 centimes.
    mensuel: Math.round(somme(actives, annuelCentimes) / 12),
    nombreAArreter: marquees.length,
    annuelAArreter: somme(marquees, annuelCentimes),
    mensuelAArreter: Math.round(somme(marquees, annuelCentimes) / 12),
  };
}

/* --------------------------------------------------------------------------
   Dates — les cas limites comptent : 31 janvier + 1 mois, années bissextiles.
   -------------------------------------------------------------------------- */

/** Ajoute n mois en ramenant le jour au dernier jour du mois s'il n'existe
 *  pas (31 janvier + 1 mois = 28 ou 29 février, jamais le 3 mars). */
function ajouterMois(date, n) {
  const j = date.getDate();
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const dernier = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(j, dernier));
  return d;
}

function ajouterJours(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

/** Date ISO (aaaa-mm-jj) -> Date locale à minuit, ou null. */
function versDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [a, m, j] = iso.split('-').map(Number);
  if (m < 1 || m > 12 || j < 1 || j > 31) return null;
  const d = new Date(a, m - 1, j);
  // Rejette le 31 février et compagnie : JS les décale silencieusement.
  if (d.getFullYear() !== a || d.getMonth() !== m - 1 || d.getDate() !== j) return null;
  return d;
}

function joursEntre(a, b) {
  return Math.round((b - a) / 86400000);
}

/** Prochaine échéance à partir d'une échéance connue, éventuellement passée.
 *  Avance par pas de périodicité tant que la date est dépassée. */
function prochaineEcheance(echeanceIso, periodicite, aujourdhui) {
  const base = versDate(echeanceIso);
  if (!base) return null;
  const p = PERIODICITES[periodicite];
  let d = base;
  let garde = 0;
  if (p && p.mois) {
    while (d < aujourdhui && garde < 400) { d = ajouterMois(d, p.mois); garde++; }
  } else if (p) {
    while (d < aujourdhui && garde < 2000) { d = ajouterJours(d, 7); garde++; }
  }
  return d;
}

/** Fenêtre d'information sur la non-reconduction : au plus tôt trois mois,
 *  au plus tard un mois avant l'échéance (article L215-1). */
function fenetreNonReconduction(echeanceIso, periodicite, aujourdhui) {
  const echeance = prochaineEcheance(echeanceIso, periodicite, aujourdhui);
  if (!echeance) return null;
  const debut = ajouterMois(echeance, -3);
  const fin = ajouterMois(echeance, -1);
  return {
    echeance,
    debut,
    fin,
    dedans: aujourdhui >= debut && aujourdhui <= fin,
    joursAvantEcheance: joursEntre(aujourdhui, echeance),
    joursAvantFinFenetre: joursEntre(aujourdhui, fin),
    passee: aujourdhui > fin,
  };
}

/** État d'un engagement de durée déterminée. */
function engagement(debutIso, dureeMois, aujourdhui) {
  const debut = versDate(debutIso);
  const duree = Number(dureeMois);
  if (!debut || !Number.isFinite(duree) || duree <= 0) return null;
  const fin = ajouterMois(debut, Math.round(duree));
  const douzieme = ajouterMois(debut, 12);
  return {
    debut,
    fin,
    dureeMois: Math.round(duree),
    termine: aujourdhui >= fin,
    joursRestants: Math.max(0, joursEntre(aujourdhui, fin)),
    // Repère de l'article L224-28, utile seulement pour un contrat de
    // communications électroniques de plus de douze mois.
    apresDouziemeMois: aujourdhui >= douzieme,
    finDouziemeMois: douzieme,
  };
}

/* --------------------------------------------------------------------------
   Orientation — ce que l'utilisateur peut vérifier, jamais une conclusion.
   Chaque piste renvoie une clé du registre `REGLES`, jamais un texte de loi
   écrit en dur.
   -------------------------------------------------------------------------- */

const CATEGORIES = {
  streaming:  'Streaming, musique, presse',
  telecom:    'Téléphone, internet, mobile',
  logiciel:   'Logiciel, stockage, jeu',
  sport:      'Salle de sport, club, cours',
  assurance:  'Assurance, mutuelle, garantie',
  energie:    'Énergie, eau',
  autre:      'Autre',
};

/** Renvoie la liste des vérifications pertinentes pour une ligne.
 *  `type` : 'fait' (découle des dates saisies) ou 'verification' (piste à
 *  contrôler soi-même, dépendant du contrat). Jamais une affirmation du
 *  genre « ce contrat est résiliable ». */
function pistes(ligne, aujourdhui) {
  const out = [];
  const souscritEnLigne = ligne.souscritEnLigne === true;
  const eng = ligne.engagementDebut ? engagement(ligne.engagementDebut, ligne.engagementMois, aujourdhui) : null;
  const fen = ligne.echeance ? fenetreNonReconduction(ligne.echeance, ligne.periodicite, aujourdhui) : null;

  if (souscritEnLigne) {
    out.push({
      type: 'verification', regle: 'resiliation-trois-clics',
      titre: "Cherchez la résiliation en ligne",
      texte: "Vous avez indiqué avoir souscrit en ligne. Le professionnel doit alors proposer une fonctionnalité de résiliation en ligne, gratuite. Son existence est une obligation ; elle ne dit pas pour autant que votre contrat peut être rompu dès aujourd'hui sans frais.",
    });
  }

  if (eng && !eng.termine) {
    out.push({
      type: 'fait', regle: null,
      titre: `Engagement en cours jusqu'au ${eng.fin.toLocaleDateString('fr-FR')}`,
      texte: `D'après les dates que vous avez saisies, il reste ${eng.joursRestants} jour${eng.joursRestants > 1 ? 's' : ''} d'engagement. Un arrêt avant ce terme peut entraîner des sommes restant dues : ce n'est pas un calcul que nous pouvons faire à votre place, il dépend de votre contrat.`,
    });
    if (ligne.categorie === 'telecom' && eng.dureeMois > 12) {
      out.push({
        type: 'verification', regle: 'engagement-telecom',
        titre: eng.apresDouziemeMois
          ? `Douzième mois dépassé depuis le ${eng.finDouziemeMois.toLocaleDateString('fr-FR')}`
          : `Repère du douzième mois : ${eng.finDouziemeMois.toLocaleDateString('fr-FR')}`,
        texte: eng.apresDouziemeMois
          ? "Pour un engagement de 24 mois rompu sans motif légitime, la règle est la suivante : toutes les mensualités restant dues jusqu'à la fin des douze premiers mois, puis 25 % des mensualités restant dues au-delà. Vous êtes dans la seconde période. Nous ne chiffrons pas la somme : elle dépend de votre motif de résiliation, du détail de vos mensualités et des frais propres à votre opérateur. Demandez le décompte par écrit et confrontez-le à cette règle."
          : "Avant la fin du douzième mois, la totalité des mensualités restant dues sur cette première période peut vous être réclamée ; seule la fraction postérieure au douzième mois bénéficie de la réduction à 25 %. Plusieurs situations suppriment tout frais : motif légitime, modification du contrat par l'opérateur, dysfonctionnement durable du service.",
      });
    }
    // La règle ci-dessus est conditionnée à la catégorie « télécom ». Tant que
    // la catégorie n'est pas renseignée, nous ne pouvons ni l'appliquer ni la
    // taire : l'appliquer serait affirmer une qualification que l'utilisateur
    // n'a pas donnée, la taire ferait disparaître sans bruit la seule règle
    // vraiment utile à ce stade. On le dit donc, sans rien conclure.
    else if (!ligne.categorie && eng.dureeMois > 12) {
      out.push({
        type: 'verification', regle: null,
        titre: "Une règle particulière existe pour la téléphonie et l'internet",
        texte: "Vous n'avez pas indiqué la catégorie de cet abonnement. S'il s'agit d'un contrat de téléphonie ou d'accès à internet, un engagement de plus de douze mois obéit à une règle de calcul spécifique en cas de rupture anticipée. Précisez la catégorie pour l'afficher : nous ne l'appliquons pas d'office, parce que rien ne nous dit que ce contrat en relève.",
      });
    }
  } else if (eng && eng.termine) {
    out.push({
      type: 'fait', regle: null,
      titre: `Engagement terminé depuis le ${eng.fin.toLocaleDateString('fr-FR')}`,
      texte: "D'après vos dates, la période d'engagement est passée. Les conditions de résiliation de votre contrat s'appliquent alors seules — préavis éventuel compris.",
    });
  }

  if (fen) {
    if (fen.dedans) {
      out.push({
        type: 'fait', regle: 'tacite-reconduction',
        titre: `Fenêtre d'information ouverte — échéance le ${fen.echeance.toLocaleDateString('fr-FR')}`,
        texte: `Nous sommes dans la période où le professionnel doit vous avoir informé de la possibilité de ne pas reconduire : elle court du ${fen.debut.toLocaleDateString('fr-FR')} au ${fen.fin.toLocaleDateString('fr-FR')}. Si vous n'avez rien reçu par écrit, c'est un point à soulever.`,
      });
    } else if (!fen.passee) {
      out.push({
        type: 'fait', regle: 'tacite-reconduction',
        titre: `Prochaine échéance le ${fen.echeance.toLocaleDateString('fr-FR')}`,
        texte: `Si votre contrat se reconduit tacitement, l'information doit vous parvenir entre le ${fen.debut.toLocaleDateString('fr-FR')} et le ${fen.fin.toLocaleDateString('fr-FR')}. Notez cette période.`,
      });
    } else {
      out.push({
        type: 'fait', regle: 'tacite-reconduction',
        titre: `Échéance proche : ${fen.echeance.toLocaleDateString('fr-FR')}`,
        texte: `La période pendant laquelle l'information devait vous être donnée est passée (elle s'est achevée le ${fen.fin.toLocaleDateString('fr-FR')}). Si rien ne vous est parvenu par écrit dans les formes prévues, la loi ouvre une résiliation gratuite à tout moment à compter de la reconduction — c'est à vérifier sur vos échanges.`,
      });
    }
  }

  if (ligne.recent === true) {
    out.push({
      type: 'verification', regle: 'retractation-14-jours',
      titre: "Souscription récente : regardez d'abord la rétractation",
      texte: "Pour un contrat conclu à distance il y a moins de quatorze jours, le droit de rétractation est la voie la plus simple, sans motif à donner. Plusieurs catégories en sont exclues : vérifiez la liste avant de compter dessus.",
    });
  }

  if (!out.length) {
    // Formulé comme une action, pas comme un manque : c'est le cas le plus
    // fréquent d'une première saisie, et l'utilisateur doit savoir quoi faire.
    out.push({
      type: 'verification', regle: null,
      titre: "Prochaine étape : retrouvez trois informations dans votre contrat",
      texte: "Avec le montant seul, nous savons déjà ce que cet abonnement coûte par mois et par an — c'est un fait utile. Pour aller plus loin, cherchez dans votre contrat ou vos courriels : la date de prochaine échéance, la durée d'engagement s'il en existe une, et si vous avez souscrit en ligne. Ces trois éléments déterminent ce que vous pouvez faire, et l'outil l'indiquera dès que vous les aurez saisis.",
    });
  }
  return out;
}

/* ==========================================================================
   AJOUTS POUR LE PARCOURS « UN CONTRAT À LA FOIS »
   --------------------------------------------------------------------------
   Rien de ce qui précède n'est modifié : `pistes`, `totaux`, `engagement` et
   `fenetreNonReconduction` gardent exactement le même comportement, et les
   assertions qui les couvrent restent valables. Les deux fonctions ci-dessous
   s'ajoutent, pour une raison précise : le parcours doit désormais SÉPARER
   deux sommes que l'ancien écran mélangeait.

     — « économiser à l'avenir » : le coût annuel d'un contrat qu'on arrête.
       C'est une HYPOTHÈSE. Un engagement en cours, un préavis ou des frais
       peuvent la réduire, voire l'annuler pour l'année en cours.

     — « réclamer un remboursement » : l'article L215-1 du code de la
       consommation prévoit qu'à défaut d'information écrite avant la
       reconduction tacite, le contrat peut être résilié gratuitement à tout
       moment à compter de la reconduction, et que les sommes versées d'avance
       pour la période non courue sont remboursées dans les trente jours.

   AUCUN MONTANT REMBOURSABLE N'EST PLUS AFFICHÉ, et c'est un retrait délibéré.
   Une version précédente calculait un prorata en jours entre aujourd'hui et
   l'échéance — 17,09 € sur un abonnement de 99 €, par exemple. Ce chiffre
   supposait cinq faits établis, dont aucun ne l'était :
     1. que le contrat relève bien de l'article L215-1 ;
     2. que la reconduction tacite a effectivement eu lieu ;
     3. que l'information écrite n'a PAS été reçue — nous ne pouvons pas le
        savoir, et c'est la condition qui ouvre tout ;
     4. quelle avance a réellement été payée, et pour quelle période ;
     5. à quelle date la résiliation prend effet, puisque le remboursement
        porte sur la période postérieure à cette date, pas à aujourd'hui.
   Un prorata calculé sur la date du jour répondait donc à une question que
   personne n'avait posée. La case « somme » ne montre plus qu'un fait — le
   coût actuel — et la vérification à mener est donnée en clair.

   De même, le coût annuel n'est plus présenté comme une économie. Sans
   scénario de résiliation (peut-on résilier, à quelle date, à quel coût) ni
   offre de remplacement (que paierait-on à la place), « 99 € » n'est pas
   99 € d'économie : c'est le coût actuel de ce contrat.
   ========================================================================== */

/* Le résultat en quatre parties, dans la forme attendue par resultat4.js. */
function resultat4Abonnement(ligne, aujourdhui) {
  const auj = aujourdhui || new Date();
  const annuel = annuelCentimes(ligne.montant, ligne.periodicite);
  const mensuel = mensuelCentimes(ligne.montant, ligne.periodicite);
  const p = PERIODICITES[ligne.periodicite];
  const eng = engagement(ligne.engagementDebut, ligne.engagementMois, auj);
  const fen = fenetreNonReconduction(ligne.echeance, ligne.periodicite, auj);
  const ps = pistes(ligne, auj);

  /* ---- 1. Le constat : des faits, tirés de la saisie ---- */
  const constat = [{
    titre: `${euros(annuel)} par an`,
    texte: `Vous payez ${euros(ligne.montant)} ${p.nom}, soit ${euros(annuel)} sur douze mois et ${euros(mensuel)} par mois en moyenne. C'est une addition de ce que vous venez de saisir, rien de plus.`,
  }];
  if (ligne.periodicite === 'annuelle' || ligne.periodicite === 'semestrielle') {
    constat.push({
      titre: "Un paiement peu fréquent, donc peu visible",
      texte: "Ce contrat ne figure pas sur vos relevés la plupart des mois. Le mensuel affiché est une moyenne lissée, utile pour comparer, pas pour prévoir un prélèvement.",
    });
  }
  ps.filter(x => x.type === 'fait').forEach(x => constat.push({ titre: x.titre, texte: x.texte }));

  /* ---- 2. Les deux sommes, séparées ---- */
  const coutActuel = {
    montant: annuel,
    texte: `${euros(annuel)} par an`,
    certitude: 'fait',
    pourquoi: `C'est le coût actuel de ce contrat, obtenu en additionnant ce que vous venez de saisir : ${euros(ligne.montant)} ${p.nom}. Ce n'est pas une économie${eng && !eng.termine ? ', et ce ne peut pas l\'être tant que votre engagement court' : ''} : pour parler d'économie, il faudrait savoir si vous pouvez résilier, à quelle date, à quel coût, et ce que vous paieriez à la place. Nous ne connaissons aucun de ces quatre éléments.`,
  };

  /* ---- 3. Ce qu'il reste à vérifier ---- */
  const verification = ps.filter(x => x.type === 'verification')
                         .map(x => ({ titre: x.titre, texte: x.texte, regle: x.regle }));
  if (fen && fen.dedans) {
    verification.unshift({
      titre: "Cinq choses à établir avant de parler de remboursement",
      texte: "L'article L215-1 prévoit qu'à défaut d'information écrite avant la reconduction, le contrat peut être résilié gratuitement et les sommes versées d'avance pour la période non courue sont remboursées sous trente jours. Nous n'affichons aucun montant, parce qu'il dépend de cinq faits que nous ne connaissons pas : que ce contrat relève bien de cet article ; que la reconduction a eu lieu ; que l'information écrite ne vous est pas parvenue dans les formes — cherchez une lettre dédiée ou un courriel consacré à la reconduction, c'est la condition qui ouvre tout ; quelle avance vous avez réellement payée, et pour quelle période ; et à quelle date votre résiliation prendrait effet, puisque le remboursement porte sur la période postérieure à cette date. Le décompte, c'est au professionnel de le produire.",
      regle: 'tacite-reconduction',
    });
  }
  if (!verification.length) {
    verification.push({
      titre: "Trois informations à retrouver dans votre contrat",
      texte: "La date de prochaine échéance, la durée d'engagement s'il en existe une, et le mode de souscription. Sans elles, aucune démarche ne peut être évaluée — ni par vous, ni par nous.",
    });
  }

  /* ---- 4. Une seule prochaine action, gratuite ---- */
  const action = [];
  if (ligne.recent) {
    action.push({
      titre: "Exercez votre rétractation, c'est le chemin le plus court",
      texte: "Vous avez indiqué une souscription de moins de quatorze jours à distance ou hors établissement. Ce délai se prend sans motif à donner et sans frais. Envoyez la demande par écrit et gardez la preuve de sa date.",
      gratuit: true, regle: 'retractation-14-jours',
    });
  } else if (fen && fen.dedans) {
    action.push({
      titre: "Demandez par écrit la résiliation et le remboursement",
      texte: "Nous sommes dans la fenêtre pendant laquelle l'information sur la reconduction doit vous parvenir. Écrivez au professionnel en lui demandant de produire la preuve de cette information, et à défaut de résilier gratuitement et de rembourser la période non courue. Un courriel suffit à établir la date ; conservez-le.",
      gratuit: true, regle: 'tacite-reconduction',
    });
  } else if (ligne.souscritEnLigne) {
    action.push({
      titre: "Cherchez la résiliation en ligne dans votre espace client",
      texte: "Vous avez souscrit en ligne : le professionnel doit mettre à disposition une fonctionnalité de résiliation en ligne, gratuite et accessible en quelques clics. Son existence est une obligation ; elle ne dit pas que votre contrat peut être rompu aujourd'hui sans frais. Faites une capture d'écran de la confirmation.",
      gratuit: true, regle: 'resiliation-trois-clics',
    });
  } else {
    action.push({
      titre: "Retrouvez l'échéance, puis revenez",
      texte: "La date de prochaine échéance est l'information qui débloque le reste : elle situe la fenêtre pendant laquelle l'information sur la reconduction doit vous parvenir. Elle figure sur votre contrat, une facture, ou le courriel de souscription.",
      gratuit: true,
    });
  }

  /* ---- Les limites ---- */
  const limites = [
    "Nous ne lisons pas votre contrat : ni préavis, ni frais de résiliation, ni clause particulière ne nous sont connus.",
    "Aucune des règles citées ne rend un contrat résiliable à elle seule. Elles pèsent sur le professionnel.",
    "Le montant affiché est un coût, pas un gain. Nous n'affichons aucune économie : elle supposerait de connaître votre faculté de résilier, sa date, son coût, et ce que vous paieriez à la place.",
    "Nous n'affichons aucun montant remboursable au titre de l'article L215-1 : il dépend de cinq faits que seul votre contrat et vos courriers peuvent établir. La vérification à mener est détaillée ci-dessus.",
  ];

  return { constat, somme: coutActuel, verification, action, limites, annuel, mensuel };
}


if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PERIODICITES, CATEGORIES, enCentimes, euros, annuelCentimes, mensuelCentimes,
                     totaux, ajouterMois, ajouterJours, versDate, joursEntre, prochaineEcheance,
                     fenetreNonReconduction, engagement, pistes,
                     resultat4Abonnement };
}
