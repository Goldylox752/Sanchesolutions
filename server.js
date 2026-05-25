import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "groq-stream-ai",
    model: "llama3-8b-8192",
  });
});

/* =========================================
   GROQ STREAMING ENGINE (FIXED)
========================================= */

async function streamGroq(message, res) {
  if (!GROQ_API_KEY) {
    res.write("Server missing GROQ_API_KEY");
    return res.end();
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant for a SaaS automation company. Be concise, persuasive, and helpful.",
            },
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_tokens: 400,
        }),
      }
    );

    if (!response.ok || !response.body) {
      const errText = await response.text();
      console.error("Groq error:", errText);
      res.write("AI error. Try again later.");
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.replace("data:", "").trim();

        if (jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr);
          const token = json?.choices?.[0]?.delta?.content;

          if (token) {
            res.write(token);
          }
        } catch (err) {
          // ignore malformed chunks safely
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("Stream crash:", err);
    res.write("AI stream failed.");
    res.end();
  }
}

/* =========================================
   CHAT ROUTE
========================================= */

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  // streaming headers (IMPORTANT for Render/Vercel)
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  await streamGroq(message, res);
});

/* =========================================
   SAFETY HANDLERS
========================================= */

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

/* =========================================
   START SERVER
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Groq AI server running on port ${PORT}`);
});