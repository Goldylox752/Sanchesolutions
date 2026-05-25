import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// memory (optional fallback)
const sessions = {};

// intents
const intents = [
  {
    name: "website",
    keywords: ["website", "web", "site"],
    reply: "We build high-converting websites that turn visitors into leads. What kind of business do you run?"
  },
  {
    name: "seo",
    keywords: ["seo", "google", "rank"],
    reply: "We help you rank on Google and get organic leads without ads."
  },
  {
    name: "pricing",
    keywords: ["price", "cost", "how much"],
    reply: "Most websites range from $300–$1500 depending on features. What are you looking for?"
  },
  {
    name: "whatsapp",
    keywords: ["whatsapp", "call", "contact"],
    reply: "You can reach us on WhatsApp at +1 780-267-9673 for fastest response."
  }
];

// intent matcher
function getIntent(msg) {
  msg = msg.toLowerCase();

  return intents.find(i =>
    i.keywords.some(k => msg.includes(k))
  );
}

// BOT ENDPOINT
app.post("/api/bot", async (req, res) => {
  try {
    const { message, sessionId = "default" } = req.body;

    if (!sessions[sessionId]) {
      sessions[sessionId] = { step: 0 };
    }

    const intent = getIntent(message);

    let reply =
      intent?.reply ||
      "What type of business are you trying to grow?";

    // save to Supabase
    await supabase.from("leads").insert([
      {
        session_id: sessionId,
        message,
        reply,
        intent: intent?.name || "unknown"
      }
    ]);

    res.json({
      reply,
      intent: intent?.name || "unknown"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error" });
  }
});

// health
app.get("/", (req, res) => {
  res.send("Sanche Bot + Supabase Running 🚀");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on", port));