import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV VALIDATION (FAIL FAST)
───────────────────────────── */

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing env: ${key}`);
  return value;
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
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

/* ─────────────────────────────
   WEBHOOK (MUST BE FIRST)
───────────────────────────── */

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
      console.error("❌ Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session?.metadata?.user_id;

        if (userId) {
          await supabase.from("users").upsert({
            id: userId,
            plan: "pro",
            stripe_customer_id: session.customer || null,
            updated_at: new Date().toISOString(),
          });
        }
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);

/* ─────────────────────────────
   MIDDLEWARE (AFTER WEBHOOK)
───────────────────────────── */

app.use(
  cors({
    origin: [
      "https://sanchesolutions.vercel.app",
      "http://localhost:5500",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/api/health", (_, res) => {
  res.json({
    ok: true,
    service: "SancheSolutions AI Backend",
    time: new Date().toISOString(),
  });
});

/* ─────────────────────────────
   AUTH MIDDLEWARE (HARDENED)
───────────────────────────── */

async function requireUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid auth session" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth failed" });
  }
}

/* ─────────────────────────────
   USER PROFILE
───────────────────────────── */

app.get("/api/me", requireUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    res.json({
      user: req.user,
      profile: data || { plan: "free" },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load user" });
  }
});

/* ─────────────────────────────
   AI CHAT (GROQ)
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
            "You are an AI assistant for a SaaS automation platform called SancheSolutions.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content ?? "No response";

    res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("❌ AI error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

/* ─────────────────────────────
   STRIPE CHECKOUT
───────────────────────────── */

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: "Missing user_id or email" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SancheSolutions Pro",
              description: "AI automation dashboard + lead systems",
            },
            unit_amount: 4900,
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
        "https://sanchesolutions.vercel.app/app.html?canceled=1",

      metadata: {
        user_id,
      },
    });

    if (!session.url) {
      return res.status(500).json({
        error: "Stripe session failed",
      });
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SancheSolutions backend running on port ${PORT}`);
});