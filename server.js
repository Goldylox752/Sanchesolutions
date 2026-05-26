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
   CHAT ROUTE (SAFETY + LOGGING)
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
            "You are SancheAI, a SaaS sales assistant that helps convert leads."
        },
        { role: "user", content: message }
      ]
    });

    const reply =
      ai?.choices?.[0]?.message?.content ||
      "Sorry, no response generated.";

    /* ───── SAVE TO SUPABASE (SAFE) ───── */

    if (user_id) {
      await supabase.from("chat_logs").insert([
        {
          user_id,
          message,
          reply
        }
      ]);
    }

    res.json({ reply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: "AI service failed" });
  }
});

/* ─────────────────────────────
   TWILIO VOICE WEBHOOK
───────────────────────────── */

app.post("/voice", async (req, res) => {
  try {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

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
            "You are a professional phone receptionist. Keep responses under 2 sentences."
        },
        { role: "user", content: speech }
      ]
    });

    const reply =
      ai?.choices?.[0]?.message?.content ||
      "Sorry, I didn't catch that.";

    response.say(reply);

    res.type("text/xml");
    res.send(response.toString());

  } catch (err) {
    console.error("VOICE ERROR:", err);

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    response.say("System error. Please try again later.");

    res.type("text/xml");
    res.send(response.toString());
  }
});

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "SancheAI Supabase MVP"
  });
});

/* ─────────────────────────────
   START SERVER
───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SancheAI running on port ${PORT}`);
});