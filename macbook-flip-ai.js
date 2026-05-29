<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>MacFlip AI — SaaS Entry</title>

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

/* HERO */
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
  max-width:700px;
  margin-left:auto;
  margin-right:auto;
}

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

/* STATUS */
.status{
  margin-top:20px;
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

/* LOCK */
.lock{
  margin-top:40px;
  padding:20px;
  border-radius:14px;
  background:rgba(255,255,255,.03);
  border:1px solid var(--border);
  display:none;
}

.lock button{
  margin-top:10px;
}
</style>
</head>

<body>

<div class="container">

  <section class="hero">

    <h1>MacFlip AI</h1>

    <p>
      AI finds undervalued MacBooks on eBay and calculates real flipping profit in seconds.
    </p>

    <div class="buttons">

      <button class="cta" onclick="startCheckout()">
        Get Access — $9.99/mo
      </button>

      <button class="secondary" onclick="checkStatus()">
        Enter Dashboard
      </button>

    </div>

    <div class="status" id="status">Checking account...</div>
    <div class="badge" id="badge">FREE USER</div>

    <div class="lock" id="lockBox">
      <h3>🔒 Pro Required</h3>
      <p style="color:#9AA6C3;font-size:14px;margin-top:8px;">
        Unlock live MacBook flip alerts, AI scoring, and instant deal notifications.
      </p>
      <button class="cta" onclick="startCheckout()">Upgrade Now</button>
    </div>

  </section>

</div>

<script>

/* =========================
   MOCK USER STATE
   (replace with Supabase later)
========================= */

function getUser(){
  return {
    loggedIn: true,
    plan: localStorage.getItem("plan") || "free"
  };
}

/* =========================
   CHECK STATUS
========================= */

function checkStatus(){

  const user = getUser();

  if(!user.loggedIn){
    document.getElementById("status").innerText = "Not logged in";
    return;
  }

  if(user.plan === "pro"){
    document.getElementById("status").innerText = "Pro active — redirecting...";
    window.location.href = "/dashboard.html";
  } else {
    document.getElementById("status").innerText = "Free plan detected";
    document.getElementById("badge").innerText = "FREE USER";
    document.getElementById("lockBox").style.display = "block";
  }
}

/* =========================
   STRIPE CHECKOUT
========================= */

async function startCheckout(){

  const res = await fetch("/api/checkout", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      user_id:"demo_user",
      email:"demo@user.com"
    })
  });

  const data = await res.json();

  if(data.url){
    window.location.href = data.url;
  }
}

/* =========================
   AUTO INIT
========================= */

checkStatus();

</script>

</body>
</html>