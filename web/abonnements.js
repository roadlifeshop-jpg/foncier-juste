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


/* ==========================================================================
   INVENTAIRE RAPIDE — plusieurs contrats d'abord, vérification ensuite.
   --------------------------------------------------------------------------
   Rien de ce qui précède n'est modifié. Les fonctions ajoutées ici servent un
   parcours inversé : on saisit une liste en deux champs par contrat, on voit
   le total, et on n'ouvre les champs avancés que pour les contrats qu'on veut
   vraiment vérifier.

   Trois précautions gouvernent ce bloc :

   1. AUCUN PRIX N'EST PRÉREMPLI, et aucune suggestion n'est un classement.
      Les noms proposés servent à éviter de taper, rien d'autre : pas de lien,
      pas de logo, pas de partenariat, ordre alphabétique, et la saisie libre
      reste toujours immédiatement accessible.

   2. UNE PÉRIODICITÉ EXISTANTE N'EST JAMAIS CONVERTIE EN SILENCE. Le
      formulaire rapide ne propose que « par mois » et « par an », mais une
      ligne déjà enregistrée en hebdomadaire, bimestrielle, trimestrielle ou
      semestrielle garde sa périodicité, son affichage et son poids dans le
      total tant que l'utilisateur ne la change pas lui-même.

   3. LE TOTAL N'EST PAS UNE ÉCONOMIE. C'est une addition de ce qui a été
      saisi. Le classement par coût décroissant est un constat arithmétique :
      il ne désigne pas un contrat à résilier, puisque nous ignorons si l'un
      d'eux peut l'être, à quelle date et à quel coût.
   ========================================================================== */

/* Les huit entrées du choix rapide. `categorie` renvoie vers CATEGORIES, qui
   reste la seule nomenclature du fichier : c'est elle qui conditionne la règle
   des engagements télécom de plus de douze mois. « Autre » ne préremplit
   aucune catégorie — le chemin sans catégorie doit rester praticable, parce
   qu'une branche de `pistes()` lui est consacrée.

   Les exemples sont des noms courants, en ordre alphabétique, sans aucun prix.
   Pour l'assurance, ce sont des types de contrat et non des assureurs : le
   marché est trop fragmenté pour qu'une liste de noms rende service, et citer
   quelques compagnies reviendrait à en distinguer certaines sans raison. */
const CHOIX_RAPIDES = [
  { cle:'video',     libelle:'Streaming vidéo',  categorie:'streaming',
    exemples:['Apple TV+','Canal+','Crunchyroll','Disney+','Max','Netflix','Paramount+','Prime Video'] },
  { cle:'musique',   libelle:'Musique',          categorie:'streaming',
    exemples:['Amazon Music','Apple Music','Deezer','Spotify','YouTube Premium'] },
  { cle:'mobile',    libelle:'Téléphone mobile', categorie:'telecom',
    exemples:['Bouygues Telecom','Free Mobile','Orange','Prixtel','RED by SFR','SFR','Sosh'] },
  { cle:'box',       libelle:'Box internet',     categorie:'telecom',
    exemples:['Bouygues Telecom','Free','Orange','SFR'] },
  { cle:'sport',     libelle:'Salle de sport',   categorie:'sport',
    exemples:['Basic-Fit','Fitness Park','Keep Cool','L’Orange bleue','Neoness','On Air'] },
  { cle:'logiciel',  libelle:'Logiciel ou cloud', categorie:'logiciel',
    exemples:['Adobe Creative Cloud','Dropbox','Google One','iCloud+','Microsoft 365','Proton'] },
  { cle:'assurance', libelle:'Assurance',        categorie:'assurance',
    exemples:['Assurance auto','Assurance habitation','Assurance téléphone','Mutuelle santé','Protection juridique'] },
  { cle:'autre',     libelle:'Autre',            categorie:'',
    exemples:[] },
];

/* --------------------------------------------------------------------------
   Normalisation défensive — aucune migration, aucun changement de schéma.
   La clé de stockage et les noms de champs restent ceux de la version
   précédente ; cette fonction se contente de rendre inoffensive une ligne
   incomplète ou abîmée, sans jamais réinterpréter ce qui est lisible.
   -------------------------------------------------------------------------- */

/** Ligne brute issue du stockage -> ligne exploitable, ou null si elle ne
 *  porte aucun montant utilisable (il n'y a alors rien à calculer ni à
 *  afficher). `rang` ne sert qu'à fabriquer un identifiant de repli stable,
 *  pour que la fonction reste pure et testable. */
function normaliserLigne(brut, rang) {
  if (!brut || typeof brut !== 'object') return null;

  const montant = Number.isInteger(brut.montant) ? brut.montant : enCentimes(brut.montant);
  if (montant === null || montant <= 0) return null;

  // Une périodicité connue est conservée telle quelle, y compris les quatre
  // que le formulaire rapide ne propose pas. Le repli sur « mensuelle » ne
  // concerne qu'une valeur absente ou inconnue : il n'y a alors rien à
  // préserver, et c'était déjà la valeur par défaut de la saisie.
  const periodicite = PERIODICITES[brut.periodicite] ? brut.periodicite : 'mensuelle';
  const categorie = CATEGORIES[brut.categorie] ? brut.categorie : '';

  const dateValide = v => (typeof v === 'string' && versDate(v)) ? v : null;
  const engagementDebut = dateValide(brut.engagementDebut);
  const mois = Number(brut.engagementMois);
  const dureeOk = Number.isFinite(mois) && mois > 0;

  const nom = (typeof brut.nom === 'string' && brut.nom.trim()) ? brut.nom.trim() : 'Contrat sans nom';

  return {
    // L'identifiant sert de fragment d'attribut et de sélecteur dans la page :
    // une valeur venue du stockage ne doit contenir que des caractères sûrs.
    id: (typeof brut.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(brut.id)) ? brut.id : 'reprise-' + rang,
    nom,
    montant,
    periodicite,
    categorie,
    echeance: dateValide(brut.echeance),
    // Une date de début sans durée, ou l'inverse, ne suffit pas à calculer un
    // engagement — `engagement()` renvoie null tant que les deux ne sont pas
    // là. Mais les deux champs sont conservés SÉPARÉMENT : effacer la moitié
    // saisie ferait disparaître le travail de l'utilisateur sans rien lui
    // dire, alors que `etatLigne()` peut nommer précisément ce qui manque.
    engagementDebut,
    engagementMois: dureeOk ? Math.round(mois) : null,
    souscritEnLigne: brut.souscritEnLigne === true,
    recent: brut.recent === true,
    // Confirmation d'avoir consulté le document contractuel. Rien ne la pose
    // aujourd'hui : aucune question du parcours ne la demande, et une date
    // tapée peut parfaitement l'être de mémoire. Tant qu'elle est fausse,
    // aucune information n'est présentée comme « lue sur le contrat ».
    documentConsulte: brut.documentConsulte === true,
    // Réponses du parcours de vérification. Ce sont des DÉCLARATIONS : elles
    // aiguillent les questions et ne déclenchent aucune règle. Une valeur
    // inconnue retombe sur null, jamais sur « sans engagement » — ce serait
    // conclure à la place de quelqu'un qui n'a rien dit.
    engagementDeclare: ['avec', 'sans', 'inconnu'].includes(brut.engagementDeclare) ? brut.engagementDeclare : null,
    categorieDemandee: brut.categorieDemandee === true,
    verifIgnoree: brut.verifIgnoree === true,
    // Deux indicateurs d'anciennes versions qui pèsent sur `totaux()` : les
    // laisser tomber changerait un total déjà affiché à l'utilisateur.
    archive: brut.archive === true,
    aArreter: brut.aArreter === true,
  };
}

/** Contenu brut du stockage -> liste saine, identifiants uniques. */
function normaliserLignes(brut) {
  if (!Array.isArray(brut)) return [];
  const vus = new Set();
  const out = [];
  brut.forEach((l, i) => {
    const n = normaliserLigne(l, i);
    if (!n) return;
    if (vus.has(n.id)) n.id = n.id + '-' + i;
    vus.add(n.id);
    out.push(n);
  });
  return out;
}

/** Un contrat est « approfondi » dès qu'un champ avancé a été renseigné :
 *  c'est ce qui distingue une ligne d'inventaire d'une ligne vérifiable. La
 *  catégorie seule ne compte pas — elle est préremplie par le choix rapide,
 *  sans que l'utilisateur ait rien vérifié. */
function contratApprofondi(ligne) {
  if (!ligne) return false;
  return !!(ligne.echeance || ligne.engagementDebut || ligne.souscritEnLigne === true || ligne.recent === true);
}

/** L'état d'une ligne dans l'inventaire, en un mot et sans jargon.
 *
 *  Remplace l'ancienne pastille « Vérification en cours », qui disait qu'il se
 *  passait quelque chose sans dire quoi. Quand une information indispensable
 *  manque, elle est nommée : l'utilisateur sait quoi aller chercher.
 *
 *  Trois états, et un seul peut s'appliquer :
 *    'sommaire'    — seul le montant est connu. Aucune pastille : c'est le cas
 *                    normal d'un inventaire, pas un défaut à signaler.
 *    'a-completer' — une saisie a commencé mais reste inexploitable en l'état.
 *    'verifiable'  — assez d'éléments pour qu'une vérification existe.
 *
 *  Les manques sont ordonnés du plus bloquant au moins bloquant, et seul le
 *  premier est affiché : une pastille qui énumère trois choses ne se lit pas. */
function etatLigne(ligne, aujourdhui) {
  const auj = aujourdhui || new Date();
  const manque = [];

  // Un engagement à moitié saisi ne produit aucune règle : `engagement()`
  // exige les deux. C'est le manque le plus coûteux, donc le premier cité.
  if (ligne.engagementDebut && !ligne.engagementMois) manque.push("durée de l'engagement");
  if (ligne.engagementMois && !ligne.engagementDebut) manque.push("date de début de l'engagement");

  // Un engagement de plus de douze mois sans catégorie : la règle des
  // communications électroniques ne peut être ni appliquée ni tue. `pistes()`
  // le signale déjà en toutes lettres ; la pastille dit quoi faire pour lever
  // le doute, sans rien conclure sur la nature du contrat.
  const eng = (ligne.engagementDebut && ligne.engagementMois)
    ? engagement(ligne.engagementDebut, ligne.engagementMois, auj)
    : null;
  if (eng && eng.dureeMois > 12 && !ligne.categorie) manque.push('catégorie du contrat');

  if (manque.length) return { cle: 'a-completer', manque, libelle: 'À compléter : ' + manque[0] };
  if (!contratApprofondi(ligne)) return { cle: 'sommaire', manque: [], libelle: null };
  return { cle: 'verifiable', manque: [], libelle: 'Vérification possible' };
}

/** Classement par coût annuel décroissant. Constat arithmétique : à parts
 *  égales, l'ordre alphabétique tranche, pour que l'affichage soit stable. */
function repartition(lignes) {
  const actives = (lignes || []).filter(l => l && !l.archive);
  const total = actives.reduce((t, l) => t + annuelCentimes(l.montant, l.periodicite), 0);
  return actives
    .map(l => {
      const annuel = annuelCentimes(l.montant, l.periodicite);
      return { ligne: l, annuel, part: total ? Math.round(annuel * 100 / total) : 0 };
    })
    .sort((a, b) => b.annuel - a.annuel || a.ligne.nom.localeCompare(b.ligne.nom, 'fr'));
}

/* ==========================================================================
   PARCOURS DE VÉRIFICATION — toute la liste, sans ouvrir chaque contrat.
   --------------------------------------------------------------------------
   Rouvrir un panneau de neuf champs sept fois de suite sur un téléphone, ce
   n'est pas un parcours, c'est un obstacle. Ces fonctions décrivent un
   questionnaire court qui enchaîne les contrats et ne demande que ce qui
   manque vraiment.

   TROIS PRINCIPES.

   1. UNE DÉCLARATION N'EST PAS UNE VÉRIFICATION. « Je crois que c'est sans
      engagement » est un souvenir ; une date lue sur un contrat est un fait.
      Les deux sont stockés, mais jamais confondus : `ficheContrat` les rend
      dans deux registres distincts, et aucune règle ne se déclenche sur une
      déclaration seule.

   2. « JE NE SAIS PAS » EST UNE RÉPONSE. Elle est enregistrée comme les
      autres, pour que le parcours ne repose pas la question à la reprise, et
      elle mène à une démarche : savoir qu'on ne sait pas, c'est savoir quoi
      aller chercher.

   3. AUCUNE CONCLUSION N'EST TIRÉE DE L'ABSENCE D'ENGAGEMENT. Un contrat sans
      engagement n'est pas pour autant résiliable sans frais ni condition : le
      préavis, les clauses particulières et les frais propres au professionnel
      subsistent, et nous ne les lisons pas.
   ========================================================================== */

/* Ressources officielles citées par les démarches. Ce ne sont pas des règles
   de droit — elles n'ont donc pas leur place dans `REGLES` — mais des outils
   ou des modes d'emploi publiés par une autorité publique. Aucune n'est un
   comparateur commercial, aucune ne classe d'offres, aucune n'annonce de prix.
   Chacune porte la date à laquelle son adresse a été vérifiée. */
const RESSOURCES = {
  'portabilite-numero': {
    nom: "Service-Public — Changer d'opérateur en gardant son numéro",
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F22479',
    quoi: "la démarche officielle, étape par étape, et l'identifiant RIO qu'elle réclame",
    verifiee: '2026-09-19',
  },
  'resiliation-telecom': {
    nom: 'Service-Public — Téléphone, internet ou télévision : résiliation du contrat',
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F22486',
    quoi: "ce que la loi permet selon que vous êtes engagé ou non",
    verifiee: '2026-09-19',
  },
  'couverture-arcep': {
    nom: 'Arcep — Mon réseau mobile',
    url: 'https://monreseaumobile.arcep.fr/',
    quoi: "la couverture réelle de chaque opérateur là où vous vivez et travaillez",
    verifiee: '2026-09-19',
  },
};

/* --------------------------------------------------------------------------
   Les questions du parcours court
   -------------------------------------------------------------------------- */

const ENGAGEMENT_DECLARE = {
  avec:    'Avec engagement',
  sans:    'Sans engagement',
  inconnu: 'Je ne sais pas',
};

/** La prochaine question à poser pour ce contrat, ou null s'il n'en reste
 *  aucune. L'ordre suit l'utilité : la catégorie conditionne les règles, la
 *  nature de l'engagement conditionne les dates, et les dates ne sont
 *  demandées que si un engagement a été déclaré. */
function etapeSuivante(ligne) {
  if (!ligne || ligne.verifIgnoree === true) return null;
  if (!ligne.categorie && ligne.categorieDemandee !== true) return 'categorie';
  // Un engagement déjà daté et chiffré rend la question sans objet.
  if (ligne.engagementDebut && ligne.engagementMois) {
    return null;
  }
  if (!ENGAGEMENT_DECLARE[ligne.engagementDeclare]) return 'engagement';
  if (ligne.engagementDeclare === 'avec' && !(ligne.engagementDebut && ligne.engagementMois)) {
    return 'engagement-dates';
  }
  return null;
}

/** Les contrats restant à parcourir, dans l'ordre de la liste. La reprise est
 *  gratuite : il n'y a aucun curseur à stocker, la position se recalcule. */
function resteAVerifier(lignes) {
  return (lignes || []).filter(l => l && !l.archive && etapeSuivante(l) !== null);
}

/** Avancement du parcours, compté en CONTRATS et non en questions : une barre
 *  qui recule parce qu'une réponse ouvre une sous-question ne sert à rien. */
function avancement(lignes) {
  const actives = (lignes || []).filter(l => l && !l.archive);
  const restants = resteAVerifier(actives).length;
  return {
    total: actives.length,
    faits: actives.length - restants,
    restants,
    termine: restants === 0,
  };
}

/* --------------------------------------------------------------------------
   La démarche gratuite, adaptée à ce que l'on sait
   -------------------------------------------------------------------------- */

/** Une seule prochaine action, toujours gratuite, jamais une conclusion.
 *  Elle reste utile quand aucun remboursement n'est identifié : c'est le cas
 *  le plus fréquent, et le plus mal servi par un outil qui ne saurait parler
 *  que d'argent récupérable.
 *
 *  `liens` ne contient que des ressources publiques. Aucun partenaire, aucun
 *  classement d'offres, aucune économie annoncée. */
function demarcheContrat(ligne, aujourdhui) {
  const auj = aujourdhui || new Date();
  const cat = ligne.categorie || '';
  const decl = ligne.engagementDeclare;
  const eng = (ligne.engagementDebut && ligne.engagementMois)
    ? engagement(ligne.engagementDebut, ligne.engagementMois, auj) : null;
  const fen = ligne.echeance ? fenetreNonReconduction(ligne.echeance, ligne.periodicite, auj) : null;

  /* La rétractation prime sur tout : c'est le chemin le plus court et le seul
     qui ne demande aucun motif. */
  if (ligne.recent) {
    return {
      titre: "Exercez votre rétractation, c'est le chemin le plus court",
      texte: "Vous avez indiqué une souscription de moins de quatorze jours à distance ou hors établissement. Ce délai se prend sans motif à donner et sans frais. Envoyez la demande par écrit et gardez la preuve de sa date.",
      regle: 'retractation-14-jours', liens: [],
    };
  }

  /* Une fenêtre de reconduction ouverte est un fait daté, pas une déclaration :
     elle passe devant les démarches de catégorie. */
  if (fen && fen.dedans) {
    return {
      titre: "Demandez par écrit la preuve de l'information sur la reconduction",
      texte: "Nous sommes dans la période pendant laquelle le professionnel doit vous avoir informé de la possibilité de ne pas reconduire. Demandez-lui de produire cette preuve, et à défaut de résilier gratuitement et de rembourser la période non courue. Un courriel suffit à établir la date ; conservez-le.",
      regle: 'tacite-reconduction', liens: [],
    };
  }

  if (eng && !eng.termine) {
    return {
      titre: `Demandez le décompte de ce qu'une rupture vous coûterait`,
      texte: `Votre engagement court jusqu'au ${eng.fin.toLocaleDateString('fr-FR')}. Demandez par écrit le décompte des sommes restant dues en cas de rupture anticipée : c'est au professionnel de le produire, et le recevoir ne vous engage à rien. ${cat === 'telecom' ? "Confrontez-le à la règle de l'article L224-28, rappelée ci-dessous." : "Nous ne le chiffrons pas : il dépend de vos mensualités et des frais propres à votre contrat."}`,
      regle: cat === 'telecom' && eng.dureeMois > 12 ? 'engagement-telecom' : null,
      liens: cat === 'telecom' ? [RESSOURCES['resiliation-telecom']] : [],
    };
  }

  /* À partir d'ici, aucun fait daté ne commande. La démarche dépend de la
     catégorie et de ce que l'utilisateur a déclaré. */

  if (cat === 'telecom') {
    return {
      titre: decl === 'avec'
        ? "Demandez votre date de fin d'engagement par écrit"
        : "Faites confirmer votre engagement, puis préparez votre numéro",
      texte: decl === 'avec'
        ? "Vous avez déclaré être engagé sans en connaître les dates. Demandez à votre opérateur, par écrit ou depuis votre espace client, la date de début et la durée de votre engagement. C'est l'information qui décide de tout le reste, et elle vous est due."
        : `${decl === 'sans' ? "Vous avez déclaré n'être pas engagé, et c'est probablement exact — mais cela ne rend pas le contrat résiliable sans condition : préavis, frais propres à l'opérateur et clauses particulières subsistent." : "Vous ne savez pas si vous êtes engagé, et c'est la première chose à établir."} Demandez la confirmation écrite à votre opérateur. Dans le même mouvement, deux choses se préparent sans rien engager : la couverture réseau réelle là où vous vivez, et l'identifiant qui vous permettra de garder votre numéro.`,
      regle: null,
      liens: decl === 'avec'
        ? [RESSOURCES['resiliation-telecom']]
        : [RESSOURCES['couverture-arcep'], RESSOURCES['portabilite-numero'], RESSOURCES['resiliation-telecom']],
    };
  }

  if (cat === 'assurance') {
    const st = sousTypeAssurance(ligne.nom);
    if (st === 'habitation' || st === 'auto') {
      const quoi = st === 'habitation' ? 'une assurance habitation' : 'une assurance de véhicule à moteur';
      return {
        titre: "Relevez la date d'échéance annuelle sur votre avis de cotisation",
        texte: `Le nom que vous avez donné — « ${ligne.nom} » — désigne ${quoi}, et la règle rappelée ci-dessous s'applique à ce type de contrat : résiliation à chaque échéance annuelle, et à tout moment après la première année. Nous ne vérifions pas pour autant que votre contrat en est bien un, ni depuis quand il court : ces deux points figurent sur votre avis de cotisation, avec la date d'échéance qui commande tout le reste.${st === 'auto' ? " Un véhicule à moteur doit rester assuré : ne résiliez pas avant d'avoir souscrit ailleurs." : ''}`,
        regle: 'assurance-resiliation-annuelle', liens: [],
      };
    }
    if (st === 'autre-regime') {
      return {
        titre: "Vérifiez le régime propre à ce type d'assurance",
        texte: `Le nom que vous avez donné — « ${ligne.nom} » — ne correspond ni à une assurance habitation ni à une assurance de véhicule. La règle rappelée ci-dessous ne le couvre donc pas : complémentaire santé, assurance d'un appareil et assurance emprunteur relèvent chacune de dispositions distinctes, que ce site ne traite pas. Demandez par écrit à votre assureur les conditions et la date d'échéance de ce contrat précis.`,
        regle: 'assurance-resiliation-annuelle', liens: [],
      };
    }
    return {
      titre: "Précisez de quelle assurance il s'agit, puis relevez son échéance",
      texte: "Le nom enregistré ne nous dit pas de quel contrat il s'agit, et la catégorie « assurance » recouvre des régimes qui n'obéissent pas aux mêmes règles : habitation et véhicule à moteur d'un côté, complémentaire santé, assurance d'un appareil ou assurance emprunteur de l'autre. Renommez la ligne pour vous y retrouver, puis relevez la date d'échéance annuelle sur l'avis de cotisation.",
      regle: 'assurance-resiliation-annuelle', liens: [],
    };
  }

  if (cat === 'energie') {
    return {
      titre: "Relevez votre consommation annuelle, pas votre mensualité",
      texte: "Le montant que vous payez chaque mois pour l'énergie est un acompte estimé, régularisé une fois par an : ce n'est ni votre coût réel, ni une base de comparaison. Cherchez sur votre dernière facture de régularisation la consommation annuelle en kilowattheures. C'est la seule donnée qui permette de comparer quoi que ce soit — nous ne la connaissons pas et n'en déduisons aucune économie.",
      regle: null, liens: [],
    };
  }

  if (cat === 'streaming' || cat === 'logiciel') {
    return {
      titre: "Cherchez la résiliation dans votre espace client, et relevez l'échéance",
      texte: `Un contrat souscrit en ligne doit pouvoir être résilié en ligne, gratuitement et en quelques clics : c'est une obligation qui pèse sur le professionnel. Faites une capture d'écran de la confirmation. Relevez au passage la date de prochaine échéance — c'est elle qui situe la fenêtre d'information sur la reconduction.${decl === 'sans' ? " Vous avez déclaré n'être pas engagé ; cela ne dispense ni du préavis éventuel ni des conditions propres au service." : ''}`,
      regle: 'resiliation-trois-clics', liens: [],
    };
  }

  if (cat === 'sport') {
    return {
      titre: "Relisez la clause de résiliation de votre contrat",
      texte: `Les contrats de salle de sport comportent fréquemment un engagement de douze mois et des motifs de sortie anticipée limitativement énumérés — déménagement, raison médicale, perte d'emploi — chacun avec son justificatif. Ces conditions sont dans votre contrat, pas dans la loi : nous ne les lisons pas.${decl === 'sans' ? " Vous avez déclaré n'être pas engagé : faites-le confirmer par écrit avant de compter dessus." : ''} Demandez un exemplaire de vos conditions si vous ne l'avez plus.`,
      regle: 'tacite-reconduction', liens: [],
    };
  }

  /* Sans catégorie, on ne sait pas de quel contrat il s'agit — et demander
     une date d'échéance à quelqu'un qui n'a pas encore identifié le
     professionnel met la charrue devant les bœufs. On remet les deux étapes
     dans l'ordre : nommer, retrouver le contrat, puis en lire l'échéance.
     Nous n'attribuons toujours aucune catégorie d'office. */
  return {
    titre: "Identifiez le professionnel, puis retrouvez le contrat",
    texte: "Tant que vous ne savez pas qui prélève, il n'y a rien à vérifier. Relevez le libellé exact sur votre relevé bancaire et cherchez ce nom dans vos courriels : la confirmation de souscription s'y trouve presque toujours, et c'est elle qui donne le contrat. Votre banque peut aussi vous communiquer le créancier d'un prélèvement. Une fois le professionnel identifié et le contrat en main, relevez-y la date de prochaine échéance : c'est elle qui débloquera la suite.",
    regle: null, liens: [],
  };
}

/** Lit le NOM que l'utilisateur a donné à sa ligne d'assurance, pour savoir
 *  quelle question lui poser. C'est un repérage lexical sur son propre texte,
 *  rien d'autre : il choisit une formulation, jamais une conclusion. Un nom
 *  qui ne dit rien renvoie null, et la question redevient générale. */
function sousTypeAssurance(nom) {
  const n = String(nom || '').toLowerCase();
  if (/habitation|logement|appartement|maison|locataire|propri[ée]taire|mrh/.test(n)) return 'habitation';
  if (/auto|voiture|v[ée]hicule|moto|scooter|deux[- ]roues/.test(n)) return 'auto';
  if (/sant[ée]|mutuelle|compl[ée]mentaire|pr[eê]voyance|emprunteur|pr[eê]t|cr[ée]dit|t[ée]l[ée]phone|mobile|appareil|nomade|scolaire|animal|animaux/.test(n)) return 'autre-regime';
  return null;
}

/* --------------------------------------------------------------------------
   La fiche d'un contrat : trois questions, trois réponses.
   « Ce que vous savez », « ce qu'il reste à vérifier », « ce que vous pouvez
   faire maintenant ». C'est la forme que réclame une liste qu'on relit sur un
   téléphone : une carte par contrat, pas quatre listes par thème.
   -------------------------------------------------------------------------- */

/** `source` dit d'où vient chaque information :
 *    'calcule' — nous l'avons obtenue par calcul sur le montant saisi ;
 *    'declare' — l'utilisateur l'a répondue de mémoire, au parcours ;
 *    'indique' — l'utilisateur l'a saisie, sans nous dire d'où elle venait ;
 *    'saisi'   — elle a été relevée sur le document contractuel.
 *
 *  Le dernier niveau exige `documentConsulte`, que rien ne pose aujourd'hui :
 *  aucune question ne demande à l'utilisateur s'il a bien ouvert son contrat.
 *  Une date tapée l'est donc « par vous », pas « d'après le contrat » — la
 *  différence compte, puisque c'est elle qui sépare un souvenir d'une preuve.
 *  Le niveau reste dans le code, prêt pour le jour où la question sera posée. */
function ficheContrat(ligne, aujourdhui) {
  const auj = aujourdhui || new Date();
  const p = PERIODICITES[ligne.periodicite] || PERIODICITES.mensuelle;
  const eng = (ligne.engagementDebut && ligne.engagementMois)
    ? engagement(ligne.engagementDebut, ligne.engagementMois, auj) : null;
  const fen = ligne.echeance ? fenetreNonReconduction(ligne.echeance, ligne.periodicite, auj) : null;
  const etat = etatLigne(ligne, auj);

  /* ---- Ce que vous savez ---- */
  const sais = [{
    source: 'calcule',
    texte: `${euros(ligne.montant)} ${p.nom}, soit ${euros(annuelCentimes(ligne.montant, ligne.periodicite))} par an et ${euros(mensuelCentimes(ligne.montant, ligne.periodicite))} par mois en moyenne.`,
  }];
  if (ligne.categorie && CATEGORIES[ligne.categorie]) {
    sais.push({ source: 'declare', texte: `Catégorie : ${CATEGORIES[ligne.categorie].toLowerCase()}.` });
  }
  const provDate = ligne.documentConsulte === true ? 'saisi' : 'indique';
  if (eng) {
    sais.push({
      source: provDate,
      texte: eng.termine
        ? `Engagement de ${eng.dureeMois} mois terminé depuis le ${eng.fin.toLocaleDateString('fr-FR')}.`
        : `Engagement de ${eng.dureeMois} mois, en cours jusqu'au ${eng.fin.toLocaleDateString('fr-FR')}.`,
    });
  } else if (ENGAGEMENT_DECLARE[ligne.engagementDeclare]) {
    sais.push({
      source: 'declare',
      texte: ligne.engagementDeclare === 'avec'
        ? "Vous avez déclaré un engagement, sans en connaître les dates."
        : ligne.engagementDeclare === 'sans'
          ? "Vous avez déclaré n'être pas engagé."
          : "Vous ne savez pas si ce contrat comporte un engagement.",
    });
  }
  if (fen) {
    sais.push({ source: provDate, texte: `Prochaine échéance le ${fen.echeance.toLocaleDateString('fr-FR')}.` });
  }
  if (ligne.souscritEnLigne) sais.push({ source: 'declare', texte: 'Souscrit en ligne.' });
  if (ligne.recent) sais.push({ source: 'declare', texte: 'Souscrit il y a moins de quatorze jours.' });

  /* ---- Ce qu'il reste à vérifier ---- */
  const verifier = [];
  if (etat.cle === 'a-completer') {
    etat.manque.forEach(m => verifier.push(`Il manque ${m} : sans elle, aucune règle ne s'applique.`));
  }
  if (ligne.engagementDeclare === 'sans' && !eng) {
    verifier.push("Votre absence d'engagement est une déclaration, pas une vérification. Elle ne rend pas le contrat résiliable sans frais ni condition : préavis, clauses particulières et frais propres au professionnel subsistent.");
  }
  if (ligne.engagementDeclare === 'inconnu') {
    verifier.push("L'existence d'un engagement n'est pas établie. C'est la première chose à faire confirmer par écrit.");
  }
  if (ligne.engagementDeclare === 'avec' && !eng) {
    verifier.push("L'engagement est déclaré mais non daté : sa date de fin, et donc ce qu'une rupture coûterait, restent inconnues.");
  }
  // Ni date, ni déclaration : la question n'a simplement jamais été posée ou
  // répondue. Le dire, plutôt que de laisser une fiche silencieuse sur le
  // point qui commande le plus de démarches.
  if (!eng && !ENGAGEMENT_DECLARE[ligne.engagementDeclare]) {
    verifier.push("L'existence d'un engagement n'est pas renseignée : c'est elle qui décide de ce qu'une résiliation coûterait.");
  }
  if (ligne.verifIgnoree === true) {
    verifier.push("Vous avez passé ce contrat dans le parcours de vérification. Ce qui précède reste donc en suspens ; relancez le parcours ou ouvrez « Vérifier ce contrat » quand vous le voudrez.");
  }
  if (!ligne.echeance) {
    verifier.push("La date de prochaine échéance n'est pas connue : sans elle, la fenêtre d'information sur la reconduction ne peut pas être située.");
  }
  if (!ligne.categorie) {
    verifier.push("La catégorie n'est pas précisée : nous n'en attribuons aucune d'office, et les règles propres à un type de contrat restent donc inappliquées.");
  }
  if (ligne.categorie === 'energie') {
    verifier.push("Pour l'énergie, le montant mensuel est un acompte estimé, régularisé une fois par an : ce n'est pas votre coût réel.");
  }
  if (!verifier.length) {
    verifier.push("Rien de bloquant. Restent les conditions de votre contrat — préavis, frais, clauses particulières — que nous ne lisons pas.");
  }

  return {
    id: ligne.id,
    nom: ligne.nom,
    etat: etat.cle,
    annuel: annuelCentimes(ligne.montant, ligne.periodicite),
    sais,
    verifier,
    faire: demarcheContrat(ligne, auj),
  };
}

/* --------------------------------------------------------------------------
   La synthèse de l'inventaire, dans la forme attendue par resultat4.js.
   `resultat4.js` n'est pas modifié : il est partagé par les trois outils, et
   le vocabulaire des degrés de certitude doit rester fixé à un seul endroit.
   Le total annuel y entre avec la certitude « fait » — que le rendu commun
   intitule déjà « Coût actuel », jamais « économie ».
   -------------------------------------------------------------------------- */
function resultat4Inventaire(lignes, aujourdhui) {
  const auj = aujourdhui || new Date();
  const actives = normaliserLignes(lignes);
  const t = totaux(actives);
  const ordre = repartition(actives);
  const av = avancement(actives);

  /* ---- 1. Votre situation ---- */
  const constat = [{
    titre: `${t.nombre} contrat${t.nombre > 1 ? 's' : ''} — ${euros(t.annuel)} par an`,
    texte: `Soit ${euros(t.mensuel)} par mois en moyenne. C'est une addition de ce que vous avez saisi, rien de plus : aucun montant n'est deviné, aucun relevé n'est lu.`,
  }];

  if (ordre.length > 1) {
    constat.push({
      titre: 'Répartition de vos dépenses récurrentes',
      texte: 'Par coût annuel décroissant : '
        + ordre.map(o => `${o.ligne.nom}, ${euros(o.annuel)} (${o.part} %)`).join(' · ')
        + ". C'est un constat arithmétique, pas une recommandation : ce classement ne dit pas lequel arrêter, puisque nous ignorons si l'un d'eux peut l'être, à quelle date et à quel coût.",
    });
  }

  const peuVisibles = ordre.filter(o => o.ligne.periodicite === 'annuelle' || o.ligne.periodicite === 'semestrielle');
  if (peuVisibles.length) {
    constat.push({
      titre: `${peuVisibles.length} contrat${peuVisibles.length > 1 ? 's' : ''} peu visible${peuVisibles.length > 1 ? 's' : ''} sur vos relevés`,
      texte: `${peuVisibles.map(o => o.ligne.nom).join(', ')} : ${peuVisibles.length > 1 ? 'ces contrats ne figurent pas' : 'ce contrat ne figure pas'} sur vos relevés la plupart des mois. Le mensuel affiché est une moyenne lissée, utile pour comparer, pas pour prévoir un prélèvement.`,
    });
  }

  /* ---- 2. Le coût total, et rien d'autre ---- */
  const somme = {
    montant: t.annuel,
    texte: `${euros(t.annuel)} par an`,
    certitude: 'fait',
    pourquoi: `C'est le coût actuel de ${t.nombre > 1 ? 'ces ' + t.nombre + ' contrats' : 'ce contrat'}, obtenu en additionnant ce que vous avez saisi, soit ${euros(t.mensuel)} par mois en moyenne. Ce n'est pas une économie, et ce n'est pas une somme récupérable : pour parler d'économie, il faudrait savoir quels contrats vous pouvez résilier, à quelle date, à quel coût, et ce que vous paieriez à la place. Nous ne connaissons aucun de ces quatre éléments.`,
  };

  /* ---- 3. Une seule action, globale.
     Le détail par contrat n'est PAS répété ici : il est rendu contrat par
     contrat par `ficheContrat`, au-dessus. Deux endroits pour la même phrase,
     c'est une phrase qu'on ne lit ni à l'un ni à l'autre. ---- */
  const action = [av.termine
    ? {
        titre: `Vous avez parcouru vos ${av.total} contrat${av.total > 1 ? 's' : ''}`,
        texte: "Chaque contrat porte désormais sa propre prochaine démarche, juste au-dessus. Elles sont toutes gratuites et n'engagent à rien : demander un décompte, réclamer une confirmation écrite ou relever une date ne vaut pas résiliation.",
        gratuit: true,
      }
    : {
        titre: `Vérifiez vos contrats : ${av.restants} sur ${av.total} attendent encore une réponse`,
        texte: "Le parcours pose deux ou trois questions par contrat, et ne demande que ce qui manque vraiment. Vous pouvez passer un contrat, revenir en arrière, et reprendre plus tard : votre position est retrouvée toute seule.",
        gratuit: true,
      }];

  /* ---- 4. Ce que l'outil ne peut pas savoir ---- */
  const verification = [{
    titre: "Ce que nous ne lisons pas, et que vous seul pouvez vérifier",
    texte: "Vos conditions particulières : préavis, frais de résiliation, clauses de sortie anticipée et justificatifs exigés. Aucune règle citée ici ne rend un contrat résiliable à elle seule — toutes pèsent sur le professionnel, et c'est à lui de produire ses décomptes.",
  }];
  if (!av.termine) {
    verification.push({
      titre: `${av.restants} contrat${av.restants > 1 ? 's' : ''} sans vérification en l'état`,
      texte: `${resteAVerifier(actives).map(l => l.nom).join(', ')} : nous n'en connaissons que le montant, ou une partie des réponses. Le parcours de vérification les reprend un par un.`,
    });
  }

  const limites = [
    "Le total est une addition de vos saisies, pas une économie ni une somme récupérable.",
    "Une réponse déclarée au parcours — « sans engagement », « je ne sais pas » — est un souvenir, pas une vérification. Aucune règle ne s'applique sur cette seule base.",
    "Un contrat sans engagement n'est pas pour autant résiliable sans frais ni condition.",
    "Nous n'affichons aucun montant remboursable au titre de l'article L215-1 : il dépend de cinq faits que seuls vos contrats et vos courriers peuvent établir.",
    "Aucune offre n'est comparée et aucun fournisseur n'est recommandé. Les ressources citées sont publiques et ne classent pas d'offres.",
    "Le mensuel affiché est une moyenne lissée. Un contrat payé une fois par an ne coûte rien onze mois sur douze.",
  ];

  return { constat, somme, verification, action, limites,
           annuel: t.annuel, mensuel: t.mensuel, nombre: t.nombre,
           repartition: ordre, avancement: av,
           fiches: ordre.map(o => ficheContrat(o.ligne, auj)) };
}


if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PERIODICITES, CATEGORIES, enCentimes, euros, annuelCentimes, mensuelCentimes,
                     totaux, ajouterMois, ajouterJours, versDate, joursEntre, prochaineEcheance,
                     fenetreNonReconduction, engagement, pistes,
                     resultat4Abonnement,
                     CHOIX_RAPIDES, normaliserLigne, normaliserLignes, contratApprofondi,
                     etatLigne, repartition, resultat4Inventaire,
                     RESSOURCES, ENGAGEMENT_DECLARE, etapeSuivante, resteAVerifier,
                     avancement, sousTypeAssurance, demarcheContrat, ficheContrat };
}
