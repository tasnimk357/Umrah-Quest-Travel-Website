# UQT Rewards — Stripe Checkout Setup

This project is one repo, deployed live via Netlify (GitHub stays your code
storage; Netlify does the hosting + serverless function).

## 1. Push this folder to GitHub

```
git init
git add .
git commit -m "Add Stripe checkout"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If GitHub Pages was previously turned on for this repo, leave it off —
GitHub is code storage only now; Netlify serves the live site.

## 2. Create your Stripe Prices

In the Stripe Dashboard → Product catalog:
1. Create a Product for each of the 4 items (UQT Traveller Pack, Premium
   Travel Tee, Umrah Essentials Kit, Travel Tech Organiser) with the price
   shown on the site (in AUD).
2. Copy each Price ID (starts with `price_...`).
3. Open `netlify/functions/create-checkout.js` and replace the 4 placeholder
   `price_REPLACE_ME_*` values with your real Price IDs.
4. Commit and push that change.

## 3. Connect the repo to Netlify

1. Go to app.netlify.com → **Add new site → Import an existing project**.
2. Choose GitHub, then select this repository.
3. Build settings: leave build command empty, publish directory `.`
   (netlify.toml already sets this).
4. Deploy.

## 4. Add your Stripe secret key to Netlify

Site settings → Environment variables → Add a variable:
- Key: `STRIPE_SECRET_KEY`
- Value: your Stripe secret key (starts with `sk_live_...` or `sk_test_...`
  while testing) — from Stripe Dashboard → Developers → API keys.

Also add:
- Key: `SITE_URL`
- Value: your live Netlify URL, e.g. `https://uqt-rewards.netlify.app`
  (update this once you attach a custom domain).

Redeploy after adding these (Netlify → Deploys → Trigger deploy).

## 5. Test before going live

Use Stripe's test mode (test secret key + test card `4242 4242 4242 4242`,
any future expiry, any CVC) to confirm a full checkout completes and lands
on `success.html`. Only switch to your live secret key once that works.

## How it fits together

- `index.html` — the site. The Checkout button posts the cart's product
  names + quantities (never prices) to the function below.
- `netlify/functions/create-checkout.js` — looks up the real price for each
  product from `PRICE_LOOKUP` and creates a Stripe Checkout Session server-side.
- Netlify runs that function automatically; no separate server to manage.
- Every push to GitHub's `main` branch triggers a new Netlify deploy.
