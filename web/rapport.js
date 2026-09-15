// Génération du rapport PDF — partagée entre l'aperçu gratuit (index.html,
// marqué "EXEMPLE") et le vrai rapport livré après paiement (succes.html).
// Nécessite jsPDF chargé sur la page (window.jspdf).

function calculerImpact(anomalies, taxeActuelle) {
  const hasHaute = anomalies.some(a => a.gravite === 'haute');
  const hasMoyenne = anomalies.some(a => a.gravite === 'moyenne');
  if (!taxeActuelle || (!hasHaute && !hasMoyenne)) return null;
  const [pctLow, pctHigh] = hasHaute ? [8, 20] : [3, 10];
  return { eurMin: Math.round(taxeActuelle * pctLow / 100), eurMax: Math.round(taxeActuelle * pctHigh / 100) };
}

function genererRapportPDF(d, opts = {}) {
  const exemple = opts.exemple !== false; // par défaut : exemple, sauf appel explicite {exemple:false}
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marge = 20;
  let y = 24;
  const largeur = 210 - marge * 2;

  const ligne = (texte, opts2 = {}) => {
    const { taille = 10, style = 'normal', couleur = [30, 30, 25], espace = 6 } = opts2;
    doc.setFont('helvetica', style);
    doc.setFontSize(taille);
    doc.setTextColor(...couleur);
    const morceaux = doc.splitTextToSize(texte, largeur);
    doc.text(morceaux, marge, y);
    y += morceaux.length * (taille / 2.6) + espace;
  };

  // En-tête
  doc.setFillColor(46, 74, 74);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(
    exemple ? 'Foncier Juste — Rapport de pré-diagnostic' : 'Foncier Juste — Rapport complet de diagnostic',
    marge, 10.5
  );
  y = 28;

  if (exemple) {
    doc.setTextColor(160, 60, 45);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('EXEMPLE — généré gratuitement, ne constitue pas le rapport payant final', marge, y);
    y += 10;
  }

  ligne(`Date : ${new Date().toLocaleDateString('fr-FR')}`, { taille: 9, couleur: [90, 95, 88], espace: 2 });
  ligne(`Commune : ${d.commune.commune} (${d.commune.code_postal})  ·  Type de bien : ${d.type}`, { taille: 9, couleur: [90, 95, 88], espace: 8 });

  ligne('Niveau de vigilance', { taille: 14, style: 'bold', espace: 2 });
  const couleurNiveau = d.score >= 40 ? [156, 59, 46] : d.score >= 20 ? [147, 103, 46] : [47, 107, 74];
  ligne(`${d.score} / 100 — signal ${d.niveau}`, { taille: 12, style: 'bold', couleur: couleurNiveau, espace: 8 });

  ligne('Éléments relevés', { taille: 12, style: 'bold', espace: 3 });
  if (d.anomalies.length) {
    d.anomalies.forEach(a => ligne(`• ${a.message}`, { taille: 10, espace: 5 }));
  } else {
    ligne('Aucune anomalie détectée avec les informations fournies.', { taille: 10, espace: 5 });
  }
  y += 2;

  const impact = calculerImpact(d.anomalies, d.taxeActuelle);
  if (impact) {
    ligne('Impact potentiel estimé', { taille: 12, style: 'bold', espace: 3 });
    ligne(`${impact.eurMin} à ${impact.eurMax} € par an (fourchette indicative, pas un recalcul officiel).`, { taille: 10, espace: 8 });
  }

  ligne('Prochaines étapes recommandées', { taille: 12, style: 'bold', espace: 3 });
  [
    "1. Demandez votre fiche d'évaluation (formulaire 6675-M) sur impots.gouv.fr, espace particulier, par messagerie sécurisée.",
    "2. Comparez chaque ligne de la fiche à la réalité actuelle de votre bien (surface, éléments de confort).",
    "3. En cas d'écart confirmé, déposez une réclamation avant le 31 décembre de l'année suivant la mise en recouvrement de l'avis contesté.",
  ].forEach(t => ligne(t, { taille: 10, espace: 5 }));

  y = 275;
  doc.setDrawColor(214, 213, 199); doc.line(marge, y, 210 - marge, y);
  y += 5;
  ligne(
    "Ce document est un pré-diagnostic indicatif basé sur les informations fournies et des données de marché publiques (DVF, data.gouv.fr). Il ne constitue ni un conseil fiscal personnalisé, ni une garantie de résultat, ni un document officiel de l'administration fiscale.",
    { taille: 7.5, couleur: [110, 114, 105], espace: 0 }
  );

  const nomFichier = exemple
    ? `foncier-juste-exemple-${d.commune.code_commune}.pdf`
    : `foncier-juste-rapport-${d.commune.code_commune}.pdf`;
  doc.save(nomFichier);
}
