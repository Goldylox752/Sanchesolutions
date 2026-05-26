import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   OPENAI CLIENT
───────────────────────────── */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant for a business website. Be concise and useful."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({ status: "AI server running" });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 AI server running on port", PORT);
});