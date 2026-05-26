import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ─────────────────────────────
   GROQ CLIENT
───────────────────────────── */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ─────────────────────────────
   MEMORY STORE
───────────────────────────── */

const memory = new Map();

function getMemory(sessionId) {
  if (!memory.has(sessionId)) memory.set(sessionId, []);
  return memory.get(sessionId);
}

/* ─────────────────────────────
   AGENTS
───────────────────────────── */

const agents = {
  router: `
Classify intent into ONE word:
sales, technical, seo, automation, closer, support
Return only one word.
`,

  sales: `You are a sales engineer. Focus on ROI and booking demos.`,
  technical: `You are a senior engineer. Give clear step-by-step fixes.`,
  seo: `You are an SEO expert. Focus on traffic growth.`,
  automation: `You design AI workflows and automation systems.`,
  closer: `You are a high conversion closer. Push toward booking.`,
  support: `You are support. Keep answers simple.`
};

/* ─────────────────────────────
   ROUTER (FREE GROQ VERSION)
───────────────────────────── */

async function routeAgent(message) {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: agents.router },
        { role: "user", content: message }
      ],
      temperature: 0
    });

    const result = res.choices[0].message.content
      .trim()
      .toLowerCase();

    const valid = ["sales","technical","seo","automation","closer","support"];

    return valid.includes(result) ? result : "sales";
  } catch (err) {
    console.error("Router error:", err);
    return "sales";
  }
}

/* ─────────────────────────────
   RESPONSE STREAM (GROQ)
───────────────────────────── */

async function streamResponse({ agent, message, res }) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      stream: true,
      temperature: 0.7,
      max_tokens: 400,
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
    res.write("AI temporarily unavailable.");
    res.end();
  }
}

/* ─────────────────────────────
   CHAT ROUTE
───────────────────────────── */

app.post("/chat", async (req, res) => {
  const { message = "", sessionId = "default" } = req.body;

  if (!message.trim()) {
    return res.status(400).json({ error: "No message provided" });
  }

  const agent = await routeAgent(message);

  const history = getMemory(sessionId);
  history.push({ role: "user", content: message });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");

  await streamResponse({
    agent,
    message,
    res
  });

  history.push({ role: "assistant", content: "streamed" });
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "SancheSolutions AI Running (Groq)",
    memory: true,
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