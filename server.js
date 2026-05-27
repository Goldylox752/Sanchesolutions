import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV VALIDATION
───────────────────────────── */

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
}

/* ─────────────────────────────
   CLIENT INITIALIZATION
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
   CORS
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
   STRIPE WEBHOOK (RAW BODY FIRST)
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
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

/* ─────────────────────────────
   JSON MIDDLEWARE (AFTER WEBHOOK)
───────────────────────────── */

app.use(express.json());

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    service: "CleanFlow AI",
    time: new Date().toISOString(),
  });
});

/* ─────────────────────────────
   AUTH MIDDLEWARE
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
   AI CHAT ROUTE
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
            "You are CleanFlow AI, a SaaS assistant for cleaning businesses that helps generate bookings and automate leads.",
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
  } catch {
    return res.status(500).json({ error: "AI request failed" });
  }
});

/* ─────────────────────────────
   STRIPE CHECKOUT SESSION
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
              name: "CleanFlow AI Pro",
              description:
                "AI receptionist that converts visitors into booked cleaning jobs",
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

    if (!session || !session.url) {
      return res.status(500).json({
        error: "Stripe did not return checkout URL",
      });
    }

    return res.json({ url: session.url });
  } catch {
    return res.status(500).json({ error: "Checkout failed" });
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT);