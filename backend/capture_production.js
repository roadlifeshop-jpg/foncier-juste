/**
 * Capture des résultats du MOTEUR DE PRODUCTION, pour le test de parité
 * `backend/test_parite_moteurs.py`.
 *
 * Ce script ne réimplémente rien : il pilote la vraie page (web/index.html)
 * comme le ferait un visiteur — il remplit le formulaire, enchaîne les trois
 * étapes, puis lit l'objet `dernierDiagnostic` produit par `moteur.js`. C'est
 * le seul moyen d'être certain qu'on teste le code réellement servi, et non
 * une copie qui pourrait diverger sans qu'on s'en aperçoive. Piloter le DOM
 * vérifie en outre la correspondance entre les questions posées et l'entrée
 * réellement transmise au moteur.
 *
 * Mode d'emploi
 * -------------
 *   1. servir le dossier web/ :        python3 -m http.server 8899
 *   2. ouvrir http://localhost:8899/index.html dans un navigateur
 *   3. coller ce fichier dans la console, puis :
 *        copy(JSON.stringify(await capturerParite(CAS), null, 2))
 *      où CAS est le contenu de backend/cas_parite.json
 *   4. enregistrer le résultat dans backend/parite_production.json
 *
 * La sortie est normalisée exactement comme `resultat_normalise()` côté Python.
 */
async function empreinteTextes(anomalies) {
  const textes = [
    anomalies.map((a) => a.figure),
    anomalies.map((a) => a.titre),
    anomalies.map((a) => a.vosReponses),
    anomalies.map((a) => a.calcul),
    anomalies.map((a) => a.message),
    anomalies.map((a) => a.confiance.texte),
    anomalies.map((a) => a.confiance.origine),
  ];
  const octets = new TextEncoder().encode(JSON.stringify(textes));
  const hash = await crypto.subtle.digest('SHA-256', octets);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function capturerParite(cas) {
  const $ = (id) => document.getElementById(id);
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const resultats = [];

  for (const c of cas) {
    // --- Étape 1 : commune et type de bien
    $('start-btn').click();
    $('commune').value = c.label_commune;
    $('type_local').value = c.type_local;
    $('next-btn').click();
    await attendre(120);

    // --- Étape 2 : fiche 6675-M, surfaces, source de la surface
    const radio = c.a_la_fiche ? $('fiche-oui') : $('fiche-non');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    $('surf_fiche').value = c.surface_fiche == null ? '' : c.surface_fiche;
    $('surf_reelle').value = c.surface_reelle;
    $('certitude').value = c.source_surface;
    $('next-btn').click();
    await attendre(60);

    // --- Étape 3 : éléments de confort, puis calcul
    document.querySelectorAll('#confort-factures input').forEach((i) => {
      i.checked = c.factures.includes(i.value);
    });
    document.querySelectorAll('#confort-existants input').forEach((i) => {
      i.checked = c.existants.includes(i.value);
    });
    const avant = dernierDiagnostic;
    $('next-btn').click();
    for (let i = 0; i < 100 && dernierDiagnostic === avant; i++) await attendre(50);

    const d = dernierDiagnostic;

    // Prix médian : recalculé avec la fonction même du moteur, car il n'est pas
    // conservé dans `dernierDiagnostic` (seul son libellé formaté l'est).
    let prixMedian = null;
    try {
      const stats = await statsPourDepartement(c.code_dept);
      const comps = comparablesAgreges(stats, c.code_commune, c.type_local, c.surface_reelle);
      if (comps && comps.n >= 5) prixMedian = comps.prixMedian;
    } catch (_) { /* département sans données */ }

    resultats.push({
      id: c.id,
      classification: d.classif.cle,
      classification_label: d.classif.label,
      score: d.score,
      vente_autorisee: venteAutorisee(d.anomalies),
      n_signaux_reels: d.anomalies.filter((a) => a.gravite !== 'info').length,
      codes: d.anomalies.map((a) => a.code),
      gravites: d.anomalies.map((a) => a.gravite),
      confiances: d.anomalies.map((a) => a.confiance.niveau),
      n_comparables: d.n,
      // Empreinte des textes affichés à l'utilisateur (figures, titres, « ce
      // que vous avez indiqué », « ce qui en est calculé », messages). On
      // compare une empreinte plutôt que 30 Ko de prose : une divergence de
      // formulation, même d'un caractère, fait échouer le test, et la capture
      // se rejoue pour voir le détail.
      empreinte: await empreinteTextes(d.anomalies),
      prix_median: prixMedian === null ? null : Math.round(prixMedian * 1e6) / 1e6,
    });

    $('restart-btn').click();
    await attendre(60);
  }
  return resultats;
}
