import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
   FREE AI (HUGGING FACE)
=============================== */

const HF_API_TOKEN = process.env.HF_API_TOKEN; // optional but recommended

async function generateReply(message = "") {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": HF_API_TOKEN ? `Bearer ${HF_API_TOKEN}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `You are a helpful business AI assistant.\nUser: ${message}\nAssistant:`,
          parameters: {
            max_new_tokens: 200,
            return_full_text: false
          }
        })
      }
    );

    const data = await response.json();

    return (
      data?.[0]?.generated_text ||
      "I can help you with AI automation, SEO, and business systems."
    );

  } catch (err) {
    console.error("HF error:", err);
    return "AI service temporarily unavailable.";
  }
}

/* ===============================
   CHAT ROUTE (STREAM STYLE)
=============================== */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, reply: "No message" });
    }

    const reply = await generateReply(message);

    // streaming effect (fake ChatGPT typing)
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for (let i = 0; i < reply.length; i++) {
      res.write(reply[i]);
      await new Promise(r => setTimeout(r, 8));
    }

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).end("Server error");
  }
});

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    ai: "huggingface-mistral"
  });
});

/* ===============================
   START
=============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});