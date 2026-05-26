import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ─────────────────────────────
   GROQ CLIENT
───────────────────────────── */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ─────────────────────────────
   CHAT ENDPOINT
───────────────────────────── */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are an elite AI assistant for a SaaS business website. Be concise, helpful, and sales-focused."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "SancheSolutions AI running (Groq)",
    ai: "enabled"
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});