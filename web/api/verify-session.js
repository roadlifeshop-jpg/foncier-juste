// Vérifie côté serveur qu'une session Stripe Checkout a bien été payée,
// avant de débloquer le vrai rapport (jamais faire confiance à un simple
// paramètre d'URL renvoyé par le client).

module.exports = async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = req.query?.session_id;

  if (!secretKey) {
    res.status(500).json({ error: 'Configuration serveur incomplète (STRIPE_SECRET_KEY manquante sur Vercel).' });
    return;
  }
  if (!sessionId) {
    res.status(400).json({ error: 'session_id manquant' });
    return;
  }

  try {
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const data = await stripeRes.json();
    if (!stripeRes.ok) {
      res.status(502).json({ error: data.error?.message || 'Erreur Stripe inconnue' });
      return;
    }
    // Cette lecture ne filtre AUCUN produit, volontairement : une commande
    // payée avant le retrait de l'analyse à 29 € doit rester délivrable à son
    // acheteur. Le retrait de la vente se fait uniquement à la création de la
    // session, dans create-checkout-session.js.
    //
    // Les réponses du pré-diagnostic ont été jointes au paiement : elles
    // permettent de reconstruire le document acheté, sur n'importe quel
    // appareil et à tout moment, à partir du seul identifiant de session.
    let diag = null;
    try { if (data.metadata?.diag) diag = JSON.parse(data.metadata.diag); }
    catch (_) { diag = null; }

    res.status(200).json({
      payment_status: data.payment_status, // "paid" | "unpaid" | "no_payment_required"
      amount_total: data.amount_total,
      currency: data.currency,
      produit: data.metadata?.produit || 'rapport',
      date: data.created ? new Date(data.created * 1000).toISOString() : null,
      diag,
    });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
};
