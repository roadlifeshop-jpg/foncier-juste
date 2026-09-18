// Génération des PDF — partagée entre l'aperçu gratuit (index.html, marqué
// « EXEMPLE ») et les documents livrés après paiement (succes.html).
// Nécessite jsPDF chargé sur la page (window.jspdf).
//
// Trois produits :
//  - genererApercuPDF    : structure du livrable, contenu masqué (gratuit)
//  - genererRapportPDF   : l'analyse détaillée (29 €)
//  - genererDossierPDF   : l'analyse + le projet de courrier + la marche à
//                          suivre (49 €)
//
// RÈGLE DE VÉRACITÉ APPLIQUÉE À CES DOCUMENTS
// -------------------------------------------
// Ces documents peuvent affirmer ce qui se calcule à partir des réponses de
// l'utilisateur. Ils ne peuvent rien affirmer sur ce que l'administration a
// retenu, sur le caractère fautif d'une donnée, ni sur l'issue d'une
// démarche. Aucun montant d'économie n'y figure : nous ne disposons d'aucune
// méthode fondée pour le calculer.
//
// POINTS JURIDIQUES — vérifiés sur sources officielles le 16/09/2026
// ------------------------------------------------------------------
//  - Délai de réclamation, impôts directs locaux : au plus tard le
//    31 décembre de l'année suivant celle, SELON LE CAS, de la mise en
//    recouvrement du rôle OU de la réalisation de l'événement motivant la
//    réclamation (art. R*196-2 LPF ; BOI-CTX-PREA-10-30). Une version
//    antérieure affirmait qu'on ne peut jamais remonter au-delà de l'année
//    précédente : c'était trop absolu, cela ignorait le second point de
//    départ. Le texte dit désormais ce qui est courant, et renvoie au service
//    des impôts fonciers pour le reste — nous ne concluons pas à sa place.
//  - Forme de la réclamation (art. R*197-3 LPF) : mentionner l'imposition
//    contestée, contenir un exposé sommaire des moyens et conclusions, porter
//    la signature manuscrite de son auteur, et être accompagnée de l'avis
//    d'imposition, d'une copie de cet avis ou d'un extrait du rôle. Le même
//    article permet la RÉGULARISATION À TOUT MOMENT par production de l'une de
//    ces pièces : ne pas présenter l'absence d'avis comme une irrecevabilité
//    acquise.
//    NE PAS citer ici la branche « à défaut, une pièce justifiant le montant
//    de la retenue ou du versement » : elle ne vise que les impositions
//    n'ayant donné lieu ni à un rôle ni à un avis de mise en recouvrement. La
//    taxe foncière est établie par rôle — cette possibilité ne s'applique pas
//    à notre parcours, et la mentionner induirait l'usager en erreur.
//  - Instruction : l'administration statue dans les six mois, prolongeables
//    de trois mois si elle en informe le contribuable (art. R*198-10 LPF).
//  - Silence de l'administration : il ne vaut PAS acceptation. Le
//    contribuable peut saisir le tribunal administratif passé six mois, et
//    aucun délai de recours ne court contre lui tant qu'une décision expresse
//    de rejet ne lui a pas été régulièrement notifiée (CE, 8e-3e ch.,
//    21 octobre 2020, n° 443327). La formulation « le silence vaut rejet
//    implicite » d'une version antérieure était trompeuse.

// --------------------------------------------------------------------------
// Écrivain paginé
// --------------------------------------------------------------------------
// Une page A4 fait 297 mm. Le pied de page occupe la zone 275-290 mm. Au-delà
// de HAUTEUR_UTILE, on passe à la page suivante : sans ce contrôle, la lettre
// de réclamation débordait dès deux motifs (mesuré à 293 mm), et la signature
// se retrouvait par-dessus le pied de page.
const HAUTEUR_UTILE = 258;
const HAUT_DE_PAGE = 24;

function creerEcrivain(doc, margeGauche, largeur, opts = {}) {
  let y = HAUT_DE_PAGE;
  const { pied, titreSuite } = opts;

  function pageSuivante() {
    if (pied) dessinerPiedDePage(doc, pied);
    doc.addPage();
    y = HAUT_DE_PAGE;
    if (titreSuite) {
      doc.setFont(POLICE_NOM, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 128, 136);
      doc.text(`${titreSuite} (suite)`, margeGauche, y - 8);
      doc.setDrawColor(216, 223, 227);
      doc.line(margeGauche, y - 5, margeGauche + largeur, y - 5);
    }
  }

  return {
    get y() { return y; },
    set y(v) { y = v; },
    espace(h) { if (y + h > HAUTEUR_UTILE) pageSuivante(); else y += h; },
    // Réserve une hauteur pour un bloc qui ne doit pas être coupé : si la
    // place restante est insuffisante, on passe à la page suivante AVANT de
    // commencer le bloc. Évite qu'une formule de politesse et sa signature se
    // retrouvent séparées, ou isolées en bas de page.
    reserver(h) { if (y + h > HAUTEUR_UTILE) pageSuivante(); },
    ligne(texte, o = {}) {
      const { taille = 10, style = 'normal', couleur = [18, 24, 29], espace = 6, x = margeGauche } = o;
      // La mise en forme doit être réappliquée APRÈS un éventuel saut de page :
      // pageSuivante() dessine l'en-tête « (suite) » en italique gris, et sans
      // cette seconde application la ligne qui déclenche le saut héritait de
      // cette fonte — défaut repéré à la relecture visuelle du PDF.
      const appliquer = () => {
        doc.setFont(POLICE_NOM, style === 'bold' ? 'bold' : 'normal');
        doc.setFontSize(taille);
        doc.setTextColor(...couleur);
      };
      appliquer();
      const morceaux = doc.splitTextToSize(texte, largeur - (x - margeGauche));
      const hauteur = morceaux.length * (taille / 2.6) + espace;
      if (y + hauteur > HAUTEUR_UTILE) { pageSuivante(); appliquer(); }
      doc.text(morceaux, x, y);
      y += hauteur;
    },
    finir() { if (pied) dessinerPiedDePage(doc, pied); },
  };
}

function dessinerEnTete(doc, titre, { exemple, sousTitre } = {}) {
  doc.setFillColor(33, 65, 79);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(POLICE_NOM, 'bold'); doc.setFontSize(13);
  doc.text(titre, 20, 10.5);

  let y = 28;
  if (exemple) {
    doc.setTextColor(150, 39, 31);
    doc.setFont(POLICE_NOM, 'bold'); doc.setFontSize(9);
    doc.text('EXEMPLE — généré gratuitement, ne constitue pas le document payant', 20, y);
    y += 10;
  }
  if (sousTitre) {
    doc.setTextColor(120, 128, 136);
    doc.setFont(POLICE_NOM, 'normal'); doc.setFontSize(9);
    const l = doc.splitTextToSize(sousTitre, 170);
    doc.text(l, 20, y);
    y += l.length * 4 + 6;
  }
  return y;
}

// --------------------------------------------------------------------------
// Enregistrement
// --------------------------------------------------------------------------
// Les documents embarquent leur police (voir vendor/polices.js). Sans cela, un
// PDF s'appuie sur les 14 polices dites standard, que chaque lecteur est censé
// fournir : en pratique certains substituent une police système aux métriques
// différentes, ce qui déforme l'espacement. Un document destiné à être imprimé
// et adressé à une administration ne peut pas dépendre de ce que le lecteur du
// destinataire a installé.
//
// verifierPDF() refuse d'écrire un fichier qui ne contiendrait pas sa police.
function verifierPDF(brut) {
  const anomalies = [];
  if (!/\/FontFile2/.test(brut)) anomalies.push('aucune police embarquée');
  if (!/\/FontDescriptor/.test(brut)) anomalies.push('descripteur de police absent');
  // Police composite (Type0/Identity-H) : les largeurs sont dans /W, pas /Widths.
  if (!/\/W\s*\[/.test(brut) && !/\/Widths/.test(brut)) anomalies.push('table de largeurs absente');
  // Sans /ToUnicode, le texte du PDF ne serait plus ni copiable ni recherchable.
  if (!/\/ToUnicode/.test(brut)) anomalies.push('table ToUnicode absente');
  if (/\/BaseFont \/(Helvetica|Courier|Times|Symbol|ZapfDingbats)/.test(brut)) {
    anomalies.push('police standard non embarquée encore référencée');
  }
  if (!brut.startsWith('%PDF-')) anomalies.push('en-tête PDF absent');
  if (!brut.includes('%%EOF')) anomalies.push('marqueur de fin absent');
  return anomalies;
}

// Crée un document prêt à écrire : format A4, police embarquée, aucune des
// 14 polices standard dans la sortie, et des propriétés lisibles dans le
// panneau « Informations » du lecteur.
function nouveauDocument(titre, sujet) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
  installerPolices(doc);
  doc.setProperties({
    title: titre || 'Foncier·Juste',
    subject: sujet || 'Pré-diagnostic de taxe foncière',
    author: 'Foncier·Juste',
    creator: 'Foncier·Juste',
  });
  return doc;
}

// Nom de fichier lisible par le destinataire : ni code INSEE, ni identifiant
// technique. « Foncier-Juste_Dossier-de-verification_Nantes_2026-09-17.pdf ».
function nomDeFichier(prefixe, d) {
  const sansAccent = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const maintenant = new Date();
  const jour = [maintenant.getFullYear(), String(maintenant.getMonth() + 1).padStart(2, '0'),
    String(maintenant.getDate()).padStart(2, '0')].join('-');
  return `Foncier-Juste_${prefixe}_${sansAccent(d.commune.commune)}_${jour}.pdf`;
}

// Remplace doc.save() : contrôle le document, puis déclenche le téléchargement.
function enregistrerPDF(doc, nom) {
  const brut = doc.output();
  const anomalies = verifierPDF(brut);
  if (anomalies.length) throw new Error('PDF non conforme : ' + anomalies.join(', '));
  const octets = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i) & 0xff;
  const blob = new Blob([octets], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url; lien.download = nom;
  document.body.appendChild(lien); lien.click(); lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return blob;
}

function dessinerPiedDePage(doc, texte) {
  doc.setDrawColor(216, 223, 227); doc.line(20, 275, 190, 275);
  doc.setFont(POLICE_NOM, 'normal'); doc.setFontSize(7.5); doc.setTextColor(124, 137, 148);
  doc.text(doc.splitTextToSize(texte, 170), 20, 280);
}

const PIED_ANALYSE =
  "Document d'information établi à partir des seules réponses fournies par son destinataire et de données publiques " +
  "(DVF, data.gouv.fr). Foncier·Juste n'a pas accès au dossier fiscal de l'usager, ne recalcule pas de valeur locative " +
  "cadastrale et ne garantit aucun résultat. Ce document ne constitue ni un conseil fiscal personnalisé, ni une " +
  "consultation juridique, ni une pièce officielle.";

const LIBELLES_ELEMENTS = {
  piscine: 'la piscine', garage: 'le garage',
  dependance: 'la dépendance', veranda: 'la véranda',
};

// Description d'un bloc « élément à vérifier ». Une seule source : la même
// liste sert à MESURER la hauteur du bloc et à le DESSINER. Tant qu'elles
// étaient écrites deux fois, l'estimation divergeait du tracé et le bloc
// basculait de page alors qu'il tenait encore.
function lignesBlocSignal(a, index, nonValide, avecCourrier) {
  const lignes = [
    { texte: `${index}. ${a.titre}`, taille: 11, style: 'bold', espace: 3 },
    { texte: `${a.code === 'elements_confort_obsoletes' ? 'Élément concerné' : 'Écart constaté'} : ${a.figure}`,
      taille: 10, style: 'bold', couleur: [33, 65, 79], espace: 3, x: 24 },
  ];
  if (nonValide) {
    lignes.push({
      texte: "Statut — constat non validé. Nous vérifions actuellement, sur de vraies fiches d'évaluation, que " +
        "les deux surfaces comparées recouvrent bien le même périmètre. Tant que ce point n'est pas tranché, " +
        "nous ne le présentons pas comme une anomalie" +
        (avecCourrier ? " et il ne figure pas dans le projet de courrier" : "") + ".",
      taille: 9, style: 'bold', couleur: [122, 94, 16], espace: 4, x: 24,
    });
  }
  lignes.push(
    { texte: `Ce que vous avez indiqué — ${a.vosReponses}`, taille: 9.5, espace: 2.5, x: 24 },
    { texte: `Ce que nous en déduisons — ${a.calcul}`, taille: 9.5, espace: 2.5, x: 24 },
    { texte: `Ce qu'il reste à vérifier — ${a.aVerifier}`, taille: 9.5, espace: 2.5, x: 24 },
    { texte: `Ce que vaut ce constat — ${a.confiance.texte}`, taille: 9.5, couleur: [91, 104, 117], espace: 2.5, x: 24 },
    { texte: `D'où vient l'information — ${a.confiance.origine}`, taille: 9.5, couleur: [91, 104, 117], espace: 7, x: 24 },
  );
  return lignes;
}

// Hauteur du bloc, calculée avec exactement les mêmes métriques que l'écrivain.
// Plafonnée à une page : un bloc plus haut ne peut de toute façon pas rester
// d'un seul tenant, et le réserver provoquerait un saut de page inutile.
function hauteurBloc(doc, lignes, margeGauche, largeur) {
  let h = 0;
  for (const l of lignes) {
    doc.setFont(POLICE_NOM, l.style === 'bold' ? 'bold' : 'normal');
    doc.setFontSize(l.taille);
    const x = l.x || margeGauche;
    const n = doc.splitTextToSize(l.texte, largeur - (x - margeGauche)).length;
    h += n * (l.taille / 2.6) + l.espace;
  }
  return Math.min(h, HAUTEUR_UTILE - HAUT_DE_PAGE);
}

// --------------------------------------------------------------------------
// Page 1 — l'analyse
// --------------------------------------------------------------------------

function dessinerPageAnalyse(doc, d, { exemple, avecCourrier = false }) {
  const titre = exemple ? 'Foncier·Juste — Pré-diagnostic' : 'Foncier·Juste — Analyse détaillée';
  const w = creerEcrivain(doc, 20, 170, { pied: PIED_ANALYSE, titreSuite: 'Analyse détaillée' });
  w.y = dessinerEnTete(doc, titre, { exemple });

  const reels = d.anomalies.filter(a => a.gravite !== 'info');
  const contexte = d.anomalies.filter(a => a.gravite === 'info');

  // PARITÉ D'AFFICHAGE AVEC L'ÉCRAN — le document acheté ne doit jamais
  // contredire la page qui l'a précédé. Deux natures distinctes, jamais
  // additionnées : ce qui est retenu comme motif, et ce qui ne l'est pas tant
  // que la comparaison des surfaces n'a pas été validée sur de vraies fiches.
  // Les motifs retenus passent devant. Le moteur, lui, est inchangé : on ne
  // fait que trier et formuler ce qu'il a produit.
  const retenus = reels.filter(a => !CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code));
  const observations = reels.filter(a => CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code));
  const ordonnes = retenus.concat(observations);

  // 1 — Synthèse
  w.ligne(`Établi le ${new Date().toLocaleDateString('fr-FR')}`, { taille: 9, couleur: [124, 137, 148], espace: 2 });
  w.ligne(`Bien étudié : ${d.commune.commune} (${d.commune.code_postal}) · ${d.type}`, { taille: 9, couleur: [124, 137, 148], espace: 8 });

  w.ligne('Synthèse', { taille: 14, style: 'bold', espace: 3 });
  const sansMotifRetenu = reels.length > 0 && retenus.length === 0;
  const couleur = sansMotifRetenu ? [122, 94, 16]
    : d.score >= 40 ? [150, 39, 31] : d.score >= 20 ? [122, 94, 16] : [44, 99, 73];
  w.ligne(
    sansMotifRetenu ? 'Aucun motif retenu à ce stade' : (d.classifLabel || 'Aucun élément notable détecté'),
    { taille: 12, style: 'bold', couleur, espace: 4 }
  );
  const phraseSynthese = () => {
    if (reels.length === 0) return "Aucun élément appelant une vérification n'a été relevé à partir de vos réponses.";
    const nb = (n, s, p) => `${n} ${n > 1 ? p : s}`;
    if (retenus.length === 0) {
      return observations.length === 1
        ? "Un écart a été relevé entre vos deux surfaces. Il mérite votre attention, mais il n'est pas retenu comme motif : il est présenté plus bas, à part."
        : "Des écarts ont été relevés entre vos surfaces. Ils méritent votre attention, mais ne sont pas retenus comme motifs : ils sont présentés plus bas, à part.";
    }
    // Sans la fiche, rien n'est « retenu » : l'utilisateur n'a pas vu ce que
    // l'administration prend en compte. Même conditionnement qu'à l'écran.
    const base = d.avecFiche
      ? `${nb(retenus.length, 'piste est retenue', 'pistes sont retenues')} pour vérification.`
      : `${nb(retenus.length, 'point est à confirmer', 'points sont à confirmer')} sur votre fiche d'évaluation, que vous n'aviez pas sous les yeux.`;
    return observations.length
      ? `${base} S'y ajoute ${nb(observations.length, 'observation qui ne compte pas comme motif', 'observations qui ne comptent pas comme motifs')}, présentée séparément.`
      : `${base} Le détail figure ci-dessous.`;
  };
  w.ligne(phraseSynthese(), { taille: 10, espace: 6 });

  // 2 — Données utilisées
  w.ligne('Données utilisées pour cette analyse', { taille: 12, style: 'bold', espace: 3 });
  w.ligne(
    d.avecFiche
      ? `Fiche d'évaluation 6675-M : vous l'aviez sous les yeux. Surface réelle qui y figure : ${Number(d.surfFiche).toFixed(0)} m².`
      : "Fiche d'évaluation 6675-M : non consultée. Aucune comparaison de surface n'a donc été possible.",
    { taille: 10, espace: 3 }
  );
  w.ligne(`Surface habitable aujourd'hui : ${Number(d.surfReelle).toFixed(0)} m², ${
    d.sourceSurface === 'mesuree' ? 'que vous déclarez avoir mesurée vous-même'
    : d.sourceSurface === 'acte' ? 'issue de votre acte de vente ou d\'un diagnostic'
    : 'estimée de mémoire'}.`, { taille: 10, espace: 3 });
  const ef = (d.entree && d.entree.ef) || [];
  const ee = (d.entree && d.entree.ee) || [];
  w.ligne(`Éléments portés à l'évaluation selon vos réponses : ${ef.length ? ef.join(', ') : 'aucun'}. Existant aujourd'hui : ${ee.length ? ee.join(', ') : 'aucun'}.`, { taille: 10, espace: 8 });

  // 3 — Chaque élément détecté
  if (reels.length) {
    w.ligne(retenus.length
      ? (d.avecFiche ? 'Pistes à vérifier' : 'Points à confirmer sur votre fiche')
      : 'Ce que nous avons relevé', { taille: 12, style: 'bold', espace: 4 });
    let intertitrePose = false;
    ordonnes.forEach((a, i) => {
      const nonValide = CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code);
      // Un intertitre sépare les deux natures : sans lui, le sommaire
      // laisserait croire que tout ce qui suit est un motif.
      if (nonValide && retenus.length && !intertitrePose) {
        intertitrePose = true;
        w.ligne('Observation complémentaire — non retenue comme motif',
                { taille: 11, style: 'bold', couleur: [122, 94, 16], espace: 4 });
      }
      const lignes = lignesBlocSignal(a, i + 1, nonValide, avecCourrier);
      // Un élément se lit d'un bloc : on réserve sa hauteur exacte pour qu'il
      // ne soit pas coupé au milieu.
      w.reserver(hauteurBloc(doc, lignes, 20, 170));
      lignes.forEach((l) => w.ligne(l.texte, l));
    });
  } else {
    w.ligne('Éléments à vérifier', { taille: 12, style: 'bold', espace: 3 });
    w.ligne("Aucun, sur la base de vos réponses. Cela ne signifie pas que votre évaluation est exacte : cela signifie que les points que nous savons contrôler ne présentent pas d'écart.", { taille: 10, espace: 8 });
  }

  // 4 — Contexte de marché
  if (contexte.length) {
    w.ligne('Contexte immobilier de votre commune', { taille: 12, style: 'bold', espace: 3 });
    contexte.forEach(a => {
      w.ligne(`${a.titre} — ${a.figure}`, { taille: 10, style: 'bold', espace: 2.5 });
      w.ligne(`Ce que cela change pour votre taxe — ${a.aVerifier}`, { taille: 9.5, couleur: [91, 104, 117], espace: 7 });
    });
  }

  // 5 — Limites
  w.ligne("Limites de cette analyse", { taille: 12, style: 'bold', espace: 3 });
  [
    "Nous n'avons pas accès à votre dossier fiscal. Tout ce qui précède est calculé à partir des chiffres que vous avez saisis.",
    "La catégorie de confort (échelle de 1 à 8) et le local de référence retenu pour votre commune ne sont pas analysés : ils supposent une appréciation comparative que nous ne pouvons pas automatiser.",
    "Un écart inférieur à 5 m² n'est pas signalé, même s'il représente une part importante d'une petite surface. Cette limite est connue et en cours de réévaluation.",
    "Nous ne pouvons pas calculer l'incidence financière d'une éventuelle correction : elle dépend de la valeur locative recalculée par l'administration, de coefficients qui nous sont inconnus et du taux voté par votre commune.",
  ].forEach(t => w.ligne(`— ${t}`, { taille: 9.5, espace: 3 }));
  w.espace(4);

  // 6 — Sources
  w.ligne('Sources', { taille: 12, style: 'bold', espace: 3 });
  [
    "Méthode d'évaluation des locaux d'habitation : articles 324 L à 324 V de l'annexe III au Code général des impôts ; commentaires BOFiP BOI-IF-TFB-20-10-20-50.",
    "Données de marché : fichier DVF (Demandes de valeurs foncières), DGFiP, publié sur data.gouv.fr, millésime 2024.",
    "Délai de réclamation : article R*196-2 du Livre des procédures fiscales.",
  ].forEach(t => w.ligne(`— ${t}`, { taille: 9, couleur: [91, 104, 117], espace: 3 }));

  w.finir();
}

function genererRapportPDF(d, opts = {}) {
  const exemple = opts.exemple !== false;
  const doc = nouveauDocument(exemple ? 'Foncier·Juste — Pré-diagnostic' : 'Foncier·Juste — Analyse détaillée',
    'Éléments de votre évaluation foncière qui méritent une vérification');
  dessinerPageAnalyse(doc, d, { exemple });
  enregistrerPDF(doc, nomDeFichier(exemple ? 'Exemple' : 'Analyse-detaillee', d));
}

// --------------------------------------------------------------------------
// Aperçu gratuit — montre la STRUCTURE du livrable, jamais son contenu.
// Ne jamais l'enrichir sans se demander s'il redevient un substitut gratuit.
// --------------------------------------------------------------------------

function genererApercuPDF(d) {
  const doc = nouveauDocument('Foncier·Juste — Aperçu du dossier', 'Démonstration de format');
  const w = creerEcrivain(doc, 20, 170, {
    pied: "Aperçu de format, sans valeur juridique. Les analyses et le projet de courrier ne figurent que dans le document complet.",
  });
  w.y = dessinerEnTete(doc, 'Foncier·Juste — Aperçu du dossier', {
    sousTitre: 'Document de démonstration : le contenu est volontairement masqué.',
  });

  w.espace(4);
  w.ligne(`Bien étudié : ${d.commune.commune} (${d.commune.code_postal}) · ${d.type}`, { taille: 10, couleur: [124, 137, 148], espace: 10 });

  const masque = (titre, n) => {
    w.ligne(titre, { taille: 12, style: 'bold', espace: 4 });
    for (let i = 0; i < n; i++) {
      doc.setFillColor(226, 232, 236);
      doc.roundedRect(20, w.y - 3.5, 120 + Math.random() * 45, 4, 1, 1, 'F');
      w.espace(8);
    }
    w.espace(4);
  };

  // Aperçu gratuit : on annonce le nombre de PISTES RETENUES, pas le total des
  // éléments relevés — un constat non retenu ne se vend pas.
  w.ligne(`Pistes retenues pour vérification : ${
    d.anomalies.filter(a => a.gravite !== 'info' && !CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code)).length
  }`, { taille: 11, style: 'bold', espace: 6 });
  masque('Chaque élément, expliqué : ce que vous avez indiqué, ce que nous en déduisons, ce qu\'il reste à vérifier', 2);
  masque('Les données exactes utilisées pour votre bien', 2);
  masque('Les documents à réunir, adaptés à votre situation', 2);
  masque('Votre projet de courrier, à relire et compléter', 3);
  masque('La marche à suivre et les délais applicables', 2);

  w.espace(2);
  doc.setDrawColor(122, 94, 16);
  doc.setFillColor(247, 240, 218);
  doc.roundedRect(20, w.y - 4, 170, 24, 2, 2, 'FD');
  doc.setTextColor(110, 84, 14);
  doc.setFont(POLICE_NOM, 'bold'); doc.setFontSize(10);
  doc.text('Le document complet contient ces sections renseignées pour votre bien.', 25, w.y + 3);
  doc.setFont(POLICE_NOM, 'normal'); doc.setFontSize(9);
  doc.text(doc.splitTextToSize("Votre pré-diagnostic reste consultable gratuitement sur le site. Aucun montant d'économie n'est annoncé, ici ni ailleurs : il dépend d'un recalcul que seule l'administration peut faire.", 160), 25, w.y + 9);

  w.finir();
  enregistrerPDF(doc, nomDeFichier('Apercu-du-dossier', d));
}

// --------------------------------------------------------------------------
// Dossier de vérification (49 €) — analyse + pièces + courrier + marche à suivre
// --------------------------------------------------------------------------

// Deux listes distinctes, pour deux usages distincts.
//
// `piecesCourrier` est destinée au courrier lui-même : des intitulés courts,
// cochables, que le destinataire adapte à ce qu'il joint réellement. Un
// courrier qui annonce des pièces absentes dessert son auteur.
//
// `conseilsPieces` est destinée à « Marche à suivre » : comment obtenir chaque
// pièce, ce qu'elle vaut, et quoi faire quand elle manque. Ces explications
// s'adressent au lecteur, pas à l'administration — elles n'ont rien à faire
// dans un courrier officiel.

function piecesCourrier(motifs) {
  const pieces = [
    "Avis de taxe foncière contesté (ou copie, ou extrait du rôle)",
    "Fiche d'évaluation du local (formulaire 6675-M)",
  ];
  if (motifs.some(a => a.code === 'surface_surevaluee')) {
    pieces.push("Justificatif de surface : plan coté ou relevé");
  }
  const confort = motifs.find(a => a.code === 'elements_confort_obsoletes');
  if (confort) {
    const elements = (confort.figure || '').toLowerCase();
    pieces.push(`Preuve datée de la disparition${elements ? ' : ' + elements : ''}`);
  }
  return pieces;
}

function conseilsPieces(motifs) {
  const conseils = [
    ["L'avis de taxe foncière contesté",
     "L'article R*197-3 du Livre des procédures fiscales demande que la réclamation soit accompagnée de " +
     "l'avis d'imposition, d'une copie de cet avis ou d'un extrait du rôle. Le même article prévoit qu'elle " +
     "peut être régularisée à tout moment par la production de l'une de ces pièces : si vous ne l'avez pas " +
     "sous la main, ne différez pas votre envoi, surtout si le délai approche — vous pourrez la fournir " +
     "ensuite. Retirez alors la ligne correspondante de la liste des pièces jointes."],
    ["La fiche d'évaluation (formulaire 6675-M)",
     "Elle s'obtient gratuitement auprès du service des impôts fonciers, ou par la messagerie sécurisée de " +
     "votre espace particulier sur impots.gouv.fr. C'est le document qui détaille ce que l'administration " +
     "retient pour votre logement."],
  ];
  if (motifs.some(a => a.code === 'surface_surevaluee')) {
    conseils.push(["Un justificatif de surface",
     "Plan coté, relevé de géomètre-expert, ou acte de vente avec plan annexé. Si vous joignez une " +
     "attestation Carrez ou Boutin, dites-le explicitement dans votre courrier : ces mesures ne retiennent " +
     "pas le même périmètre que l'évaluation fiscale, et produites sans explication elles peuvent être " +
     "écartées."]);
  }
  if (motifs.some(a => a.code === 'elements_confort_obsoletes')) {
    conseils.push(["Une preuve datée de la disparition",
     "Facture de l'entreprise intervenue, permis de démolir ou déclaration préalable, ou photographie " +
     "aérienne historique de l'IGN sur remonterletemps.ign.fr — gratuite et datée, c'est souvent la pièce " +
     "la plus simple à obtenir. Une attestation sur l'honneur peut les accompagner, mais ne les remplace pas."]);
  }
  conseils.push(["Si une pièce vous manque",
   "Envoyez votre réclamation sans elle plutôt que de laisser passer le délai, et supprimez la ligne " +
   "correspondante de la liste des pièces jointes. Vous pourrez la transmettre ensuite, par la même voie, " +
   "en rappelant la référence de votre réclamation."]);
  return conseils;
}

function dessinerPageCourrier(doc, d) {
  doc.addPage();
  const w = creerEcrivain(doc, 20, 170, {
    pied: "Projet de courrier à relire, compléter et signer. Foncier·Juste n'est pas un cabinet d'avocats ; ce texte ne constitue pas une consultation juridique et n'engage pas son destinataire sur l'issue de la démarche.",
    titreSuite: 'Projet de courrier',
  });
  w.y = dessinerEnTete(doc, 'Projet de courrier', {
    sousTitre: "À recopier sur papier libre et à signer, ou à transmettre depuis votre espace sur impots.gouv.fr. Les mentions entre crochets sont à compléter par vos soins.",
  });

  const annee = new Date().getFullYear();
  w.espace(2);
  w.ligne('[Vos NOM et Prénom]', { taille: 10, espace: 2 });
  w.ligne('[Votre adresse complète]', { taille: 10, espace: 2 });
  w.ligne("[Votre numéro fiscal — en haut de votre avis d'imposition]", { taille: 10, espace: 7 });

  w.ligne("À l'attention du Service des Impôts Fonciers", { taille: 10, style: 'bold', espace: 2 });
  w.ligne("[Adresse du service — indiquée sur votre avis de taxe foncière]", { taille: 10, espace: 7 });

  w.ligne(`Fait à [Ville], le ${new Date().toLocaleDateString('fr-FR')}`, { taille: 10, espace: 6 });

  w.ligne(
    `Objet : réclamation contentieuse relative à la taxe foncière sur les propriétés bâties — ` +
    `avis n° [référence de l'avis contesté], année ${annee} — article L.190 du Livre des procédures fiscales`,
    { taille: 10, style: 'bold', espace: 6 }
  );

  w.ligne('Madame, Monsieur,', { taille: 10, espace: 5 });

  w.ligne(
    `Je vous prie de bien vouloir procéder à un nouvel examen de l'évaluation retenue pour le bien situé ` +
    `[adresse complète du bien], commune de ${d.commune.commune} (${d.commune.code_postal}), ` +
    `au titre de l'avis de taxe foncière mentionné en objet.`,
    { taille: 10, espace: 6 }
  );

  w.ligne(
    "Après avoir consulté la fiche d'évaluation de ce local, je constate les éléments suivants, que je porte " +
    "à votre connaissance sans préjuger de leur incidence sur le calcul :",
    { taille: 10, espace: 4 }
  );

  // Seuls les motifs que nous considérons comme étayés figurent dans le
  // courrier. L'écart de surface en est exclu tant que le test T1 n'a pas
  // établi que la « surface réelle » de la fiche et la surface habitable
  // mesurée recouvrent le même périmètre : nous refusons de vendre sur ce
  // motif, il serait incohérent de le faire porter à l'administration.
  // Il reste exposé dans l'analyse, et une note ci-dessous explique au
  // lecteur comment l'ajouter lui-même s'il a vérifié le périmètre.
  const motifs = d.anomalies.filter(
    a => a.gravite !== 'info' && !CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code)
  );
  const surfaceEcartee = d.anomalies.some(
    a => a.gravite !== 'info' && CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code)
  );
  motifs.forEach(a => {
    w.ligne(`— ${a.message}`, { taille: 10, espace: 3, x: 24 });
  });
  w.espace(1);

  w.ligne(
    "Ces éléments me paraissent susceptibles d'affecter la valeur locative cadastrale servant de base au calcul " +
    "de mon imposition. Je m'en remets à votre appréciation pour déterminer s'ils justifient une rectification.",
    { taille: 10, espace: 6 }
  );

  w.ligne(
    "Je sollicite en conséquence, sur le fondement de l'article L.190 du Livre des procédures fiscales, le " +
    "réexamen de l'évaluation de ce local et, s'il y a lieu, le dégrèvement correspondant de l'imposition contestée.",
    { taille: 10, espace: 6 }
  );

  w.ligne("Vous trouverez ci-joint les pièces suivantes :", { taille: 10, espace: 4 });
  piecesCourrier(motifs).forEach(p => w.ligne(`[   ]  ${p}`, { taille: 10, espace: 3, x: 24 }));
  w.ligne(
    "(cochez les pièces que vous joignez effectivement et supprimez les autres lignes avant d'envoyer)",
    { taille: 8.5, style: 'italic', couleur: [124, 137, 148], espace: 3, x: 24 }
  );
  w.espace(1);

  // La formule de politesse et la signature forment un bloc qu'on réserve, pour
  // qu'il ne soit ni coupé ni renvoyé seul sur une page suivante alors qu'il
  // tenait encore. La consigne sur la signature manuscrite est passée dans
  // « Marche à suivre » : ce n'est pas du texte à recopier, et la garder ici
  // allongeait le bloc au point de faire déborder la lettre.
  //
  // Essai écarté : lister les pièces après la signature, comme dans une lettre
  // ordinaire. Mesuré — cela repoussait la liste seule sur une page suivante et
  // dégradait toutes les configurations testées.
  w.reserver(24);
  w.ligne("Je reste à votre disposition pour tout élément complémentaire et vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.", { taille: 10, espace: 6 });
  w.ligne('[Signature manuscrite]', { taille: 10, style: 'bold', espace: 4 });

  w.finir();
}

function dessinerPageDemarche(doc, d) {
  doc.addPage();
  const w = creerEcrivain(doc, 20, 170, {
    pied: "Informations établies d'après le Livre des procédures fiscales et la jurisprudence en vigueur au 16 septembre 2026. Vérifiez leur actualité sur impots.gouv.fr ou legifrance.gouv.fr avant d'engager la démarche.",
    titreSuite: 'Marche à suivre',
  });
  w.y = dessinerEnTete(doc, 'Marche à suivre');

  // La note sur l'écart de surface est une explication au lecteur, pas une
  // pièce du courrier : sa place est ici, et non au dos de la lettre où elle
  // laissait la signature isolée sur une page presque vide.
  const surfaceEcartee = d.anomalies.some(
    a => a.gravite !== 'info' && CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code)
  );
  if (surfaceEcartee) {
    w.ligne("Pourquoi l'écart de surface ne figure pas dans le courrier", { taille: 12, style: 'bold', espace: 4 });
    w.ligne(
      "Votre analyse relève un écart entre la surface lue sur votre fiche et celle que vous avez mesurée. " +
      "Nous ne l'avons volontairement pas inscrit comme motif : nous ne sommes pas encore certains que ces " +
      "deux chiffres recouvrent le même périmètre. La fiche décompose le local en parties principales, " +
      "parties secondaires et dépendances ; si votre total inclut un garage ou une cave que votre mesure " +
      "exclut, l'écart n'est qu'un artefact.",
      { taille: 10, espace: 3 }
    );
    w.ligne(
      "Avant d'avancer ce motif, reprenez votre fiche et identifiez précisément les lignes que vous avez " +
      "additionnées, puis mesurez exactement les mêmes espaces. Si un écart subsiste après cette " +
      "vérification, il porte alors sur deux surfaces comparables. Cela ne démontre pas pour autant une " +
      "erreur dans votre évaluation : cela vous donne un élément que vous pouvez soumettre à " +
      "l'administration, accompagné d'un plan coté ou d'un relevé, en la laissant apprécier.",
      { taille: 10, espace: 8 }
    );
  }

  // Les explications sur les pièces vivent ici, et non dans le courrier :
  // elles s'adressent au lecteur, pas à l'administration.
  const motifs = d.anomalies.filter(
    a => a.gravite !== 'info' && !CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code)
  );
  w.reserver(26);
  w.ligne('1. Les pièces à réunir', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Le courrier annonce une liste de pièces jointes, à cocher ou à supprimer selon ce que vous joignez " +
    "réellement. Voici à quoi chacune sert et comment l'obtenir.",
    { taille: 10, espace: 5 }
  );
  conseilsPieces(motifs).forEach(([titre, texte]) => {
    w.reserver(22);
    w.ligne(titre, { taille: 10, style: 'bold', espace: 2.5 });
    w.ligne(texte, { taille: 9.5, espace: 5, x: 24 });
  });
  w.espace(3);

  w.reserver(26);
  w.ligne('2. Avant d\'envoyer', { taille: 12, style: 'bold', espace: 4 });
  [
    "Relisez le projet de courrier et complétez toutes les mentions entre crochets. Un courrier incomplet retarde le traitement.",
    "Vérifiez que chaque élément que vous avancez est appuyé par une pièce. Une affirmation sans justificatif a peu de chances d'aboutir.",
    "Si vous n'êtes pas certain d'un chiffre, retirez-le plutôt que de l'avancer : une inexactitude fragilise tout le dossier.",
    "Si vous envoyez par courrier, signez le document à la main : l'article R*197-3 du Livre des procédures fiscales l'exige.",
  ].forEach(t => w.ligne(`— ${t}`, { taille: 10, espace: 3 }));
  w.espace(5);

  w.reserver(26);
  w.ligne('3. Où déposer votre réclamation', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Deux voies au choix. Par la messagerie sécurisée de votre espace particulier sur impots.gouv.fr, rubrique " +
    "« J'ai une question sur le calcul de mon impôt » — l'envoi y est horodaté automatiquement. Ou par courrier " +
    "adressé au Service des Impôts Fonciers dont l'adresse figure sur votre avis, de préférence en recommandé " +
    "avec accusé de réception. La démarche est gratuite dans les deux cas et ne nécessite pas d'avocat.",
    { taille: 10, espace: 8 }
  );

  w.reserver(26);
  w.ligne('4. Le délai à ne pas dépasser', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Pour les impôts directs locaux, la réclamation doit parvenir à l'administration au plus tard le 31 décembre " +
    "de l'année suivant celle, selon le cas, de la mise en recouvrement du rôle, ou de la réalisation de " +
    "l'événement qui motive la réclamation (article R*196-2 du Livre des procédures fiscales).",
    { taille: 10, espace: 4 }
  );
  w.ligne(
    "Dans la situation la plus courante — vous contestez un avis que vous venez de recevoir — c'est le premier " +
    "point de départ qui s'applique : le délai couvre alors l'avis de l'année en cours et, selon le moment, celui " +
    "de l'année précédente.",
    { taille: 10, espace: 4 }
  );
  w.ligne(
    "Le second point de départ peut ouvrir un délai distinct lorsqu'un événement postérieur justifie la " +
    "réclamation. Ce que recouvre exactement cette notion s'apprécie au cas par cas et relève de l'administration, " +
    "puis le cas échéant du juge : nous ne pouvons pas le déterminer à votre place. Si vous pensez être dans " +
    "cette situation, exposez-la dans votre courrier et interrogez votre service des impôts fonciers avant de " +
    "renoncer à réclamer.",
    { taille: 10, espace: 8 }
  );

  w.reserver(26);
  w.ligne('5. Ce qui se passe ensuite', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "L'administration dispose de six mois pour statuer. Si elle ne peut pas tenir ce délai, elle doit vous en " +
    "informer avant son expiration et peut se réserver trois mois supplémentaires au maximum (article R*198-10 " +
    "du Livre des procédures fiscales).",
    { taille: 10, espace: 4 }
  );
  w.ligne(
    "Si elle garde le silence, cela ne vaut pas acceptation de votre demande. Passé six mois, vous pouvez saisir " +
    "le tribunal administratif — et aucun délai de recours ne court contre vous tant qu'une décision expresse de " +
    "rejet ne vous a pas été régulièrement notifiée (Conseil d'État, 21 octobre 2020, n° 443327). En cas de rejet " +
    "exprès et motivé, vous disposez de deux mois à compter de sa notification pour saisir le tribunal.",
    { taille: 10, espace: 8 }
  );

  w.reserver(26);
  w.ligne('6. Ce que cette démarche ne garantit pas', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Aucune réclamation ne garantit un dégrèvement. L'administration peut confirmer son évaluation, la corriger " +
    "partiellement, ou constater une insuffisance d'imposition. Foncier·Juste ne peut pas anticiper sa décision et " +
    "ne vous promet aucun montant. Ce que ce dossier vous apporte, c'est une demande correctement formée, appuyée " +
    "sur les bonnes pièces et déposée dans les délais — ce qui est la seule chose sur laquelle vous ayez prise.",
    { taille: 10, espace: 6 }
  );

  w.finir();
}

function genererDossierPDF(d, opts = {}) {
  const exemple = opts.exemple !== false;
  const doc = nouveauDocument(exemple ? 'Foncier·Juste — Pré-diagnostic' : 'Foncier·Juste — Dossier de vérification',
    'Analyse, projet de courrier et marche à suivre');
  dessinerPageAnalyse(doc, d, { exemple, avecCourrier: true });
  dessinerPageCourrier(doc, d);
  dessinerPageDemarche(doc, d);
  enregistrerPDF(doc, nomDeFichier(exemple ? 'Dossier-exemple' : 'Dossier-de-verification', d));
}
