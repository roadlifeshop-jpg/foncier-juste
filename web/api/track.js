// Mesure du funnel — volontairement minimaliste.
//
// Ce que ça fait : écrit une ligne dans les logs Vercel (Observability >
// Runtime Logs) à chaque étape franchie. Suffisant pour les premières
// dizaines de visiteurs, et sans dépendance ni compte tiers.
//
// Ce que ça ne fait PAS, délibérément : aucun cookie, aucun identifiant,
// aucune adresse IP stockée, aucune donnée sur le bien de l'utilisateur.
// C'est ce qui permet de continuer à dire honnêtement que les réponses au
// diagnostic ne quittent jamais le navigateur.
//
// Quand le volume dépassera ce que les logs permettent de suivre à la main,
// remplacer par Plausible ou Umami (sans cookie eux aussi) — pas par Google
// Analytics, qui contredirait le positionnement du produit.

// ---------------------------------------------------------------------------
// À AJOUTER AVANT L'OUVERTURE COMMERCIALE AU PUBLIC : `achat_bloque`
// ---------------------------------------------------------------------------
// Pourquoi. Depuis la V1, l'offre payante n'apparaît que si un écart réel
// repose sur une donnée fiable (fiche 6675-M). Une très grande partie des
// visiteurs ne verra donc jamais de bouton d'achat. Sans cet événement, un
// taux de conversion nul est indéchiffrable : impossible de distinguer
//   (a) « personne ne veut payer »            -> le produit n'intéresse pas ;
//   (b) « personne n'atteint l'offre »        -> le gabarit d'accès est trop
//       strict, ou les gens n'ont pas leur fiche ;
//   (c) « l'offre s'affiche mais le formulaire email/consentement bloque »
//       -> problème d'interface, pas de désir.
// Ce sont trois décisions produit opposées. L'événement les sépare.
//
// Ce qu'il faut ajouter, précisément.
//
// 1. Ici : ajouter 'achat_bloque' à EVENEMENTS_AUTORISES, puis étendre la
//    liste blanche des méta-données avec un champ `raison` contraint à un
//    ensemble fermé de valeurs — jamais une chaîne libre, qui rouvrirait la
//    porte à des données personnelles dans les logs :
//      const RAISONS = new Set([
//        'aucun_signal',        // diagnostic sans écart : rien à vendre
//        'signal_non_fiable',   // écart relevé, mais confiance faible
//        'sans_fiche',          // l'utilisateur n'a pas sa fiche 6675-M
//        'email_invalide',      // l'offre était visible, l'email a bloqué
//        'consentement_absent', // l'offre était visible, la case a bloqué
//      ]);
//      raison: RAISONS.has(body.raison) ? body.raison : undefined,
//
// 2. Dans web/index.html, fonction `renderResults()`, juste après le calcul de
//    `const vente = venteAutorisee(anomalies);` — dans la branche `if (!vente)`
//    qui existe déjà :
//      track('achat_bloque', {
//        raison: reels.length === 0 ? 'aucun_signal'
//              : !avecFiche        ? 'sans_fiche'
//                                  : 'signal_non_fiable'
//      });
//
// 3. Dans web/index.html, gestionnaire des `.buy-btn`, sur les deux retours
//    anticipés qui existent déjà :
//      - après l'échec du test d'email  : track('achat_bloque', { raison: 'email_invalide' });
//      - après l'échec du consentement  : track('achat_bloque', { raison: 'consentement_absent' });
//
// Ce que ça ne change pas : toujours aucun cookie, aucun identifiant, aucune
// donnée sur le bien. `raison` est un mot d'une liste fermée de cinq valeurs.
//
// Pourquoi ce n'est pas fait maintenant : le périmètre du test T1 est gelé, et
// cet événement ne sert qu'à lire du trafic public — que le site n'a pas
// encore, puisqu'il reste en `noindex` jusqu'à l'immatriculation.
// ---------------------------------------------------------------------------

const EVENEMENTS_AUTORISES = new Set([
  'page_vue',
  'diagnostic_demarre',
  'etape_1_validee',
  'etape_2_validee',
  'etape_3_validee',
  'etape_4_validee',
  'resultat_affiche',
  'offre_vue',
  'apercu_demande',
  'paiement_demarre',
  'paiement_reussi',
  'document_telecharge',
  // Ajoutés avec les outils « abonnements » et « garanties » : même principe,
  // aucun cookie, aucun identifiant, aucune donnée saisie. On ne mesure que
  // le fait qu'un outil a servi, jamais son contenu.
  'outil_utilise',
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!EVENEMENTS_AUTORISES.has(body.e)) {
      res.status(204).end(); // on ignore silencieusement tout événement inattendu
      return;
    }
    // Liste blanche stricte des méta-données : rien d'autre ne sera journalisé.
    const meta = {
      signal: typeof body.signal === 'boolean' ? body.signal : undefined,
      anomalies: Number.isInteger(body.anomalies) ? body.anomalies : undefined,
      produit: body.produit === 'rapport' || body.produit === 'dossier' ? body.produit : undefined,
    };
    console.log(`[funnel] ${body.e} ${JSON.stringify(meta)}`);
  } catch (_) {
    // la mesure ne doit jamais faire échouer quoi que ce soit
  }
  res.status(204).end();
};
