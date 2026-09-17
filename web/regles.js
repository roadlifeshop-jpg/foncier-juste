/* ==========================================================================
   REGISTRE DES RÈGLES
   --------------------------------------------------------------------------
   Une seule source de vérité pour tout ce que le site affirme du droit.
   Les outils n'écrivent jamais une règle en dur : ils citent une clé d'ici,
   et le rendu de la source est produit par `citer()`.

   Chaque entrée porte obligatoirement :
     titre        — ce que la règle dit, en une phrase
     texte        — la référence exacte (article, décret)
     source       — {nom, url} d'une source officielle, de préférence
                    Légifrance, economie.gouv.fr, service-public.fr ou EUR-Lex
     statut       — 'en vigueur' | 'reforme-attendue' | 'non-transpose'
     applicable   — date d'entrée en application (ISO) ou null si ancienne
     verifiee     — date de la dernière vérification sur la source (ISO)
     concerne     — qui peut s'en prévaloir
     exceptions   — les principales limites, en clair

   RÈGLE DE MAINTENANCE : ne jamais afficher une règle dont `statut` vaut
   autre chose que 'en vigueur' comme si elle s'appliquait. Les outils
   l'affichent alors dans un bloc distinct, au futur.
   ========================================================================== */

const REGLES = {

  /* ------------------------------------------------------------------ */
  /* Achats, garanties, réparation                                       */
  /* ------------------------------------------------------------------ */

  'conformite-duree': {
    titre: "Le vendeur professionnel répond des défauts de conformité qui apparaissent dans les deux ans suivant la délivrance du bien.",
    texte: "Article L217-3 du code de la consommation",
    source: { nom: 'Légifrance — code de la consommation, section « Garantie légale de conformité »',
              url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221271/' },
    statut: 'en vigueur',
    applicable: '2022-01-01',
    verifiee: '2026-09-17',
    concerne: "L'acheteur consommateur, auprès d'un vendeur professionnel. Elle ne s'applique pas entre deux particuliers.",
    exceptions: [
      "Le délai court à compter de la délivrance, pas de la commande.",
      "La garantie couvre un défaut de conformité, pas une casse, une usure normale ou une mauvaise utilisation.",
    ],
  },

  'conformite-presomption': {
    titre: "Pendant 24 mois pour un bien neuf et 12 mois pour un bien d'occasion, le défaut est présumé exister depuis la délivrance : c'est au vendeur de prouver le contraire.",
    texte: "Article L217-7 du code de la consommation",
    source: { nom: 'Légifrance — code de la consommation, article L217-7',
              url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221271/' },
    statut: 'en vigueur',
    applicable: '2022-01-01',
    verifiee: '2026-09-17',
    concerne: "L'acheteur consommateur, pendant la fenêtre de présomption.",
    exceptions: [
      "Passé cette fenêtre, la garantie reste ouverte jusqu'à deux ans, mais c'est à l'acheteur d'établir que le défaut existait déjà à la délivrance.",
      "La présomption tombe si le vendeur démontre que le défaut vient de l'usage.",
    ],
  },

  'conformite-extension-reparation': {
    titre: "Un bien réparé au titre de la garantie légale de conformité voit cette garantie prolongée de six mois.",
    texte: "Article L217-13 du code de la consommation",
    source: { nom: 'Légifrance — code de la consommation, article L217-13',
              url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221271/' },
    statut: 'en vigueur',
    applicable: '2022-01-01',
    verifiee: '2026-09-17',
    concerne: "L'acheteur dont le bien a été réparé dans le cadre de la garantie légale — pas d'une garantie commerciale.",
    exceptions: ["La prolongation suppose une réparation effectuée au titre de la garantie légale : gardez la trace écrite de ce cadre."],
  },

  'vices-caches': {
    titre: "Un vice caché, antérieur à la vente et rendant le bien inutilisable, ouvre une action pendant deux ans à compter de sa découverte.",
    texte: "Articles 1641 et 1648 du code civil",
    source: { nom: 'Légifrance — code civil, article 1648',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000020466328' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Tout acheteur, y compris entre particuliers — c'est sa différence majeure avec la garantie de conformité.",
    exceptions: [
      "Le vice doit être antérieur à la vente, caché lors de l'achat, et suffisamment grave.",
      "La preuve incombe à l'acheteur, en pratique par une expertise.",
      "La jurisprudence ajoute un délai butoir de vingt ans à compter de la vente.",
    ],
  },

  'retractation-14-jours': {
    titre: "Un achat à distance, par téléphone ou hors établissement ouvre quatorze jours de rétractation, sans motif à donner.",
    texte: "Article L221-18 du code de la consommation",
    source: { nom: 'Légifrance — code de la consommation, article L221-18',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226842/' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Le consommateur ayant contracté à distance ou hors établissement. Pas un achat en magasin, où aucun délai légal n'existe.",
    exceptions: [
      "Le délai part de la réception pour un bien, de la conclusion pour un service.",
      "Plusieurs catégories en sont exclues par l'article L221-28 — notamment un bien confectionné sur mesure ou un contenu numérique déjà fourni avec votre accord.",
      "Un commerçant peut offrir mieux que la loi : vérifiez ses conditions.",
    ],
  },

  'droit-reparation-ue': {
    titre: "La directive européenne sur le droit à la réparation crée notamment une obligation de réparer hors garantie pour certains produits et une prolongation de douze mois de la garantie après réparation.",
    texte: "Directive (UE) 2024/1799 du 13 juin 2024",
    source: { nom: 'Légifrance — publication de la directive (UE) 2024/1799',
              url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049988668' },
    statut: 'non-transpose',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Personne, en France, à ce jour.",
    exceptions: [
      "La date limite de transposition était le 31 juillet 2026 ; au 17 septembre 2026, aucun texte français d'application n'a été publié.",
      "Tant que la transposition n'est pas parue, ces droits ne peuvent pas être invoqués devant un vendeur français : ce site ne les traite donc jamais comme une règle applicable.",
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Abonnements et contrats                                             */
  /* ------------------------------------------------------------------ */

  'resiliation-trois-clics': {
    titre: "Un contrat qu'on a pu souscrire en ligne doit pouvoir être résilié en ligne, par une fonctionnalité gratuite et accessible en quelques clics.",
    texte: "Article L215-1-1 du code de la consommation ; décret n° 2023-417 du 31 mai 2023",
    source: { nom: 'Légifrance — code de la consommation, article L215-1-1',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107' },
    statut: 'en vigueur',
    applicable: '2023-06-01',
    verifiee: '2026-09-17',
    concerne: "Le consommateur ou le non-professionnel, pour tout contrat qu'un professionnel permet de conclure par voie électronique.",
    exceptions: [
      "L'obligation pèse sur le professionnel qui propose la souscription en ligne ; elle ne rend pas le contrat résiliable à tout moment pour autant.",
      "Ce sont les conditions du contrat et sa durée d'engagement qui déterminent s'il peut être rompu maintenant, et à quel coût.",
    ],
  },

  'tacite-reconduction': {
    titre: "Pour un contrat de services à tacite reconduction, le professionnel doit informer par écrit de la possibilité de ne pas reconduire, au plus tôt trois mois et au plus tard un mois avant l'échéance. À défaut, le contrat peut être résilié gratuitement à tout moment à compter de la reconduction.",
    texte: "Article L215-1 du code de la consommation",
    source: { nom: 'Légifrance — code de la consommation, article L215-1',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000034072591/' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Le consommateur lié par un contrat de prestation de services à durée déterminée reconductible tacitement.",
    exceptions: [
      "L'information doit être écrite et mentionner la date limite dans un encadré apparent.",
      "Certains contrats relèvent de régimes propres : assurances, communications électroniques, contrats entre professionnels.",
    ],
  },

  'engagement-telecom': {
    titre: "Pour un contrat de communications électroniques imposant plus de douze mois d'engagement, le consommateur peut résilier dès la fin du douzième mois ; il ne reste dû qu'une part des mensualités restantes — le quart dans le cas courant d'un engagement de 24 mois.",
    texte: "Article L224-28 du code de la consommation",
    source: { nom: 'Légifrance — code de la consommation, article L224-28',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043545704' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Le consommateur abonné à un service de communications électroniques — mobile, internet fixe — avec un engagement supérieur à douze mois.",
    exceptions: [
      "Avant le treizième mois, la totalité des mensualités restantes peut être exigée.",
      "Les frais de résiliation propres à l'opérateur s'ajoutent et se contestent séparément.",
      "L'Arcep publie les modalités détaillées par opérateur.",
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Taxe foncière — déjà utilisées par l'outil existant                 */
  /* ------------------------------------------------------------------ */

  'tf-delai-reclamation': {
    titre: "Une réclamation sur la taxe foncière se dépose au plus tard le 31 décembre de l'année suivant celle de la mise en recouvrement du rôle. Un second point de départ existe lorsqu'un événement postérieur motive la réclamation.",
    texte: "Article R*196-2 du livre des procédures fiscales",
    source: { nom: 'Légifrance — livre des procédures fiscales, article R*196-2',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047280419' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Tout redevable de la taxe foncière contestant son imposition.",
    exceptions: [
      "Les deux points de départ ne se cumulent pas au choix : le second suppose un événement qui motive réellement la réclamation.",
      "En cas de doute sur le point de départ applicable, interrogez le service des impôts fonciers.",
    ],
  },

  'tf-forme-reclamation': {
    titre: "La réclamation doit mentionner l'imposition contestée, contenir un exposé sommaire des moyens, porter une signature manuscrite et être accompagnée de l'avis d'imposition ou d'une copie.",
    texte: "Article R*197-3 du livre des procédures fiscales",
    source: { nom: 'Légifrance — livre des procédures fiscales, article R*197-3',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006316633' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Tout auteur d'une réclamation contentieuse.",
    exceptions: ["Un vice de forme est régularisable à tout moment : une réclamation incomplète n'est pas perdue."],
  },

  'tf-delai-reponse': {
    titre: "L'administration dispose de six mois pour répondre, délai qu'elle peut prolonger de trois mois en vous en informant.",
    texte: "Article R*198-10 du livre des procédures fiscales",
    source: { nom: 'Légifrance — livre des procédures fiscales, article R*198-10',
              url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025622405' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Tout auteur d'une réclamation en attente de réponse.",
    exceptions: ["Le silence de l'administration ne vaut pas acceptation ; aucun délai de recours ne court avant une décision de rejet expressément notifiée (Conseil d'État, 21 octobre 2020, n° 443327)."],
  },

  'tf-surface-ponderee': {
    titre: "La valeur locative d'un logement se calcule sur une surface pondérée : la surface réelle corrigée de coefficients, augmentée d'équivalences superficielles pour les éléments de confort.",
    texte: "Articles 324 L à 324 V de l'annexe III au code général des impôts ; BOFiP BOI-IF-TFB-20-10-20-50",
    source: { nom: 'BOFiP — évaluation des locaux d\'habitation',
              url: 'https://bofip.impots.gouv.fr/bofip/1302-PGP.html' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "Tout local d'habitation évalué selon la méthode de 1970.",
    exceptions: [
      "La surface pondérée dépasse normalement la surface mesurée de 20 à 40 % : un écart entre les deux n'est pas une anomalie en soi.",
      "Les départements du Bas-Rhin, du Haut-Rhin et de la Moselle relèvent d'un régime distinct.",
    ],
  },
};

/* --------------------------------------------------------------------------
   Rendu d'une citation. Volontairement austère : un texte, une source datée.
   `mode` vaut 'bloc' (sous un résultat) ou 'ligne' (en fin de paragraphe).
   -------------------------------------------------------------------------- */
const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function dateFr(iso){
  if (!iso) return '';
  const [a, m, j] = iso.split('-').map(Number);
  return `${j} ${MOIS_FR[m - 1]} ${a}`;
}

function echapper(s){
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
}

function citer(cle){
  const r = REGLES[cle];
  if (!r) return '';
  const statut = r.statut === 'en vigueur'
    ? `<span class="etiquette et-ok">En vigueur${r.applicable ? ' depuis le ' + dateFr(r.applicable) : ''}</span>`
    : r.statut === 'non-transpose'
      ? `<span class="etiquette et-warn">Non transposée en droit français</span>`
      : `<span class="etiquette et-warn">Réforme attendue</span>`;
  return `<div class="source">
    ${statut}
    <p style="margin-top:8px"><b>${echapper(r.texte)}</b> — ${echapper(r.titre)}</p>
    <p style="margin-top:6px"><b>Qui est concerné :</b> ${echapper(r.concerne)}</p>
    ${r.exceptions && r.exceptions.length ? `<p style="margin-top:6px"><b>À savoir :</b></p>
      <ul style="margin-top:4px; font-size:.84rem">${r.exceptions.map(e => `<li>${echapper(e)}</li>`).join('')}</ul>` : ''}
    <p class="maj" style="margin-top:8px"><a href="${echapper(r.source.url)}" target="_blank" rel="noopener">${echapper(r.source.nom)}</a> · vérifié le ${dateFr(r.verifiee)}</p>
  </div>`;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { REGLES, citer, dateFr };
