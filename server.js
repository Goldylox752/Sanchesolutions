import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import twilio from "twilio";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────────────
   CLIENTS
───────────────────────────── */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const twiml = twilio.twiml.VoiceResponse;

/* ─────────────────────────────
   AI FUNCTION
───────────────────────────── */

async function getAI(text) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are an AI phone receptionist. Keep responses under 2 sentences."
      },
      { role: "user", content: text }
    ]
  });

  return res.choices[0].message.content;
}

/* ─────────────────────────────
   INBOUND CALL ENTRY
───────────────────────────── */

app.post("/voice", (req, res) => {
  const response = new twiml();

  const gather = response.gather({
    input: "speech dtmf",
    numDigits: 1,
    speechTimeout: "auto",
    action: "/voice/handle",
    method: "POST"
  });

  gather.say(
    "Welcome to Sanche AI. Press 1 for sales. Press 2 for support. Or just speak."
  );

  res.type("text/xml");
  res.send(response.toString());
});

/* ─────────────────────────────
   CALL HANDLER
───────────────────────────── */

app.post("/voice/handle", async (req, res) => {
  const response = new twiml();

  const digit = req.body.Digits;
  const speech = req.body.SpeechResult;

  // PRESS 1 → SALES ROUTE
  if (digit === "1") {
    response.say("Connecting you to sales.");
    response.dial("+1780XXXXXXX"); // YOUR NUMBER
  }

  // PRESS 2 → SUPPORT
  else if (digit === "2") {
    response.say("Connecting support.");
    response.dial("+1780XXXXXXX");
  }

  // AI MODE (SPEECH)
  else {
    const aiReply = await getAI(speech || "Hello");

    response.say(aiReply);
    response.redirect("/voice");
  }

  res.type("text/xml");
  res.send(response.toString());
});

/* ─────────────────────────────
   OUTBOUND CALL SYSTEM
───────────────────────────── */

app.post("/call", async (req, res) => {
  try {
    const { to } = req.body;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const call = await client.calls.create({
      url: "https://YOUR-BACKEND.onrender.com/voice",
      to,
      from: process.env.TWILIO_PHONE
    });

    res.json({ success: true, callSid: call.sid });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Call failed" });
  }
});

/* ─────────────────────────────
   HEALTH
───────────────────────────── */

app.get("/", (req, res) => {
  res.send("AI Call Center Online");
});

/* ───────────────────────────── */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("AI Call Center running on", PORT);
});