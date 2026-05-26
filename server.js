import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV
───────────────────────────── */

function requireEnv(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

/* ─────────────────────────────
   CLIENTS
───────────────────────────── */

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

const groq = new Groq({
  apiKey: requireEnv("GROQ_API_KEY"),
});

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_ANON_KEY")
);

/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */

app.use(
  cors({
    origin: [
      "https://sanchesolutions.vercel.app",
      "http://localhost:5500",
    ],
  })
);

/* Stripe webhook MUST be raw */
app.post(
  "/stripe-webhook",
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
      return res.status(400).send(err.message);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session?.metadata?.user_id;

        if (userId) {
          await supabase.from("users").upsert({
            id: userId,
            plan: "pro",
            stripe_customer_id: session.customer,
            updated_at: new Date().toISOString(),
          });
        }
      }

      return res.json({ received: true });
    } catch (err) {
      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);

/* JSON AFTER WEBHOOK */
app.use(express.json());

/* ─────────────────────────────
   AUTH MIDDLEWARE
───────────────────────────── */

async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid user" });
  }

  req.user = data.user;
  next();
}

/* ─────────────────────────────
   HEALTH
───────────────────────────── */

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ─────────────────────────────
   CHAT (PROTECTED)
───────────────────────────── */

app.post("/api/chat", requireUser, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are SancheAI, an AI SaaS automation assistant.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "No response";

    return res.json({
      success: true,
      reply,
    });
  } catch (err) {
    return res.status(500).json({ error: "AI failed" });
  }
});

/* ─────────────────────────────
   STRIPE CHECKOUT
───────────────────────────── */

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: "Missing data" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SancheAI Pro",
            },
            unit_amount: 2900,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],

      success_url:
        "https://sanchesolutions.vercel.app/app.html?success=1",

      cancel_url:
        "https://sanchesolutions.vercel.app/app.html?cancel=1",

      metadata: {
        user_id,
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: "Checkout failed" });
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});