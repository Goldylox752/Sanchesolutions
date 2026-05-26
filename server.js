import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

/* ─────────────────────────────
   ENV VALIDATION
───────────────────────────── */

function requireEnv(name) {

  const value = process.env[name];

  if (!value) {

    throw new Error(
      `❌ Missing environment variable: ${name}`
    );
  }

  return value;
}

/* ─────────────────────────────
   SAFE IMPORTS
───────────────────────────── */

const { stripe } =
  await import("./stripe.js");

const { supabase } =
  await import("./supabase.js");

/* ─────────────────────────────
   CORS
───────────────────────────── */

app.use(cors({
  origin: [
    "https://sanchesolutions.vercel.app",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000"
  ],
  methods: [
    "GET",
    "POST"
  ],
  credentials: true
}));

/* ─────────────────────────────
   STRIPE WEBHOOK
   MUST COME BEFORE express.json()
───────────────────────────── */

app.post(
  "/stripe-webhook",

  express.raw({
    type: "application/json"
  }),

  async (req, res) => {

    const signature =
      req.headers["stripe-signature"];

    let event;

    try {

      event =
        stripe.webhooks.constructEvent(
          req.body,
          signature,
          requireEnv(
            "STRIPE_WEBHOOK_SECRET"
          )
        );

    } catch (err) {

      console.error(
        "❌ Stripe webhook verification failed:",
        err.message
      );

      return res
        .status(400)
        .send(
          `Webhook Error: ${err.message}`
        );
    }

    try {

      switch (event.type) {

        case "checkout.session.completed": {

          const session =
            event.data.object;

          const userId =
            session?.metadata?.user_id;

          console.log(
            "💰 Payment success:",
            userId
          );

          if (userId) {

            const { error } =
              await supabase
                .from("users")
                .upsert({
                  id: userId,
                  plan: "pro",
                  stripe_customer_id:
                    session.customer,
                  updated_at:
                    new Date().toISOString()
                });

            if (error) {

              console.error(
                "Supabase update error:",
                error.message
              );
            }
          }

          break;
        }

        case "invoice.payment_failed":

          console.log(
            "❌ Invoice payment failed"
          );

          break;

        default:

          console.log(
            `Unhandled event: ${event.type}`
          );
      }

      return res.json({
        received: true
      });

    } catch (err) {

      console.error(
        "Webhook processing error:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Webhook processing failed"
        });
    }
  }
);

/* ─────────────────────────────
   JSON PARSER
───────────────────────────── */

app.use(express.json());

/* ─────────────────────────────
   GROQ CLIENT
───────────────────────────── */

const groq = new Groq({
  apiKey: requireEnv(
    "GROQ_API_KEY"
  )
});

/* ─────────────────────────────
   HEALTH ROUTE
───────────────────────────── */

app.get("/api/health", (req, res) => {

  res.json({
    status: "ok",
    service: "SancheAI SaaS",
    features: [
      "chat",
      "stripe",
      "webhook",
      "supabase"
    ]
  });
});

/* ROOT */

app.get("/", (req, res) => {

  res.json({
    status: "online"
  });
});

/* ─────────────────────────────
   CHAT ROUTE
───────────────────────────── */

app.post("/api/chat", async (req, res) => {

  try {

    const {
      message,
      sessionId,
      user_id
    } = req.body;

    if (!message) {

      return res
        .status(400)
        .json({
          error:
            "Message is required"
        });
    }

    const completion =
      await groq.chat.completions.create({

        model:
          "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",

            content:
              "You are SancheAI, an AI business assistant for automation, SaaS growth, and customer support."
          },

          {
            role: "user",
            content: message
          }
        ]
      });

    const reply =
      completion?.choices?.[0]
        ?.message?.content ||
      "No response generated.";

    /* OPTIONAL CHAT LOGGING */

    if (user_id) {

      const { error } =
        await supabase
          .from("chat_logs")
          .insert({

            user_id,

            session_id:
              sessionId,

            message,

            reply,

            created_at:
              new Date().toISOString()
          });

      if (error) {

        console.error(
          "Chat log error:",
          error.message
        );
      }
    }

    return res.json({
      success: true,
      reply
    });

  } catch (err) {

    console.error(
      "❌ AI ERROR:",
      err
    );

    return res
      .status(500)
      .json({
        error:
          "AI request failed"
      });
  }
});

/* ─────────────────────────────
   STRIPE CHECKOUT
───────────────────────────── */

app.post(
  "/api/create-checkout-session",

  async (req, res) => {

    try {

      const {
        user_id,
        email
      } = req.body;

      if (
        !user_id ||
        !email
      ) {

        return res
          .status(400)
          .json({
            error:
              "Missing user_id or email"
          });
      }

      const session =
        await stripe.checkout.sessions.create({

          payment_method_types: [
            "card"
          ],

          mode:
            "subscription",

          customer_email:
            email,

          line_items: [
            {
              price_data: {

                currency:
                  "usd",

                product_data: {
                  name:
                    "SancheAI Pro"
                },

                unit_amount:
                  2900,

                recurring: {
                  interval:
                    "month"
                }
              },

              quantity: 1
            }
          ],

          success_url:
            "https://sanchesolutions.vercel.app/app.html?success=1",

          cancel_url:
            "https://sanchesolutions.vercel.app/app.html?cancel=1",

          metadata: {
            user_id
          }
        });

      return res.json({
        url: session.url
      });

    } catch (err) {

      console.error(
        "Checkout error:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Checkout failed"
        });
    }
  }
);

/* ─────────────────────────────
   SERVER START
───────────────────────────── */

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `🚀 Server running on port ${PORT}`
  );
});