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
    res.status(200).json({
      payment_status: data.payment_status, // "paid" | "unpaid" | "no_payment_required"
      amount_total: data.amount_total,
      currency: data.currency,
    });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
};
