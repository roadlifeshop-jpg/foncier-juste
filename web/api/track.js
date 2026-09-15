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
