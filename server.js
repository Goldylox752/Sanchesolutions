import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import twilio from "twilio";
import dotenv from "dotenv";

import { supabase } from "./supabase.js";
import { stripe } from "./stripe.js";

dotenv.config();

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
   CHAT API (SAAS CORE)
───────────────────────────── */

app.post("/chat", async (req, res) => {
  try {
    const { message, user_id } = req.body;

    if (!message) return res.status(400).json({ error: "No message" });

    const ai = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are SancheAI, a SaaS AI sales assistant that converts leads into customers."
        },
        { role: "user", content: message }
      ]
    });

    const reply = ai.choices?.[0]?.message?.content || "No response";

    /* SAVE CHAT */
    if (user_id) {
      await supabase.from("chat_logs").insert({
        user_id,
        message,
        reply
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});