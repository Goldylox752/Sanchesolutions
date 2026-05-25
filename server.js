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

/* ───── MEMORY ───── */
const sessions = {};

/* ───── SMART KNOWLEDGE BASE ───── */
const knowledge = {
  website: [
    "We build high-converting websites designed to turn visitors into paying customers.",
    "A strong website should focus on speed, clarity, and conversion."
  ],
  seo: [
    "We help businesses rank on Google and get consistent organic traffic.",
    "SEO is the long-term way to get free leads without ads."
  ],
  pricing: [
    "Most projects range from $300–$1500 depending on complexity.",
    "Pricing depends on features like automation, SEO, and integrations."
  ],
  automation: [
    "We build AI-like automation systems that handle leads and follow-ups automatically.",
    "Automation saves time and increases conversion rates."
  ],
  contact: [
    "You can reach us on WhatsApp at +1 780-267-9673 for fastest response."
  ]
};

/* ───── KEYWORD ENGINE ───── */
function detectIntent(msg) {
  msg = msg.toLowerCase();

  const map = {
    website: ["website", "web", "site", "landing"],
    seo: ["seo", "google", "rank", "traffic"],
    pricing: ["price", "cost", "how much"],
    automation: ["automation", "ai", "bot", "crm"],
    contact: ["whatsapp", "contact", "call", "talk"]
  };

  for (const key in map) {
    if (map[key].some(k => msg.includes(k))) {
      return key;
    }
  }

  return null;
}

/* ───── RESPONSE BUILDER (IMPORTANT) ───── */
function generateReply(intent, message) {
  if (!intent) {
    return "Got it — what are you trying to build? I can help you with websites, SEO, or automation systems.";
  }

  const responses = knowledge[intent];

  // random “AI-like” variation
  const base = responses[Math.floor(Math.random() * responses.length)];

  if (intent === "pricing") {
    return base + " What budget range are you thinking?";
  }

  if (intent === "website") {
    return base + " What type of business do you run?";
  }

  if (intent === "seo") {
    return base + " Are you currently getting any traffic?";
  }

  return base;
}

/* ───── BOT ENDPOINT ───── */
app.post("/api/bot", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message provided" });
    }

    /* session */
    if (!sessions[sessionId]) {
      sessions[sessionId] = { step: 0 };
    }

    const intent = detectIntent(message);
    const reply = generateReply(intent, message);

    /* save lead */
    await supabase.from("leads").insert([
      {
        session_id: sessionId,
        message,
        reply,
        intent: intent || "unknown"
      }
    ]);

    res.json({
      reply,
      intent: intent || "unknown"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Server error — try again later"
    });
  }
});

/* ───── HEALTH ───── */
app.get("/", (req, res) => {
  res.send("Sanche FREE AI Bot + Supabase 🚀");
});

/* ───── START ───── */
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on", port));