import express from "express";
import cors from "cors";

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

    if (!message) {
      return res.status(400).json({
        reply: "Please enter a message."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are a sales assistant for Sanche Solutions.

Your goals:
- Convert visitors into leads
- Be short, confident, and professional
- Encourage users to contact via WhatsApp for serious projects
- Help with websites, SEO, AI chatbots, branding, and automation

Never make responses overly long.
              `
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      }
    );

    const data = await response.json();

    console.log(data);

    res.json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "Tell me more about your project."
    });
  } catch (err) {
    console.error("BOT ERROR:", err);

    res.status(500).json({
      reply: "Server error. Please contact us on WhatsApp."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});