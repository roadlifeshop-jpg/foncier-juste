// Fonction serverless Vercel (runtime Node.js — aucune dépendance npm,
// on appelle directement l'API REST de Stripe avec fetch()).
//
// Crée une session de paiement Stripe Checkout pour le rapport complet
// (29€). Le prix est fixé ICI, côté serveur — jamais envoyé par le client,
// pour qu'il ne puisse pas être manipulé.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: 'Configuration serveur incomplète (STRIPE_SECRET_KEY manquante sur Vercel).' });
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/succes.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/index.html`);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'eur');
  params.append('line_items[0][price_data][unit_amount]', '2900'); // 29,00 € — fixé ici, pas côté client
  params.append('line_items[0][price_data][product_data][name]', 'Foncier Juste — Rapport complet de diagnostic');
  params.append(
    'line_items[0][price_data][product_data][description]',
    "Diagnostic détaillé des anomalies détectées, comparé aux transactions immobilières réelles de votre secteur (DVF)."
  );

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await stripeRes.json();
    if (!stripeRes.ok) {
      res.status(502).json({ error: data.error?.message || 'Erreur Stripe inconnue' });
      return;
    }
    res.status(200).json({ url: data.url });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur : ' + e.message });
  }
};
