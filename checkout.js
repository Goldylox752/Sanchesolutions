import Stripe from "stripe";

/* ─────────────────────────────
   ENV SAFETY
───────────────────────────── */

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
}

/* ─────────────────────────────
   STRIPE CLIENT
───────────────────────────── */

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/* ─────────────────────────────
   OPTIONAL CONFIG
───────────────────────────── */

export const STRIPE_CONFIG = {
  currency: "usd",
  mode: "subscription",
};