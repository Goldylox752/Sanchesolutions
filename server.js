import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

/* ===============================
   SAFETY LAYER (CRASH PROTECTION)
=============================== */

// Prevent full crash on async errors
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception:", err);
  console.log("🔄 Server continuing...");
});

/* ===============================
   MIDDLEWARE
=============================== */

app.use(cors());
app.use(express.json());

/* ===============================
   OPENAI CLIENT (SAFE INIT)
=============================== */

let openai;

function initOpenAI() {
  try {
    const OpenAIClass = OpenAI;
    openai = new OpenAIClass({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log("✅ OpenAI initialized");
  } catch (err) {
    console.error("❌ OpenAI init failed:", err);
    openai = null;
  }
}

initOpenAI();

/* ===============================
   RETRY WRAPPER (ERROR RECOVERY)
=============================== */

async function safeOpenAIRequest(message, retries = 2) {
  if (!openai) {
    throw new Error("OpenAI not initialized");
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant for a sales automation company."
          },
          {
            role: "user",
            content: message
          }
        ]
      });

      return res.choices?.[0]?.message?.content;
    } catch (err) {
      console.error(`❌ OpenAI attempt ${attempt} failed`, err.message);

      if (attempt === retries) {
        throw err;
      }

      // small delay before retry
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

/* ===============================
   HEALTH CHECK (IMPORTANT FOR RENDER)
=============================== */

app.get("/", (req, res) => {
  res.json({
    status: "alive",
    openai: !!openai
  });
});

/* ===============================
   CHAT ROUTE (WITH RECOVERY)
=============================== */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        reply: "Invalid message"
      });
    }

    const reply = await safeOpenAIRequest(message);

    return res.json({
      success: true,
      reply: reply || "No response generated"
    });
  } catch (err) {
    console.error("💥 Chat route error:", err);

    return res.status(500).json({
      success: false,
      reply: "AI temporarily unavailable"
    });
  }
});

/* ===============================
   AUTO-RECOVERY WATCHDOG
=============================== */

setInterval(() => {
  if (!openai) {
    console.log("🔄 Re-initializing OpenAI...");
    initOpenAI();
  }
}, 30000); // every 30 seconds

/* ===============================
   GRACEFUL SHUTDOWN
=============================== */

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down safely...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down safely...");
  process.exit(0);
});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ===============================
   CRASH SAFETY (LAST RESORT)
=============================== */

server.on("error", (err) => {
  console.error("🔥 Server error:", err);
});