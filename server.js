import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ─────────────────────────────────────────────
   MULTI-AGENT AI SYSTEM
───────────────────────────────────────────── */

const agents = {
  router: {
    role: `
You are the routing agent.

Your ONLY job:
- Analyze user intent
- Decide which specialist agent should respond

Available agents:
- sales
- technical
- seo
- automation
- closer
- support

Return ONLY the agent name.
`
  },

  sales: {
    role: `
You are a high-converting AI sales consultant.

Goals:
- Understand business needs
- Build excitement
- Ask strategic questions
- Position services clearly
- Move toward booking or payment

Tone:
- Professional
- Confident
- Human
- Concise
`
  },

  technical: {
    role: `
You are a senior technical consultant.

Responsibilities:
- Explain websites
- Explain hosting
- Explain APIs
- Explain software architecture
- Explain integrations
- Explain deployment systems

Keep explanations simple but intelligent.
`
  },

  seo: {
    role: `
You are an elite SEO strategist.

Responsibilities:
- Local SEO
- Technical SEO
- Google rankings
- Keyword targeting
- Content strategy
- SEO audits

Focus on business growth and traffic.
`
  },

  automation: {
    role: `
You are an AI automation engineer.

Responsibilities:
- CRM systems
- Lead automation
- AI chatbots
- Sales pipelines
- Workflow systems
- Integrations

Focus on saving time and increasing revenue.
`
  },

  closer: {
    role: `
You are the closing agent.

Responsibilities:
- Handle objections
- Push toward decision
- Encourage booking/payment
- Create urgency
- Increase conversions

Never sound aggressive.
`
  },

  support: {
    role: `
You are a customer support specialist.

Responsibilities:
- Help users
- Solve issues
- Explain next steps
- Be calm and helpful
`
  }
};

/* ─────────────────────────────────────────────
   ROUTER AGENT
───────────────────────────────────────────── */

async function routeAgent(message) {
  const completion =
    await openai.chat.completions.create({
      model: "gpt-4.1-mini",

      temperature: 0,

      messages: [
        {
          role: "system",
          content: agents.router.role
        },

        {
          role: "user",
          content: message
        }
      ]
    });

  return completion.choices[0].message.content
    .trim()
    .toLowerCase();
}

/* ─────────────────────────────────────────────
   SPECIALIST RESPONSE
───────────────────────────────────────────── */

async function runAgent({
  agentName,
  session,
  message
}) {
  const agent =
    agents[agentName] || agents.sales;

  const completion =
    await openai.chat.completions.create({
      model: "gpt-4.1-mini",

      temperature: 0.8,

      messages: [
        {
          role: "system",
          content: agent.role
        },

        ...session.messages,

        {
          role: "user",
          content: message
        }
      ]
    });

  return completion.choices[0].message.content;
}

/* ─────────────────────────────────────────────
   SMART SALES PIPELINE
───────────────────────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  if (
    msg.includes("price") ||
    msg.includes("cost") ||
    msg.includes("quote")
  ) {
    return "decision";
  }

  if (
    msg.includes("seo") ||
    msg.includes("website") ||
    msg.includes("automation")
  ) {
    return "interest";
  }

  if (
    msg.includes("start") ||
    msg.includes("book") ||
    msg.includes("pay")
  ) {
    return "purchase";
  }

  return "awareness";
}

/* ─────────────────────────────────────────────
   MAIN AI ENGINE
───────────────────────────────────────────── */

async function generateMultiAgentReply({
  session,
  message
}) {
  /* Step 1: detect sales stage */
  const stage = detectStage(message);

  /* Step 2: choose specialist */
  let selectedAgent =
    await routeAgent(message);

  /* Step 3: override with closer */
  if (
    stage === "decision" ||
    stage === "purchase"
  ) {
    selectedAgent = "closer";
  }

  /* Step 4: run specialist */
  const reply = await runAgent({
    agentName: selectedAgent,
    session,
    message
  });

  return {
    reply,
    agent: selectedAgent,
    stage
  };
}