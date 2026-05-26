import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();

/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for Twilio

/* ─────────────────────────────
   GROQ CLIENT
───────────────────────────── */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ─────────────────────────────
   AI CORE FUNCTION (REUSABLE)
───────────────────────────── */
async function getAIReply(message, systemPrompt = "") {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          systemPrompt ||
          "You are SancheAI, an AI business assistant and voice receptionist."
      },
      {
        role: "user",
        content: message || ""
      }
    ]
  });

  return completion.choices?.[0]?.message?.content || "No response";
}

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */
app.get("/", (req, res) => {
  res.send("SancheAI backend running 🚀");
});

/* ─────────────────────────────
   CHAT ENDPOINT (WEB APP)
───────────────────────────── */
app.post("/chat", async (req, res) => {
  try {
    const { message, session } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const reply = await getAIReply(
      message,
      "You are SancheAI, an AI sales and automation assistant."
    );

    res.json({
      reply,
      session
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: "AI chat failed" });
  }
});

/* ─────────────────────────────
   VOICE ENDPOINT (TWILIO READY)
───────────────────────────── */
app.post("/voice", async (req, res) => {
  try {
    const twilio = await import("twilio");
    const VoiceResponse = twilio.twiml.VoiceResponse;

    const twiml = new VoiceResponse();

    const gather = twiml.gather({
      input: "speech dtmf",
      numDigits: 1,
      speechTimeout: "auto",
      action: "/voice/handle",
      method: "POST"
    });

    gather.say(
      "Welcome to Sanche AI. Press 1 for sales. Press 2 for support. Or tell me how I can help."
    );

    res.type("text/xml");
    res.send(twiml.toString());

  } catch (err) {
    console.error("VOICE ERROR:", err);
    res.status(500).send("Voice system error");
  }
});

/* ─────────────────────────────
   VOICE ROUTING LOGIC
───────────────────────────── */
app.post("/voice/handle", async (req, res) => {
  try {
    const twilio = await import("twilio");
    const VoiceResponse = twilio.twiml.VoiceResponse;

    const twiml = new VoiceResponse();

    const digit = req.body.Digits;
    const speech = req.body.SpeechResult;

    // PRESS 1 → SALES
    if (digit === "1") {
      twiml.say("Connecting you to sales.");
      twiml.dial("+1780XXXXXXX"); // replace
    }

    // PRESS 2 → SUPPORT
    else if (digit === "2") {
      twiml.say("Connecting you to support.");
      twiml.dial("+1780XXXXXXX"); // replace
    }

    // AI MODE
    else {
      const reply = await getAIReply(
        speech,
        "You are a phone receptionist. Keep responses short and natural."
      );

      twiml.say(reply);
      twiml.redirect("/voice");
    }

    res.type("text/xml");
    res.send(twiml.toString());

  } catch (err) {
    console.error("VOICE HANDLE ERROR:", err);
    res.status(500).send("Error handling voice");
  }
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SancheAI running on port ${PORT}`);
});