import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import Stripe from "stripe";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV VALIDATION
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

/* Lazy Supabase (prevents cold-start crashes) */
let supabaseClient;

async function db() {
  if (!supabaseClient) {
    const mod = await import("./supabase.js");
    supabaseClient = mod.supabase;
  }
  return supabaseClient;
}

/* ─────────────────────────────
   GLOBAL MIDDLEWARE
───────────────────────────── */

app.use(
  cors({
    origin: [
      "https://sanchesolutions.vercel.app",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

/* IMPORTANT: Stripe needs RAW body FIRST */
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        requireEnv("STRIPE_WEBHOOK_SECRET")
      );
    } catch (err) {
      console.error("❌ Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      const supabase = await db();

      switch (event.type) {
        /* ── PAYMENT SUCCESS ── */
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session?.metadata?.user_id;

          console.log("💰 Payment success:", userId);

          if (userId) {
            const { error } = await supabase.from("users").upsert({
              id: userId,
              plan: "pro",
              stripe_customer_id: session.customer,
              updated_at: new Date().toISOString(),
            });

            if (error) {
              console.error("DB error:", error.message);
            }
          }

          break;
        }

        /* ── FAILED PAYMENT ── */
        case "invoice.payment_failed":
          console.log("❌ Payment failed");
          break;

        default:
          console.log("Unhandled event:", event.type);
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);

/* ─────────────────────────────
   JSON BODY (AFTER WEBHOOK ONLY)
───────────────────────────── */

app.use(express.json());

/* ─────────────────────────────
   ROUTES
───────────────────────────── */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SancheAI SaaS",
    version: "1.0.0",
  });
});

app.get("/", (req, res) => {
  res.json({ status: "online" });
});

/* ─────────────────────────────
   AI CHAT ROUTE
───────────────────────────── */

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId, user_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are SancheAI, an AI business automation assistant specializing in SaaS, CRM systems, and revenue automation.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "No response generated.";

    const supabase = await db();

    /* optional logging */
    if (user_id) {
      const { error } = await supabase.from("chat_logs").insert({
        user_id,
        session_id: sessionId,
        message,
        reply,
        created_at: new Date().toISOString(),
      });

      if (error) console.error("Chat log error:", error.message);
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("❌ AI ERROR:", err);
    return res.status(500).json({ error: "AI request failed" });
  }
});

/* ─────────────────────────────
   STRIPE CHECKOUT
───────────────────────────── */

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: "Missing user_id/email" });
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
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Checkout failed" });
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});