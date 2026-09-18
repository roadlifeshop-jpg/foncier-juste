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
    titre: "Le vendeur professionnel répond des défauts de conformité qui apparaissent dans les deux ans suivant la délivrance du bien. Ce délai de deux ans est le même que le bien soit neuf, reconditionné ou d'occasion.",
    texte: "Article L217-3 du code de la consommation",
    source: { nom: 'Service-Public — Achat d\'un produit : garantie légale de conformité (fiche F11094)',
              url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F11094' },
    source_secondaire: { nom: 'Légifrance — code de la consommation, section « Garantie légale de conformité »',
                         url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221271/' },
    statut: 'en vigueur',
    applicable: '2022-01-01',
    verifiee: '2026-09-17',
    concerne: "L'acheteur consommateur, auprès d'un vendeur professionnel. Elle ne s'applique pas entre deux particuliers.",
    exceptions: [
      "Le délai court à compter de la délivrance, pas de la commande.",
      "Ne confondez pas cette durée de deux ans avec la présomption d'antériorité, plus courte pour un bien d'occasion : la garantie reste ouverte après la fin de la présomption, mais la preuve change de camp.",
      "La garantie couvre un défaut de conformité, pas une casse, une usure normale ou une mauvaise utilisation.",
    ],
  },

  'conformite-presomption': {
    titre: "Pendant 24 mois pour un bien neuf et 12 mois pour un bien d'occasion, le défaut est présumé exister depuis la délivrance : vous n'avez pas à prouver qu'il existait déjà lors de la délivrance, c'est au vendeur de démontrer le contraire. Passé ce délai, la garantie reste ouverte jusqu'à deux ans, mais c'est à vous d'établir que le défaut existait déjà lors de la vente.",
    texte: "Article L217-7 du code de la consommation",
    source: { nom: 'Service-Public — Achat d\'un produit : garantie légale de conformité (fiche F11094)',
              url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F11094' },
    source_secondaire: { nom: 'Légifrance — code de la consommation, article L217-7',
                         url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221271/' },
    statut: 'en vigueur',
    applicable: '2022-01-01',
    verifiee: '2026-09-17',
    concerne: "L'acheteur consommateur, auprès d'un vendeur professionnel. Bien neuf : 24 mois. Bien d'occasion ou reconditionné : 12 mois.",
    exceptions: [
      "Pour un bien d'occasion, le 13e mois change tout : la garantie de deux ans court toujours, mais la charge de la preuve passe du vendeur à vous.",
      "Établir l'antériorité passe en pratique par un constat de réparateur décrivant l'origine de la panne, plus que par un courrier argumenté.",
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

  /* ------------------------------------------------------------------ */
  /* Vol retardé                                                         */
  /* ------------------------------------------------------------------ */
  /* Toutes ces règles ont été relevées le 18/09/2026 sur le site de la
     DGAC — organisme national chargé de faire respecter le règlement en
     France — et recoupées avec le texte du règlement sur EUR-Lex.
     Une divergence entre deux sources officielles est signalée dans
     'vol-montants' : la Commission européenne résume le barème en trois
     montants (250/400/600), la DGAC en détaille quatre en appliquant la
     réduction de moitié prévue à l'article 7, paragraphe 2. Nous suivons la
     DGAC, plus précise et plus prudente. */

  'vol-champ': {
    titre: "Le règlement s'applique aux vols partant d'un aéroport de l'Union européenne, de Norvège, d'Islande ou de Suisse, quelle que soit la compagnie ; et aux vols arrivant dans l'un de ces pays depuis un pays tiers, à condition que la compagnie qui exploite le vol soit européenne.",
    texte: "Règlement (CE) n° 261/2004, article 3",
    source: { nom: "Ministère de la Transition écologique — Que faire en cas de retard au départ, annulation d'un vol, refus d'embarquement",
              url: 'https://www.ecologie.gouv.fr/politiques-publiques/que-faire-cas-retard-depart-annulation-dun-vol-refus-dembarquement' },
    source_secondaire: { nom: 'DGAC — Droits des passagers aériens, foire aux questions « Retard de vol »',
              url: 'https://droits-passagers-aeriens.aviation-civile.gouv.fr/public/je-m-informe' },
    statut: 'en vigueur',
    applicable: '2005-02-17',
    verifiee: '2026-09-18',
    concerne: "Tout passager d'un vol entrant dans ce périmètre, quelle que soit sa nationalité.",
    exceptions: [
      "Un vol au départ d'un pays tiers vers l'Union sur une compagnie non européenne n'entre pas dans le périmètre.",
      "Pour un voyage à correspondances réservé en une seule fois au départ de l'Union, le règlement couvre l'ensemble du trajet, y compris si l'incident survient hors de l'Union.",
      "La destination finale est celle du dernier vol figurant sur le contrat de transport, pas celle de l'escale.",
    ],
  },

  'vol-montants': {
    titre: "Un passager qui atteint sa destination finale avec au moins trois heures de retard peut recevoir une indemnisation forfaitaire : 250 € jusqu'à 1 500 km ; 400 € pour un vol intracommunautaire de plus de 1 500 km et pour tout autre vol de 1 500 à 3 500 km ; 300 € pour un vol international de plus de 3 500 km retardé de trois à quatre heures ; 600 € au-delà de quatre heures.",
    texte: "Règlement (CE) n° 261/2004, article 7",
    source: { nom: 'DGAC — Droits des passagers aériens, foire aux questions « Retard de vol »',
              url: 'https://droits-passagers-aeriens.aviation-civile.gouv.fr/public/je-m-informe' },
    source_secondaire: { nom: 'EUR-Lex — règlement (CE) n° 261/2004, texte intégral',
              url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32004R0261' },
    statut: 'en vigueur',
    applicable: '2005-02-17',
    verifiee: '2026-09-18',
    concerne: "Le passager qui a effectivement voyagé et est arrivé à destination avec au moins trois heures de retard.",
    exceptions: [
      "Le retard se mesure à l'ARRIVÉE à la destination finale, pas au départ. Un vol parti avec quatre heures de retard mais rattrapé en vol n'ouvre rien.",
      "La distance est mesurée selon la route orthodromique entre le départ du premier vol et la destination finale du contrat (article 7, paragraphe 4).",
      "Le palier à 300 € résulte de la faculté, ouverte à la compagnie par l'article 7, paragraphe 2, de réduire l'indemnisation de moitié. La Commission européenne, dans sa communication du 15 juin 2026, résume le barème sans ce palier : nous retenons la présentation de la DGAC.",
      "Un vol de plus de 3 500 km peut rester intracommunautaire — par exemple entre la métropole et un département d'outre-mer : le montant est alors de 400 €, pas de 600 €. La Cour de cassation l'a jugé le 12 octobre 2016 pour un vol Paris–La Réunion.",
      "À l'inverse, la Nouvelle-Calédonie et la Polynésie française ne sont pas un territoire de l'Union : un vol qui s'y rend n'est pas intracommunautaire et relève du palier le plus élevé.",
      "Aucune indemnisation n'est due si vous avez renoncé au voyage sans atteindre la destination avec au moins trois heures de retard.",
    ],
  },

  'vol-exoneration': {
    titre: "La compagnie n'est pas tenue de verser l'indemnisation si elle est en mesure de prouver que le retard est dû à des circonstances extraordinaires qui n'auraient pas pu être évitées même si toutes les mesures raisonnables avaient été prises.",
    texte: "Règlement (CE) n° 261/2004, article 5, paragraphe 3",
    source: { nom: 'EUR-Lex — règlement (CE) n° 261/2004, texte intégral',
              url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32004R0261' },
    source_secondaire: { nom: 'DGAC — Droits des passagers aériens, foire aux questions « Retard de vol »',
              url: 'https://droits-passagers-aeriens.aviation-civile.gouv.fr/public/je-m-informe' },
    statut: 'en vigueur',
    applicable: '2005-02-17',
    verifiee: '2026-09-18',
    concerne: "La compagnie aérienne, à qui la preuve incombe — pas au passager.",
    exceptions: [
      "C'est la compagnie qui doit prouver la circonstance extraordinaire. Le passager n'a pas à démontrer qu'il n'y en avait pas.",
      "Ce site ne peut pas savoir pourquoi votre vol a été retardé : c'est la seule inconnue qui peut faire tomber le montant à zéro. Demandez le motif par écrit.",
      "Un motif invoqué n'est pas un motif établi : une compagnie qui écrit « raison technique » sans autre précision ne prouve rien par cette seule phrase.",
    ],
  },

  'vol-demarche': {
    titre: "La réclamation se fait d'abord, gratuitement, auprès de la compagnie qui a exploité le vol. Sans réponse satisfaisante ou passé deux mois, le passager peut saisir un médiateur — en France, la Médiation tourisme et voyage, si la compagnie y adhère — ou le tribunal. Le délai de recours est de cinq ans à compter de l'incident.",
    texte: "Règlement (CE) n° 261/2004, articles 16 et 17 ; délai de recours français",
    source: { nom: 'DGAC — Droits des passagers aériens, foire aux questions « Retard de vol »',
              url: 'https://droits-passagers-aeriens.aviation-civile.gouv.fr/public/je-m-informe' },
    statut: 'en vigueur',
    applicable: '2005-02-17',
    verifiee: '2026-09-18',
    concerne: "Le passager qui demande son indemnisation. Aucune société intermédiaire n'est nécessaire.",
    exceptions: [
      "La DGAC reçoit les signalements en tant que régulateur, mais son action est indépendante des demandes individuelles : la saisir ne fait pas payer la compagnie.",
      "Vérifiez que votre compagnie adhère bien à la Médiation tourisme et voyage avant de la saisir ; toutes n'y adhèrent pas.",
      "Des sociétés privées proposent de réclamer à votre place contre une commission. La démarche auprès de la compagnie est gratuite et n'exige aucun intermédiaire.",
    ],
  },

  'vol-reforme-2026': {
    titre: "Une révision du règlement a fait l'objet d'un accord politique le 15 juin 2026. La Commission européenne indique que les seuils d'indemnisation restent inchangés, et que les règles révisées s'appliqueront douze mois après leur publication au Journal officiel de l'Union européenne.",
    texte: "Révision du règlement (CE) n° 261/2004 — accord politique du 15 juin 2026",
    source: { nom: "Commission européenne — La Commission se félicite de l'accord sur la révision des droits des passagers aériens",
              url: 'https://france.representation.ec.europa.eu/informations-et-evenements/informations/la-commission-se-felicite-de-laccord-historique-sur-la-revision-des-droits-des-passagers-aeriens-2026-06-15_fr' },
    statut: 'reforme-attendue',
    applicable: null,
    verifiee: '2026-09-18',
    concerne: "Personne, à ce jour : les règles en vigueur restent celles du règlement de 2004.",
    exceptions: [
      "Au 18 septembre 2026, nous n'avons pas constaté de publication au Journal officiel de l'Union européenne. Cet outil applique donc exclusivement les règles actuelles.",
      "Le seuil de trois heures et les montants de 250, 400 et 600 € ne sont pas modifiés par l'accord annoncé.",
    ],
  },

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
    titre: "Pour un engagement de 24 mois rompu sans motif légitime, l'abonné doit la totalité des mensualités restant dues jusqu'à la fin des douze premiers mois, puis 25 % des mensualités restant dues au-delà.",
    texte: "Article L224-28 du code de la consommation",
    source: { nom: 'Service-Public — Résiliation d\'un abonnement de téléphonie ou d\'internet (fiche F22486)',
              url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F22486' },
    source_secondaire: { nom: 'Légifrance — code de la consommation, article L224-28',
                         url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043545704' },
    statut: 'en vigueur',
    applicable: null,
    verifiee: '2026-09-17',
    concerne: "L'abonné consommateur à un service de communications électroniques — mobile, internet fixe — engagé pour plus de douze mois. Les 25 % ne concernent que la fraction d'engagement postérieure au douzième mois.",
    exceptions: [
      "Aucun frais n'est dû en cas de motif légitime : licenciement, hospitalisation prolongée, déménagement dans une zone non couverte, handicap ou maladie. Un justificatif est exigé, et la demande se fait de préférence par lettre recommandée.",
      "Aucun frais n'est dû non plus si l'opérateur modifie le contrat — hausse tarifaire, suppression d'un service : vous disposez alors de quatre mois pour résilier.",
      "Ni en cas de dysfonctionnement durable du service (coupures répétées, absence de réseau), après démarches restées infructueuses.",
      "Les frais de résiliation propres à l'opérateur sont distincts de ce calcul et se contestent séparément.",
      "Ce site ne chiffre pas la somme due : il faudrait connaître votre motif de résiliation, le détail de vos mensualités restantes et les frais de votre opérateur.",
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
    <p class="maj" style="margin-top:8px"><a href="${echapper(r.source.url)}" target="_blank" rel="noopener">${echapper(r.source.nom)}</a>${
      r.source_secondaire ? ` · <a href="${echapper(r.source_secondaire.url)}" target="_blank" rel="noopener">${echapper(r.source_secondaire.nom)}</a>` : ''
    } · vérifié le ${dateFr(r.verifiee)}</p>
  </div>`;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { REGLES, citer, dateFr };
