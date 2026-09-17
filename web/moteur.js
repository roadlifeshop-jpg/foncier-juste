/* ==========================================================================
   Foncier·Juste — moteur de pré-diagnostic (production)
   --------------------------------------------------------------------------
   Ce fichier est chargé par index.html (pré-diagnostic) ET par succes.html
   (régénération d'un document acheté). C'est la raison d'être de son
   extraction : un document payé doit pouvoir être reconstruit à partir des
   seules réponses, sur n'importe quel appareil, sans dépendre du navigateur
   d'origine.

   SOURCE DE VÉRITÉ : backend/diagnostic_engine.py applique EXACTEMENT les
   mêmes règles. Les points à synchroniser portent le marqueur « PARITÉ ».
   Toute modification ici doit être répercutée là-bas, puis vérifiée par
   backend/test_parite_moteurs.py.

   Le moteur ne lit jamais le DOM : il prend un objet d'entrée et rend un
   résultat. C'est ce qui permet de le rejouer ailleurs.
   ========================================================================== */

/* Forme de l'entrée — volontairement compacte, car c'est aussi ce qui est
   transmis à Stripe pour permettre la redélivrance du document acheté :
     cc : code INSEE de la commune      cn : nom de la commune
     cp : code postal                    cd : code département
     t  : "Maison" | "Appartement"       f  : 1 si la fiche 6675-M est en main
     sf : surface réelle lue sur la fiche (m²), null sans fiche
     sr : surface habitable mesurée aujourd'hui (m²)
     ss : "mesuree" | "acte" | "estimee"
     ef : éléments portés à l'évaluation  ee : éléments existants aujourd'hui  */

const BUCKET = 20; // PARITÉ : SURFACE_BUCKET_SIZE côté Python

// PARITÉ : seuils du moteur. EN COURS DE VALIDATION PAR LE TEST T1.
// Ne pas modifier sans constat étayé sur de vraies fiches 6675-M.
const SURFACE_ECART_SEUIL_M2 = 5;
const SURFACE_ECART_SEUIL_PCT = 5;
const SURFACE_GRAVITE_HAUTE_PCT = 15;

// Bornes de saisie. Ce ne sont PAS des seuils métier : ce sont exactement les
// bornes de filtrage du jeu de données DVF (backend/build_dataset.py), donc
// le domaine sur lequel le produit sait travailler. Au-delà, il n'y a ni
// comparable ni sens.
const SURFACE_MIN_M2 = 8;
const SURFACE_MAX_M2 = 400;

const deptStatsCache = {};

function statsPourDepartement(codeDept){
  if (!deptStatsCache[codeDept]){
    deptStatsCache[codeDept] = fetch(`market_stats/${codeDept}.json`).then(r => {
      if (!r.ok) throw new Error('département introuvable');
      return r.json();
    });
  }
  return deptStatsCache[codeDept];
}

/* PARITÉ : comparables_agreges() côté Python. */
function comparablesAgreges(stats, codeCommune, type, surface){
  const bucketCible = Math.floor(surface / BUCKET) * BUCKET;
  const memeCommuneType = stats.filter(s => s.code_commune === codeCommune && s.type_local === type);
  for (let rayon = 0; rayon <= 3; rayon++){
    const retenus = memeCommuneType.filter(s => Math.abs(s.surface_bucket_min - bucketCible) <= rayon * BUCKET);
    const n = retenus.reduce((s, r) => s + r.n, 0);
    if (n >= 5 || rayon === 3){
      if (!retenus.length) return null;
      return { n, prixMedian: retenus.reduce((s, r) => s + r.prix_m2_median * r.n, 0) / n };
    }
  }
  return null;
}

/* Confiance accordée à la surface mesurée, selon la source déclarée.
   PARITÉ : CONFIANCE_SURFACE côté Python.
   Une incertitude ne crée jamais d'anomalie : elle dégrade la confiance. */
// Ces libellés décrivent la SOURCE que l'utilisateur déclare, pas la qualité
// de ce qu'il a fait. Nous n'avons aucun moyen de contrôler un relevé : dire
// qu'une mesure est fiable parce que quelqu'un déclare l'avoir faite serait
// une affirmation que nous ne pouvons pas soutenir.
const CONFIANCE_SURFACE = {
  mesuree: {
    niveau: 'elevee',
    texte: 'Vous déclarez avoir mesuré cette surface vous-même. C’est la source la plus directe, mais nous ne pouvons pas contrôler votre relevé : ce constat vaut ce que vaut la mesure.',
    origine: 'Votre relevé, tel que vous nous l’avez communiqué, confronté au chiffre que vous avez lu sur votre fiche.',
  },
  acte: {
    niveau: 'moyenne',
    texte: 'Vous déclarez tenir cette surface d’un acte de vente ou d’un diagnostic. Une surface loi Carrez ne retient pas exactement les mêmes espaces que l’évaluation fiscale : l’écart reste exploitable, mais devra être confirmé par une mesure.',
    origine: 'Un document que vous détenez, dont la définition de surface diffère de celle de l’administration.',
  },
  estimee: {
    niveau: 'faible',
    texte: 'Vous déclarez avoir estimé cette surface de mémoire. Ce constat ne suffit pas à fonder une réclamation : mesurez avant d’aller plus loin.',
    origine: 'Votre estimation. Aucun document ne l’appuie pour l’instant.',
  },
};

const CONFIANCE_CONFORT_AVEC_FICHE = {
  niveau: 'elevee',
  texte: 'Vous déclarez avoir lu cette information sur votre fiche d’évaluation. C’est le document qui fait foi, mais nous n’y avons pas accès : vérifiez votre relevé avant de vous en prévaloir.',
  origine: 'Votre fiche 6675-M, telle que vous l’avez lue.',
};
const CONFIANCE_CONFORT_SANS_FICHE = {
  niveau: 'faible',
  texte: 'Vous avez répondu de mémoire, sans consulter votre fiche. Ce que l’administration prend réellement en compte n’y figure pas ailleurs : tant que vous ne l’avez pas lue, ce constat reste une hypothèse.',
  origine: 'Votre déclaration seule.',
};
const CONFIANCE_MARCHE = {
  niveau: 'contexte',
  texte: 'Donnée publique, que vous pouvez verser à un dossier pour situer votre bien. Ce n’est pas un motif de réclamation.',
  origine: 'Le fichier public DVF des ventes réellement enregistrées en 2024.',
};

/* --------------------------------------------------------------------------
   Règle de vente
   --------------------------------------------------------------------------
   Trois conditions cumulatives :
     1. un écart réel a été relevé (gravité haute ou moyenne) ;
     2. il repose sur une donnée assez fiable pour construire un dossier —
        ce qui implique la fiche 6675-M, que la réclamation exige de produire ;
     3. il ne s'agit pas UNIQUEMENT de l'écart de surface.

   La troisième condition est une décision produit datée du 16/09/2026 et
   volontairement conservatrice. Tant que le test T1 n'a pas établi, sur de
   vraies fiches, que la « surface réelle » de la fiche et la surface
   habitable mesurée recouvrent bien le même périmètre, un écart de surface
   peut être un artefact de la question posée, pas une anomalie. Il reste
   affiché et expliqué — il ne déclenche simplement aucune vente.

   À LEVER après T1 si la comparaison est validée : retirer le filtre sur
   `surface_surevaluee` ci-dessous, et le répercuter côté Python.
   -------------------------------------------------------------------------- */
const CODES_NE_DECLENCHANT_PAS_LA_VENTE = ['surface_surevaluee'];

function venteAutorisee(anomalies){
  return anomalies.some(a =>
    (a.gravite === 'haute' || a.gravite === 'moyenne') &&
    a.confiance && (a.confiance.niveau === 'elevee' || a.confiance.niveau === 'moyenne') &&
    !CODES_NE_DECLENCHANT_PAS_LA_VENTE.includes(a.code)
  );
}

/* PARITÉ : classifier() côté Python. Le score reste calculé en interne —
   référence numérique partagée entre les deux moteurs — mais n'est jamais
   affiché : il ne peut prendre que huit valeurs distinctes. */
function classifier(score){
  if (score >= 40) return { cle:'fort',   ton:'t-alert', label:'Vérification fortement recommandée' };
  if (score >= 20) return { cle:'modere', ton:'t-warn',  label:'Vérification recommandée' };
  return { cle:'aucun', ton:'t-ok', label:'Aucun élément notable détecté' };
}

/* --------------------------------------------------------------------------
   Calcul complet. `stats` est la liste d'agrégats du département ; passer
   null si elle n'a pas pu être chargée — le diagnostic se poursuit alors
   sans repère de marché plutôt que d'échouer.
   -------------------------------------------------------------------------- */
function calculerDiagnostic(e, stats){
  const anomalies = [];
  const surfFiche = Number(e.sf) || 0;
  const surfReelle = Number(e.sr) || 0;

  let comps = null;
  if (stats && surfReelle > 0){
    try { comps = comparablesAgreges(stats, e.cc, e.t, surfReelle); } catch (_) { comps = null; }
  }

  // --- Règle 1 : surface. Évaluée UNIQUEMENT si la fiche fournit le chiffre
  // de référence : sans elle, aucune surface administrative n'est connue.
  if (e.f && surfFiche > 0 && surfReelle > 0){
    const ecart = surfFiche - surfReelle;
    const ecartPct = ecart / surfReelle * 100;
    if (ecart > SURFACE_ECART_SEUIL_M2 && ecartPct > SURFACE_ECART_SEUIL_PCT){
      const conf = CONFIANCE_SURFACE[e.ss] || CONFIANCE_SURFACE.estimee;
      anomalies.push({
        code: 'surface_surevaluee',
        gravite: ecartPct > SURFACE_GRAVITE_HAUTE_PCT ? 'haute' : 'moyenne',
        kind: 'Surface',
        titre: 'Les deux surfaces que vous avez saisies ne concordent pas',
        figure: `${ecart.toFixed(0)} m² · ${ecartPct.toFixed(0)} % de la surface mesurée`,
        vosReponses: `Vous avez relevé ${surfFiche.toFixed(0)} m² sur votre fiche d'évaluation et mesuré ${surfReelle.toFixed(0)} m² aujourd'hui.`,
        calcul: `Différence : ${ecart.toFixed(0)} m², soit ${ecartPct.toFixed(0)} % de la surface mesurée.`,
        aVerifier: "Trois explications au moins sont possibles, et une seule serait une anomalie : les deux chiffres ne couvrent peut-être pas les mêmes pièces, la fiche n'a peut-être pas été mise à jour après des travaux, ou la mesure est approximative. Commencez par vérifier lesquelles des pièces de votre logement entrent dans chacun des deux chiffres.",
        confiance: conf,
        message: `La surface réelle relevée sur la fiche (${surfFiche.toFixed(0)} m²) dépasse de ${ecart.toFixed(0)} m² (${ecartPct.toFixed(0)} %) la surface habitable mesurée déclarée (${surfReelle.toFixed(0)} m²).`,
      });
    }
  }

  // --- Règle 2 : éléments de confort. Évaluable dans les deux modes, mais la
  // confiance chute sans la fiche : de mémoire, on ne sait pas ce qui est
  // réellement pris en compte.
  const ef = e.ef || [], ee = e.ee || [];
  const obsoletes = ef.filter(x => !ee.includes(x));
  if (obsoletes.length){
    const libelles = obsoletes.map(o => o.charAt(0).toUpperCase() + o.slice(1));
    anomalies.push({
      code: 'elements_confort_obsoletes',
      gravite: obsoletes.length > 1 ? 'haute' : 'moyenne',
      kind: 'Éléments de confort',
      titre: obsoletes.length > 1
        ? 'Plusieurs éléments que vous avez déclarés n’existent plus'
        : 'Un élément que vous avez déclaré n’existe plus',
      figure: libelles.join(' · '),
      // PARITÉ : mêmes textes côté Python, conditionnés de la même façon.
      // Sans la fiche, l'utilisateur n'a PAS vu ce que l'administration retient :
      // écrire que l'élément « entre dans son évaluation » ou que ses réponses
      // « se contredisent » affirmerait ce qu'il ne peut pas savoir. On formule
      // alors une hypothèse à confirmer, et on dit comment la confirmer.
      vosReponses: e.f
        ? (obsoletes.length > 1
            ? `Vous avez indiqué que ces éléments entrent dans votre évaluation alors qu'ils n’existent plus aujourd'hui : ${obsoletes.join(', ')}.`
            : `Vous avez indiqué que cet élément entre dans votre évaluation alors qu'il n’existe plus aujourd'hui : ${obsoletes.join(', ')}.`)
        : (obsoletes.length > 1
            ? `Vous avez indiqué de mémoire, sans consulter votre fiche, que ces éléments entrent dans votre évaluation alors qu'ils n’existent plus aujourd'hui : ${obsoletes.join(', ')}.`
            : `Vous avez indiqué de mémoire, sans consulter votre fiche, que cet élément entre dans votre évaluation alors qu'il n’existe plus aujourd'hui : ${obsoletes.join(', ')}.`),
      calcul: e.f
        ? (obsoletes.length > 1
            ? 'Vos deux réponses se contredisent : ces éléments sont portés à votre évaluation mais n’existent plus.'
            : 'Vos deux réponses se contredisent : cet élément est porté à votre évaluation mais n’existe plus.')
        : (obsoletes.length > 1
            ? 'Hypothèse à confirmer, et non contradiction établie : SI ces éléments figurent sur votre fiche d’évaluation, ils entrent encore dans le calcul alors qu’ils n’existent plus. Seule la fiche permet de le savoir — demandez-la, c’est gratuit.'
            : 'Hypothèse à confirmer, et non contradiction établie : SI cet élément figure sur votre fiche d’évaluation, il entre encore dans le calcul alors qu’il n’existe plus. Seule la fiche permet de le savoir — demandez-la, c’est gratuit.'),
      aVerifier: "Aucune mise à jour n'est automatique : ni une démolition, ni le comblement d'une piscine ne sont signalés d'office aux services fiscaux. Reste à confirmer, sur votre fiche, que l'élément y figure bien — et à pouvoir dater sa disparition.",
      confiance: e.f ? CONFIANCE_CONFORT_AVEC_FICHE : CONFIANCE_CONFORT_SANS_FICHE,
      message: obsoletes.length > 1
        ? `Les éléments suivants sont pris en compte dans mon évaluation alors qu'ils n'existent plus : ${obsoletes.join(', ')}.`
        : `L'élément suivant est pris en compte dans mon évaluation alors qu'il n'existe plus : ${obsoletes.join(', ')}.`,
    });
  }

  // --- Contexte de marché : jamais une preuve, et aucun chiffre publié sur
  // un échantillon insuffisant.
  if (comps && comps.n >= 5){
    anomalies.push({
      code: 'contexte_marche',
      gravite: 'info',
      kind: 'Contexte de marché',
      titre: `${comps.n} ventes comparables à ${e.cn}`,
      figure: `${comps.prixMedian.toFixed(0)} €/m² médian`,
      vosReponses: `Vous avez indiqué un bien de type ${e.t.toLowerCase()} d'environ ${surfReelle.toFixed(0)} m² à ${e.cn}.`,
      calcul: `Prix médian de ${comps.n} ventes réellement enregistrées en 2024 pour des biens de même type et de surface voisine.`,
      aVerifier: "Rien, du point de vue de votre taxe. La valeur locative cadastrale repose sur des valeurs de 1970 revalorisées, pas sur les prix actuels : ce chiffre situe votre bien dans son marché, il ne dit pas si votre imposition est juste.",
      confiance: CONFIANCE_MARCHE,
      message: `Sur ${comps.n} transactions réelles comparables à ${e.cn}, le prix médian observé est de ${comps.prixMedian.toFixed(0)} €/m². Repère utile pour documenter une réclamation, pas une preuve à lui seul.`,
    });
  }

  // PARITÉ : poids et plafond identiques côté Python.
  const graviteScore = { haute: 40, moyenne: 20, info: 5 };
  const score = Math.min(100, anomalies.reduce((s, a) => s + graviteScore[a.gravite], 0));
  const classif = classifier(score);

  return {
    entree: e,
    score,
    niveau: score >= 40 ? 'élevé' : score >= 20 ? 'moyen' : 'faible',
    classif,
    classifLabel: classif.label,
    anomalies,
    n: comps ? comps.n : 0,
    vente: venteAutorisee(anomalies),
    // Champs consommés par rapport.js.
    commune: { commune: e.cn, code_postal: e.cp, code_commune: e.cc },
    type: e.t,
    avecFiche: !!e.f,
    surfFiche,
    surfReelle,
    sourceSurface: e.ss,
  };
}

/* Recalcule un diagnostic à partir des seules réponses — utilisé par
   succes.html pour reconstruire un document acheté. */
async function rejouerDiagnostic(entree){
  let stats = null;
  try { stats = await statsPourDepartement(entree.cd); } catch (_) { /* sans repère de marché */ }
  return calculerDiagnostic(entree, stats);
}
