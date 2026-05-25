import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* =========================================
   REAL GROQ STREAMING (NO FAKE TYPING)
========================================= */

async function streamGroq(message, res) {
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
          stream: true, // 🔥 REAL STREAM ENABLED
          messages: [
            {
              role: "system",
              content:
                "You are a high-performance AI assistant for a business automation company. Be concise, direct, and sales-focused.",
            },
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_tokens: 400,
        }),
      }
    );

    if (!response.ok || !response.body) {
      console.error("Groq stream error");
      res.end("AI unavailable");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Groq sends SSE-style chunks → parse safely
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.includes("data:")) continue;

        const jsonStr = line.replace("data: ", "").trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr);
          const token = json?.choices?.[0]?.delta?.content;

          if (token) {
            res.write(token); // 🔥 real-time token stream
          }
        } catch (e) {
          // ignore bad chunk
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("Stream error:", err);
    res.end("AI error");
  }
}

/* =========================================
   CHAT ROUTE
========================================= */

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).end("No message provided");
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  await streamGroq(message, res);
});

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    ai: "groq-pro-stream",
    model: "llama3-8b-8192"
  });
});

/* =========================================
   SAFETY HANDLERS
========================================= */

process.on("uncaughtException", (err) =>
  console.error("Uncaught:", err)
);

process.on("unhandledRejection", (err) =>
  console.error("Rejection:", err)
);

/* =========================================
   START
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("⚡ PRO Groq AI running on port", PORT);
});