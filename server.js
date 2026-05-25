import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Sanche Bot API Running");
});

// BOT ENDPOINT
app.post("/api/bot", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a sales assistant for Sanche Solutions.
Your job is to convert visitors into leads.
Be short, helpful, and push WhatsApp if they are serious.
            `
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "Tell me more about your project."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error. Please try WhatsApp." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on", port));