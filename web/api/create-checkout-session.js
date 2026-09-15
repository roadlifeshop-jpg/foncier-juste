// Fonction serverless Vercel (runtime Node.js — aucune dépendance npm,
// on appelle directement l'API REST de Stripe avec fetch()).
//
// Crée une session de paiement Stripe Checkout pour le rapport complet
// (29€). Le prix est fixé ICI, côté serveur — jamais envoyé par le client,
// pour qu'il ne puisse pas être manipulé.

// Catalogue défini ICI, côté serveur — jamais envoyé ni modifiable par le
// client. Le client ne fait que choisir une clé ("rapport" ou "dossier").
const PRODUITS = {
  rapport: {
    montant: 2900, // 29,00 €
    nom: 'Foncier Juste — Rapport complet de diagnostic',
    description: "Diagnostic détaillé des anomalies détectées, comparé aux transactions immobilières réelles de votre secteur (DVF).",
  },
  dossier: {
    montant: 4900, // 49,00 €
    nom: 'Foncier Juste — Dossier complet de réclamation',
    description: "Le rapport de diagnostic + la lettre de réclamation prête à compléter + la liste des pièces à joindre et les délais à respecter.",
  },
};

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

  // Vercel parse déjà le JSON en objet si Content-Type: application/json ;
  // ce fallback gère aussi le cas d'un corps encore sous forme de texte.
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const produitId = PRODUITS[body.produit] ? body.produit : 'rapport';
  const produit = PRODUITS[produitId];

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/succes.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/index.html`);
  params.append('metadata[produit]', produitId);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'eur');
  params.append('line_items[0][price_data][unit_amount]', String(produit.montant)); // fixé ici, pas côté client
  params.append('line_items[0][price_data][product_data][name]', produit.nom);
  params.append('line_items[0][price_data][product_data][description]', produit.description);

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
