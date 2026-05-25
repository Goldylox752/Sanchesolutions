import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────
   AGENTS
───────────────────────────── */

const agents = {
  router: `You are a routing system.

Return ONLY one word:
sales, technical, seo, automation, closer, support

Choose based on intent, not keywords.`,

  sales: `You are a sales assistant. Focus on value, benefits, and conversion.`,

  technical: `You are a technical support assistant. Be clear and practical.`,

  seo: `You are an SEO expert. Focus on rankings, keywords, and optimization.`,

  automation: `You are an automation expert. Focus on workflows and systems.`,

  closer: `You are a high-conversion sales closer. Be confident and persuasive.`,

  support: `You are a customer support agent. Be helpful and calm.`
};

/* ─────────────────────────────
   STAGE DETECTION (metadata only)
───────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  const decisionKeywords = [
    "price",
    "pricing",
    "cost",
    "quote",
    "how much",
    "$"
  ];

  const purchaseKeywords = [
    "buy",
    "book",
    "pay",
    "start now",
    "let's do it"
  ];

  if (purchaseKeywords.some(w => msg.includes(w))) return "purchase";
  if (decisionKeywords.some(w => msg.includes(w))) return "decision";

  return "awareness";
}

/* ─────────────────────────────
   ROUTER (AI DECIDES AGENT)
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

    const result =
      res.choices?.[0]?.message?.content?.trim()?.toLowerCase();

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
   AGENT EXECUTION
───────────────────────────── */

async function runAgent({ agentName, session, message }) {
  try {
    const systemPrompt = agents[agentName] || agents.sales;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (Array.isArray(session?.messages)) {
      messages.push(...session.messages.slice(-8));
    }

    messages.push({ role: "user", content: message });

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature:
        agentName === "closer"
          ? 0.4
          : agentName === "support"
          ? 0.3
          : 0.6,
      max_tokens: 300,
      messages
    });

    return res.choices?.[0]?.message?.content || "Need more details.";
  } catch (err) {
    console.error("Agent error:", err);
    return "Something went wrong. Please try again.";
  }
}

/* ─────────────────────────────
   MAIN ORCHESTRATOR
───────────────────────────── */

export async function generateMultiAgentReply({
  session = {},
  message = ""
}) {
  const stage = detectStage(message);

  let agent = await routeAgent(message);

  // Only upgrade to closer on strong purchase intent
  if (stage === "purchase") {
    agent = "closer";
  }

  const reply = await runAgent({
    agentName: agent,
    session,
    message
  });

  return {
    success: true,
    reply,
    agent,
    stage,
    priority: stage === "purchase" ? "hot" : "normal"
  };
}