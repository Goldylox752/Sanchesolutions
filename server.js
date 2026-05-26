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
   GROQ STREAM ENGINE (FIXED + STABLE)
========================================= */

async function streamGroq(message, res) {
  if (!GROQ_API_KEY) {
    res.status(500).send("Missing GROQ_API_KEY");
    return;
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
                "You are a high-performance SaaS automation assistant. Be concise, practical, and sales-focused.",
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    if (!response.ok || !response.body) {
      const err = await response.text();
      console.error("Groq API error:", err);
      res.status(500).send("AI temporarily unavailable.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    // IMPORTANT: force headers flush (fixes Render buffering)
    res.flushHeaders?.();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();

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
          // ignore malformed chunks from Groq stream
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("Stream crash:", err);
    res.status(500).send("Stream error occurred.");
  }
}

/* =========================================
   CHAT ROUTE
========================================= */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // FIX: streaming-safe headers for Render + proxies
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    await streamGroq(message, res);
  } catch (err) {
    console.error("Route error:", err);
    res.status(500).send("Server error");
  }
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