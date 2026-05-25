import express from "express";
import cors from "cors";
import { generateMultiAgentReply } from "./yourFile.js"; // adjust path

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { message, session } = req.body;

    const result = await generateMultiAgentReply({
      message,
      session
    });

    res.json(result);

  } catch (err) {
    console.error("Route error:", err);
    res.status(500).json({
      success: false,
      reply: "Server error"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});