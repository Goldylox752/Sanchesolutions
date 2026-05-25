import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */

app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   OPENAI CLIENT
───────────────────────────── */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────
   AI RESPONSE ENGINE
───────────────────────────── */

async function generateReply(message = "") {
  if (!message || typeof message !== "string") {
    return "Invalid message";
  }

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant for a sales automation company. Be helpful, clear, and business-focused."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    return res.choices?.[0]?.message?.content || "No response generated";
  } catch (err) {
    console.error("OpenAI Error:", err);
    return "AI service error";
  }
}

/* ─────────────────────────────
   CHAT ENDPOINT
───────────────────────────── */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await generateReply(message);

    return res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error("Route Error:", err);

    return res.status(500).json({
      success: false,
      reply: "Server error"
    });
  }
});

/* ─────────────────────────────
   HEALTH CHECK (IMPORTANT)
───────────────────────────── */

app.get("/", (req, res) => {
  res.send("Sanche AI API is running");
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});