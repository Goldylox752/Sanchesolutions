import OpenAI from "openai";

/* ─────────────────────────────────────────────
   OPENAI CLIENT
───────────────────────────────────────────── */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────────────────────
   AGENTS
───────────────────────────────────────────── */

const agents = {
  router: `
You are a routing system.

Return ONLY one word from:
sales, technical, seo, automation, closer, support
No punctuation. No explanation.
`,

  sales: `
You are a sales consultant for Sanche AI.
Be concise, helpful, and conversational.
Focus on business value and outcomes.
`,

  technical: `
You are a senior software engineer.
Explain APIs, hosting, deployment, and systems clearly and simply.
`,

  seo: `
You are an SEO expert.
Focus on rankings, traffic, and actionable improvements.
`,

  automation: `
You are an automation engineer.
Focus on workflows, integrations, and scaling systems.
`,

  closer: `
You are a conversion specialist.
Be persuasive but calm. Focus on clarity and next steps.
`,

  support: `
You are support.
Solve issues clearly and simply.
`
};

/* ─────────────────────────────────────────────
   ROUTER
───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   STAGE DETECTION
───────────────────────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  if (["price", "cost", "quote", "pricing"].some(w => msg.includes(w)))
    return "decision";

  if (["book", "pay", "start", "ready"].some(w => msg.includes(w)))
    return "purchase";

  if (["seo", "website", "automation", "chatbot", "ai"].some(w => msg.includes(w)))
    return "interest";

  return "awareness";
}

/* ─────────────────────────────────────────────
   AGENT RUNNER
───────────────────────────────────────────── */

async function runAgent({ agentName, session, message }) {
  try {
    const systemPrompt = agents[agentName] || agents.sales;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // safe memory
    if (Array.isArray(session?.messages)) {
      messages.push(...session.messages.slice(-10));
    }

    messages.push({ role: "user", content: message });

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 300,
      messages
    });

    return (
      res.choices?.[0]?.message?.content ||
      "Can you tell me a bit more?"
    );
  } catch (err) {
    console.error("Agent error:", err);
    return "Something went wrong. Please try again.";
  }
}

/* ─────────────────────────────────────────────
   MAIN ENGINE
───────────────────────────────────────────── */

export async function generateMultiAgentReply({
  session = {},
  message = ""
}) {
  try {
    const stage = detectStage(message);

    let agent = await routeAgent(message);

    // override for sales intent
    if (stage === "decision" || stage === "purchase") {
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
      priority: stage === "decision" || stage === "purchase"
        ? "hot"
        : "normal"
    };

  } catch (err) {
    console.error("System error:", err);

    return {
      success: false,
      reply: "Service temporarily unavailable. Try again.",
      agent: "support",
      stage: "awareness",
      priority: "normal"
    };
  }
}