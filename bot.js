import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   AI CLIENT
───────────────────────────── */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────
   AGENTS
───────────────────────────── */

const agents = {
  router: `Return ONLY one word:
sales, technical, seo, automation, closer, support`,

  sales: `You are a sales assistant focused on value and conversion.`,

  technical: `You are a technical support assistant.`,

  seo: `You are an SEO expert.`,

  automation: `You are an automation expert.`,

  closer: `You are a high-conversion sales closer.`,

  support: `You are a helpful support agent.`
};

/* ─────────────────────────────
   STAGE DETECTION
───────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  if (msg.includes("buy") || msg.includes("pay") || msg.includes("start")) {
    return "purchase";
  }

  if (msg.includes("price") || msg.includes("cost")) {
    return "decision";
  }

  return "awareness";
}

/* ─────────────────────────────
   ROUTER
───────────────────────────── */

async function routeAgent(message) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 8,
      messages: [
        { role: "system", content: agents.router },
        { role: "user", content: message }
      ]
    });

    const result = res.choices?.[0]?.message?.content?.trim().toLowerCase();

    const valid = new Set([
      "sales",
      "technical",
      "seo",
      "automation",
      "closer",
      "support"
    ]);

    return valid.has(result) ? result : "sales";

  } catch (err) {
    console.error("Router error:", err);
    return "sales";
  }
}

/* ─────────────────────────────
   STREAM FUNCTION
───────────────────────────── */

async function streamResponse({ agent, message, res }) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.6,
      max_tokens: 300,
      messages: [
        { role: "system", content: agents[agent] || agents.sales },
        { role: "user", content: message }
      ]
    });

    for await (const chunk of completion) {
      const token = chunk.choices?.[0]?.delta?.content;
      if (token) res.write(token);
    }

    res.end();

  } catch (err) {
    console.error("Stream error:", err);
    res.write("AI error occurred.");
    res.end();
  }
}

/* ─────────────────────────────
   MAIN CHAT ROUTE
───────────────────────────── */

app.post("/chat", async (req, res) => {
  const { message = "" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  const stage = detectStage(message);
  let agent = await routeAgent(message);

  if (stage === "purchase") {
    agent = "closer";
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  await streamResponse({
    agent,
    message,
    res
  });
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    streaming: true
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});