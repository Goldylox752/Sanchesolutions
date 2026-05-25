import OpenAI from "openai";

/* ─────────────────────────────────────────────
   OPENAI CLIENT
───────────────────────────────────────────── */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────────────────────
   AGENTS (STRONGER SYSTEM PROMPTS)
───────────────────────────────────────────── */

const agents = {
  router: `
You are a routing classifier for an AI sales system.

Choose ONLY ONE label:

sales | technical | seo | automation | closer | support

Rules:
- Output ONLY the word
- No punctuation
- No explanation
- If unsure → sales
- If pricing/booking/decision intent → closer
`,

  sales: `
You are an AI sales consultant for Sanche AI.

Your job:
- Identify business needs
- Explain value clearly
- Keep responses short (2–6 lines)
- Ask 1 smart follow-up question
- Focus on revenue outcomes, not features
`,

  technical: `
You are a senior software engineer.

Explain:
- APIs
- hosting
- deployment
- integrations

Rules:
- simple language
- practical solutions only
`,

  seo: `
You are an elite SEO strategist.

Focus on:
- rankings
- traffic growth
- conversions

Give actionable steps only.
`,

  automation: `
You are an AI automation engineer.

Focus on:
- workflows
- CRM systems
- integrations
- scaling operations

Keep answers structured and practical.
`,

  closer: `
You are a HIGH-CONVERSION sales closer for an AI agency.

Your job:
- Turn interest into action
- Push toward booking or deposit
- Create urgency without being aggressive
- Always end with a CTA

Rules:
- Be confident
- Be short
- Always suggest next step:
  "Book a $500 strategy call" OR "Secure a $1K build slot"
`,

  support: `
You are customer support.

Be:
- simple
- helpful
- fast
- solution-focused
`
};

/* ─────────────────────────────────────────────
   ROUTER (IMPROVED ACCURACY)
───────────────────────────────────────────── */

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

    const result = res.choices?.[0]?.message?.content
      ?.trim()
      ?.toLowerCase();

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

/* ─────────────────────────────────────────────
   STAGE DETECTION (FIXED LOGIC)
───────────────────────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  const decisionKeywords = [
    "price", "pricing", "cost", "quote", "how much", "$"
  ];

  const purchaseKeywords = [
    "book", "pay", "buy", "start", "ready", "let's do it"
  ];

  const interestKeywords = [
    "seo", "website", "automation", "chatbot", "ai", "leads"
  ];

  if (decisionKeywords.some(w => msg.includes(w))) {
    return "decision";
  }

  if (purchaseKeywords.some(w => msg.includes(w))) {
    return "purchase";
  }

  if (interestKeywords.some(w => msg.includes(w))) {
    return "interest";
  }

  return "awareness";
}

/* ─────────────────────────────────────────────
   AGENT RUNNER (MORE RELIABLE)
───────────────────────────────────────────── */

async function runAgent({ agentName, session, message }) {
  try {
    const systemPrompt = agents[agentName] || agents.sales;

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // safe memory handling
    if (Array.isArray(session?.messages)) {
      messages.push(...session.messages.slice(-8));
    }

    messages.push({ role: "user", content: message });

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: agentName === "closer" ? 0.5 : 0.7,
      max_tokens: 300,
      messages
    });

    return (
      res.choices?.[0]?.message?.content ||
      "Can you give me a bit more detail?"
    );

  } catch (err) {
    console.error("Agent error:", err);
    return "Something went wrong. Try again shortly.";
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

    // FORCE CLOSER FOR MONEY INTENT
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
      priority:
        stage === "decision" || stage === "purchase"
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