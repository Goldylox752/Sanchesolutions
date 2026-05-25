import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* =========================================
   STREAM GROQ (ROBUST SSE PARSER)
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
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "You are a high-performance AI assistant for a SaaS automation company. Be concise, sales-driven, and practical.",
            },
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_tokens: 400,
        }),
      }
    );

    if (!response.ok || !response.body) {
      console.error("Groq error:", await response.text());
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

      // split SSE safely
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const data = line.replace("data: