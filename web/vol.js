/* ==========================================================================
   OUTIL « VOL RETARDÉ » — orientation puis montant forfaitaire.
   --------------------------------------------------------------------------
   C'est le seul des outils du site où un MONTANT peut être affiché, parce que
   c'est le seul où le montant est fixé par un texte et non par une décision à
   venir : le règlement (CE) n° 261/2004 arrête un barème forfaitaire.

   Trois interdits, tenus dans tout le fichier :
     — ne jamais présenter le montant comme acquis. Le règlement le prévoit ;
       la compagnie peut s'en exonérer en prouvant une circonstance
       extraordinaire, que ce site ne peut pas connaître ;
     — ne jamais afficher de montant quand la tranche de distance n'est pas
       connue. Une tranche devinée, c'est un montant faux ;
     — ne jamais renvoyer vers un intermédiaire payant : la démarche auprès de
       la compagnie est gratuite.

   SOURCES, relevées le 18 septembre 2026
     — DGAC, « Droits des passagers aériens », FAQ « Retard de vol » :
       barème à quatre paliers, seuil de trois heures À L'ARRIVÉE, distance
       orthodromique, délai de recours de cinq ans en France, démarche.
     — Ministère de la Transition écologique (page du 18/05/2026) : périmètre.
     — EUR-Lex, règlement (CE) n° 261/2004 : article 7 (montants et réduction
       de moitié), article 5 § 3 (la preuve de la circonstance extraordinaire
       incombe à la compagnie).
     — Commission européenne, 15/06/2026 : une révision a été négociée, les
       seuils restent inchangés, et elle ne s'appliquera que douze mois après
       publication au Journal officiel. Elle n'est donc pas appliquée ici.

   DIVERGENCE ASSUMÉE ENTRE DEUX SOURCES OFFICIELLES
   La Commission résume le barème en trois montants (250 / 400 / 600). La DGAC
   en détaille quatre, en intégrant la faculté de réduction de moitié de
   l'article 7 § 2 : un vol international de plus de 3 500 km retardé de trois
   à quatre heures donne 300 €. Nous suivons la DGAC : c'est l'organisme
   national chargé de faire respecter le règlement en France, sa présentation
   est plus précise, et elle est la plus prudente des deux.
   ========================================================================== */

const VOL_DEPARTS = {
  ue:     "Un aéroport de l'UE, de Norvège, d'Islande ou de Suisse",
  tiers:  "Un aéroport hors de ces pays",
};

const VOL_RETARDS = {
  moins3:  "Moins de 3 heures",
  de3a4:   "Entre 3 et 4 heures",
  plus4:   "4 heures ou plus",
  inconnu: "Je ne sais pas encore",
};

/* Les tranches sont celles de l'article 7. On les fait CHOISIR, avec des
   repères concrets, plutôt que de calculer une distance : il faudrait un
   référentiel d'aéroports que nous ne pourrions ni maintenir ni justifier, et
   une distance approchée produirait un montant faux. « Je ne sais pas » est
   une réponse prévue, qui n'affiche aucun montant. */
const VOL_TRANCHES = {
  courte:   "1 500 km ou moins",
  moyenne:  "Entre 1 500 et 3 500 km",
  longue:   "Plus de 3 500 km",
  inconnue: "Je ne sais pas",
};

const VOL_MONTANTS = { courte: 250, moyenne: 400, longue_intra: 400, longue_3a4: 300, longue_4plus: 600 };

const PRESCRIPTION_ANS = 5;   // France, recours fondé sur le règlement 261/2004 (DGAC, 18/09/2026)

function versDateV(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [a, m, j] = iso.split('-').map(Number);
  const d = new Date(a, m - 1, j);
  return (d.getFullYear() === a && d.getMonth() === m - 1 && d.getDate() === j) ? d : null;
}

function joursEntre(a, b) {
  return Math.round((b - a) / 86400000);
}

/* Le montant du barème, ou null si une donnée manque. Volontairement séparé
   du reste : c'est la seule fonction qui produit un chiffre. */
function montantForfaitaire({ tranche, intraUE, retard }) {
  if (tranche === 'courte')  return VOL_MONTANTS.courte;
  if (tranche === 'moyenne') return VOL_MONTANTS.moyenne;
  if (tranche === 'longue') {
    if (intraUE === true) return VOL_MONTANTS.longue_intra;   // métropole ↔ outre-mer, par exemple
    if (intraUE === false) {
      if (retard === 'plus4') return VOL_MONTANTS.longue_4plus;
      if (retard === 'de3a4') return VOL_MONTANTS.longue_3a4;
    }
  }
  return null;
}

/* ==========================================================================
   Première orientation : deux réponses suffisent.
   Elle ne donne AUCUN montant — seulement si le règlement peut jouer.
   ========================================================================== */
function orientationRapide(r) {
  const couvert = r.depart === 'ue'
    ? true
    : (r.depart === 'tiers' ? r.compagnieEuropeenne === true : null);

  if (couvert === null) return { etat: 'incomplet' };

  if (!couvert) {
    return {
      etat: 'hors-champ',
      titre: "Le règlement européen ne couvre pas ce vol",
      texte: "Il s'applique au départ de l'UE, de Norvège, d'Islande ou de Suisse quelle que soit la compagnie, et à l'arrivée dans ces pays depuis un pays tiers seulement si la compagnie qui exploite le vol est européenne. Votre vol ne remplit ni l'une ni l'autre condition.",
      suite: "Une autre voie existe, sans barème : les conventions de Montréal et de Varsovie permettent de demander réparation d'un préjudice que vous pouvez justifier — un hôtel payé, un rendez-vous manqué avec conséquence chiffrable. Il faut prouver le dommage, il n'y a pas de montant automatique.",
    };
  }

  if (r.retard === 'moins3') {
    return {
      etat: 'sous-seuil',
      titre: "Sous trois heures, aucune indemnisation forfaitaire n'est prévue",
      texte: "Le seuil est de trois heures de retard à l'arrivée à votre destination finale. En dessous, le règlement ne prévoit pas d'indemnisation, même si le départ a été bien plus tardif.",
      suite: "Deux choses restent possibles et sont souvent oubliées : le remboursement des frais de restauration ou d'hébergement que la compagnie devait prendre en charge pendant l'attente, et la réparation d'un préjudice prouvé au titre de la convention de Montréal.",
    };
  }

  if (r.retard === 'inconnu') {
    return {
      etat: 'a-mesurer',
      titre: "Tout dépend du retard à l'arrivée",
      texte: "Le vol entre bien dans le périmètre du règlement. Reste à établir le retard à l'arrivée à votre destination finale — pas le retard au départ, qui ne compte pas.",
      suite: "Reprenez l'heure d'arrivée prévue sur votre réservation et l'heure d'arrivée réelle. Pour un voyage à correspondances réservé en une fois, c'est l'arrivée du dernier vol qui compte.",
    };
  }

  return {
    etat: 'ouvert',
    titre: "Ce vol peut ouvrir droit à une indemnisation forfaitaire",
    texte: "Départ et retard remplissent les deux conditions principales du règlement. Le montant dépend maintenant de la distance, et une seule inconnue peut le ramener à zéro : le motif du retard.",
    suite: null,
  };
}

/* ==========================================================================
   Résultat complet, en quatre parties : constat, somme éventuelle et son
   degré de certitude, vérification nécessaire, prochaine action gratuite.
   ========================================================================== */
function orienterVol(r, aujourdhui) {
  const auj = aujourdhui || new Date();
  const rapide = orientationRapide(r);

  const dateVol = versDateV(r.dateVol);
  if (r.dateVol && !dateVol) {
    return { invalide: "Cette date n'existe pas." };
  }
  if (dateVol && dateVol > auj) {
    return { invalide: "Cette date est dans le futur : indiquez la date du vol qui a été retardé." };
  }

  const constat = [];
  const verification = [];
  const action = [];
  const limites = [];

  /* ---- Prescription : cinq ans à compter de l'incident ---- */
  let prescrit = null, joursRestants = null;
  if (dateVol) {
    const limite = new Date(dateVol.getFullYear() + PRESCRIPTION_ANS, dateVol.getMonth(), dateVol.getDate());
    joursRestants = joursEntre(auj, limite);
    prescrit = joursRestants <= 0;
    constat.push({
      titre: prescrit
        ? `Délai de recours dépassé depuis le ${limite.toLocaleDateString('fr-FR')}`
        : `Vous avez jusqu'au ${limite.toLocaleDateString('fr-FR')} pour réclamer`,
      texte: prescrit
        ? "En France, le délai de recours fondé sur le règlement est de cinq ans à compter de l'incident. Passé ce délai, une demande peut être refusée pour cette seule raison."
        : `Le délai est de cinq ans à compter de l'incident, soit encore ${joursRestants} jour${joursRestants > 1 ? 's' : ''}. Rien n'oblige à attendre : plus la demande est tardive, plus les preuves sont difficiles à réunir.`,
    });
  }

  /* ---- Hors champ, ou sous le seuil : pas de montant ---- */
  if (rapide.etat === 'hors-champ' || rapide.etat === 'sous-seuil' || rapide.etat === 'incomplet') {
    return {
      invalide: null, rapide, prescrit, joursRestants,
      constat: [{ titre: rapide.titre, texte: rapide.texte }, ...constat],
      somme: { montant: null, texte: 'Aucun montant forfaitaire à ce titre',
               certitude: 'exclu',
               pourquoi: rapide.etat === 'hors-champ'
                 ? "Le barème du règlement européen ne s'applique pas à ce vol."
                 : "Le barème du règlement européen ne s'applique qu'à partir de trois heures de retard à l'arrivée." },
      verification: [{ titre: "Vérifiez l'heure d'arrivée réelle, pas celle du départ",
                       texte: "C'est l'écart entre l'arrivée prévue sur votre réservation et l'arrivée effective à la destination finale qui compte. Beaucoup de passagers renoncent à tort après avoir regardé l'heure de départ." }],
      action: rapide.suite
        ? [{ titre: "Une autre voie, sans barème", texte: rapide.suite, gratuit: true }]
        : [],
      limites: ["Ce site n'a accès à aucun dossier : tout ce qui précède découle de ce que vous venez de saisir."],
    };
  }

  /* ---- Le vol est dans le périmètre et au-delà du seuil ---- */
  if (r.arrive === false) {
    constat.push({
      titre: "Vous n'avez pas effectué le voyage",
      texte: "La DGAC le précise : aucune indemnisation n'est due si vous avez renoncé au voyage sans atteindre votre destination finale avec au moins trois heures de retard.",
    });
  }

  const montant = r.arrive === false ? null : montantForfaitaire({
    tranche: r.tranche, intraUE: r.intraUE === true, retard: r.retard,
  });

  const intraConnu = r.tranche !== 'longue' || typeof r.intraUE === 'boolean';

  /* L'ordre du constat suit ce qui compte le plus pour le lecteur. Quand le
     délai est passé, c'est cette information qui doit venir en premier :
     annoncer « ce vol peut ouvrir droit » avant de dire « mais c'est trop
     tard » est une contradiction dans le même bloc. */
  if (prescrit) constat.push({ titre: rapide.titre, texte: rapide.texte });
  else          constat.unshift({ titre: rapide.titre, texte: rapide.texte });

  /* ---- La somme et son degré de certitude ---- */
  let somme;
  if (r.arrive === false) {
    somme = { montant: null, texte: 'Aucun montant forfaitaire à ce titre', certitude: 'exclu',
              pourquoi: "Le forfait suppose que vous soyez arrivé à destination avec au moins trois heures de retard." };
  } else if (montant === null) {
    somme = { montant: null, texte: 'Entre 250 € et 600 €', certitude: 'indeterminee',
              pourquoi: !intraConnu
                ? "Pour un vol de plus de 3 500 km, le montant dépend de sa nature : 400 € s'il reste intracommunautaire — un vol entre la métropole et un département d'outre-mer, par exemple — et 300 ou 600 € sinon. Répondez à cette question pour obtenir un montant."
                : "Le barème dépend de la distance entre le départ du premier vol et votre destination finale. Sans cette tranche, afficher un montant serait deviner." };
  } else if (prescrit) {
    /* Le barème donne bien un montant, mais le délai de recours est passé :
       afficher « 250 € » avec l'étiquette « montant fixé par un texte »
       laisserait croire à une somme récupérable. On garde le chiffre — il est
       vrai — en disant dans la même case qu'il n'est plus réclamable. */
    somme = { montant: null, texte: `${montant} €, hors délai`, certitude: 'exclu',
              pourquoi: `Le barème prévoit ${montant} € pour cette distance et ce retard, mais le délai de recours de cinq ans est écoulé. Une compagnie peut refuser la demande pour ce seul motif, et elle en a le droit.` };
  } else {
    somme = { montant, texte: `${montant} €`, certitude: 'barème',
              pourquoi: "C'est le montant que le règlement prévoit pour cette distance et ce retard. Ce n'est pas un droit confirmé : la compagnie peut s'en exonérer si elle prouve une circonstance extraordinaire." };
  }

  /* ---- Ce qui reste à vérifier ---- */
  verification.push({
    titre: "Le motif du retard — la seule inconnue qui peut tout annuler",
    texte: "La compagnie n'est pas tenue de payer si elle prouve une circonstance extraordinaire inévitable malgré toutes les mesures raisonnables. La preuve lui incombe, pas à vous. Nous ne pouvons pas savoir pourquoi votre vol a été retardé : demandez le motif par écrit. Un motif invoqué en une phrase n'est pas un motif prouvé.",
    regle: 'vol-exoneration',
  });
  verification.push({
    titre: "L'heure d'arrivée réelle à la destination finale",
    texte: "Conservez la carte d'embarquement, la réservation avec l'horaire prévu, et toute trace de l'heure d'arrivée effective. Pour un voyage à correspondances réservé en une seule fois, c'est le dernier vol du contrat qui fait la destination finale.",
    regle: 'vol-montants',
  });
  if (r.tranche === 'longue' && r.intraUE === false && r.retard === 'de3a4') {
    verification.push({
      titre: "Entre trois et quatre heures, la compagnie peut réduire de moitié",
      texte: "L'article 7, paragraphe 2 lui ouvre cette faculté pour un vol de plus de 3 500 km réacheminé avec moins de quatre heures de retard : le montant passe alors de 600 à 300 €. Si votre retard atteint quatre heures, c'est 600 € qui sont dus.",
      regle: 'vol-montants',
    });
  }

  /* ---- La prochaine action, gratuite ---- */
  if (!prescrit) {
    action.push({
      titre: "Écrivez à la compagnie qui a exploité le vol",
      texte: "C'est la démarche prévue par le règlement, et elle est gratuite. Adressez-vous au transporteur qui a effectivement opéré le vol — pas nécessairement celui qui a vendu le billet. Demandez l'indemnisation en citant le règlement (CE) n° 261/2004, joignez la réservation et la carte d'embarquement, et demandez par écrit le motif du retard.",
      gratuit: true, regle: 'vol-demarche',
    });
    action.push({
      titre: "Sans réponse satisfaisante, ou après deux mois",
      texte: "Vous pouvez saisir un médiateur — en France la Médiation tourisme et voyage, à condition que votre compagnie y adhère, ce qui se vérifie sur son site — ou le tribunal compétent. Vous pouvez aussi signaler le litige à la DGAC : c'est utile au régulateur, mais son action est indépendante de votre demande et ne fait pas payer la compagnie.",
      gratuit: true, regle: 'vol-demarche',
    });
  } else {
    action.push({
      titre: "Le délai est dépassé, mais une réclamation reste possible",
      texte: "Une compagnie peut accepter de traiter une demande ancienne ; elle peut aussi la refuser pour ce seul motif, et elle en a le droit. Écrire ne coûte rien, mais n'en attendez pas beaucoup.",
      gratuit: true,
    });
  }

  limites.push("Ce site n'a accès à aucun dossier de réservation : tout ce qui précède découle de ce que vous venez de saisir.");
  limites.push("Nous ne pouvons pas dire si votre demande aboutira. Le motif réel du retard, que seule la compagnie connaît, peut faire tomber le montant à zéro.");
  limites.push("Des sociétés privées proposent de réclamer à votre place contre une commission prélevée sur l'indemnisation. La démarche décrite ci-dessus est gratuite et n'exige aucun intermédiaire.");
  if (montant !== null) {
    limites.push("Le montant affiché est celui du barème, pas une somme promise : il n'est dû que si la compagnie ne prouve aucune circonstance extraordinaire.");
  }

  return { invalide: null, rapide, prescrit, joursRestants, constat, somme, verification, action, limites, montant };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VOL_DEPARTS, VOL_RETARDS, VOL_TRANCHES, VOL_MONTANTS,
                     versDateV, montantForfaitaire, orientationRapide, orienterVol };
}
