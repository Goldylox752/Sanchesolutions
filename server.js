import express from "express";
import { generateMultiAgentReply } from "./yourFile.js";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, session } = req.body;

  const result = await generateMultiAgentReply({
    message,
    session
  });

  res.json(result);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});