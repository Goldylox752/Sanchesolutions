import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Smart Sales Bot (Upgraded)
app.post("/api/bot", (req, res) => {
  const msg = (req.body.message || "").toLowerCase();

  // intent scoring system
  const rules = [
    {
      keywords: ["website", "web", "build", "site"],
      reply:
        "We build high-converting websites designed to bring you leads, not just look good. What type of business do you run?"
    },
    {
      keywords: ["seo", "google", "rank", "traffic"],
      reply:
        "We help businesses rank higher on Google and get consistent organic leads without ads."
    },
    {
      keywords: ["price", "cost", "pricing", "how much"],
      reply:
        "Pricing depends on your project, but most business websites start between $300–$800 depending on features."
    },
    {
      keywords: ["automation", "ai", "bot", "system"],
      reply:
        "We build automation systems that save time and handle leads automatically for your business."
    },
    {
      keywords: ["contact", "whatsapp", "call", "talk"],
      reply:
        "You can reach us directly on WhatsApp at +1 780-267-9673 and we’ll respond quickly."
    }
  ];

  // find best match
  const match = rules.find(r =>
    r.keywords.some(k => msg.includes(k))
  );

  // smarter fallback (NOT dumb anymore)
  const fallbackMessages = [
    "Got it — can you tell me a bit more about your business so I can recommend the right solution?",
    "I can help you build a website, improve SEO, or automate your leads. What are you focused on right now?",
    "Are you trying to get more customers online or improve your current website?"
  ];

  const reply = match
    ? match.reply
    : fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

  res.json({ reply });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on", port));