// Fonction serverless Vercel (runtime Node.js — aucune dépendance npm,
// on appelle directement l'API REST de Stripe avec fetch()).
//
// Crée une session de paiement Stripe Checkout. Le prix est fixé ICI, côté
// serveur — jamais envoyé par le client, pour qu'il ne puisse pas être
// manipulé.

// Catalogue défini ICI, côté serveur — jamais envoyé ni modifiable par le
// client.
//
// Une seule offre est vendable depuis le 17/09/2026 : le dossier de
// vérification. L'analyse seule à 29 € a été retirée — la comparaison section
// par section avec le résultat gratuit montrait qu'elle n'ajoutait qu'un
// rappel des réponses déjà saisies. La clé « rapport » reste définie pour que
// les sessions de paiement antérieures restent lisibles par verify-session.
const PRODUITS = {
  // Retirée de la vente. Conservée pour les sessions antérieures.
  rapport: {
    montant: 2900,
    nom: 'Foncier·Juste — Analyse détaillée',
    description: "Analyse détaillée des éléments relevés (offre retirée).",
    retiree: true,
  },
  dossier: {
    montant: 4900, // 49,00 €
    nom: 'Foncier·Juste — Dossier de vérification',
    description: "L'analyse détaillée, plus la lettre de réclamation rédigée et référencée, les pièces à joindre et les délais à respecter.",
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
  // Seules les offres encore en vente peuvent donner lieu à un paiement. Toute
  // autre demande est REFUSÉE, jamais remplacée : créer une session à 49 €
  // pour qui demande un produit à 29 € serait une surprise de facturation.
  const produitId = body.produit;
  const produit = PRODUITS[produitId];
  if (!produit) {
    res.status(400).json({ error: "Ce produit n'existe pas." });
    return;
  }
  if (produit.retiree) {
    res.status(410).json({
      error: "Cette offre n'est plus proposée à la vente. Seul le dossier de vérification à 49 € est disponible.",
    });
    return;
  }

  // L'email permet à Stripe d'envoyer le reçu et, surtout, de retrouver le
  // client si la livraison du PDF échoue de son côté (onglet fermé, etc.).
  const email = typeof body.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
    ? body.email.trim()
    : null;
  if (!email) {
    res.status(400).json({ error: 'Email invalide ou manquant.' });
    return;
  }

  // --------------------------------------------------------------------
  // Réponses du pré-diagnostic, jointes au paiement.
  // --------------------------------------------------------------------
  // C'est ce qui garantit la livraison : sans elles, un client qui ferme son
  // onglet pendant le tunnel de paiement aurait payé sans que le document
  // puisse jamais être reconstruit. Elles sont conservées par Stripe avec la
  // transaction, et relues par /api/verify-session au retour.
  //
  // Liste blanche stricte : rien d'autre n'est accepté, aucune valeur libre,
  // et le tout est plafonné — un champ de métadonnée Stripe est limité à
  // 500 caractères.
  const ELEMENTS = ['piscine', 'garage', 'dependance', 'veranda'];
  const SOURCES = ['mesuree', 'acte', 'estimee'];
  const texte = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const nombre = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && n <= 400 ? Math.round(n) : null;
  };
  const liste = (v) => (Array.isArray(v) ? v.filter((x) => ELEMENTS.includes(x)) : []);

  const d = body.diag && typeof body.diag === 'object' ? body.diag : null;
  let diagnostic = null;
  if (d) {
    diagnostic = {
      cc: texte(d.cc, 10), cn: texte(d.cn, 60), cp: texte(d.cp, 10), cd: texte(d.cd, 4),
      t: d.t === 'Appartement' ? 'Appartement' : 'Maison',
      f: d.f ? 1 : 0,
      sf: nombre(d.sf),
      sr: nombre(d.sr),
      ss: SOURCES.includes(d.ss) ? d.ss : 'estimee',
      ef: liste(d.ef), ee: liste(d.ee),
    };
    if (!diagnostic.cc || !diagnostic.cd || !diagnostic.sr) diagnostic = null;
  }
  const diagJson = diagnostic ? JSON.stringify(diagnostic) : null;
  if (diagJson && diagJson.length > 480) {
    // Ne devrait jamais arriver avec la liste blanche ci-dessus ; on préfère
    // ne rien joindre plutôt que de faire échouer le paiement.
    diagnostic = null;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/succes.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/index.html`);
  params.append('customer_email', email);
  params.append('metadata[produit]', produitId);
  // Trace du consentement L221-28 : le bouton d'achat est inaccessible sans
  // la case cochée côté client, on en garde la preuve horodatée chez Stripe.
  params.append('metadata[renonciation_retractation]', new Date().toISOString());
  if (diagnostic) params.append('metadata[diag]', JSON.stringify(diagnostic));
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
