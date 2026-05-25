import OpenAI from "openai";

/* ─────────────────────────────────────────────
   OPENAI CLIENT
───────────────────────────────────────────── */

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

Your ONLY responsibility:
- Analyze the user's message
- Decide which specialist should respond

Available agents:
- sales
- technical
- seo
- automation
- closer
- support

Rules:
- Return ONLY the agent name
- No explanations
- No punctuation
`
  },

  sales: {
    role: `
You are a high-converting AI sales consultant for Sanche AI.

Goals:
- Understand the client's business
- Identify pain points
- Position solutions clearly
- Build trust
- Move conversations toward booking

Services include:
- AI chatbots
- Automation systems
- CRM integrations
- High-converting websites
- SEO systems
- Lead generation infrastructure

Tone:
- Professional
- Clear
- Concise
- Human
- Helpful

Rules:
- Keep replies short and conversational
- Ask strategic follow-up questions
- Never sound robotic
`
  },

  technical: {
    role: `
You are a senior technical consultant.

Responsibilities:
- Explain APIs
- Explain hosting
- Explain integrations
- Explain deployment
- Explain software architecture
- Explain frontend/backend systems

Rules:
- Keep explanations simple
- Avoid unnecessary jargon
- Be practical and solution-focused
`
  },

  seo: {
    role: `
You are an elite SEO strategist.

Responsibilities:
- Local SEO
- Technical SEO
- Google indexing
- Keyword strategy
- Content optimization
- SEO audits
- Performance optimization

Focus:
- Rankings
- Organic traffic
- Lead generation
- Business growth

Rules:
- Give actionable advice
- Focus on measurable impact
`
  },

  automation: {
    role: `
You are an AI automation engineer.

Responsibilities:
- CRM automation
- Lead follow-up systems
- AI chatbots
- Workflow automation
- Sales pipelines
- API integrations

Focus:
- Saving time
- Increasing revenue
- Reducing manual work

Rules:
- Explain systems clearly
- Prioritize scalable solutions
`
  },

  closer: {
    role: `
You are the closing specialist.

Responsibilities:
- Handle objections
- Create urgency
- Encourage booking
- Push toward action
- Increase conversion rates

Rules:
- Never sound aggressive
- Be persuasive but professional
- Focus on value and outcomes
`
  },

  support: {
    role: `
You are a support specialist.

Responsibilities:
- Help users
- Solve problems
- Explain next steps
- Stay calm and professional

Rules:
- Be concise
- Be helpful
- Avoid technical overload
`
  }
};

/* ─────────────────────────────────────────────
   ROUTER AGENT
───────────────────────────────────────────── */

async function routeAgent(message) {
  try {
    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        temperature: 0,

        max_tokens: 10,

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

    const result =
      completion.choices?.[0]?.message?.content
        ?.trim()
        ?.toLowerCase();

    const validAgents = [
      "sales",
      "technical",
      "seo",
      "automation",
      "closer",
      "support"
    ];

    return validAgents.includes(result)
      ? result
      : "sales";

  } catch (error) {
    console.error("Router Agent Error:", error);

    return "sales";
  }
}

/* ─────────────────────────────────────────────
   SALES STAGE DETECTION
───────────────────────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  if (
    msg.includes("price") ||
    msg.includes("pricing") ||
    msg.includes("cost") ||
    msg.includes("quote")
  ) {
    return "decision";
  }

  if (
    msg.includes("book") ||
    msg.includes("pay") ||
    msg.includes("start") ||
    msg.includes("ready")
  ) {
    return "purchase";
  }

  if (
    msg.includes("seo") ||
    msg.includes("website") ||
    msg.includes("automation") ||
    msg.includes("chatbot") ||
    msg.includes("ai")
  ) {
    return "interest";
  }

  return "awareness";
}

/* ─────────────────────────────────────────────
   SPECIALIST RESPONSE
───────────────────────────────────────────── */

async function runAgent({
  agentName,
  session,
  message
}) {
  try {
    const agent =
      agents[agentName] || agents.sales;

    const messages = [
      {
        role: "system",
        content: agent.role
      }
    ];

    /* SESSION MEMORY */
    if (
      session?.messages &&
      Array.isArray(session.messages)
    ) {
      messages.push(
        ...session.messages.slice(-10)
      );
    }

    messages.push({
      role: "user",
      content: message
    });

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        temperature: 0.7,

        max_tokens: 300,

        messages
      });

    return (
      completion.choices?.[0]?.message
        ?.content ||
      "I'd be happy to help. Can you tell me a bit more about what you're looking to build?"
    );

  } catch (error) {
    console.error("Agent Error:", error);

    return "Something went wrong on our side. Please try again in a moment.";
  }
}

/* ─────────────────────────────────────────────
   MAIN AI ENGINE
───────────────────────────────────────────── */

export async function generateMultiAgentReply({
  session = {},
  message = ""
}) {
  try {
    /* STEP 1: DETECT STAGE */
    const stage =
      detectStage(message);

    /* STEP 2: ROUTE AGENT */
    let selectedAgent =
      await routeAgent(message);

    /* STEP 3: CLOSER OVERRIDE */
    if (
      stage === "decision" ||
      stage === "purchase"
    ) {
      selectedAgent = "closer";
    }

    /* STEP 4: GENERATE RESPONSE */
    const reply =
      await runAgent({
        agentName: selectedAgent,
        session,
        message
      });

    /* STEP 5: HOT LEAD DETECTION */
    const hotLead =
      stage === "decision" ||
      stage === "purchase";

    return {
      success: true,

      reply,

      agent: selectedAgent,

      stage,

      priority: hotLead
        ? "hot"
        : "normal"
    };

  } catch (error) {
    console.error(
      "Multi-Agent System Error:",
      error
    );

    return {
      success: false,

      reply:
        "Something went wrong. Please try again shortly.",

      agent: "support",

      stage: "awareness",

      priority: "normal"
    };
  }
}