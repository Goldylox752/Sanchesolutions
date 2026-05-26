import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────
   SUPABASE INITIALIZATION
   Secure + Production Ready
───────────────────────────── */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }
  return value;
}

const url = requireEnv("SUPABASE_URL", SUPABASE_URL);
const serviceKey = requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY",
  SUPABASE_SERVICE_KEY
);

/* ─────────────────────────────
   SUPABASE CLIENT (ADMIN)
   ⚠️ Server-side only (NEVER expose in frontend)
───────────────────────────── */

export const supabase = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/* ─────────────────────────────
   OPTIONAL HELPERS (CLEAN ARCHITECTURE)
───────────────────────────── */

export const db = {
  leads: "leads",
  users: "users",
  subscriptions: "subscriptions",
};