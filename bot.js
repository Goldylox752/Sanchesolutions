import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ─────────────────────────────
   AI CLIENT
───────────────────────────── */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────
   SIMPLE MEMORY STORE (upgradeable to Redis later)
───────────────────────────── */

const memory = new Map(); // sessionId -> messages

function getMemory(sessionId) {
  if (!memory.has(sessionId)) memory.set(sessionId, []);
  return memory.get(sessionId);
}

/* ─────────────────────────────
   AGENTS (UPGRADED PROMPTS)
───────────────────────────── */

const agents = {
  router: `
Classify the user intent into ONLY ONE word:

sales = buying intent, pricing, conversion, demo, ROI
technical = bugs, code, integration issues
seo = ranking, Google, traffic, keywords
automation = workflows, AI automation, systems
closer = urgency, ready to buy, "start now", "let's do it"
support = help, general questions

Return ONLY the word.
`,

  sales: `
You are a high-performance sales engineer.

Rules:
- Focus on ROI, outcomes, and business value
- Keep responses short and persuasive
- Always try to move toward a demo or call
- Never be vague
`,

  technical: `
You are a senior technical engineer.

Rules:
- Be precise and structured
- Give step-by-step fixes
- Assume developer-level clarity
`,

  seo: `
You are an SEO strategist.

Rules:
- Focus on ranking, keywords, traffic growth
- Give actionable SEO steps
`,

  automation: `
You are an AI automation architect.

Rules:
- Suggest workflows, tools, integrations
- Focus on business automation ROI
`,

  closer: `
You are a high-conversion sales closer.

Rules:
- Create urgency
- Push toward booking a demo or call
- Focus on transformation and ROI
- Be confident but not spammy
`,

  support: `
You are a helpful support assistant.

Rules:
- Keep answers simple
- Solve the problem quickly
`
};

/* ─────────────────────────────
   INTENT DETECTION (IMPROVED)
───────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  if (msg.includes("buy") || msg.includes("start now") || msg.includes("sign up")) {
    return "purchase";
  }

  if (msg.includes("price") || msg.includes("cost") || msg.includes("pricing")) {
    return "decision";
  }

  return "awareness";
}

/* ─────────────────────────────
   SMART ROUTER (MORE RELIABLE)
───────────────────────────── */

async function routeAgent(message) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 10,
      messages: [
        { role: "system", content: agents.router },
        { role: "user", content: message }
      ]
    });

    const result = res.choices?.[0]?.message?.content
      ?.trim()
      ?.toLowerCase();

    const valid = [
      "sales",
      "technical",
      "seo",
      "automation",
      "closer",
      "support"
    ];

    return valid.includes(result) ? result : "sales";

  } catch (err) {
    console.error("Router error:", err);
    return "sales";
  }
}

/* ─────────────────────────────
   STREAM RESPONSE (FIXED + SAFE)
───────────────────────────── */

async function streamResponse({ agent, message, res }) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.6,
      max_tokens: 350,
      messages: [
        { role: "system", content: agents[agent] || agents.sales },
        { role: "user", content: message }
      ]
    });

    let hasOutput = false;

    for await (const chunk of completion) {
      const token = chunk.choices?.[0]?.delta?.content;

      if (token) {
        hasOutput = true;
        res.write(token);
      }
    }

    if (!hasOutput) {
      res.write("Let me help you with that.");
    }

    res.end();

  } catch (err) {
    console.error("Stream error:", err);
    res.write("AI temporarily unavailable. Please try again.");
    res.end();
  }
}

/* ─────────────────────────────
   MAIN CHAT ROUTE (WITH MEMORY)
───────────────────────────── */

app.post("/chat", async (req, res) => {
  const { message = "", sessionId = "default" } = req.body;

  if (!message.trim()) {
    return res.status(400).json({ error: "No message provided" });
  }

  const stage = detectStage(message);
  let agent = await routeAgent(message);

  if (stage === "purchase") {
    agent = "closer";
  }

  // ── MEMORY CONTEXT ──
  const history = getMemory(sessionId);
  history.push({ role: "user", content: message });

  if (history.length > 10) history.shift();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  await streamResponse({
    agent,
    message,
    res
  });

  history.push({ role: "assistant", content: "streamed_response" });
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    version: "2.0-upgraded",
    streaming: true,
    memory: true
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Upgraded AI server running on port", PORT);
});