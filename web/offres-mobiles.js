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

   4. TROIS SORTES DE FRAIS, JAMAIS CONFONDUES.
      — `fraisSouscription` : ce qu'on paie pour ENTRER dans l'offre (carte
        SIM, activation, mise en service). Il s'ajoute au coût de la première
        année, parce qu'on le paie vraiment.
      — `fraisResiliationNouvelle` : ce que coûterait de QUITTER cette offre
        plus tard. Il n'entre dans aucun total — on ne le paie que si l'on
        part — mais il est affiché, parce qu'il change la valeur d'un contrat
        « sans engagement ».
      — Le coût de sortie des contrats ACTUELS n'est ni ici ni calculable :
        nous ne lisons pas les contrats de l'utilisateur.
      Un frais non établi vaut `null` et s'affiche « non établi », jamais
      zéro. Une première version de ce fichier mettait `null` partout en
      affirmant que les pages ne les publiaient pas : c'était faux. Les
      mentions de B&YOU les donnent, et celles de Free donnent le prix de la
      carte SIM. Ils avaient simplement été cherchés sur les cartes d'offres
      et non dans les mentions.

   ENTRETIEN. Nous ne savons pas à quelle fréquence ces offres changent, et
   nous ne prétendons donc pas qu'un relevé reste valable un mois. Une offre
   n'est JAMAIS présentée comme « vérifiée » au présent : elle porte la date
   à laquelle son prix a été lu, et l'invitation à le revérifier. Au-delà de
   `ALERTE_JOURS`, l'avertissement se renforce. Voir `releveAncien()`.
   ========================================================================== */

/* Seuil d'avertissement renforcé. Trente jours n'est PAS une durée de validité :
   nous n'avons aucune donnée sur la fréquence de changement de ces offres, et
   les mentions consultées portent elles-mêmes des fenêtres datées — « offre
   valable à partir du 26/01/26 », « valable jusqu'au 11/02/2026 ». Une série
   spéciale peut disparaître le lendemain du relevé. Avant ce seuil comme
   après, la page invite à revérifier ; au-delà, elle insiste. */
const ALERTE_JOURS = 30;

/* Prix et frais lus le 19 septembre 2026 sur les pages officielles citées,
   mentions comprises. `sourceFrais` dit où les frais ont été lus, ou pourquoi
   ils ne l'ont pas été. */
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
    fraisSouscription: 1000,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Frais d’activation de la carte SIM ou eSIM : 10 €, payés à la commande, « pour la souscription d’un forfait seul » — récapitulatif contractuel officiel (les-offres-sosh_rc_4098.pdf). Frais de résiliation non établis.',
    nouveauxClientsSeulement: true,
    exclusionChangementOffre: 'Offre non valable pour les clients mobile Orange ou Sosh en changement d’offre : si vous êtes déjà chez l’un des deux, ce prix ne vous est pas accessible en changeant simplement de formule.',
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
    fraisSouscription: null,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Frais de souscription non établis : la Brochure Tarifaire et Conditions Générales d’Abonnement (52 pages) a été lue ; elle ne chiffre de frais d’ouverture que pour la fibre (39 €) et la box 5G (29 €), et les 10 € qu’elle cite concernent le remplacement d’une carte SIM, pas une souscription.',
    nouveauxClientsSeulement: false,
    exclusionChangementOffre: null,
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
    fraisSouscription: 1000,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Frais d’activation de la carte SIM ou eSIM : 10 €, payés à la commande, « pour la souscription d’un forfait seul » — récapitulatif contractuel officiel (les-offres-sosh_rc_4744.pdf). Frais de résiliation non établis.',
    nouveauxClientsSeulement: true,
    exclusionChangementOffre: 'Offre non valable pour les clients mobile Orange ou Sosh en changement d’offre : si vous êtes déjà chez l’un des deux, ce prix ne vous est pas accessible en changeant simplement de formule.',
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
    fraisSouscription: 1000,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Carte SIM ou eSIM à 10 €, lue dans les mentions de mobile.free.fr. Frais de résiliation non établis sur cette page.',
    nouveauxClientsSeulement: false,
    exclusionChangementOffre: null,
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
    fraisSouscription: 1000,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Frais d’activation de la carte SIM ou eSIM : 10 €, payés à la commande, « pour la souscription d’un forfait seul » — récapitulatif contractuel officiel (contractualdocument_009902f025537.pdf). Frais de résiliation non établis.',
    nouveauxClientsSeulement: true,
    exclusionChangementOffre: 'Offre non valable pour les clients mobile Orange ou Sosh en changement d’offre : si vous êtes déjà chez l’un des deux, ce prix ne vous est pas accessible en changeant simplement de formule.',
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
    fraisSouscription: 200,
    fraisResiliationNouvelle: 500,
    sourceFrais: 'Carte SIM 1 € et frais d’activation 1 € à payer sur la première facture, frais de résiliation 5 € : lus dans les mentions de la page B&YOU sans engagement.',
    nouveauxClientsSeulement: false,
    exclusionChangementOffre: null,
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
    fraisSouscription: null,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Frais de souscription non établis : le récapitulatif contractuel (les-offres-sosh_rc_4983.pdf) ne mentionne 10 € que « pour l’activation d’une option Multi-SIM », ce qui ne dit rien du coût d’une souscription simple.',
    nouveauxClientsSeulement: true,
    exclusionChangementOffre: 'Offre non valable pour les clients mobile Orange ou Sosh en changement d’offre : si vous êtes déjà chez l’un des deux, ce prix ne vous est pas accessible en changeant simplement de formule.',
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
    fraisSouscription: 1000,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Carte SIM ou eSIM à 10 €, lue dans les mentions de mobile.free.fr — offerte pour une nouvelle souscription réservée aux abonnés Freebox ou Box 5G. Frais de résiliation non établis sur cette page.',
    nouveauxClientsSeulement: false,
    exclusionChangementOffre: null,
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
    fraisSouscription: null,
    fraisResiliationNouvelle: null,
    sourceFrais: 'Frais de souscription non établis : le récapitulatif contractuel (les-offres-sosh_rc_4792.pdf) ne mentionne 10 € que « pour l’activation d’une option Multi-SIM », ce qui ne dit rien du coût d’une souscription simple.',
    nouveauxClientsSeulement: true,
    exclusionChangementOffre: 'Offre non valable pour les clients mobile Orange ou Sosh en changement d’offre : si vous êtes déjà chez l’un des deux, ce prix ne vous est pas accessible en changeant simplement de formule.',
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
    /* Lus dans les mentions de la page B&YOU sans engagement, le 19/09/2026. */
    fraisSouscriptionMobile: 200,      // carte SIM 1 € + activation 1 €
    fraisMiseEnServiceBox: 4800,       // mise en service fibre 48 €
    fraisResiliationMobile: 500,       // 5 €
    fraisResiliationBox: 6900,         // 69 €
    conditionRemise: 'La remise de 3 €/mois pendant 12 mois suppose une première souscription SIMULTANÉE au forfait et à B&YOU Pure fibre, sous réserve d’activation effective des lignes. Elle est perdue si la box est résiliée.',
    eligibiliteAVerifier: true,
    inconnues: [
      'l’éligibilité de votre adresse à cette fibre, qui se teste chez l’opérateur et conditionne toute l’offre',
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

/** Coût RÉCURRENT sur douze mois, promotion comprise. N'inclut aucun frais :
 *  c'est la part qui revient chaque mois, et elle seule. */
function coutDouzeMois(offre) {
  if (!offre) return 0;
  const promo = Number(offre.dureePromoMois);
  if (Number.isFinite(promo) && promo > 0 && promo < 12 && Number.isFinite(offre.prixApres)) {
    return offre.prix * promo + offre.prixApres * (12 - promo);
  }
  return offre.prix * 12;
}

/** Ce qu'on paie réellement la première année : douze mensualités plus les
 *  frais d'entrée. Les frais de résiliation de la nouvelle offre n'y sont pas
 *  — on ne les paie qu'en partant, et les compter d'avance supposerait qu'on
 *  part. Quand les frais ne sont pas établis, le total reste le récurrent et
 *  `fraisConnus` vaut faux : l'interface le dit au lieu de compter zéro. */
function coutPremiereAnnee(offre) {
  const recurrent = coutDouzeMois(offre);
  /* `Number(null)` vaut 0 : passer par Number() ferait d'un frais inconnu un
     frais nul, exactement ce que ce fichier interdit. Le type est vérifié
     avant toute conversion. */
  const brut = offre ? offre.fraisSouscription : null;
  const connus = typeof brut === 'number' && Number.isFinite(brut) && brut >= 0;
  const frais = connus ? brut : null;
  return { recurrent, frais, fraisConnus: connus,
           total: recurrent + (connus ? frais : 0) };
}

/** Nombre de jours écoulés depuis le relevé. */
function ageReleve(offre, aujourdhui) {
  const d = versDate(offre.verifiee);
  if (!d) return null;
  return Math.max(0, Math.round((aujourdhui - d) / 86400000));
}

/** Vrai si le relevé dépasse le seuil d'alerte, ou si sa date est illisible.
 *  Ce n'est pas une date de péremption : une offre peut avoir changé dès le
 *  lendemain du relevé, et la page le dit dans tous les cas. */
function releveAncien(offre, aujourdhui) {
  const age = ageReleve(offre, aujourdhui || new Date());
  return age === null || age > ALERTE_JOURS;
}

/** Les offres retenues, triées par coût de première année croissant.
 *
 *  `situation` : { prixActuel (centimes|null), donneesNecessaires (Go|null),
 *                  besoinEtranger (bool|null) }
 *  Un `null` vaut « je ne sais pas » et ne filtre rien. */
function comparerMobile(situation, aujourdhui, offres) {
  const auj = aujourdhui || new Date();
  const liste = (offres || OFFRES_MOBILES).filter(o => !o.remiseBox);
  const besoin = Number(situation && situation.donneesNecessaires);
  const aBesoin = Number.isFinite(besoin) && besoin > 0;

  const retenues = liste
    .filter(o => !aBesoin || o.donneesFr >= besoin)
    .map(o => {
      const c = coutPremiereAnnee(o);
      const actuel12 = Number.isFinite(situation && situation.prixActuel) && situation.prixActuel > 0
        ? situation.prixActuel * 12 : null;
      return {
        offre: o,
        cout12: c.total,
        recurrent12: c.recurrent,
        frais: c.frais,
        fraisConnus: c.fraisConnus,
        ancien: releveAncien(o, auj),
        /* Deux chiffres distincts, et c'est volontaire :
             `recurrent12` — les mensualités sur douze mois, connues pour
               toutes les offres, donc seules réellement comparables ;
             `coutTotalConnu` — le total incluant les frais d'entrée, qui
               n'existe QUE si ces frais ont été établis.
           Une offre dont les frais manquent ne peut pas être déclarée moins
           chère : son total est incomplet, et un total incomplet gagne
           toujours contre un total complet. */
        coutTotalConnu: c.fraisConnus ? c.total : null,
        /* Sans besoin en données déclaré, nous ignorons si l'offre couvre
           l'usage : un forfait 1 Go peut « faire économiser 264 € » et ne pas
           convenir du tout. L'écart reste calculé, mais il n'est plus annoncé
           comme un gain — l'interface le présente sous réserve. */
        besoinInconnu: !aBesoin,
        ecart12: (actuel12 === null || !c.fraisConnus) ? null : actuel12 - c.total,
        ecartMensualites: actuel12 === null ? null : actuel12 - c.recurrent,
        /* `moinsCher` vaut le liseré vert et la mention « de moins ». Il exige
           donc les deux : des frais établis ET un besoin connu. */
        moinsCher: (actuel12 === null || !c.fraisConnus || !aBesoin) ? null : actuel12 - c.total > 0,
        ecartIndeterminable: actuel12 !== null && !c.fraisConnus,
      };
    })
    /* Le tri porte sur les mensualités : c'est la seule grandeur connue pour
       toutes les offres. Trier sur un total dont certains membres omettent
       des frais ferait remonter les moins documentées. */
    .sort((a, b) => a.recurrent12 - b.recurrent12 || a.offre.operateur.localeCompare(b.offre.operateur, 'fr'));

  return {
    retenues,
    nombreEcartees: liste.length - retenues.length,
    besoinApplique: aBesoin ? besoin : null,
    prixActuelConnu: Number.isFinite(situation && situation.prixActuel) && situation.prixActuel > 0,
    fraisIncomplets: retenues.some(r => !r.fraisConnus),
  };
}

/** Le scénario groupé. Il ne rend JAMAIS une économie chiffrée : l'éligibilité
 *  à l'adresse et le coût de sortie des contrats actuels manquent toujours. */
function scenarioBoxMobile(foyer, scenario, aujourdhui) {
  const auj = aujourdhui || new Date();
  const sc = scenario || SCENARIOS_BOX_MOBILE[0];

  const promo = Number(sc.dureeRemiseMois);
  const mobile12 = (Number.isFinite(promo) && promo > 0 && promo < 12)
    ? sc.mobileAvecBox * promo + sc.mobileApresRemise * (12 - promo)
    : sc.mobileAvecBox * 12;
  const box12 = sc.prixBox * 12;
  const fraisEntree = (Number(sc.fraisSouscriptionMobile) || 0) + (Number(sc.fraisMiseEnServiceBox) || 0);
  const recurrent12 = mobile12 + box12;
  const nouveau12 = recurrent12 + fraisEntree;

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
  sc.inconnues.forEach(i => manque.push(i));

  const actuel12 = (mobileActuelConnu && boxActuelleConnue)
    ? mobileActuel * 12 + boxActuelle * 12 : null;

  return {
    scenario: sc,
    ancien: releveAncien(sc, auj),
    mobile12, box12, recurrent12, fraisEntree, nouveau12,
    /* Ce qu'il en coûterait de repartir : affiché, jamais additionné. */
    fraisSortieNouvelle: (Number(sc.fraisResiliationMobile) || 0) + (Number(sc.fraisResiliationBox) || 0),
    actuel12,
    confirmee: false,
    ecartIndicatif: actuel12 === null ? null : actuel12 - nouveau12,
    manque,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ALERTE_JOURS, OFFRES_MOBILES, SCENARIOS_BOX_MOBILE, roleTelecom,
                     coutDouzeMois, coutPremiereAnnee, ageReleve, releveAncien,
                     comparerMobile, scenarioBoxMobile };
}
