export default function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body || {};

    // validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    return res.status(200).json({
      reply: `You said: ${message}`
    });

  } catch (err) {
    console.error("API ERROR:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
}