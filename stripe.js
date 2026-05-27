import Stripe from "stripe";

/* ─────────────────────────────
   ENV SAFETY
───────────────────────────── */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }
  return value;
}

/* ─────────────────────────────
   STRIPE INIT
───────────────────────────── */

const secretKey = requireEnv("STRIPE_SECRET_KEY");

export const stripe = new Stripe(secretKey, {
  apiVersion: "2024-06-20",
});

/* ─────────────────────────────
   SHARED STRIPE CONFIG (SAAS READY)
───────────────────────────── */

export const STRIPE_CONFIG = {
  currency: "usd",
  mode: "subscription",
  planName: "CleanFlow AI Pro",
  interval: "month",
};