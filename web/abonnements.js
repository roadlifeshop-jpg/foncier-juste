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
        titre: eng.apresDouziemeMois ? "Vous avez dépassé le douzième mois" : `Repère du douzième mois : ${eng.finDouziemeMois.toLocaleDateString('fr-FR')}`,
        texte: eng.apresDouziemeMois
          ? "Pour un contrat de communications électroniques engagé plus de douze mois, la loi encadre ce qui reste dû après le douzième mois. Vérifiez le décompte que vous propose l'opérateur : il se contrôle."
          : "Avant ce repère, la totalité des mensualités restantes peut vous être réclamée. Après, la loi encadre ce qui reste dû.",
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
    out.push({
      type: 'verification', regle: null,
      titre: "Rien à signaler avec ces seules informations",
      texte: "Renseignez l'échéance, la durée d'engagement ou le mode de souscription pour que nous puissions indiquer les vérifications pertinentes. Sans ces éléments, nous ne pouvons rien en dire d'utile.",
    });
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PERIODICITES, CATEGORIES, enCentimes, euros, annuelCentimes, mensuelCentimes,
                     totaux, ajouterMois, ajouterJours, versDate, joursEntre, prochaineEcheance,
                     fenetreNonReconduction, engagement, pistes };
}
