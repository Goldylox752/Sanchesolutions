<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>MacFlip AI — Secure SaaS Entry</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<style>
:root{
  --bg:#070A12;
  --panel:#0E1424;
  --text:#EAF0FF;
  --muted:#9AA6C3;
  --accent:#6C7CFF;
  --accent2:#00D4FF;
  --border:rgba(255,255,255,0.08);
  --danger:#ff4d6d;
}

*{margin:0;padding:0;box-sizing:border-box;font-family:Inter,sans-serif}

body{
  background: radial-gradient(circle at top, #0C1226, var(--bg));
  color:var(--text);
}

.container{
  max-width:1100px;
  margin:0 auto;
  padding:60px 20px;
}

.hero{
  text-align:center;
  padding:90px 20px 40px;
}

.hero h1{
  font-size:56px;
  font-weight:800;
}

.hero p{
  margin-top:16px;
  color:var(--muted);
  font-size:18px;
}

/* STATUS */
.status{
  margin-top:18px;
  font-size:13px;
  color:var(--muted);
}

.badge{
  display:inline-block;
  margin-top:10px;
  padding:6px 10px;
  border-radius:999px;
  font-size:12px;
  background:rgba(0,229,160,.12);
  border:1px solid rgba(0,229,160,.25);
  color:#00e5a0;
}

/* BUTTONS */
.buttons{
  margin-top:30px;
  display:flex;
  justify-content:center;
  gap:12px;
  flex-wrap:wrap;
}

.cta{
  padding:14px 26px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  border:none;
  border-radius:12px;
  font-weight:700;
  cursor:pointer;
  color:white;
}

.secondary{
  padding:14px 26px;
  background:transparent;
  border:1px solid var(--border);
  color:var(--text);
  border-radius:12px;
  cursor:pointer;
}

.lock{
  display:none;
  margin-top:40px;
  padding:20px;
  border-radius:14px;
  background:rgba(255,255,255,.03);
  border:1px solid var(--border);
}
</style>
</head>

<body>

<div class="container">

  <section class="hero">

    <h1>MacFlip AI</h1>

    <p>AI detects undervalued MacBooks and calculates real flipping profit in seconds.</p>

    <div class="buttons">
      <button class="cta" onclick="startCheckout()">Get Access — $9.99/mo</button>
      <button class="secondary" onclick="enterApp()">Enter Dashboard</button>
    </div>

    <div class="status" id="status">Checking session...</div>
    <div class="badge" id="badge">FREE</div>

    <div class="lock" id="lockBox">
      <h3>🔒 Pro Required</h3>
      <p style="color:var(--muted);font-size:14px;margin-top:8px;">
        Unlock live MacBook flip alerts + AI deal scoring.
      </p>
      <button class="cta" onclick="startCheckout()">Upgrade Now</button>
    </div>

  </section>

</div>

<script>

const API_BASE = "/api";

/* =========================
   REAL AUTH CHECK (SUPABASE)
========================= */

async function getSession(){
  const res = await fetch(`${API_BASE}/me`, {
    headers:{
      Authorization: "Bearer " + localStorage.getItem("sb_token")
    }
  });

  if(!res.ok) return null;
  return await res.json();
}

/* =========================
   CHECK USER STATUS
========================= */

async function checkStatus(){

  const data = await getSession();

  if(!data){
    document.getElementById("status").innerText = "Not logged in";
    document.getElementById("badge").innerText = "GUEST";
    document.getElementById("lockBox").style.display = "block";
    return;
  }

  const plan = data.profile?.plan || "free";

  if(plan === "pro"){
    document.getElementById("status").innerText = "Pro active — redirect ready";
    document.getElementById("badge").innerText = "PRO USER";

    setTimeout(() => {
      window.location.href = "/app.html";
    }, 800);

  } else {
    document.getElementById("status").innerText = "Free plan detected";
    document.getElementById("badge").innerText = "FREE USER";
    document.getElementById("lockBox").style.display = "block";
  }
}

/* =========================
   STRIPE CHECKOUT (REAL BACKEND)
========================= */

async function startCheckout(){

  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      user_id: localStorage.getItem("user_id") || "guest",
      email: localStorage.getItem("email") || "guest@email.com"
    })
  });

  const data = await res.json();

  if(data.url){
    window.location.href = data.url;
  }
}

/* =========================
   ENTER APP
========================= */

function enterApp(){
  window.location.href = "/app.html";
}

/* INIT */
checkStatus();

</script>

</body>
</html>