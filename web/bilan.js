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

/* Les huit postes. `suggestions` accélère la saisie : ce sont des nombres
   ronds, jamais des prix constatés, jamais une moyenne, et aucun n'est
   sélectionné d'office. L'interface le dit à côté d'eux. */
const POSTES = {
  mobile: {
    nom: 'Forfait mobile', reglesContrat: true,
    comparatif: 'comparer-mobile.html',
    suggestions: [1000, 1500, 2000, 3000],
  },
  box: {
    nom: 'Box internet', reglesContrat: true, comparatif: null,
    suggestions: [2000, 3000, 4000, 5000],
  },
  energie: {
    nom: 'Énergie', reglesContrat: true, comparatif: null,
    suggestions: [5000, 8000, 12000, 16000],
    /* La mensualité d'énergie est un acompte estimé, régularisé une fois par
       an : ce n'est pas un coût constaté. Le bilan doit le dire. */
    avertissement: "Ce que vous payez chaque mois pour l’énergie est un acompte estimé, régularisé une fois par an : ce n’est pas votre coût réel.",
  },
  assurance: {
    nom: 'Assurances', reglesContrat: true, comparatif: null,
    suggestions: [2000, 4000, 6000, 10000],
  },
  abonnements: {
    nom: 'Abonnements', reglesContrat: true, comparatif: null,
    suggestions: [500, 1000, 1500, 2500],
  },
  logement: {
    nom: 'Logement', reglesContrat: false, comparatif: null,
    suggestions: [50000, 70000, 90000, 120000],
    avertissement: "Un loyer ou une mensualité de prêt ne relève d’aucune des règles de résiliation que ce site connaît. Il compte dans votre total, et rien de plus.",
  },
  transport: {
    nom: 'Transport', reglesContrat: false, comparatif: null,
    suggestions: [5000, 10000, 15000, 20000],
    avertissement: "Carburant, péages ou titres de transport ne sont pas des contrats résiliables : ils comptent dans votre total, sans démarche associée.",
  },
  autre: {
    nom: 'Autre', reglesContrat: false, comparatif: null,
    suggestions: [1000, 3000, 5000, 10000],
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
  if (mobile) {
    return {
      cle: 'comparer-mobile',
      titre: 'Comparer votre forfait mobile',
      phrase: `C’est le seul poste pour lequel nous disposons d’offres relevées chez plusieurs opérateurs, à une date connue : votre ${euros(mensuelCentimes(mobile.montant, mobile.periodicite))} par mois peut être mis en face de leur coût sur douze mois.`,
      action: { libelle: 'Comparer mon forfait mobile', href: 'comparer-mobile.html' },
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { POSTES, RYTHMES_BILAN, normaliserDepense, normaliserBilan,
                     totauxBilan, repartitionBilan, pistePrioritaire,
                     mobileDuBilan, boxDuBilan };
}
