'use strict';
/* ==========================================================================
   LE RENDEZ-VOUS MENSUEL — historique des confirmations.
   --------------------------------------------------------------------------
   Pourquoi une clé de plus, et non un champ dans le bilan.

   `dj_bilan_v1` est lu par quatre pages — `bilan.html`, `comparer-mobile.html`,
   `comparer-box.html` et `abonnements.html` — qui attendent toutes un tableau
   plat de dépenses. Y glisser des mois casserait les quatre d'un coup. Le bilan
   garde donc son sens : ce que vous payez aujourd'hui. L'historique vit à côté,
   dans `dj_mois_v1`, et ne décrit qu'une chose : ce que vous avez confirmé, et
   quand.

   Ce que ce fichier NE fait pas, et c'est voulu :
     — il ne copie pas le bilan dans chaque mois. La liste à confirmer se déduit
       du bilan courant au moment où on la demande. Ouvrir un mois n'enregistre
       donc rien de vos dépenses : pas de migration implicite, conformément à la
       décision inscrite dans CONCEPTION-TABLEAU-DE-BORD.md ;
     — il ne devine aucun montant. Une ligne non confirmée n'a pas de valeur
       pour ce mois-là, et son montant repris est affiché comme repris ;
     — il ne calcule aucune économie. Un écart entre deux mois est un écart,
       pas un gain, et sa cause est ce que vous en dites, rien d'autre.

   Une ligne confirmée emporte son propre montant. C'est ce qui permet à
   l'historique de survivre : si vous supprimez un poste du bilan en novembre,
   ce que vous aviez confirmé en octobre reste vrai.

   Aucun accès au stockage ici. Les pages lisent et écrivent ; ce fichier ne
   fait que transformer des objets, ce qui le rend testable sans navigateur.
   Montants en centimes entiers, comme partout ailleurs.
   ========================================================================== */

const ETATS_LIGNE = ['confirme', 'passe'];

/* Les causes qu'on accepte d'enregistrer. « Je ne sais pas encore » est une
   réponse légitime et doit rester disponible : forcer un motif produirait des
   motifs faux. */
const CAUSES_MOIS = ['inconnue', 'usage', 'tarif', 'ponctuelle', 'correction'];

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** La clé d'un mois, « 2026-10 ». Une date invalide ne renvoie rien plutôt
 *  qu'un mois inventé. */
function moisCle(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  if (!d || isNaN(d.getTime())) return null;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

/** Le mois d'avant. Janvier renvoie décembre de l'année précédente. */
function moisPrecedent(cle) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(cle || ''));
  if (!m) return null;
  let annee = Number(m[1]), mois = Number(m[2]) - 1;
  if (mois < 1) { mois = 12; annee -= 1; }
  return annee + '-' + String(mois).padStart(2, '0');
}

/** « 2026-10 » devient « octobre 2026 ». Une clé illisible ressort telle
 *  quelle plutôt que déformée. */
function moisEnFrancais(cle) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(cle || ''));
  if (!m) return String(cle || '');
  const i = Number(m[2]) - 1;
  return (MOIS_FR[i] ? MOIS_FR[i] : m[2]) + ' ' + m[1];
}

/** Une ligne d'historique, nettoyée. Tout ce qui n'est pas reconnu est
 *  écarté : mieux vaut perdre une ligne douteuse que porter une valeur fausse. */
function normaliserLigne(brut) {
  if (!brut || typeof brut !== 'object') return null;
  const etat = ETATS_LIGNE.indexOf(brut.etat) >= 0 ? brut.etat : null;
  if (!etat) return null;
  const ligne = { etat: etat, le: /^\d{4}-\d{2}-\d{2}$/.test(brut.le) ? brut.le : null };
  if (etat === 'passe') return ligne;
  /* Une confirmation sans montant exploitable n'est pas une confirmation. */
  if (!Number.isInteger(brut.montant) || brut.montant <= 0) return null;
  ligne.montant = brut.montant;
  ligne.periodicite = (typeof RYTHMES_BILAN !== 'undefined' && RYTHMES_BILAN.indexOf(brut.periodicite) >= 0)
    ? brut.periodicite : 'mensuelle';
  ligne.cause = CAUSES_MOIS.indexOf(brut.cause) >= 0 ? brut.cause : 'inconnue';
  return ligne;
}

/** L'historique complet, nettoyé. */
function normaliserHistorique(brut) {
  const out = {};
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return out;
  Object.keys(brut).forEach(cle => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(cle)) return;
    const mois = brut[cle];
    if (!mois || typeof mois !== 'object') return;
    const lignes = {};
    const source = (mois.lignes && typeof mois.lignes === 'object') ? mois.lignes : {};
    Object.keys(source).forEach(id => {
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return;
      const l = normaliserLigne(source[id]);
      if (l) lignes[id] = l;
    });
    out[cle] = {
      ouvert: /^\d{4}-\d{2}-\d{2}$/.test(mois.ouvert) ? mois.ouvert : null,
      lignes: lignes,
    };
  });
  return out;
}

/** Les mois connus, du plus récent au plus ancien. */
function moisConnus(histo) {
  return Object.keys(histo || {}).sort().reverse();
}

const jourISO = date => {
  const d = (date instanceof Date) ? date : new Date(date);
  return (!d || isNaN(d.getTime())) ? null : d.toLocaleDateString('sv-SE');
};

/** Ouvre un mois, sans rien y copier.
 *
 *  Idempotent : rouvrir un mois déjà ouvert ne touche pas à ses lignes. Rend un
 *  nouvel objet ; l'historique reçu n'est pas modifié. */
function ouvrirMois(histo, cle, date) {
  const h = normaliserHistorique(histo);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(cle))) return h;
  if (!h[cle]) h[cle] = { ouvert: jourISO(date || new Date()), lignes: {} };
  return h;
}

/** Inscrit une confirmation. Le montant confirmé est celui qu'on passe, pas
 *  celui du bilan : c'est ce qui permet de corriger sans toucher au bilan, et
 *  à l'historique de rester vrai si le bilan change plus tard. */
function confirmerLigne(histo, cle, id, valeurs, date) {
  const h = ouvrirMois(histo, cle, date);
  if (!h[cle] || !/^[A-Za-z0-9_-]{1,40}$/.test(String(id))) return h;
  const l = normaliserLigne({
    etat: 'confirme',
    montant: valeurs && valeurs.montant,
    periodicite: valeurs && valeurs.periodicite,
    cause: valeurs && valeurs.cause,
    le: jourISO(date || new Date()),
  });
  if (l) h[cle].lignes[id] = l;
  return h;
}

/** Marque une ligne passée. Passer n'est pas confirmer : la ligne reste due. */
function passerLigne(histo, cle, id, date) {
  const h = ouvrirMois(histo, cle, date);
  if (!h[cle] || !/^[A-Za-z0-9_-]{1,40}$/.test(String(id))) return h;
  h[cle].lignes[id] = { etat: 'passe', le: jourISO(date || new Date()) };
  return h;
}

/** Retire une décision, pour revenir en arrière sans repartir de zéro. */
function annulerLigne(histo, cle, id) {
  const h = normaliserHistorique(histo);
  if (h[cle] && h[cle].lignes) delete h[cle].lignes[id];
  return h;
}

/** L'état d'un mois, croisé avec le bilan courant.
 *
 *  La liste à confirmer n'est pas stockée : elle se déduit ici du bilan. Un
 *  poste ajouté en cours de mois apparaît donc à confirmer, et un poste
 *  supprimé disparaît de ce qui reste à faire — sans effacer ce qui a déjà été
 *  confirmé, puisque les lignes confirmées portent leur propre montant.
 *
 *  Les totaux ne mélangent jamais confirmé et repris : deux sommes séparées,
 *  et le nombre de lignes restantes, parce que c'est lui qui dit où on en est. */
function etatDuMois(histo, cle, depenses) {
  const h = normaliserHistorique(histo);
  const lignes = (h[cle] && h[cle].lignes) ? h[cle].lignes : {};
  const liste = Array.isArray(depenses) ? depenses : [];
  const confirmes = [], aConfirmer = [], passes = [];

  liste.forEach(d => {
    const l = lignes[d.id];
    if (l && l.etat === 'confirme') {
      confirmes.push({ depense: d, montant: l.montant, periodicite: l.periodicite,
                       cause: l.cause, le: l.le });
    } else if (l && l.etat === 'passe') {
      passes.push({ depense: d, le: l.le });
      aConfirmer.push({ depense: d, passe: true });
    } else {
      aConfirmer.push({ depense: d, passe: false });
    }
  });

  /* Une ligne confirmée dont le poste a disparu du bilan depuis : elle compte
     dans l'historique du mois, mais n'a plus rien à confirmer. */
  const vus = new Set(liste.map(d => d.id));
  Object.keys(lignes).forEach(id => {
    if (vus.has(id) || lignes[id].etat !== 'confirme') return;
    confirmes.push({ depense: null, montant: lignes[id].montant,
                     periodicite: lignes[id].periodicite, cause: lignes[id].cause,
                     le: lignes[id].le });
  });

  const annuelConfirme = confirmes.reduce((t, c) => t + annuelCentimes(c.montant, c.periodicite), 0);
  const annuelAConfirmer = aConfirmer.reduce(
    (t, a) => t + annuelCentimes(a.depense.montant, a.depense.periodicite), 0);

  return {
    cle: cle,
    ouvert: h[cle] ? h[cle].ouvert : null,
    confirmes: confirmes,
    aConfirmer: aConfirmer,
    passes: passes,
    nbConfirmes: confirmes.length,
    nbAConfirmer: aConfirmer.length,
    nbTotal: confirmes.length + aConfirmer.length,
    annuelConfirme: annuelConfirme,
    annuelAConfirmer: annuelAConfirmer,
    /* Vrai seulement si le mois a été ouvert et que plus rien n'attend. */
    termine: !!h[cle] && aConfirmer.length === 0 && confirmes.length > 0,
  };
}

/** Ce qui a changé entre deux mois, sur les seules lignes confirmées des deux
 *  côtés.
 *
 *  Comparer un montant confirmé à un montant repris n'aurait aucun sens : le
 *  second n'est qu'une copie du premier. Une ligne absente d'un des deux mois
 *  ressort en « apparue » ou « disparue », jamais en hausse ou en baisse.
 *
 *  ATTENTION pour l'affichage : `disparues` veut dire « confirmée le mois
 *  d'avant, pas confirmée celui-ci ». Ce n'est PAS « cette dépense n'existe
 *  plus » — une ligne seulement passée, ou pas encore vérifiée, s'y retrouve.
 *  L'écrire « supprimée » serait faux. De même, `apparues` couvre aussi bien un
 *  poste nouveau qu'un poste qu'on n'avait pas confirmé le mois précédent.
 *
 *  Aucun écart n'est présenté comme une économie ni comme une hausse de tarif :
 *  la cause est celle que la personne a déclarée, et « inconnue » reste la
 *  valeur par défaut. */
function changementsEntreMois(histo, cleAvant, cleApres) {
  const h = normaliserHistorique(histo);
  const avant = (h[cleAvant] && h[cleAvant].lignes) ? h[cleAvant].lignes : {};
  const apres = (h[cleApres] && h[cleApres].lignes) ? h[cleApres].lignes : {};
  const confirme = o => Object.keys(o).filter(id => o[id].etat === 'confirme');
  const ids = new Set(confirme(avant).concat(confirme(apres)));
  const out = { hausses: [], baisses: [], stables: [], apparues: [], disparues: [] };

  ids.forEach(id => {
    const a = avant[id] && avant[id].etat === 'confirme' ? avant[id] : null;
    const b = apres[id] && apres[id].etat === 'confirme' ? apres[id] : null;
    if (a && !b) { out.disparues.push({ id: id, mensuel: mensuelCentimes(a.montant, a.periodicite) }); return; }
    if (!a && b) { out.apparues.push({ id: id, mensuel: mensuelCentimes(b.montant, b.periodicite) }); return; }
    const ma = mensuelCentimes(a.montant, a.periodicite);
    const mb = mensuelCentimes(b.montant, b.periodicite);
    const ecart = mb - ma;
    const ligne = { id: id, avant: ma, apres: mb, ecart: ecart, cause: b.cause };
    if (ecart > 0) out.hausses.push(ligne);
    else if (ecart < 0) out.baisses.push(ligne);
    else out.stables.push(ligne);
  });

  /* L'écart net ne porte que sur les postes présents des deux côtés. Y ajouter
     une ligne apparue ferait passer un ajout pour une augmentation. */
  out.ecartNet = out.hausses.concat(out.baisses).reduce((t, l) => t + l.ecart, 0);
  out.compares = out.hausses.length + out.baisses.length + out.stables.length;
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ETATS_LIGNE, CAUSES_MOIS, moisCle, moisPrecedent, moisEnFrancais,
                     normaliserLigne, normaliserHistorique, moisConnus, ouvrirMois,
                     confirmerLigne, passerLigne, annulerLigne, etatDuMois,
                     changementsEntreMois };
}
