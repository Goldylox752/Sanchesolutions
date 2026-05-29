import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV SAFETY
───────────────────────────── */

const requireEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing ENV: ${key}`);
  return val;
};

/* ─────────────────────────────
   CLIENTS
───────────────────────────── */

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY")
);

/* ─────────────────────────────
   WEBHOOK (RAW MUST COME FIRST)
───────────────────────────── */

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        requireEnv("STRIPE_WEBHOOK_SECRET")
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const userId = session?.metadata?.user_id;
        const customerId = session?.customer;

        if (!userId) return res.json({ received: true });

        await supabase.from("users").upsert({
          id: userId,
          plan: "pro",
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        });
      }

      res.json({ received: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Webhook failed" });
    }
  }
);

/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */

app.use(cors({
  origin: ["http://localhost:5500"],
  credentials: true,
}));

app.use(express.json());

/* ─────────────────────────────
   AUTH (SUPABASE)
───────────────────────────── */

async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid session" });
  }

  req.user = data.user;
  next();
}

/* ─────────────────────────────
   PRO ACCESS CHECK
───────────────────────────── */

async function requirePro(req, res, next) {
  const { data } = await supabase
    .from("users")
    .select("plan")
    .eq("id", req.user.id)
    .maybeSingle();

  if (data?.plan !== "pro") {
    return res.status(403).json({ error: "Pro subscription required" });
  }

  next();
}

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/api/health", (_, res) => {
  res.json({
    ok: true,
    service: "MacFlip AI Backend",
    time: new Date().toISOString(),
  });
});

/* ─────────────────────────────
   USER PROFILE
───────────────────────────── */

app.get("/api/me", requireUser, async (req, res) => {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.user.id)
    .maybeSingle();

  res.json({
    user: req.user,
    profile: data || { plan: "free" },
  });
});

/* ─────────────────────────────
   💰 STRIPE CHECKOUT ($9.99/mo)
───────────────────────────── */

app.post("/api/checkout", async (req, res) => {
  const { user_id, email } = req.body;

  if (!user_id || !email) {
    return res.status(400).json({ error: "Missing user data" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,

    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: "MacFlip AI Pro",
            description: "Real-time MacBook flip alerts",
          },
          unit_amount: 999,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],

    success_url: "http://localhost:5500/success.html",
    cancel_url: "http://localhost:5500/cancel.html",

    metadata: {
      user_id,
    },
  });

  res.json({ url: session.url });
});

/* ─────────────────────────────
   🔍 EBAY DEAL SCANNER
───────────────────────────── */

async function fetchDeals() {
  const res = await fetch(
    "https://api.ebay.com/buy/browse/v1/item_summary/search?q=macbook%20air%20m1",
    {
      headers: {
        Authorization: `Bearer ${process.env.EBAY_TOKEN}`,
      },
    }
  );

  const data = await res.json();
  const items = data.itemSummaries || [];

  return items.map((item) => {
    const buy = Number(item.price.value);

    const resale = buy * 1.35;
    const profit = resale - buy;

    return {
      title: item.title,
      buy,
      resale: +resale.toFixed(2),
      profit: +profit.toFixed(2),
      url: item.itemWebUrl,
      good: profit > 80,
    };
  });
}

/* ─────────────────────────────
   🚀 PRO DEALS ENDPOINT
───────────────────────────── */

app.get("/api/deals", requireUser, requirePro, async (req, res) => {
  try {
    const deals = await fetchDeals();

    res.json({
      success: true,
      deals,
      count: deals.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 MacFlip AI running on port ${PORT}`);
});