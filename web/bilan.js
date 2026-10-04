/* ==========================================================================
   BILAN DES DÉPENSES DU FOYER — postes, pas contrats.
   --------------------------------------------------------------------------
   POURQUOI CE FICHIER N'EST PAS `abonnements.js`.

   L'inventaire existant décrit des CONTRATS : des engagements soumis aux
   règles du code de la consommation que porte `regles.js` — tacite
   reconduction, résiliation en ligne, engagement télécom. Ses catégories
   (`CATEGORIES`) supposent toutes cette qualification.

   Un bilan de foyer contient autre chose : un loyer, une facture d'eau, du
   carburant. Les faire entrer dans l'inventaire des contrats reviendrait à
   leur appliquer, ou à laisser croire qu'on leur applique, des règles de
   résiliation qui ne les concernent pas. Un bail d'habitation n'est pas un
   abonnement ; du carburant n'est pas un contrat du tout.

   D'où deux choses distinctes :
     — un registre `POSTES` propre au bilan, où chaque poste dit lui-même,
       par `reglesContrat`, si les règles de notre registre peuvent même être
       évoquées à son sujet ;
     — une clé de stockage `dj_bilan_v1`, séparée de `dj_abonnements_v1`.
       Les contrats déjà enregistrés par le visiteur ne sont ni lus en
       écriture, ni convertis, ni déplacés.

   Ce qui EST partagé, parce que c'est de l'arithmétique et non du droit :
   `enCentimes`, `euros`, `PERIODICITES`, `annuelCentimes`, `mensuelCentimes`,
   tous définis dans `abonnements.js` et inchangés.
   ========================================================================== */

/* Les huit postes.
   --------------------------------------------------------------------------
   Chaque poste portait quatre montants « raccourcis » — 50, 80, 120, 160 € pour
   l'énergie, par exemple. C'étaient des nombres ronds choisis à la main. Un
   raccourci qu'on propose est lu comme un ordre de grandeur, et un ordre de
   grandeur avancé sans source est un montant inventé : exactement ce que ce
   dépôt s'interdit. Ils ont été retirés.

   À la place, `repere` — là où une source publique existe, et nulle part
   ailleurs. Un repère porte toujours sa valeur, sa source, son année et son
   adresse. Aujourd'hui l'énergie est le seul poste à en avoir un : pour le
   loyer et le transport, les publications officielles ne donnent pas de montant
   mensuel exploitable, et une moyenne nationale y mélangerait de toute façon
   des situations sans rapport — un studio et une maison, un abonnement de métro
   et deux pleins par semaine. Mieux vaut pas de repère qu'un faux repère. */
const POSTES = {
  mobile: {
    nom: 'Forfait mobile', reglesContrat: true, categorieContrat: 'telecom',
    comparatif: 'comparer-mobile.html',
  },
  box: {
    nom: 'Box internet', reglesContrat: true, categorieContrat: 'telecom',
    comparatif: 'comparer-box.html',
  },
  energie: {
    /* « En moyenne, les ménages ont dépensé 2 071 € en énergie pour leur
       logement » — Chiffres clés de l'énergie, édition 2026, données 2024,
       service des données et études statistiques du ministère. Lu à la source
       le 04/10/2026. 2 071 / 12 = 172,58 €, arrondi à 173 € pour ne pas donner
       une précision que la moyenne n'a pas. */
    repere: {
      mensuel: 17300,
      texte: 'un ménage dépense en moyenne 173 € par mois d’énergie pour son logement',
      precision: '2 071 € sur l’année, toutes énergies et taxes comprises',
      source: 'Chiffres clés de l’énergie, édition 2026 — données 2024',
      editeur: 'service des données et études statistiques du ministère',
      url: 'https://www.statistiques.developpement-durable.gouv.fr/chiffres-cles-de-lenergie-edition-2026',
      verifiee: '2026-10-04',
    },
    nom: 'Énergie', reglesContrat: true, categorieContrat: 'energie', comparatif: null,
    /* Nous ne comparerons jamais les offres d'énergie : un comparateur public
       existe, édité par le médiateur national de l'énergie — autorité publique
       indépendante, gratuit, indépendant des fournisseurs et des gestionnaires
       de réseaux (page consultée le 27/09/2026). Il fait mieux que nous ne
       ferions, sans relevé à tenir. `outilOfficiel` est donc distinct de
       `comparatif` : l'un renvoie à une page du site, l'autre à un tiers dont
       on nomme l'éditeur et dont on ne tire rien. */
    outilOfficiel: {
      nom: 'le comparateur officiel des offres d’électricité et de gaz',
      editeur: 'le médiateur national de l’énergie, autorité publique indépendante',
      url: 'https://comparateur-offres.energie-info.fr/comparateur-offres-electricite-gaz-naturel/criteria.action?profil=particulier',
    },
    /* Ce qu'il faut avoir sous la main avant d'y aller.
       ------------------------------------------------------------------------
       Nous disions « munissez-vous de votre consommation annuelle en kWh, elle
       figure sur votre facture de régularisation ». C'était un conseil plus
       difficile que nécessaire, et bientôt daté : l'obligation de faire figurer
       la consommation annuelle sur les factures ne commence qu'au 1er janvier
       2027. Beaucoup de factures d'aujourd'hui ne la portent pas.

       Le comparateur sait la chercher lui-même. Vérifié à la source le
       04/10/2026 sur énergie-info, site du médiateur national de l'énergie :
         « il suffit de renseigner les 14 chiffres de votre numéro de Point
           Référence Mesure (PRM) » ;
         « votre identifiant de compteur (PDL ou PRM) est indiqué en haut de
           votre facture » ;
         « cela permet au comparateur du médiateur national de l'énergie de
           récupérer votre consommation annuelle et la puissance souscrite ».

       Les données viennent d'Enedis, le gestionnaire du réseau d'électricité.
       Il faut donc le dire : contrairement au reste de ce site, cette étape-là
       transmet quelque chose — sur l'autre site, et seulement si la personne y
       consent.

       Restriction assumée : je n'ai vérifié ce chemin que pour l'électricité.
       Le gaz a un autre identifiant et un autre gestionnaire ; tant que ce n'est
       pas lu à la source, nous n'en parlons pas. */
    guideAvant: {
      titre: 'Un numéro à 14 chiffres suffit',
      etapes: [
        'Prenez une facture d’électricité : votre identifiant de compteur, appelé PRM ou PDL, est indiqué en haut.',
        'Il figure aussi sur le compteur Linky, en faisant défiler l’affichage, et dans l’application de votre fournisseur.',
        'Le comparateur s’en sert pour récupérer votre consommation annuelle et votre puissance souscrite auprès d’Enedis, si vous l’y autorisez.',
      ],
      reserve: 'Cette étape-là transmet votre identifiant au comparateur, qui interroge Enedis : c’est le seul endroit du site où une donnée sort, elle sort sur l’autre site, et seulement si vous l’acceptez. Sans ce numéro, le comparateur fonctionne aussi — il vous demandera alors d’estimer votre consommation.',
      source: 'énergie-info, site du médiateur national de l’énergie',
      url: 'https://www.energie-info.fr/une-nouvelle-fonctionnalite-du-comparateur-du-mediateur-national-de-lenergie/',
      verifiee: '2026-10-04',
      perimetre: 'Vérifié pour l’électricité. Le gaz utilise un autre identifiant, que nous n’avons pas vérifié.',
    },
    /* La mensualité d'énergie est un acompte estimé, régularisé une fois par
       an : ce n'est pas un coût constaté. Le bilan doit le dire. */
    avertissement: "Ce que vous payez chaque mois pour l’énergie est un acompte estimé, régularisé une fois par an : ce n’est pas votre coût réel.",
  },
  assurance: {
    nom: 'Assurances', reglesContrat: true, categorieContrat: 'assurance', comparatif: null,
  },
  abonnements: {
    nom: 'Abonnements', reglesContrat: true, categorieContrat: '', comparatif: null,
  },
  logement: {
    nom: 'Logement', reglesContrat: false, categorieContrat: null, comparatif: null,
    avertissement: "Un loyer ou une mensualité de prêt ne relève d’aucune des règles de résiliation que ce site connaît. Il compte dans votre total, et rien de plus.",
  },
  transport: {
    nom: 'Transport', reglesContrat: false, categorieContrat: null, comparatif: null,
    avertissement: "Carburant, péages ou titres de transport ne sont pas des contrats résiliables : ils comptent dans votre total, sans démarche associée.",
  },
  autre: {
    nom: 'Autre', reglesContrat: false, categorieContrat: null, comparatif: null,
  },
};

/* Les trois rythmes proposés au bilan. Ce sont des clés de `PERIODICITES`,
   pour que `annuelCentimes` fonctionne sans conversion. */
const RYTHMES_BILAN = ['mensuelle', 'trimestrielle', 'annuelle'];

/* --------------------------------------------------------------------------
   Normalisation défensive. Même discipline que l'inventaire : rien n'est
   deviné, un poste inconnu devient « autre », un montant inexploitable fait
   écarter la ligne plutôt que de fausser un total.
   -------------------------------------------------------------------------- */

function normaliserDepense(brut, rang) {
  if (!brut || typeof brut !== 'object') return null;
  const montant = Number.isInteger(brut.montant) ? brut.montant : enCentimes(brut.montant);
  if (montant === null || montant <= 0) return null;
  const poste = POSTES[brut.poste] ? brut.poste : 'autre';
  const periodicite = RYTHMES_BILAN.indexOf(brut.periodicite) >= 0 ? brut.periodicite : 'mensuelle';
  return {
    id: (typeof brut.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(brut.id)) ? brut.id : 'd' + rang,
    poste,
    /* Le libellé est facultatif : le nom du poste suffit à s'y retrouver. */
    libelle: (typeof brut.libelle === 'string' && brut.libelle.trim()) ? brut.libelle.trim() : '',
    montant,
    periodicite,
  };
}

function normaliserBilan(brut) {
  if (!Array.isArray(brut)) return [];
  const vus = new Set();
  const out = [];
  brut.forEach((d, i) => {
    const n = normaliserDepense(d, i);
    if (!n) return;
    if (vus.has(n.id)) n.id = n.id + '-' + i;
    vus.add(n.id);
    out.push(n);
  });
  return out;
}

/** Totaux du bilan. Le mensuel se calcule sur l'annuel, jamais comme somme
 *  d'arrondis — même règle que l'inventaire des contrats. */
function totauxBilan(depenses) {
  const l = normaliserBilan(depenses);
  const annuel = l.reduce((t, d) => t + annuelCentimes(d.montant, d.periodicite), 0);
  return { nombre: l.length, annuel, mensuel: Math.round(annuel / 12) };
}

/** Les postes présents, du plus coûteux au moins coûteux. */
function repartitionBilan(depenses) {
  return normaliserBilan(depenses)
    .map(d => ({ depense: d, annuel: annuelCentimes(d.montant, d.periodicite) }))
    .sort((a, b) => b.annuel - a.annuel);
}

/* --------------------------------------------------------------------------
   La piste prioritaire — une seule, et seulement si elle vaut quelque chose.
   -------------------------------------------------------------------------- */

/** Une seule piste, choisie sur ce que nous savons réellement faire.
 *
 *  L'ordre n'est pas un classement d'importance mais de FIABILITÉ :
 *    1. le mobile, parce que c'est le seul poste pour lequel un comparatif
 *       existe, avec des prix relevés et datés ;
 *    2. à défaut, un poste qui est un contrat : les règles de résiliation
 *       peuvent au moins être vérifiées — sans promesse d'économie ;
 *    3. à défaut, rien de chiffrable. On le dit, plutôt que d'inventer une
 *       piste pour remplir l'écran.
 *
 *  Aucune branche n'annonce une économie : seule la première mène à une
 *  comparaison, et c'est elle qui affichera ses propres écarts et réserves. */
function pistePrioritaire(depenses) {
  const l = normaliserBilan(depenses);
  if (!l.length) return null;

  const mobile = l.find(d => d.poste === 'mobile');
  const box = l.find(d => d.poste === 'box');

  /* Une SEULE piste reste mise en avant. Quand les deux postes existent, la box
     ne devient pas une seconde piste concurrente : elle est offerte en second
     lien dans le même bloc. Le relevé box est plus étroit que le relevé mobile
     — moins d'opérateurs, des frais moins souvent établis — et l'ordre reste
     celui de la fiabilité, pas celui du montant. */
  if (mobile) {
    return {
      cle: 'comparer-mobile',
      titre: 'Comparer votre forfait mobile',
      phrase: `C’est le poste pour lequel nous disposons du relevé le plus large — plusieurs opérateurs, à une date connue : votre ${euros(mensuelCentimes(mobile.montant, mobile.periodicite))} par mois peut être mis en face de leur coût sur douze mois.`,
      action: { libelle: 'Comparer mon forfait mobile', href: 'comparer-mobile.html' },
      secondaire: box ? {
        texte: `Vous avez aussi saisi une box à ${euros(mensuelCentimes(box.montant, box.periodicite))} par mois. Un premier relevé existe, limité à des offres fibre sans engagement.`,
        libelle: 'Examiner ma box internet',
        href: 'comparer-box.html',
      } : null,
    };
  }

  if (box) {
    return {
      cle: 'comparer-box',
      titre: 'Examiner votre box internet',
      phrase: `Votre ${euros(mensuelCentimes(box.montant, box.periodicite))} par mois peut être mis en face d’un premier relevé d’offres fibre sans engagement, relevées à une date connue. <b>Aucune économie n’est annoncée</b> : le comparatif montre des coûts, et dit ce qu’il ignore.`,
      action: { libelle: 'Examiner ma box internet', href: 'comparer-box.html' },
      secondaire: null,
    };
  }

  /* L'énergie vient après nos deux relevés — non parce qu'elle vaudrait moins,
     mais parce que le comparateur officiel est un outil tiers : on y envoie,
     on n'y répond pas. Elle passe en revanche devant la vérification des
     contrats, qui ne compare aucun prix. */
  const energie = l.find(d => d.poste === 'energie');
  if (energie) {
    const o = POSTES.energie.outilOfficiel;
    return {
      cle: 'comparer-energie',
      titre: 'Comparer vos offres d’énergie',
      phrase: `Nous ne comparons pas l’énergie, et nous ne le ferons pas : ${o.nom} est édité par ${o.editeur}. Il est gratuit, nous n’en tirons rien, et il compare ce que nous ne savons pas comparer. Vos ${euros(mensuelCentimes(energie.montant, energie.periodicite))} par mois sont un acompte estimé, pas un coût constaté : ce qui se compare, c’est votre consommation réelle.`,
      guide: POSTES.energie.guideAvant || null,
      action: { libelle: 'Ouvrir le comparateur officiel', href: o.url, externe: true },
      secondaire: null,
    };
  }

  const contrats = l.filter(d => POSTES[d.poste].reglesContrat);
  if (contrats.length) {
    const noms = contrats.map(d => POSTES[d.poste].nom.toLowerCase());
    return {
      cle: 'verifier-contrats',
      titre: 'Vérifier les conditions de vos contrats',
      phrase: `${contrats.length > 1 ? 'Ces postes sont des contrats' : 'Ce poste est un contrat'} — ${noms.join(', ')}. Nous ne savons pas encore en comparer les prix, mais l’outil de vérification dit ce que la loi impose au professionnel et quelles démarches gratuites vous sont ouvertes. <b>Aucune économie n’est annoncée.</b>`,
      action: { libelle: 'Vérifier mes contrats', href: 'abonnements.html' },
    };
  }

  return {
    cle: 'rien-de-chiffrable',
    titre: 'Rien à vérifier sur ces postes',
    phrase: 'Les postes que vous avez saisis — logement, transport, autre — ne relèvent d’aucune règle de résiliation que ce site connaisse, et nous n’avons aucun prix de référence à leur opposer. Ils comptent dans votre total, et c’est tout ce que nous pouvons en dire honnêtement.',
    action: null,
  };
}

/** Le poste mobile du bilan, s'il existe : c'est lui que le comparatif
 *  reprendra, pour éviter de faire ressaisir un montant déjà donné. */
function mobileDuBilan(depenses) {
  return normaliserBilan(depenses).find(d => d.poste === 'mobile') || null;
}

/** Le poste box du bilan, même usage. */
function boxDuBilan(depenses) {
  return normaliserBilan(depenses).find(d => d.poste === 'box') || null;
}

/** Les postes du bilan qui peuvent devenir des contrats dans l'inventaire.
 *
 *  La reprise est OFFERTE, jamais automatique : c'est l'utilisateur qui
 *  décide. Et elle est FILTRÉE — un loyer ou du carburant (`categorieContrat`
 *  à null) n'entre pas dans un inventaire régi par des règles de résiliation.
 *  « Abonnements » entre avec une catégorie vide : le parcours de vérification
 *  la demandera, plutôt que nous ne l'inventions.
 *
 *  Renvoie des objets à la forme des lignes de `abonnements.js`. */
function postesReprenables(depenses, deja) {
  const presents = new Set((deja || []).map(l => String(l.nom || '').toLowerCase()));
  return normaliserBilan(depenses)
    .filter(d => POSTES[d.poste].categorieContrat !== null)
    .map(d => ({
      poste: d.poste,
      nom: POSTES[d.poste].nom,
      categorie: POSTES[d.poste].categorieContrat,
      montant: d.montant,
      periodicite: d.periodicite,
    }))
    .filter(x => !presents.has(x.nom.toLowerCase()));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { POSTES, RYTHMES_BILAN, normaliserDepense, normaliserBilan,
                     totauxBilan, repartitionBilan, pistePrioritaire,
                     mobileDuBilan, boxDuBilan, postesReprenables };
}
