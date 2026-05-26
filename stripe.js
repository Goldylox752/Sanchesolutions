import Stripe from "stripe";

/* ─────────────────────────────
   STRIPE INITIALIZATION
   Secure + Production Ready
───────────────────────────── */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }
  return value;
}

const secretKey = requireEnv("STRIPE_SECRET_KEY", STRIPE_SECRET_KEY);

/* ─────────────────────────────
   STRIPE CLIENT
───────────────────────────── */

export const stripe = new Stripe(secretKey, {
  apiVersion: "2024-06-20",
});

/* ─────────────────────────────
   OPTIONAL HELPERS (CLEAN SETUP)
───────────────────────────── */

export const STRIPE_CONFIG = {
  currency: "usd",
  mode: "subscription",
};