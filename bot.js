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
   STAGE DETECTION
───────────────────────────── */

function detectStage(message = "") {
  const msg = message.toLowerCase();

  const decisionKeywords = ["price", "pricing", "cost", "quote", "how much", "$"];
  const purchaseKeywords = ["buy", "book", "pay", "start now", "let's do it"];

  if (purchaseKeywords.some(w => msg.includes(w))) return "purchase";
  if (decisionKeywords.some(w => msg.includes(w))) return "decision";

  return "awareness";
}

/* ─────────────────────────────
   ROUTER
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

/* ─────────────────────────────
   STREAMING AGENT EXECUTION
───────────────────────────── */

async function runAgentStream({ agentName, session, message, res }) {
  try {
    const systemPrompt = agents[agentName] || agents.sales;

    const messages = [{ role: "system", content: systemPrompt }];

    if (Array.isArray(session?.messages)) {
      messages.push(...session.messages.slice(-8));
    }

    messages.push({ role: "user", content: message });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature:
        agentName === "closer"
          ? 0.4
          : agentName === "support"
          ? 0.3
          : 0.6,
      max_tokens: 300,
      messages,
      stream: true
    });

    let fullText = "";

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content;

      if (token) {
        fullText += token;

        // Send token immediately to frontend
        res.write(token);
      }
    }

    res.end();

    return fullText;
  } catch (err) {
    console.error("Stream error:", err);
    res.write("Something went wrong.");
    res.end();
  }
}

/* ─────────────────────────────
   MAIN ORCHESTRATOR (STREAM)
───────────────────────────── */

export async function generateMultiAgentStream({
  req,
  res
}) {
  const { message = "", session = {} } = req.body;

  const stage = detectStage(message);
  let agent = await routeAgent(message);

  if (stage === "purchase") {
    agent = "closer";
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  await runAgentStream({
    agentName: agent,
    session,
    message,
    res
  });
}