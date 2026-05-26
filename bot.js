<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>SancheAI · Live Bot</title>

<style>
:root{
  --bg:#050816;
  --panel:#0b1224;
  --border:rgba(255,255,255,0.08);
  --blue:#4f8cff;
  --text:#edf2ff;
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Arial, sans-serif;
}

body{
  height:100vh;
  display:flex;
  flex-direction:column;
  background:var(--bg);
  color:var(--text);
}

/* HEADER */
header{
  padding:14px 16px;
  background:var(--panel);
  border-bottom:1px solid var(--border);
  display:flex;
  justify-content:space-between;
  align-items:center;
}

header h1{
  font-size:15px;
}

.badge{
  font-size:12px;
  padding:6px 10px;
  border-radius:20px;
  background:rgba(79,140,255,0.15);
  color:var(--blue);
}

/* CHAT */
.chat{
  flex:1;
  overflow-y:auto;
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.msg{
  max-width:75%;
  padding:12px 14px;
  border-radius:12px;
  font-size:14px;
  line-height:1.4;
  white-space:pre-wrap;
}

.user{
  background:var(--blue);
  align-self:flex-end;
}

.ai{
  background:var(--panel);
  border:1px solid var(--border);
  align-self:flex-start;
}

/* INPUT */
.input-bar{
  display:flex;
  gap:10px;
  padding:12px;
  background:var(--panel);
  border-top:1px solid var(--border);
}

input{
  flex:1;
  padding:12px;
  border-radius:10px;
  border:1px solid var(--border);
  background:rgba(255,255,255,0.03);
  color:white;
  outline:none;
}

button{
  padding:12px 14px;
  border:none;
  border-radius:10px;
  cursor:pointer;
  font-weight:700;
}

.send{
  background:var(--blue);
  color:white;
}

.small{
  text-align:center;
  font-size:12px;
  opacity:0.6;
  padding:6px;
}
</style>
</head>

<body>

<header>
  <h1>SancheAI Bot</h1>
  <div class="badge">Groq · SaaS AI</div>
</header>

<div class="chat" id="chat"></div>

<div class="small">
  AI Sales + Automation Bot · Powered by your Groq backend
</div>

<div class="input-bar">
  <input id="input" placeholder="Ask your AI bot..." />
  <button class="send" onclick="send()">Send</button>
</div>

<script>

/* 🔗 YOUR BACKEND */
const API_URL = "https://sanchesolutions.onrender.com/chat";

/* 🧠 USER ID (matches your Supabase + Stripe system) */
const user_id =
  localStorage.getItem("user_id") ||
  crypto.randomUUID();

localStorage.setItem("user_id", user_id);

const chat = document.getElementById("chat");
const input = document.getElementById("input");

/* UI */
function addMsg(text, type){
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function typing(){
  const div = document.createElement("div");
  div.className = "msg ai";
  div.textContent = "Thinking...";
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

/* 🚀 SEND MESSAGE TO YOUR GROQ BOT */
async function send(){

  const text = input.value.trim();
  if(!text) return;

  addMsg(text,"user");
  input.value = "";

  const load = typing();

  try {

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        user_id: user_id
      })
    });

    const data = await res.json();

    /* 🔒 PAYWALL HANDLING */
    if(data.error){
      load.textContent = "🔒 " + data.error;
      return;
    }

    load.textContent =
      data.reply || "No response from AI.";

  } catch(err) {
    console.error(err);
    load.textContent = "⚠️ Bot offline or server error";
  }
}

/* ENTER KEY SUPPORT */
input.addEventListener("keypress",(e)=>{
  if(e.key === "Enter") send();
});

/* INIT MESSAGE */
window.onload = () => {
  addMsg("👋 SancheAI Bot is live. Ask me anything.", "ai");
};

</script>

</body>
</html>