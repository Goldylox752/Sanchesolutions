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

/* ───── MEMORY STORE (session context) ───── */
const sessions = {};

/* ───── KNOWLEDGE BASE ───── */
const knowledge = {
  website: [
    "We build high-converting websites designed to turn visitors into paying customers.",
    "A strong website focuses on speed, clarity, and conversion."
  ],
  seo: [
    "We help businesses rank on Google and generate consistent organic traffic.",
    "SEO is the long-term strategy for free leads without ads."
  ],
  pricing: [
    "Most projects range between $300–$1500 depending on complexity.",
    "Pricing depends on features like SEO, automation, and integrations."
  ],
  automation: [
    "We build AI-style automation systems that handle leads, follow-ups, and CRM workflows.",
    "Automation increases conversions while saving time."
  ],
  contact: [
    "You can reach us on WhatsApp at +1 780-267-9673 for fastest response."
  ]
};

/* ───── INTENT SCORING (UPGRADED) ───── */
const intentMap = {
  website: ["website", "web", "site", "landing", "build"],
  seo: ["seo", "google", "rank", "traffic"],
  pricing: ["price", "cost", "how much", "pricing", "$"],
  automation: ["automation", "ai", "bot", "crm", "system"],
  contact: ["whatsapp", "contact", "call", "talk"]
};

function detectIntent(message = "") {
  const msg = message.toLowerCase();

  let best = { intent: null, score: 0 };

  for (const key in intentMap) {
    let score = 0;

    for (const keyword of intentMap[key]) {
      if (msg.includes(keyword)) {
        score += 1;
      }
    }

    if (score > best.score) {
      best = { intent: key, score };
    }
  }

  return best.intent;
}

/* ───── LLM-STYLE RESPONSE ENGINE ───── */
function generateReply(intent, message, sessionId) {
  const session = sessions[sessionId];

  // store last message context
  session.lastMessage = message;

  const fallback = [
    "Got it — what are you trying to build exactly?",
    "I can help you with websites, SEO, or automation. What are you focused on?",
    "Tell me a bit more about your business so I can guide you properly."
  ];

  if (!intent) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  const base =
    knowledge[intent][
      Math.floor(Math.random() * knowledge[intent].length)
    ];

  // contextual expansion (makes it feel “AI-like”)
  const contextAdditions = {
    website: "What type of business is this for?",
    seo: "Are you currently getting traffic?",
    pricing: "What budget range are you thinking?",
    automation: "Do you want leads automated or full CRM setup?",
    contact: "Want me to connect you directly with a rep?"
  };

  return `${base} ${contextAdditions[intent] || ""}`;
}

/* ───── BOT ENDPOINT ───── */
app.post("/api/bot", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message provided" });
    }

    /* session init */
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        createdAt: Date.now(),
        messages: []
      };
    }

    const intent = detectIntent(message);
    const reply = generateReply(intent, message, sessionId);

    /* save memory */
    sessions[sessionId].messages.push({
      role: "user",
      message
    });

    sessions[sessionId].messages.push({
      role: "bot",
      message: reply
    });

    /* supabase logging */
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
      reply: "Server error — please try again."
    });
  }
});

/* ───── HEALTH ───── */
app.get("/", (req, res) => {
  res.send("Sanche AI Bot (LLaMA-style engine) 🚀");
});

/* ───── START ───── */
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log("Server running on port", port)
);