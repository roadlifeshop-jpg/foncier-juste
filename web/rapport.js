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
      doc.setFont('helvetica', 'italic');
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
    ligne(texte, o = {}) {
      const { taille = 10, style = 'normal', couleur = [18, 24, 29], espace = 6, x = margeGauche } = o;
      // La mise en forme doit être réappliquée APRÈS un éventuel saut de page :
      // pageSuivante() dessine l'en-tête « (suite) » en italique gris, et sans
      // cette seconde application la ligne qui déclenche le saut héritait de
      // cette fonte — défaut repéré à la relecture visuelle du PDF.
      const appliquer = () => {
        doc.setFont('helvetica', style);
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
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(titre, 20, 10.5);

  let y = 28;
  if (exemple) {
    doc.setTextColor(150, 39, 31);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('EXEMPLE — généré gratuitement, ne constitue pas le document payant', 20, y);
    y += 10;
  }
  if (sousTitre) {
    doc.setTextColor(120, 128, 136);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const l = doc.splitTextToSize(sousTitre, 170);
    doc.text(l, 20, y);
    y += l.length * 4 + 6;
  }
  return y;
}

function dessinerPiedDePage(doc, texte) {
  doc.setDrawColor(216, 223, 227); doc.line(20, 275, 190, 275);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(124, 137, 148);
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

// --------------------------------------------------------------------------
// Page 1 — l'analyse
// --------------------------------------------------------------------------

function dessinerPageAnalyse(doc, d, { exemple }) {
  const titre = exemple ? 'Foncier·Juste — Pré-diagnostic' : 'Foncier·Juste — Analyse détaillée';
  const w = creerEcrivain(doc, 20, 170, { pied: PIED_ANALYSE, titreSuite: 'Analyse détaillée' });
  w.y = dessinerEnTete(doc, titre, { exemple });

  const reels = d.anomalies.filter(a => a.gravite !== 'info');
  const contexte = d.anomalies.filter(a => a.gravite === 'info');

  // 1 — Synthèse
  w.ligne(`Établi le ${new Date().toLocaleDateString('fr-FR')}`, { taille: 9, couleur: [124, 137, 148], espace: 2 });
  w.ligne(`Bien étudié : ${d.commune.commune} (${d.commune.code_postal}) · ${d.type}`, { taille: 9, couleur: [124, 137, 148], espace: 8 });

  w.ligne('Synthèse', { taille: 14, style: 'bold', espace: 3 });
  const couleur = d.score >= 40 ? [150, 39, 31] : d.score >= 20 ? [122, 94, 16] : [44, 99, 73];
  w.ligne(d.classifLabel || 'Aucun élément notable détecté', { taille: 12, style: 'bold', couleur, espace: 4 });
  w.ligne(
    reels.length === 0
      ? "Aucun élément appelant une vérification n'a été relevé à partir de vos réponses."
      : reels.length === 1
        ? "Un élément de votre situation mérite d'être vérifié. Il est détaillé ci-dessous."
        : `${reels.length} éléments de votre situation méritent d'être vérifiés. Ils sont détaillés ci-dessous.`,
    { taille: 10, espace: 6 }
  );

  // 2 — Données utilisées
  w.ligne('Données utilisées pour cette analyse', { taille: 12, style: 'bold', espace: 3 });
  w.ligne(
    d.avecFiche
      ? `Fiche d'évaluation 6675-M : consultée par vos soins. Surface réelle relevée : ${Number(d.surfFiche).toFixed(0)} m².`
      : "Fiche d'évaluation 6675-M : non consultée. Aucune comparaison de surface n'a donc été possible.",
    { taille: 10, espace: 3 }
  );
  w.ligne(`Surface habitable mesurée aujourd'hui : ${Number(d.surfReelle).toFixed(0)} m² (${
    d.sourceSurface === 'mesuree' ? 'mesurée par vos soins'
    : d.sourceSurface === 'acte' ? 'issue de votre acte de vente ou d\'un diagnostic'
    : 'estimée de mémoire'}).`, { taille: 10, espace: 3 });
  const ef = (d.entree && d.entree.ef) || [];
  const ee = (d.entree && d.entree.ee) || [];
  w.ligne(`Éléments portés à l'évaluation selon vos réponses : ${ef.length ? ef.join(', ') : 'aucun'}. Existant aujourd'hui : ${ee.length ? ee.join(', ') : 'aucun'}.`, { taille: 10, espace: 8 });

  // 3 — Chaque élément détecté
  if (reels.length) {
    w.ligne('Éléments à vérifier', { taille: 12, style: 'bold', espace: 4 });
    reels.forEach((a, i) => {
      w.ligne(`${i + 1}. ${a.titre}`, { taille: 11, style: 'bold', espace: 3 });
      w.ligne(`Écart constaté : ${a.figure}`, { taille: 10, style: 'bold', couleur: [33, 65, 79], espace: 3, x: 24 });
      w.ligne(`Ce que vous avez indiqué — ${a.vosReponses}`, { taille: 9.5, espace: 2.5, x: 24 });
      w.ligne(`Ce que nous en avons calculé — ${a.calcul}`, { taille: 9.5, espace: 2.5, x: 24 });
      w.ligne(`Ce qu'il reste à vérifier — ${a.aVerifier}`, { taille: 9.5, espace: 2.5, x: 24 });
      w.ligne(`Niveau de confiance — ${a.confiance.texte}`, { taille: 9.5, couleur: [91, 104, 117], espace: 2.5, x: 24 });
      w.ligne(`Origine de l'information — ${a.confiance.origine}`, {
        taille: 9.5, couleur: [91, 104, 117],
        espace: CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code) ? 2.5 : 7, x: 24,
      });
      if (CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code)) {
        w.ligne(
          "Statut — constat non validé. Nous vérifions actuellement, sur de vraies fiches d'évaluation, " +
          "que les deux surfaces comparées recouvrent bien le même périmètre. Tant que ce point n'est pas " +
          "tranché, cet élément n'est pas présenté comme une anomalie et ne figure pas dans le projet de " +
          "courrier. Il vous indique où regarder, rien de plus.",
          { taille: 9, style: 'bold', couleur: [122, 94, 16], espace: 7, x: 24 }
        );
      }
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
      w.ligne(a.aVerifier, { taille: 9.5, couleur: [91, 104, 117], espace: 7 });
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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  dessinerPageAnalyse(doc, d, { exemple });
  doc.save(exemple ? `foncier-juste-exemple-${d.commune.code_commune}.pdf` : `foncier-juste-analyse-${d.commune.code_commune}.pdf`);
}

// --------------------------------------------------------------------------
// Aperçu gratuit — montre la STRUCTURE du livrable, jamais son contenu.
// Ne jamais l'enrichir sans se demander s'il redevient un substitut gratuit.
// --------------------------------------------------------------------------

function genererApercuPDF(d) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
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

  w.ligne(`Éléments à vérifier relevés : ${d.anomalies.filter(a => a.gravite !== 'info').length}`, { taille: 11, style: 'bold', espace: 6 });
  masque('Chaque élément, expliqué : ce que vous avez indiqué, ce qui en est calculé, ce qu\'il reste à vérifier', 2);
  masque('Les données exactes utilisées pour votre bien', 2);
  masque('Les documents à réunir, adaptés à votre situation', 2);
  masque('Votre projet de courrier, à relire et compléter', 3);
  masque('La marche à suivre et les délais applicables', 2);

  w.espace(2);
  doc.setDrawColor(122, 94, 16);
  doc.setFillColor(247, 240, 218);
  doc.roundedRect(20, w.y - 4, 170, 24, 2, 2, 'FD');
  doc.setTextColor(110, 84, 14);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Le document complet contient ces sections renseignées pour votre bien.', 25, w.y + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(doc.splitTextToSize("Votre pré-diagnostic reste consultable gratuitement sur le site. Aucun montant d'économie n'est annoncé, ici ni ailleurs : nous ne savons pas le calculer.", 160), 25, w.y + 9);

  w.finir();
  doc.save('foncier-juste-apercu.pdf');
}

// --------------------------------------------------------------------------
// Dossier de vérification (49 €) — analyse + pièces + courrier + marche à suivre
// --------------------------------------------------------------------------

function piecesAJoindre(anomalies) {
  // L'article R*197-3 du LPF fixe ce qui est exigé à peine d'irrecevabilité ;
  // le reste relève des pièces qui étayent le fond.
  const pieces = [
    "À JOINDRE EN PRIORITÉ — l'avis de taxe foncière contesté. L'article R*197-3 du Livre des procédures " +
    "fiscales demande que la réclamation soit accompagnée de l'avis d'imposition, d'une copie de cet avis ou " +
    "d'un extrait du rôle. Le même article prévoit que la réclamation peut être régularisée à tout moment par " +
    "la production de l'une de ces pièces : si vous ne l'avez pas sous la main, ne différez pas votre envoi, " +
    "surtout si le délai approche — vous pourrez la fournir ensuite.",
    "Votre fiche d'évaluation (formulaire 6675-M), obtenue gratuitement auprès du service des impôts fonciers ou par la messagerie sécurisée d'impots.gouv.fr.",
  ];
  if (anomalies.some(a => a.code === 'surface_surevaluee')) {
    pieces.push(
      "Un justificatif de surface : plan coté, relevé de géomètre-expert, ou acte de vente avec plan annexé. " +
      "Si vous joignez une attestation Carrez ou Boutin, précisez-le : ces mesures ne retiennent pas le même périmètre que l'évaluation fiscale, et produites sans explication elles peuvent être écartées."
    );
  }
  if (anomalies.some(a => a.code === 'elements_confort_obsoletes')) {
    pieces.push(
      "Une preuve datée de la disparition de l'élément : facture de l'entreprise intervenue, permis de démolir ou déclaration préalable, ou photographie aérienne historique de l'IGN (remonterletemps.ign.fr — gratuit, daté). " +
      "Une attestation sur l'honneur peut accompagner ces pièces, mais ne les remplace pas."
    );
  }
  return pieces;
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
  w.ligne('[Vos NOM et Prénom]', { taille: 10, espace: 3 });
  w.ligne('[Votre adresse complète]', { taille: 10, espace: 3 });
  w.ligne("[Votre numéro fiscal — en haut de votre avis d'imposition]", { taille: 10, espace: 9 });

  w.ligne("À l'attention du Service des Impôts Fonciers", { taille: 10, style: 'bold', espace: 3 });
  w.ligne("[Adresse du service — indiquée sur votre avis de taxe foncière]", { taille: 10, espace: 9 });

  w.ligne(`Fait à [Ville], le ${new Date().toLocaleDateString('fr-FR')}`, { taille: 10, espace: 8 });

  w.ligne(
    `Objet : réclamation contentieuse relative à la taxe foncière sur les propriétés bâties — ` +
    `avis n° [référence de l'avis contesté], année ${annee} — article L.190 du Livre des procédures fiscales`,
    { taille: 10, style: 'bold', espace: 8 }
  );

  w.ligne('Madame, Monsieur,', { taille: 10, espace: 6 });

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
    w.ligne(`— ${a.message}`, { taille: 10, espace: 4, x: 24 });
  });
  w.espace(2);

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
  piecesAJoindre(motifs).forEach(p => w.ligne(`— ${p}`, { taille: 9.5, espace: 4, x: 24 }));
  w.espace(2);

  w.ligne("Je reste à votre disposition pour tout élément complémentaire et vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.", { taille: 10, espace: 10 });
  w.ligne('[Signature manuscrite]', { taille: 10, style: 'bold', espace: 4 });
  w.ligne("La signature manuscrite est exigée par l'article R*197-3 du Livre des procédures fiscales pour une réclamation adressée par courrier.", { taille: 8.5, couleur: [124, 137, 148], espace: 4 });

  if (surfaceEcartee) {
    w.espace(8);
    doc.setDrawColor(216, 223, 227);
    doc.setFillColor(237, 241, 244);
    const hautBloc = w.y - 5;
    w.ligne("Pourquoi l'écart de surface ne figure pas dans ce courrier", { taille: 10, style: 'bold', espace: 3, x: 24 });
    w.ligne(
      "Votre analyse relève un écart entre la surface lue sur votre fiche et celle que vous avez mesurée. " +
      "Nous ne l'avons volontairement pas inscrit comme motif : nous ne sommes pas encore certains que ces " +
      "deux chiffres recouvrent le même périmètre. La fiche décompose le local en parties principales, " +
      "parties secondaires et dépendances ; si votre total inclut un garage ou une cave que votre mesure " +
      "exclut, l'écart n'est qu'un artefact.",
      { taille: 9, espace: 3, x: 24 }
    );
    w.ligne(
      "Avant d'avancer ce motif, reprenez votre fiche et identifiez précisément les lignes que vous avez " +
      "additionnées, puis mesurez exactement les mêmes espaces. Si l'écart subsiste, il est réel : vous " +
      "pouvez alors l'ajouter vous-même à la liste ci-dessus, accompagné d'un plan coté ou d'un relevé.",
      { taille: 9, espace: 4, x: 24 }
    );
    doc.setDrawColor(191, 201, 207);
    doc.line(20, hautBloc, 20, w.y - 4);
  }

  w.finir();
}

function dessinerPageDemarche(doc, d) {
  doc.addPage();
  const w = creerEcrivain(doc, 20, 170, {
    pied: "Informations établies d'après le Livre des procédures fiscales et la jurisprudence en vigueur au 16 septembre 2026. Vérifiez leur actualité sur impots.gouv.fr ou legifrance.gouv.fr avant d'engager la démarche.",
    titreSuite: 'Marche à suivre',
  });
  w.y = dessinerEnTete(doc, 'Marche à suivre');

  w.ligne('1. Avant d\'envoyer', { taille: 12, style: 'bold', espace: 4 });
  [
    "Relisez le projet de courrier et complétez toutes les mentions entre crochets. Un courrier incomplet retarde le traitement.",
    "Vérifiez que chaque élément que vous avancez est appuyé par une pièce. Une affirmation sans justificatif a peu de chances d'aboutir.",
    "Si vous n'êtes pas certain d'un chiffre, retirez-le plutôt que de l'avancer : une inexactitude fragilise tout le dossier.",
  ].forEach(t => w.ligne(`— ${t}`, { taille: 10, espace: 3 }));
  w.espace(5);

  w.ligne('2. Où déposer votre réclamation', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Deux voies au choix. Par la messagerie sécurisée de votre espace particulier sur impots.gouv.fr, rubrique " +
    "« J'ai une question sur le calcul de mon impôt » — l'envoi y est horodaté automatiquement. Ou par courrier " +
    "adressé au Service des Impôts Fonciers dont l'adresse figure sur votre avis, de préférence en recommandé " +
    "avec accusé de réception. La démarche est gratuite dans les deux cas et ne nécessite pas d'avocat.",
    { taille: 10, espace: 8 }
  );

  w.ligne('3. Le délai à ne pas dépasser', { taille: 12, style: 'bold', espace: 4 });
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

  w.ligne('4. Ce qui se passe ensuite', { taille: 12, style: 'bold', espace: 4 });
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

  w.ligne('5. Ce que cette démarche ne garantit pas', { taille: 12, style: 'bold', espace: 4 });
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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  dessinerPageAnalyse(doc, d, { exemple });
  dessinerPageCourrier(doc, d);
  dessinerPageDemarche(doc, d);
  doc.save(exemple ? `foncier-juste-dossier-exemple-${d.commune.code_commune}.pdf` : `foncier-juste-dossier-${d.commune.code_commune}.pdf`);
}
