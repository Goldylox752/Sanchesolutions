import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const agents = {
  router: `...`,
  sales: `...`,
  technical: `...`,
  seo: `...`,
  automation: `...`,
  closer: `...`,
  support: `...`
};

function detectStage(message = "") {
  const msg = message.toLowerCase();

  const decisionKeywords = ["price", "pricing", "cost", "quote", "how much", "$"];
  const purchaseKeywords = ["book", "pay", "buy", "start", "ready", "let's do it"];
  const interestKeywords = ["seo", "website", "automation", "chatbot", "ai", "leads"];

  if (decisionKeywords.some(w => msg.includes(w))) return "decision";
  if (purchaseKeywords.some(w => msg.includes(w))) return "purchase";
  if (interestKeywords.some(w => msg.includes(w))) return "interest";
  return "awareness";
}

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

    const result = res.choices?.[0]?.message?.content?.trim()?.toLowerCase();

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

async function runAgent({ agentName, session, message }) {
  try {
    const systemPrompt = agents[agentName] || agents.sales;

    const messages = [{ role: "system", content: systemPrompt }];

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

    return res.choices?.[0]?.message?.content || "Need more details.";

  } catch (err) {
    console.error("Agent error:", err);
    return "Something went wrong.";
  }
}

export async function generateMultiAgentReply({ session = {}, message = "" }) {
  const stage = detectStage(message);

  let agent = await routeAgent(message);

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
    priority: stage === "decision" || stage === "purchase" ? "hot" : "normal"
  };
}