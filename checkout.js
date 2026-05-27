import Stripe from "stripe";

/* ─────────────────────────────
   STRIPE CLIENT (PRODUCTION SAFE)
───────────────────────────── */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }
  return value;
}

const stripeSecret = requireEnv("STRIPE_SECRET_KEY");

export const stripe = new Stripe(stripeSecret, {
  apiVersion: "2024-06-20",
});