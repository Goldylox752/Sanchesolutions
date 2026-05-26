import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const app = express();

/* ─────────────────────────────
   ENV
───────────────────────────── */

const {
  GROQ_API_KEY,
  SUPABASE_URL,
  SUPABASE_KEY,
  STRIPE_SECRET_KEY
} = process.env;

/* ─────────────────────────────
   CLIENTS
───────────────────────────── */

const groq = new Groq({
  apiKey: GROQ_API_KEY
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const stripe = new Stripe(STRIPE_SECRET_KEY);

/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ─────────────────────────────
   ACCESS CHECK (SaaS GATE)
───────────────────────────── */

async function hasAccess(user_id) {
  if (!user_id) return false;

  const { data } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user_id)
    .single();

  return data?.plan === "pro" || data?.plan === "active";
}

/* ─────────────────────────────
   SIMPLE ROUTER (FAST + LIGHT)
───────────────────────────── */

function route(message = "") {
  const m = message.toLowerCase();

  if (m.includes("bug") || m.includes("error")) return "technical";
  if (m.includes("automate")) return "automation";
  if (m.includes("price") || m.includes("buy")) return "sales";

  return "support";
}

/* ─────────────────────────────
   AGENTS (GROQ PROMPTS)
───────────────────────────── */

const agents = {
  sales:
    "You are a SaaS sales assistant focused on ROI, conversions, and closing deals quickly.",

  technical:
    "You are a senior software engineer. Give clear, step-by-step debugging help.",

  automation:
    "You design AI automation systems and workflows for businesses.",

  support:
    "You are a helpful SaaS support assistant. Be short and clear."
};

/* ─────────────────────────────
   CHAT (GROQ CORE)
───────────────────────────── */

app.post("/chat", async (req, res) => {
  try {
    const { message, user_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    /* ── SAAS ACCESS CONTROL ── */
    const access = await hasAccess(user_id);

    if (!access) {
      return res.status(403).json({
        error: "No active subscription",
        upgrade: "/pricing"
      });
    }

    const agent = route(message);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: agents[agent]
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "No response generated.";

    /* ── SAVE CHAT LOG ── */
    await supabase.from("chat_logs").insert({
      user_id,
      message,
      reply,
      agent
    });

    res.json({
      reply,
      agent
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: "Groq AI failed" });
  }
});

/* ─────────────────────────────
   STRIPE CHECKOUT
───────────────────────────── */

app.post("/create-checkout", async (req, res) => {
  try {
    const { user_id } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: "https://your-domain.com/success",
      cancel_url: "https://your-domain.com/cancel",
      metadata: {
        user_id
      }
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("STRIPE ERROR:", err);
    res.status(500).json({ error: "Stripe failed" });
  }
});

/* ─────────────────────────────
   STRIPE WEBHOOK
───────────────────────────── */

app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const event = JSON.parse(req.body);

      if (event.type === "checkout.session.completed") {
        const user_id = event.data.object.metadata.user_id;

        await supabase
          .from("users")
          .update({ plan: "pro" })
          .eq("id", user_id);
      }

      res.json({ received: true });

    } catch (err) {
      console.error("WEBHOOK ERROR:", err);
      res.status(400).send("Webhook error");
    }
  }
);

/* ─────────────────────────────
   HEALTH
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    ai: "groq-llama-3.3",
    billing: "stripe",
    db: "supabase",
    version: "5.0-groq-saas"
  });
});

/* ─────────────────────────────
   START
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Groq SaaS running on", PORT);
});