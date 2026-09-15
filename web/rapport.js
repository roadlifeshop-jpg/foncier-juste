// Génération des PDF — partagée entre l'aperçu gratuit (index.html, marqué
// "EXEMPLE") et les vrais documents livrés après paiement (succes.html).
// Nécessite jsPDF chargé sur la page (window.jspdf).
//
// Deux produits :
//  - genererRapportPDF   : le diagnostic seul (offre "Rapport complet", 29€)
//  - genererDossierPDF   : diagnostic + lettre de réclamation prête à
//    compléter + liste des pièces à joindre (offre "Dossier complet", 49€)
//
// Base légale de la lettre de réclamation, vérifiée avant rédaction :
//  - Article L.190 du Livre des procédures fiscales (LPF) — droit de
//    réclamation contre une imposition
//  - Article R*190-1 du LPF — la réclamation est gratuite, sans avocat
//  - Article R*196-2 du LPF — délai : avant le 31 décembre de l'année
//    suivant celle de la mise en recouvrement de l'avis contesté

function calculerImpact(anomalies, taxeActuelle) {
  const hasHaute = anomalies.some(a => a.gravite === 'haute');
  const hasMoyenne = anomalies.some(a => a.gravite === 'moyenne');
  if (!taxeActuelle || (!hasHaute && !hasMoyenne)) return null;
  const [pctLow, pctHigh] = hasHaute ? [8, 20] : [3, 10];
  return { eurMin: Math.round(taxeActuelle * pctLow / 100), eurMax: Math.round(taxeActuelle * pctHigh / 100) };
}

// Petit utilitaire d'écriture de texte avec retour à la ligne automatique,
// partagé par toutes les pages du document.
function creerEcrivain(doc, margeGauche, largeur) {
  let y = 24;
  return {
    get y() { return y; },
    set y(v) { y = v; },
    ligne(texte, opts = {}) {
      const { taille = 10, style = 'normal', couleur = [30, 30, 25], espace = 6, x = margeGauche } = opts;
      doc.setFont('helvetica', style);
      doc.setFontSize(taille);
      doc.setTextColor(...couleur);
      const morceaux = doc.splitTextToSize(texte, largeur - (x - margeGauche));
      doc.text(morceaux, x, y);
      y += morceaux.length * (taille / 2.6) + espace;
    },
  };
}

function dessinerEnTete(doc, titre, { exemple, sousTitre }) {
  doc.setFillColor(46, 74, 74);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(titre, 20, 10.5);

  let y = 28;
  if (exemple) {
    doc.setTextColor(160, 60, 45);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('EXEMPLE — généré gratuitement, ne constitue pas le document payant final', 20, y);
    y += 10;
  }
  if (sousTitre) {
    doc.setTextColor(90, 95, 88);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(sousTitre, 20, y);
    y += 8;
  }
  return y;
}

function dessinerPiedDePage(doc, texte) {
  doc.setDrawColor(214, 213, 199); doc.line(20, 275, 190, 275);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 114, 105);
  doc.text(doc.splitTextToSize(texte, 170), 20, 280);
}

// --------------------------------------------------------------------------
// Produit 1 : Rapport complet (29€) — le diagnostic seul
// --------------------------------------------------------------------------

function dessinerPageDiagnostic(doc, d, { exemple }) {
  const w = creerEcrivain(doc, 20, 170);
  w.y = dessinerEnTete(doc, exemple ? 'Foncier Juste — Rapport de pré-diagnostic' : 'Foncier Juste — Rapport complet de diagnostic', { exemple });

  w.ligne(`Date : ${new Date().toLocaleDateString('fr-FR')}`, { taille: 9, couleur: [90, 95, 88], espace: 2 });
  w.ligne(`Commune : ${d.commune.commune} (${d.commune.code_postal})  ·  Type de bien : ${d.type}`, { taille: 9, couleur: [90, 95, 88], espace: 8 });

  // Conclusion : une classification, jamais un score sur 100. Le score interne
  // ne peut prendre que huit valeurs distinctes ; l'afficher comme une note
  // suggérerait une précision que la méthode ne permet pas.
  w.ligne('Conclusion', { taille: 14, style: 'bold', espace: 2 });
  const couleurNiveau = d.score >= 40 ? [160, 51, 37] : d.score >= 20 ? [138, 90, 18] : [30, 107, 75];
  const conclusion = d.classifLabel
    || (d.score >= 40 ? 'Vérification fortement recommandée'
        : d.score >= 20 ? 'Vérification recommandée'
        : 'Aucun élément notable détecté');
  w.ligne(conclusion, { taille: 12, style: 'bold', couleur: couleurNiveau, espace: 6 });

  // Base de l'analyse : sans la fiche 6675-M, aucune surface n'a pu être
  // comparée. Le document doit le dire explicitement.
  w.ligne(
    d.avecFiche === false
      ? "Base de l'analyse : informations déclaratives, sans consultation de la fiche d'évaluation 6675-M. Aucune comparaison de surface n'a donc été effectuée."
      : "Base de l'analyse : les chiffres relevés sur votre fiche d'évaluation (formulaire 6675-M), confrontés à la situation actuelle du bien.",
    { taille: 9, couleur: [90, 95, 88], espace: 8 }
  );

  w.ligne('Éléments relevés', { taille: 12, style: 'bold', espace: 3 });
  if (d.anomalies.length) {
    d.anomalies.forEach(a => {
      w.ligne(`• ${a.message}`, { taille: 10, espace: a.confiance ? 2 : 5 });
      if (a.confiance) {
        w.ligne(`Niveau de confiance : ${a.confiance.texte}`, { taille: 8.5, couleur: [90, 95, 88], espace: 5, x: 24 });
      }
    });
  } else {
    w.ligne('Aucune anomalie détectée avec les informations fournies.', { taille: 10, espace: 5 });
  }
  w.y += 2;

  const impact = calculerImpact(d.anomalies, d.taxeActuelle);
  if (impact) {
    w.ligne('Impact potentiel estimé', { taille: 12, style: 'bold', espace: 3 });
    w.ligne(`${impact.eurMin} à ${impact.eurMax} € par an (fourchette indicative, pas un recalcul officiel).`, { taille: 10, espace: 8 });
  }

  w.ligne('Prochaines étapes recommandées', { taille: 12, style: 'bold', espace: 3 });
  [
    "1. Demandez votre fiche d'évaluation (formulaire 6675-M) sur impots.gouv.fr, espace particulier, par messagerie sécurisée.",
    "2. Comparez chaque ligne de la fiche à la réalité actuelle de votre bien (surface, éléments de confort).",
    "3. En cas d'écart confirmé, déposez une réclamation avant le 31 décembre de l'année suivant la mise en recouvrement de l'avis contesté.",
  ].forEach(t => w.ligne(t, { taille: 10, espace: 5 }));

  dessinerPiedDePage(doc,
    "Ce document est un pré-diagnostic indicatif basé sur les informations fournies et des données de marché publiques (DVF, data.gouv.fr). Il ne constitue ni un conseil fiscal personnalisé, ni une garantie de résultat, ni un document officiel de l'administration fiscale."
  );
}

function genererRapportPDF(d, opts = {}) {
  const exemple = opts.exemple !== false;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  dessinerPageDiagnostic(doc, d, { exemple });
  doc.save(exemple ? `foncier-juste-exemple-${d.commune.code_commune}.pdf` : `foncier-juste-rapport-${d.commune.code_commune}.pdf`);
}

// --------------------------------------------------------------------------
// Aperçu gratuit — montre la STRUCTURE du livrable, jamais son contenu.
// Règle : tout ce qui constitue la valeur payante (détail des écarts, base
// légale, montant estimé, courrier) est masqué. Ne jamais « enrichir » cet
// aperçu sans se demander s'il redevient un substitut gratuit du produit.
// --------------------------------------------------------------------------

function genererApercuPDF(d) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = creerEcrivain(doc, 20, 170);
  w.y = dessinerEnTete(doc, 'Foncier Juste — Aperçu du dossier', {
    sousTitre: 'Document de démonstration : les conclusions et le courrier sont volontairement masqués.',
  });

  w.y += 4;
  w.ligne(`Bien étudié : ${d.commune.commune} (${d.commune.code_postal}) · ${d.type}`, { taille: 10, couleur: [90, 95, 88], espace: 10 });

  const masque = (titre, lignes) => {
    w.ligne(titre, { taille: 12, style: 'bold', espace: 4 });
    lignes.forEach(() => {
      doc.setFillColor(226, 226, 216);
      doc.roundedRect(20, w.y - 3.5, 120 + Math.random() * 45, 4, 1, 1, 'F');
      w.y += 8;
    });
    w.y += 4;
  };

  w.ligne(`Écarts relevés : ${d.anomalies.filter(a => a.gravite !== 'info').length}`, { taille: 11, style: 'bold', espace: 6 });
  masque('Détail de chaque écart et base légale applicable', [1, 2, 3]);
  masque('Montant potentiellement récupérable', [1, 2]);
  masque('Votre lettre de réclamation, rédigée et référencée', [1, 2, 3, 4, 5]);
  masque('Pièces à joindre et délais à respecter', [1, 2, 3]);

  w.y += 2;
  doc.setDrawColor(147, 103, 46);
  doc.setFillColor(241, 229, 205);
  doc.roundedRect(20, w.y - 4, 170, 22, 2, 2, 'FD');
  doc.setTextColor(120, 85, 35);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Le dossier complet contient ces quatre sections remplies pour votre bien.', 25, w.y + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Votre diagnostic reste consultable gratuitement sur le site, sans aucun engagement.', 25, w.y + 10);

  dessinerPiedDePage(doc,
    "Aperçu sans valeur juridique, fourni à titre de démonstration de format. Les analyses, montants et courriers ne figurent que dans le document complet."
  );
  doc.save(`foncier-juste-apercu.pdf`);
}

// --------------------------------------------------------------------------
// Produit 2 : Dossier complet (49€) — diagnostic + lettre + pièces
// --------------------------------------------------------------------------

function piecesAJoindre(anomalies) {
  const pieces = [
    "Copie de l'avis de taxe foncière contesté",
    "Copie de la fiche d'évaluation (formulaire 6675-M), obtenue sur impots.gouv.fr",
  ];
  if (anomalies.some(a => a.code === 'surface_surevaluee')) {
    pieces.push("Justificatif de la surface réelle : plan coté, acte de vente, ou diagnostic de surface (loi Carrez/Boutin) si disponible");
  }
  if (anomalies.some(a => a.code === 'elements_confort_obsoletes')) {
    pieces.push("Justificatif de la disparition ou de l'absence de l'élément contesté (photo datée, facture de démolition, attestation sur l'honneur)");
  }
  pieces.push("Le présent rapport de diagnostic Foncier Juste, à titre d'élément d'appui");
  return pieces;
}

function dessinerLettreReclamation(doc, d) {
  doc.addPage();
  const w = creerEcrivain(doc, 20, 170);
  w.y = dessinerEnTete(doc, 'Modèle de lettre de réclamation', {
    sousTitre: 'À recopier sur papier libre ou à transmettre depuis votre espace impots.gouv.fr, une fois les crochets complétés.',
  });

  w.y += 4;
  w.ligne('[Vos NOM Prénom]', { taille: 10 });
  w.ligne('[Votre adresse complète]', { taille: 10 });
  w.ligne('[Votre numéro fiscal — en haut de votre avis d\'imposition]', { taille: 10, espace: 10 });

  w.ligne('À l\'attention du Service des Impôts Fonciers', { taille: 10, style: 'bold' });
  w.ligne(`[Adresse du service — indiquée sur votre avis de taxe foncière, ou via impots.gouv.fr > Contact]`, { taille: 10, espace: 10 });

  w.ligne(`Fait à [Ville], le ${new Date().toLocaleDateString('fr-FR')}`, { taille: 10, espace: 8 });

  w.ligne(
    `Objet : Réclamation contentieuse relative à la taxe foncière ${new Date().getFullYear()} — ` +
    `[référence de l'avis contesté] — Article L.190 du Livre des procédures fiscales`,
    { taille: 10, style: 'bold', espace: 8 }
  );

  w.ligne('Madame, Monsieur,', { taille: 10, espace: 6 });

  w.ligne(
    `Je vous prie de bien vouloir réexaminer le calcul de la taxe foncière relative à mon bien situé ` +
    `[adresse complète du bien], commune de ${d.commune.commune} (${d.commune.code_postal}), ` +
    `au titre de l'année ${new Date().getFullYear()}.`,
    { taille: 10, espace: 6 }
  );

  w.ligne("En effet, la fiche d'évaluation de ce bien présente, à ma connaissance, la ou les anomalies suivantes :", { taille: 10, espace: 4 });
  d.anomalies
    .filter(a => a.gravite !== 'info')
    .forEach(a => w.ligne(`— ${a.message}`, { taille: 10, espace: 4 }));
  w.y += 2;

  w.ligne(
    "Ces éléments me semblent conduire à une surévaluation de la valeur locative cadastrale servant de base au calcul " +
    "de ma taxe foncière, et donc à une imposition supérieure à ce qu'elle devrait être.",
    { taille: 10, espace: 6 }
  );

  w.ligne(
    "Je sollicite en conséquence, sur le fondement de l'article L.190 du Livre des procédures fiscales, la " +
    "rectification de la valeur locative cadastrale de mon bien ainsi que le dégrèvement correspondant, pour l'année " +
    "en cours et, le cas échéant, pour les années antérieures non prescrites.",
    { taille: 10, espace: 6 }
  );

  w.ligne("Vous trouverez en pièces jointes les justificatifs suivants :", { taille: 10, espace: 4 });
  piecesAJoindre(d.anomalies).forEach(p => w.ligne(`— ${p}`, { taille: 10, espace: 4 }));
  w.y += 2;

  w.ligne(
    "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    { taille: 10, espace: 10 }
  );
  w.ligne('[Signature]', { taille: 10 });

  dessinerPiedDePage(doc,
    "Modèle indicatif, à adapter à votre situation exacte. Vérifiez les informations avant envoi (adresse du service, " +
    "référence de l'avis, pièces jointes). Foncier Juste n'est pas un cabinet d'avocats et ce document ne constitue pas " +
    "une consultation juridique personnalisée."
  );
}

function dessinerPagePratique(doc) {
  doc.addPage();
  const w = creerEcrivain(doc, 20, 170);
  w.y = dessinerEnTete(doc, 'Informations pratiques', {});

  w.ligne('Où envoyer votre réclamation', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Par courrier à l'adresse du Service des Impôts Fonciers indiquée sur votre avis de taxe foncière, ou directement " +
    "en ligne depuis votre espace particulier sur impots.gouv.fr (rubrique « Messagerie sécurisée » > « Écrire » > " +
    "« Je signale une erreur dans le calcul de mon impôt »).",
    { taille: 10, espace: 8 }
  );

  w.ligne('Délai pour réclamer', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Avant le 31 décembre de l'année suivant celle de la mise en recouvrement de l'avis contesté (article R*196-2 du " +
    "Livre des procédures fiscales). La réclamation est gratuite et ne nécessite pas d'avocat (article R*190-1 du LPF).",
    { taille: 10, espace: 8 }
  );

  w.ligne("Ce qui se passe après l'envoi", { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "L'administration dispose en principe de 6 mois pour répondre (délai prolongeable de 3 mois si elle vous en informe). " +
    "Passé ce délai sans réponse, le silence vaut décision implicite de rejet — vous pouvez alors saisir le tribunal " +
    "administratif. En cas de rejet explicite et motivé, vous disposez de 2 mois à compter de sa notification pour " +
    "contester devant le tribunal administratif.",
    { taille: 10, espace: 8 }
  );

  w.ligne('Conserver une preuve d\'envoi', { taille: 12, style: 'bold', espace: 4 });
  w.ligne(
    "Privilégiez l'envoi via votre espace impots.gouv.fr (horodaté automatiquement) ou une lettre recommandée avec " +
    "accusé de réception si vous envoyez par courrier postal.",
    { taille: 10, espace: 8 }
  );

  dessinerPiedDePage(doc,
    "Informations données à titre indicatif d'après le Livre des procédures fiscales en vigueur au moment de la " +
    "génération de ce document. Vérifiez leur actualité en cas de doute sur impots.gouv.fr."
  );
}

function genererDossierPDF(d, opts = {}) {
  const exemple = opts.exemple !== false;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  dessinerPageDiagnostic(doc, d, { exemple });
  dessinerLettreReclamation(doc, d);
  dessinerPagePratique(doc);
  doc.save(exemple ? `foncier-juste-dossier-exemple-${d.commune.code_commune}.pdf` : `foncier-juste-dossier-${d.commune.code_commune}.pdf`);
}
