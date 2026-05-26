import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV VALIDATION (FAIL FAST)
───────────────────────────── */
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }
  return value;
}

/* ─────────────────────────────
   SAFE IMPORTS (AFTER ENV CHECK)
───────────────────────────── */
const { stripe } = await import("./stripe.js");
const { supabase } = await import("./supabase.js");

/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   STRIPE WEBHOOK (RAW BODY MUST BE FIRST)
───────────────────────────── */
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
      console.error("Webhook error:", err.message);
      return res.status(400).send("Webhook Error");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session?.metadata?.user_id;

        console.log("💰 PAYMENT SUCCESS:", userId);

        if (userId) {
          const { error } = await supabase.from("users").upsert({
            id: userId,
            plan: "pro",
            stripe_customer_id: session.customer,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error("Supabase update error:", error.message);
          }
        }
      }

      if (event.type === "invoice.payment_failed") {
        console.log("❌ Payment failed");
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).json({ error: "Webhook failed" });
    }
  }
);

/* ─────────────────────────────
   AI CLIENT
───────────────────────────── */
const groq = new Groq({
  apiKey: requireEnv("GROQ_API_KEY"),
});

/* ─────────────────────────────
   CHAT ROUTE
───────────────────────────── */
app.post("/chat", async (req, res) => {
  try {
    const { message, user_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const ai = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are SancheAI, a SaaS AI assistant that converts leads into customers.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      ai?.choices?.[0]?.message?.content || "No response generated";

    if (user_id) {
      const { error } = await supabase.from("chat_logs").insert({
        user_id,
        message,
        reply,
      });

      if (error) {
        console.error("Chat log error:", error.message);
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

/* ─────────────────────────────
   STRIPE CHECKOUT
───────────────────────────── */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: "Missing user_id or email" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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

      success_url: "https://yourdomain.com/app.html?success=1",
      cancel_url: "https://yourdomain.com/app.html?cancel=1",

      metadata: {
        user_id,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "SancheAI SaaS",
    features: ["chat", "stripe", "webhook", "supabase"],
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});