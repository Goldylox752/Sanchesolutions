import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const app = express();

/* =========================
   ENV SETUP
========================= */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({ origin: "*" }));

// IMPORTANT:
// Stripe webhook needs raw body, so we split routes
app.use("/api/bot", express.json());
app.use("/api/checkout", express.json());

/* =========================
   SMART BOT
========================= */

app.post("/api/bot", async (req, res) => {
  try {
    const msg = (req.body.message || "").toLowerCase();

    // store lead in Supabase
    await supabase.from("leads").insert([
      {
        message: msg,
        source: "chatbot"
      }
    ]);

    const reply = "Got it — what kind of business are you running? I can help you build a system that generates leads automatically.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error" });
  }
});

/* =========================
   STRIPE CHECKOUT
========================= */

app.post("/api/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Sanche AI System Setup",
              description: "Full AI chatbot + automation + website system",
            },
            unit_amount: 29900,
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}?cancel=true`,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

/* =========================
   STRIPE WEBHOOK
========================= */

// IMPORTANT: raw body required here
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("WEBHOOK ERROR:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // PAYMENT SUCCESS
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("PAYMENT SUCCESS:", session.id);

      // store payment in Supabase
      await supabase.from("payments").insert([
        {
          stripe_session_id: session.id,
          email: session.customer_details?.email,
          amount: session.amount_total,
          status: "paid"
        }
      ]);
    }

    res.json({ received: true });
  }
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.send("Sanche SaaS Backend Running 🚀");
});

/* =========================
   START SERVER
========================= */

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});