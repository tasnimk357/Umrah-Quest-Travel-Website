// Netlify serverless function: creates a Stripe Checkout Session.
//
// The browser never sends prices — only product names and quantities.
// This function looks up the real Stripe Price ID for each product name
// (source of truth = your Stripe Dashboard) and asks Stripe to build the
// session. This is what keeps someone from editing the page's JS in
// devtools to pay less than the real price.
//
// Deployed automatically by Netlify from netlify/functions/ — no extra
// config needed beyond netlify.toml already pointing at this folder.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Map each product name (must match data-name in index.html exactly) to
// the Stripe Price ID you create in Dashboard → Product catalog → Prices.
// Replace these placeholder IDs with your real ones before going live.
const PRICE_LOOKUP = {
  'UQT Traveller Pack': 'price_1UINLGRqnkUWdZ6PtE7ilv3a',
  'Premium Travel Tee': 'price_1UINLGRqnkUWdZ6PtE7ilv3a',
  'Umrah Essentials Kit': 'price_1UINLGRqnkUWdZ6PtE7ilv3a',
  'Travel Tech Organiser': 'price_1UINLGRqnkUWdZ6PtE7ilv3a',
};

// Update this once your site has a real domain.
const SITE_URL = process.env.SITE_URL || 'http://localhost:8888';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let items;
  try {
    ({ items } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
  }

  // Build Stripe line items server-side. Unknown product names are rejected
  // rather than silently skipped, so a typo never produces a $0 checkout.
  let line_items;
  try {
    line_items = items.map(({ name, qty }) => {
      const price = PRICE_LOOKUP[name];
      if (!price) throw new Error(`Unknown product: ${name}`);
      const quantity = Number.isInteger(qty) && qty > 0 ? qty : 1;
      return { price, quantity };
    });
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/#shop`,
      // billing/shipping address collection can be added here later, e.g.:
      // shipping_address_collection: { allowed_countries: ['AU'] },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create checkout session' }),
    };
  }
};
