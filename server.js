import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV SAFETY
───────────────────────────── */

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing env: ${key}`);
  return value;
}

/* ─────────────────────────────
   CLIENTS
───────────────────────────── */

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20",
});

const groq = new Groq({
  apiKey: requireEnv("GROQ_API_KEY"),
});

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false },
  }
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

/* ─────────────────────────────
   STRIPE WEBHOOK (RAW FIRST)
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
            stripe_customer_id: session.customer,
            updated_at: new Date().toISOString(),
          });
        }
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook handling error:", err);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

/* JSON BODY (AFTER WEBHOOK) */
app.use(express.json());

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CleanFlow AI",
    time: new Date().toISOString(),
  });
});

/* ─────────────────────────────
   AUTH (SUPABASE JWT)
───────────────────────────── */

async function requireUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    req.user = data.user;
    next();
  } catch {
    return res.status(401).json({ error: "Auth failed" });
  }
}

/* ─────────────────────────────
   AI CHAT
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
            "You are CleanFlow AI, an assistant that helps cleaning businesses get more bookings, respond faster, and automate leads.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content || "No response";

    return res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("❌ AI error:", err);
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
      return res.status(400).json({ error: "Missing user_id or email" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "CleanFlow AI Pro",
              description:
                "AI receptionist that turns visitors into booked cleaning jobs",
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

    if (!session?.url) {
      return res.status(500).json({
        error: "Stripe did not return checkout URL",
      });
    }

    return res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    return res.status(500).json({ error: "Checkout failed" });
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 CleanFlow AI running on port ${PORT}`);
});