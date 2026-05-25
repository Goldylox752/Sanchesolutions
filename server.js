import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   OPENAI
───────────────────────────── */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────
   SIMPLE AGENT LOGIC
───────────────────────────── */

async function generateReply(message) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant for a sales automation company."
      },
      {
        role: "user",
        content: message
      }
    ]
  });

  return res.choices[0].message.content;
}

/* ─────────────────────────────
   CHAT ROUTE (THIS IS YOUR URL)
───────────────────────────── */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await generateReply(message);

    res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      reply: "Server error"
    });
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});