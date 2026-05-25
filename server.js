import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

/* =========================
   SMART INTENT BOT ENGINE
========================= */

const INTENTS = [
  {
    id: "website",
    keywords: ["website", "web", "build", "site", "landing page"],
    reply:
      "We build high-converting websites designed to bring you leads, not just look good. What type of business do you run?"
  },
  {
    id: "seo",
    keywords: ["seo", "google", "rank", "traffic", "search"],
    reply:
      "We help businesses rank higher on Google and generate consistent organic leads without ads."
  },
  {
    id: "pricing",
    keywords: ["price", "cost", "pricing", "how much", "$", "budget"],
    reply:
      "Most projects range from $300–$800 depending on features. If you tell me your goals, I can give an exact quote."
  },
  {
    id: "automation",
    keywords: ["automation", "ai", "bot", "crm", "system", "workflow"],
    reply:
      "We build automation systems that capture, follow up, and convert leads automatically for your business."
  },
  {
    id: "contact",
    keywords: ["contact", "whatsapp", "call", "talk", "human"],
    reply:
      "You can reach us directly on WhatsApp at +1 780-267-9673 and we’ll respond quickly."
  },
  {
    id: "stripe",
    keywords: ["pay", "checkout", "buy", "start", "purchase"],
    reply:
      "You can start your project securely through our checkout system. Want me to send you the payment link?"
  }
];

/* =========================
   BOT ENDPOINT
========================= */

app.post("/api/bot", (req, res) => {
  try {
    const msg = (req.body.message || "").toLowerCase().trim();

    // find best matching intent
    const match = INTENTS.find(intent =>
      intent.keywords.some(keyword => msg.includes(keyword))
    );

    // fallback responses (more natural)
    const fallback = [
      "Got it — what kind of business are you running?",
      "I can help you with websites, SEO, or automation. What are you trying to achieve?",
      "Tell me a bit more so I can recommend the right solution."
    ];

    const reply = match
      ? match.reply
      : fallback[Math.floor(Math.random() * fallback.length)];

    res.json({
      reply,
      intent: match?.id || "fallback"
    });

  } catch (err) {
    console.error("BOT ERROR:", err);
    res.status(500).json({
      reply: "Server error — please try WhatsApp instead."
    });
  }
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.send("Sanche Smart Bot API Running 🚀");
});

/* =========================
   START SERVER
========================= */

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});