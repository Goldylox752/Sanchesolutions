import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

/* ───── MIDDLEWARE ───── */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ───── SUPABASE ───── */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ───── SIMPLE MEMORY STORE (fallback) ───── */
const sessions = {};

/* ───── INTENTS ENGINE (upgraded logic) ───── */
const intents = [
  {
    name: "website",
    keywords: ["website", "web", "site", "landing page"],
    reply:
      "We build high-converting websites designed to turn visitors into paying customers. What type of business do you run?"
  },
  {
    name: "seo",
    keywords: ["seo", "google", "rank", "traffic"],
    reply:
      "We help businesses rank on Google and generate consistent organic leads without ads."
  },
  {
    name: "pricing",
    keywords: ["price", "cost", "how much", "pricing"],
    reply:
      "Most projects start between $300–$1500 depending on complexity. What are you trying to build?"
  },
  {
    name: "automation",
    keywords: ["automation", "ai", "bot", "crm", "system"],
    reply:
      "We build automation systems that handle leads, follow-ups, and customer conversion automatically."
  },
  {
    name: "whatsapp",
    keywords: ["whatsapp", "call", "contact", "talk"],
    reply:
      "You can reach us directly on WhatsApp at +1 780-267-9673 for fastest response."
  }
];

/* ───── INTENT MATCHER ───── */
function detectIntent(message = "") {
  const msg = message.toLowerCase();

  return (
    intents.find((i) =>
      i.keywords.some((k) => msg.includes(k))
    ) || null
  );
}

/* ───── BOT ENDPOINT ───── */
app.post("/api/bot", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message provided" });
    }

    /* session tracking */
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        step: 0,
        createdAt: Date.now()
      };
    }

    const intent = detectIntent(message);

    const reply = intent
      ? intent.reply
      : "Got it — what kind of business are you trying to grow? I can help with websites, SEO, or automation.";

    /* ───── SAVE TO SUPABASE (LEAD LOGGING) ───── */
    const { error } = await supabase.from("leads").insert([
      {
        session_id: sessionId,
        message,
        reply,
        intent: intent?.name || "unknown"
      }
    ]);

    if (error) {
      console.error("Supabase error:", error.message);
    }

    /* ───── RESPONSE ───── */
    res.json({
      reply,
      intent: intent?.name || "unknown"
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      reply: "Server error — please try again or contact support."
    });
  }
});

/* ───── HEALTH CHECK ───── */
app.get("/", (req, res) => {
  res.send("Sanche Bot + Supabase Running 🚀");
});

/* ───── START SERVER ───── */
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});