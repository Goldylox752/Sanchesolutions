// CleanFlow AI Chat Widget
// bot.js

document.addEventListener("DOMContentLoaded", () => {
  // Create widget button
  const button = document.createElement("div");
  button.innerHTML = "🧼";
  button.id = "cleanflow-button";

  // Create chat container
  const chat = document.createElement("div");
  chat.id = "cleanflow-chat";

  chat.innerHTML = `
    <div id="cleanflow-header">
      <h3>CleanFlow AI</h3>
      <span id="cleanflow-close">✕</span>
    </div>

    <div id="cleanflow-messages">
      <div class="bot-message">
        Hey 👋 Welcome to CleanFlow AI.<br><br>
        What type of cleaning do you need today?
      </div>
    </div>

    <div id="cleanflow-input-area">
      <input type="text" id="cleanflow-input" placeholder="Type your message..." />
      <button id="cleanflow-send">Send</button>
    </div>
  `;

  document.body.appendChild(button);
  document.body.appendChild(chat);

  // Styles
  const style = document.createElement("style");

  style.innerHTML = `
    #cleanflow-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 65px;
      height: 65px;
      background: #111;
      color: white;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 30px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 8px 25px rgba(0,0,0,0.25);
    }

    #cleanflow-chat {
      position: fixed;
      bottom: 95px;
      right: 20px;
      width: 340px;
      max-height: 500px;
      background: white;
      border-radius: 18px;
      overflow: hidden;
      display: none;
      flex-direction: column;
      box-shadow: 0 10px 35px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: Arial, sans-serif;
    }

    #cleanflow-header {
      background: #111;
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #cleanflow-header h3 {
      margin: 0;
      font-size: 18px;
    }

    #cleanflow-close {
      cursor: pointer;
      font-size: 18px;
    }

    #cleanflow-messages {
      padding: 15px;
      height: 350px;
      overflow-y: auto;
      background: #f7f7f7;
    }

    .bot-message,
    .user-message {
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 10px;
      max-width: 80%;
      line-height: 1.4;
    }

    .bot-message {
      background: white;
      color: #111;
    }

    .user-message {
      background: #111;
      color: white;
      margin-left: auto;
    }

    #cleanflow-input-area {
      display: flex;
      border-top: 1px solid #ddd;
    }

    #cleanflow-input {
      flex: 1;
      border: none;
      padding: 14px;
      font-size: 14px;
      outline: none;
    }

    #cleanflow-send {
      background: #111;
      color: white;
      border: none;
      padding: 0 18px;
      cursor: pointer;
    }
  `;

  document.head.appendChild(style);

  // Toggle chat
  button.addEventListener("click", () => {
    chat.style.display =
      chat.style.display === "flex" ? "none" : "flex";
  });

  // Close chat
  document
    .getElementById("cleanflow-close")
    .addEventListener("click", () => {
      chat.style.display = "none";
    });

  // Send message
  const sendButton = document.getElementById("cleanflow-send");
  const input = document.getElementById("cleanflow-input");
  const messages = document.getElementById("cleanflow-messages");

  sendButton.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user-message");

    input.value = "";

    setTimeout(() => {
      const reply = getBotReply(text);
      addMessage(reply, "bot-message");
    }, 700);
  }

  function addMessage(text, className) {
    const div = document.createElement("div");
    div.className = className;
    div.innerHTML = text;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
  }

  function getBotReply(text) {
    const msg = text.toLowerCase();

    if (
      msg.includes("deep") ||
      msg.includes("move") ||
      msg.includes("house")
    ) {
      return "Perfect 👍 What postal code or area are you located in?";
    }

    if (
      msg.includes("quote") ||
      msg.includes("price")
    ) {
      return "Absolutely 👍 What type of cleaning are you looking for?";
    }

    if (
      msg.includes("office")
    ) {
      return "Got it 👍 Roughly how large is the office space?";
    }

    if (
      msg.match(/[a-z]\d[a-z]/i)
    ) {
      return "Awesome. Roughly how large is the property?";
    }

    return "Perfect 👍 What day works best for your cleaning?";
  }
});