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
   MEMORY (upgrade later to DB)
───────────────────────────── */

const sessions = new Map();
const leads = [];

/* ─────────────────────────────
   UTIL: EMAIL EXTRACTION
───────────────────────────── */

function extractEmail(text = "") {
  const match = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  return match ? match[0] : null;
}

/* ─────────────────────────────
   LEAD SCORING ENGINE
───────────────────────────── */

function scoreLead(message = "") {
  const msg = message.toLowerCase();
  let score = 0;

  if (msg.includes("price")) score += 20;
  if (msg.includes("cost")) score += 20;
  if (msg.includes("buy")) score += 40;
  if (msg.includes("start")) score += 40;
  if (msg.includes("demo")) score += 30;
  if (msg.includes("book")) score += 30;
  if (msg.includes("now")) score += 25;
  if (msg.includes("soon")) score += 10;

  return Math.min(score, 100);
}

/* ─────────────────────────────
   ROUTER (REVENUE OPTIMIZED)
───────────────────────────── */

async function route(message) {
  const score = scoreLead(message);

  if (score >= 70) return "closer";
  if (score >= 40) return "sales";
  return "automation";
}

/* ─────────────────────────────
   AGENTS (REVENUE FOCUSED)
───────────────────────────── */

const agents = {
  automation: `
You are a Revenue AI strategist.

Goal:
- Educate
- Build curiosity
- Qualify lead softly
- Ask about business size and goals
`,

  sales: `
You are a revenue-focused sales engineer.

Goal:
- Show ROI
- Push value
- Encourage demo booking
- Qualify lead aggressively but politely
`,

  closer: `
You are a high-performance closer AI.

Goal:
- Convert NOW
- Push urgency
- Ask for booking or next step immediately
- Focus on transformation and ROI
`
};

/* ─────────────────────────────
   MEMORY STORE
───────────────────────────── */

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, []);
  }
  return sessions.get(id);
}

/* ─────────────────────────────
   STREAM AI RESPONSE
───────────────────────────── */

async function streamAI({ message, agent, res }) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        { role: "system", content: agents[agent] },
        { role: "user", content: message }
      ]
    });

    let output = "";

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    for await (const chunk of completion) {
      const token = chunk.choices?.[0]?.delta?.content;
      if (token) {
        output += token;
        res.write(token);
      }
    }

    res.end();

    return output;

  } catch (err) {
    console.error("AI error:", err);
    res.write("AI temporarily unavailable.");
    res.end();
    return "";
  }
}

/* ─────────────────────────────
   MAIN CHAT ROUTE (REVENUE ENGINE)
───────────────────────────── */

app.post("/chat", async (req, res) => {
  const { message = "", sessionId = "default" } = req.body;

  if (!message.trim()) {
    return res.status(400).json({ error: "No message provided" });
  }

  /* ── LEAD PROCESSING ── */
  const email = extractEmail(message);
  const score = scoreLead(message);
  const agent = await route(message);

  const session = getSession(sessionId);

  session.push({
    role: "user",
    message,
    score
  });

  if (email) {
    leads.push({
      email,
      score,
      time: new Date().toISOString(),
      message
    });

    console.log("🔥 NEW LEAD CAPTURED:", email, "Score:", score);
  }

  /* ── STREAM RESPONSE ── */
  const responseText = await streamAI({
    message,
    agent,
    res
  });

  session.push({
    role: "assistant",
    message: responseText
  });
});

/* ─────────────────────────────
   LEADS DASHBOARD ENDPOINT
───────────────────────────── */

app.get("/leads", (req, res) => {
  res.json({
    total: leads.length,
    leads
  });
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "Revenue AI Active",
    leadsCaptured: leads.length
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Revenue AI running on port", PORT);
});