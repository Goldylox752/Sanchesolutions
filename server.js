import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
   SIMPLE "AI" RESPONSE ENGINE
   (no external APIs)
=============================== */

function generateReply(message = "") {
  const msg = message.toLowerCase();

  // basic intent detection
  if (msg.includes("price") || msg.includes("cost")) {
    return "Our AI systems start from $500 setup and scale based on automation needs.";
  }

  if (msg.includes("seo")) {
    return "We improve SEO using structured content, keyword mapping, and automation-driven optimization.";
  }

  if (msg.includes("ai") || msg.includes("automation")) {
    return "We build AI systems that automate leads, follow-ups, and sales processes 24/7.";
  }

  if (msg.includes("hello") || msg.includes("hi")) {
    return "Hey 👋 How can I help you scale your business today?";
  }

  return "I can help you with AI automation, lead generation, SEO, and sales systems. What are you trying to build?";
}

/* ===============================
   CHAT ENDPOINT (STREAM STYLE SIM)
=============================== */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        reply: "No message provided"
      });
    }

    const reply = generateReply(message);

    // optional fake streaming (keeps frontend working like ChatGPT)
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for (let i = 0; i < reply.length; i++) {
      res.write(reply[i]);
      await new Promise(r => setTimeout(r, 10)); // typing effect
    }

    res.end();

  } catch (err) {
    console.error("Server error:", err);

    res.status(500).end("Server error");
  }
});

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    ai: "local-engine"
  });
});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});