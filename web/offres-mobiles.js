/* ==========================================================================
   OFFRES MOBILES — registre daté, tenu à la main.
   --------------------------------------------------------------------------
   Premier essai du futur « payer moins ou récupérer son dû ». Ce fichier est
   à ce comparatif ce que `regles.js` est aux règles de droit : la seule
   source, avec sa date de vérification, et rien d'écrit en dur ailleurs.

   CE QUI GOUVERNE CE FICHIER.

   1. AUCUN PRIX N'EST DEVINÉ. Chaque montant a été lu sur la page officielle
      de l'opérateur, à la date portée par l'entrée. Ce qui n'a pas été lu est
      `null` et se dit « non relevé » à l'écran — jamais zéro, jamais une
      estimation.

   2. UNE REMISE LIÉE À UNE BOX N'EST PAS UNE ÉCONOMIE SUR LE MOBILE. Elle
      suppose de payer une box. Les offres portant `remiseBox` ne sont jamais
      comparées dans le résultat « mobile seul » : elles vivent dans un
      scénario séparé, et ce scénario n'annonce aucun chiffre tant que le prix
      de la box actuelle, l'éligibilité à l'adresse et les frais ne sont pas
      connus.

   3. AUCUN CLASSEMENT COMMERCIAL, AUCUN LIEN AFFILIÉ. Le tri est le coût sur
      douze mois, croissant. Les liens pointent vers la page officielle, sans
      paramètre de suivi.

   4. LES FRAIS DE MISE EN SERVICE N'ONT PAS ÉTÉ RELEVÉS. Aucune des pages
      consultées ne les affichait à l'endroit où les prix sont annoncés. Ils
      sont donc `null` partout, et l'interface dit que les coûts affichés les
      excluent. C'est une limite, pas un détail : elle peut représenter
      plusieurs dizaines d'euros la première année.

   ENTRETIEN. Une offre dont `verifiee` remonte à plus de `PEREMPTION_JOURS`
   cesse d'être présentée comme vérifiée. Voir `offrePerimee()`.
   ========================================================================== */

/* Au-delà de ce délai, une offre n'est plus annoncée comme vérifiée. Trente
   jours : les séries spéciales des opérateurs changent au mois, parfois plus
   vite. Ce n'est pas une garantie de fraîcheur, c'est une date de péremption. */
const PEREMPTION_JOURS = 30;

/* Toutes les offres ci-dessous ont été lues le 19 septembre 2026 sur les pages
   officielles citées. Les frais de mise en service ne figuraient sur aucune. */
const OFFRES_MOBILES = [
  {
    id: 'sosh-1go',
    operateur: 'Sosh',
    nom: 'Forfait 1Go Bloqué',
    url: 'https://shop.sosh.fr/mobile/forfaits-mobiles',
    verifiee: '2026-09-19',
    prix: 199,                 // centimes par mois
    prixApres: null,           // null : pas de changement de prix connu
    dureePromoMois: null,
    donneesFr: 1,              // Go en France
    donneesEurope: 1,
    engagement: false,
    fraisMiseEnService: null,  // non relevé
    nouveauxClientsSeulement: false,
    remiseBox: null,
    conditions: [
      'Enveloppe bloquée : 1 Go et 2 h d’appels, pas de hors-forfait.',
      '5 € remboursés sur les frais de résiliation de l’ancien opérateur.',
    ],
  },
  {
    id: 'red-60go',
    operateur: 'RED by SFR',
    nom: 'Forfait 60Go 4G',
    url: 'https://www.red-by-sfr.fr/forfaits-mobiles/',
    verifiee: '2026-09-19',
    prix: 999,
    prixApres: null,
    dureePromoMois: null,
    donneesFr: 60,
    donneesEurope: 23,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: false,
    remiseBox: null,
    conditions: [
      'Relevé sur le configurateur, à sa sélection par défaut : 60 Go, réseau 4G, 23 Go en UE/DOM.',
      'La 5G est annoncée à +3 €/mois et l’enveloppe internationale élargie à +5 €/mois : ces options ne sont pas comprises dans le prix affiché ici.',
      'Jusqu’à 5 € remboursés sur les frais de résiliation de l’ancien opérateur.',
    ],
  },
  {
    id: 'sosh-20go',
    operateur: 'Sosh',
    nom: 'Forfait 20Go',
    url: 'https://shop.sosh.fr/mobile/forfaits-mobiles',
    verifiee: '2026-09-19',
    prix: 999,
    prixApres: null,
    dureePromoMois: null,
    donneesFr: 20,
    donneesEurope: 20,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: true,
    remiseBox: null,
    conditions: [
      'Réseau Orange.',
      '5 € remboursés sur les frais de résiliation de l’ancien opérateur.',
    ],
  },
  {
    id: 'free-serie-110go',
    operateur: 'Free',
    nom: 'Série Free 110Go',
    url: 'https://mobile.free.fr/',
    verifiee: '2026-09-19',
    prix: 1299,
    prixApres: 1999,           // bascule sur le Forfait Free 5G+
    dureePromoMois: 12,
    donneesFr: 110,
    donneesEurope: 30,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: false,
    remiseBox: null,
    conditions: [
      'Le prix de 12,99 €/mois vaut un an, puis l’offre bascule sur le Forfait Free 5G+ à 19,99 €/mois.',
      '30 Go utilisables en Europe et dans les DOM.',
    ],
  },
  {
    id: 'sosh-100go',
    operateur: 'Sosh',
    nom: 'Forfait 100Go',
    url: 'https://shop.sosh.fr/mobile/forfaits-mobiles',
    verifiee: '2026-09-19',
    prix: 1399,
    prixApres: null,
    dureePromoMois: null,
    donneesFr: 100,
    donneesEurope: 40,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: true,
    remiseBox: null,
    conditions: [
      'Réseau Orange.',
      '5 € remboursés sur les frais de résiliation de l’ancien opérateur.',
    ],
  },
  {
    id: 'byou-200go',
    operateur: 'B&YOU',
    nom: 'Série spéciale 200Go Voyage 5G',
    url: 'https://www.bouyguestelecom.fr/forfaits-mobiles/sans-engagement',
    verifiee: '2026-09-19',
    prix: 1599,
    prixApres: null,
    dureePromoMois: null,
    donneesFr: 200,
    donneesEurope: 40,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: false,
    remiseBox: null,
    conditions: [
      '40 Go utilisables dans plus de 160 destinations, dont Europe, DOM, Suisse, Maroc et États-Unis.',
    ],
  },
  {
    id: 'sosh-voyage-200go',
    operateur: 'Sosh',
    nom: 'Forfait Voyage 200Go 5G',
    url: 'https://shop.sosh.fr/mobile/forfaits-mobiles',
    verifiee: '2026-09-19',
    prix: 1599,
    prixApres: null,
    dureePromoMois: null,
    donneesFr: 200,
    donneesEurope: 40,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: true,
    remiseBox: null,
    conditions: [
      '40 Go utilisables depuis 135 destinations.',
      'Réseau Orange.',
    ],
  },
  {
    id: 'free-5g-350go',
    operateur: 'Free',
    nom: 'Forfait Free 5G+ 350Go',
    url: 'https://mobile.free.fr/',
    verifiee: '2026-09-19',
    prix: 1999,
    prixApres: null,
    dureePromoMois: null,
    donneesFr: 350,
    donneesEurope: 35,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: false,
    // Une remise existe pour les abonnés Freebox, mais elle dépend du type de
    // box, de l'ordre et de la date de souscription — jusqu'à cinq résultats
    // différents. Nous ne la chiffrons pas et ne la comparons pas.
    remiseBox: null,
    conditions: [
      '35 Go utilisables dans plus de 115 destinations.',
      'Une remise existe pour les abonnés Freebox, mais son montant dépend du type de box, de l’ordre et de la date de souscription. Nous ne la chiffrons pas : consultez la page de l’opérateur.',
    ],
  },
  {
    id: 'sosh-300go',
    operateur: 'Sosh',
    nom: 'Forfait 300Go 5G',
    url: 'https://shop.sosh.fr/mobile/forfaits-mobiles',
    verifiee: '2026-09-19',
    prix: 2099,
    prixApres: null,
    dureePromoMois: null,
    donneesFr: 300,
    donneesEurope: 50,
    engagement: false,
    fraisMiseEnService: null,
    nouveauxClientsSeulement: true,
    remiseBox: null,
    conditions: ['Réseau Orange.'],
  },
];

/* Le seul scénario groupé que les pages officielles permettent de décrire sans
   rien inventer : B&YOU annonce le prix mobile remisé, le prix de la box, et
   la durée de la remise. Ce qui manque est listé, et ce qui manque empêche
   d'annoncer une économie. */
const SCENARIOS_BOX_MOBILE = [
  {
    id: 'byou-200go-pure-fibre',
    operateur: 'B&YOU',
    nomMobile: 'Série spéciale 200Go Voyage 5G',
    nomBox: 'B&YOU Pure fibre',
    url: 'https://www.bouyguestelecom.fr/forfaits-mobiles/sans-engagement',
    verifiee: '2026-09-19',
    mobileSeul: 1599,          // prix du forfait sans la box
    mobileAvecBox: 1299,       // prix remisé, avec la box
    dureeRemiseMois: 12,
    mobileApresRemise: 1599,
    prixBox: 2499,
    fraisMiseEnServiceBox: null,   // non relevé sur la page consultée
    conditionRemise: 'Le prix mobile de 12,99 €/mois est annoncé « avec Pure fibre », pendant un an, puis 15,99 €/mois.',
    eligibiliteAVerifier: true,
    inconnues: [
      'les frais de mise en service de la fibre, absents de la page consultée',
      'l’éligibilité de votre adresse à cette fibre, qui se teste chez l’opérateur',
      'ce que vous coûterait la sortie de vos contrats actuels',
    ],
  },
];

/** Lit le NOM d'un contrat télécom pour deviner s'il désigne un mobile ou une
 *  box. Repérage lexical sur le texte de l'utilisateur, rien d'autre.
 *
 *  Une première version triait par prix décroissant en supposant que le plus
 *  cher était le mobile. C'était faux, et faux dans le sens le plus gênant :
 *  une box coûte le plus souvent plus cher qu'un forfait, si bien qu'une box
 *  était systématiquement proposée comme « votre forfait mobile ». Un nom
 *  qu'on ne sait pas lire renvoie null, et rien n'est prérempli : mieux vaut
 *  un champ vide qu'un champ faussement rempli. */
function roleTelecom(nom) {
  const n = String(nom || '').toLowerCase();
  if (/\bbox\b|internet|fibre|adsl|freebox|livebox|bbox|sfr box/.test(n)) return 'box';
  if (/mobile|forfait|portable|t[ée]l[ée]phone|sim|ligne/.test(n)) return 'mobile';
  return null;
}

/* --------------------------------------------------------------------------
   Calculs. Tout est en centimes entiers, comme dans `abonnements.js`.
   -------------------------------------------------------------------------- */

/** Coût d'une offre sur douze mois, promotion comprise. Si le prix change
 *  avant le douzième mois, les deux périodes sont additionnées — c'est tout
 *  l'intérêt de raisonner sur l'année plutôt que sur la mensualité affichée. */
function coutDouzeMois(offre) {
  if (!offre) return 0;
  const promo = Number(offre.dureePromoMois);
  if (Number.isFinite(promo) && promo > 0 && promo < 12 && Number.isFinite(offre.prixApres)) {
    return offre.prix * promo + offre.prixApres * (12 - promo);
  }
  return offre.prix * 12;
}

/** Nombre de jours écoulés depuis la vérification. */
function ageVerification(offre, aujourdhui) {
  const d = versDate(offre.verifiee);
  if (!d) return null;
  return Math.max(0, Math.round((aujourdhui - d) / 86400000));
}

/** Une offre trop ancienne ne doit plus être présentée comme vérifiée. */
function offrePerimee(offre, aujourdhui) {
  const age = ageVerification(offre, aujourdhui || new Date());
  return age === null || age > PEREMPTION_JOURS;
}

/** Les offres retenues pour une situation donnée, triées par coût sur douze
 *  mois croissant.
 *
 *  `situation` : { prixActuel (centimes|null), donneesNecessaires (Go|null),
 *                  besoinEtranger (bool|null) }
 *  Un `null` vaut « je ne sais pas » et ne filtre rien : mieux vaut montrer
 *  trop que d'écarter en silence une offre qui aurait convenu. */
function comparerMobile(situation, aujourdhui, offres) {
  const auj = aujourdhui || new Date();
  const liste = (offres || OFFRES_MOBILES).filter(o => !o.remiseBox);
  const besoin = Number(situation && situation.donneesNecessaires);
  const aBesoin = Number.isFinite(besoin) && besoin > 0;

  const retenues = liste
    .filter(o => !aBesoin || o.donneesFr >= besoin)
    .map(o => {
      const cout12 = coutDouzeMois(o);
      const actuel12 = Number.isFinite(situation && situation.prixActuel) && situation.prixActuel > 0
        ? situation.prixActuel * 12 : null;
      return {
        offre: o,
        cout12,
        perimee: offrePerimee(o, auj),
        /* L'écart n'est un écart que si l'on connaît le prix actuel. Sinon il
           n'existe pas, et l'interface montre un coût, pas un gain. */
        ecart12: actuel12 === null ? null : actuel12 - cout12,
        moinsCher: actuel12 === null ? null : actuel12 - cout12 > 0,
      };
    })
    .sort((a, b) => a.cout12 - b.cout12 || a.offre.operateur.localeCompare(b.offre.operateur, 'fr'));

  return {
    retenues,
    nombreEcartees: liste.length - retenues.length,
    besoinApplique: aBesoin ? besoin : null,
    prixActuelConnu: Number.isFinite(situation && situation.prixActuel) && situation.prixActuel > 0,
  };
}

/** Le scénario groupé. Il ne rend JAMAIS une économie chiffrée tant qu'une
 *  inconnue subsiste : il rend la liste des inconnues, en clair.
 *
 *  `foyer` : { prixActuelMobile, prixActuelBox (centimes|null),
 *              aDejaUneBox (bool|null), remiseBoxDejaActive (bool|null) } */
function scenarioBoxMobile(foyer, scenario, aujourdhui) {
  const auj = aujourdhui || new Date();
  const sc = scenario || SCENARIOS_BOX_MOBILE[0];

  const promo = Number(sc.dureeRemiseMois);
  const mobile12 = (Number.isFinite(promo) && promo > 0 && promo < 12)
    ? sc.mobileAvecBox * promo + sc.mobileApresRemise * (12 - promo)
    : sc.mobileAvecBox * 12;
  const nouveau12 = mobile12 + sc.prixBox * 12;

  const mobileActuel = Number(foyer && foyer.prixActuelMobile);
  const boxActuelle = Number(foyer && foyer.prixActuelBox);
  const mobileActuelConnu = Number.isFinite(mobileActuel) && mobileActuel > 0;
  const boxActuelleConnue = Number.isFinite(boxActuelle) && boxActuelle > 0;

  const manque = [];
  if (!mobileActuelConnu) manque.push('le prix actuel de votre forfait mobile');
  if (!boxActuelleConnue) {
    manque.push(foyer && foyer.aDejaUneBox === false
      ? 'le fait que vous n’ayez pas de box aujourd’hui : la comparaison porterait alors sur une dépense nouvelle, pas sur un remplacement'
      : 'le prix actuel de votre box');
  }
  if (sc.fraisMiseEnServiceBox === null) manque.push(sc.inconnues[0]);
  if (sc.eligibiliteAVerifier) manque.push(sc.inconnues[1]);
  manque.push(sc.inconnues[2]);

  const actuel12 = (mobileActuelConnu && boxActuelleConnue)
    ? mobileActuel * 12 + boxActuelle * 12 : null;

  return {
    scenario: sc,
    perimee: offrePerimee(sc, auj),
    nouveau12,
    mobile12,
    box12: sc.prixBox * 12,
    actuel12,
    /* `confirmee` reste faux tant qu'une inconnue subsiste. Il n'y a pas de
       demi-mesure : une économie approximative est une économie fausse. */
    confirmee: false,
    ecartIndicatif: actuel12 === null ? null : actuel12 - nouveau12,
    manque,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PEREMPTION_JOURS, OFFRES_MOBILES, SCENARIOS_BOX_MOBILE, roleTelecom,
                     coutDouzeMois, ageVerification, offrePerimee,
                     comparerMobile, scenarioBoxMobile };
}
