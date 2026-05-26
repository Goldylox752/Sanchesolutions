import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import twilio from "twilio";
import { supabase } from "./supabase.js";

const app = express();

app.use(cors());
app.use(express.json());

/* ───────── AI ───────── */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ───────── CHAT ───────── */

app.post("/chat", async (req, res) => {
  const { message, user_id } = req.body;

  const ai = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are SancheAI, a SaaS sales assistant."
      },
      { role: "user", content: message }
    ]
  });

  const reply = ai.choices[0].message.content;

  // SAVE TO SUPABASE
  await supabase.from("chat_logs").insert([
    {
      user_id,
      message,
      reply
    }
  ]);

  res.json({ reply });
});

/* ───────── CALL (TWILIO) ───────── */

app.post("/voice", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const speech = req.body.SpeechResult || "Hello";

  const ai = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a phone receptionist. Keep responses short."
      },
      { role: "user", content: speech }
    ]
  });

  const reply = ai.choices[0].message.content;

  response.say(reply);

  res.type("text/xml");
  res.send(response.toString());
});

/* ───────── HEALTH ───────── */

app.get("/", (req, res) => {
  res.send("SancheAI Supabase MVP Running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});