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
    streaming: true,
  });
});

/* =========================================
   GROQ STREAM ENGINE (ROBUST PRODUCTION)
========================================= */

async function streamGroq(message, res) {
  if (!GROQ_API_KEY) {
    res.write("Missing GROQ_API_KEY");
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
          temperature: 0.7,
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content:
                "You are a high-performance AI assistant for a SaaS automation and sales company. Be concise, practical, and conversion-focused.",
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    if (!response.ok || !response.body) {
      const err = await response.text();
      console.error("Groq API error:", err);
      res.write("AI temporarily unavailable.");
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
      buffer = lines.pop(); // keep incomplete chunk

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.replace("data:", "").trim();

        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr);
          const token = json?.choices?.[0]?.delta?.content;

          if (token) {
            res.write(token);
          }
        } catch (e) {
          // ignore malformed JSON chunks (Groq SSE noise)
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("Stream crash:", err);
    res.write("Stream error occurred.");
    res.end();
  }
}

/* =========================================
   CHAT ROUTE
========================================= */

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid message" });
  }

  // IMPORTANT: streaming headers (Render + proxies)
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  await streamGroq(message, res);
});

/* =========================================
   GLOBAL ERROR SAFETY
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