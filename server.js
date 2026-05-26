import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ─────────────────────────────
   SIMPLE AI BRAIN (NO DEPENDENCIES)
───────────────────────────── */

function fakeAI(message) {
  const msg = message.toLowerCase();

  if (msg.includes("price") || msg.includes("cost")) {
    return "💰 Pricing depends on your needs. Most automation systems start around $1,500–$3,000/month depending on complexity.";
  }

  if (msg.includes("demo") || msg.includes("book")) {
    return "📅 I can help you book a demo. What does your business do?";
  }

  if (msg.includes("ai") || msg.includes("automation")) {
    return "🤖 We build AI systems that automate leads, sales, CRM, and customer support workflows.";
  }

  if (msg.includes("lead")) {
    return "🎯 Our system captures, qualifies, and converts leads automatically 24/7.";
  }

  if (msg.includes("hello") || msg.includes("hi")) {
    return "👋 Hey! I’m your SancheSolutions AI assistant. How can I help you scale?";
  }

  return "✨ Tell me more about your business so I can recommend the right automation system.";
}

/* ─────────────────────────────
   CHAT ROUTE
───────────────────────────── */

app.post("/chat", async (req, res) => {
  const { message = "" } = req.body;

  if (!message.trim()) {
    return res.status(400).json({ error: "No message provided" });
  }

  const reply = fakeAI(message);

  res.json({ reply });
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "SancheSolutions AI Online",
    mode: "fallback-ai (no dependencies)"
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});