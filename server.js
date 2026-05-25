import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
   GROQ FAST AI (LLaMA 3)
=============================== */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function generateReply(message = "") {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for a business automation company. Be concise and practical."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();

    return data?.choices?.[0]?.message?.content ||
      "I can help you with automation, SEO, and AI systems.";

  } catch (err) {
    console.error("Groq error:", err);
    return "AI temporarily unavailable.";
  }
}

/* ===============================
   CHAT ENDPOINT (STREAM STYLE)
=============================== */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).end("No message");
    }

    const reply = await generateReply(message);

    // fake streaming (smooth ChatGPT feel)
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for (let i = 0; i < reply.length; i++) {
      res.write(reply[i]);
      await new Promise(r => setTimeout(r, 5)); // VERY FAST typing
    }

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).end("Server error");
  }
});

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    ai: "groq-llama3-fast"
  });
});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("⚡ Fast AI running on port", PORT);
});