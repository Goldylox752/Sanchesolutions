export default function handler(req, res) {
  // allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  return res.status(200).json({
    reply: "You said: " + message
  });
}