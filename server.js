import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import twilio from "twilio";
import { supabase } from "./supabase.js";

const app = express();

/* ─────────────────────────────
   MIDDLEWARE
───────────────────────────── */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────────────
   AI CLIENT
───────────────────────────── */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ─────────────────────────────
   CHAT ROUTE
───────────────────────────── */

app.post("/chat", async (req, res) => {
  try {
    const { message, user_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const ai = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are SancheAI, a SaaS sales assistant that helps convert leads into booked calls."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply =
      ai?.choices?.[0]?.message?.content ??
      "No response generated.";

    /* ───── SUPABASE LOGGING (SAFE) ───── */

    if (user_id && supabase) {
      await supabase.from("chat_logs").insert({
        user_id,
        message,
        reply
      });
    }

    return res.json({ reply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ error: "AI service failed" });
  }
});

/* ─────────────────────────────
   TWILIO VOICE WEBHOOK
───────────────────────────── */

app.post("/voice", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  try {
    const speech =
      req.body?.SpeechResult ||
      req.body?.Speech ||
      "Hello";

    const ai = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional AI phone receptionist. Keep responses under 2 sentences."
        },
        {
          role: "user",
          content: speech
        }
      ]
    });

    const reply =
      ai?.choices?.[0]?.message?.content ??
      "Sorry, I didn't understand that.";

    response.say(reply);

  } catch (err) {
    console.error("VOICE ERROR:", err);
    response.say("System error. Please try again later.");
  }

  res.type("text/xml");
  res.send(response.toString());
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "SancheAI MVP",
    features: ["chat", "voice", "groq", "supabase"]
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SancheAI running on port ${PORT}`);
});