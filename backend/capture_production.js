/**
 * Capture des résultats du MOTEUR DE PRODUCTION, pour le test de parité
 * `backend/test_parite_moteurs.py`.
 *
 * Ce script ne réimplémente rien : il pilote la vraie page (web/index.html)
 * comme le ferait un visiteur — il remplit le formulaire, enchaîne les quatre
 * étapes, puis lit l'objet `dernierDiagnostic` produit par le moteur. C'est le
 * seul moyen d'être certain qu'on teste le code réellement servi, et non une
 * copie qui pourrait diverger sans qu'on s'en aperçoive.
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
async function capturerParite(cas) {
  const $ = (id) => document.getElementById(id);
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const resultats = [];

  for (const c of cas) {
    // --- Étape 1 : commune et type de bien
    document.getElementById('start-btn').click();
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

    // --- Étape 3 : éléments de confort
    document.querySelectorAll('#confort-factures input').forEach((i) => {
      i.checked = c.factures.includes(i.value);
    });
    document.querySelectorAll('#confort-existants input').forEach((i) => {
      i.checked = c.existants.includes(i.value);
    });
    $('next-btn').click();
    await attendre(60);

    // --- Étape 4 : montant (facultatif), puis calcul
    $('taxe_actuelle').value = c.taxe == null ? '' : c.taxe;
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

    const impact = calculerImpact(d.anomalies, d.taxeActuelle);
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
      figures: d.anomalies.map((a) => a.figure),
      messages: d.anomalies.map((a) => a.message),
      n_comparables: d.n,
      prix_median: prixMedian === null ? null : Math.round(prixMedian * 1e6) / 1e6,
      impact_min: impact ? impact.eurMin : null,
      impact_max: impact ? impact.eurMax : null,
    });

    $('restart-btn').click();
    await attendre(60);
  }
  return resultats;
}
