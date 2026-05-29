<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>MacFlip AI — MacBook Deal Alerts</title>

<meta name="description" content="Get instant MacBook flipping deals from eBay. AI detects undervalued listings and sends profit alerts. $9.99/month." />

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
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Inter, sans-serif;
}

body{
  background: radial-gradient(circle at top, #0C1226, var(--bg));
  color:var(--text);
}

.container{
  max-width:1100px;
  margin:0 auto;
  padding:60px 20px;
}

/* HERO */
.hero{
  text-align:center;
  padding:90px 20px 50px;
}

.hero h1{
  font-size:56px;
  font-weight:800;
  letter-spacing:-1px;
}

.hero p{
  margin-top:18px;
  font-size:18px;
  color:var(--muted);
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
  background:linear-gradient(135deg, var(--accent), var(--accent2));
  color:white;
  border-radius:12px;
  font-weight:600;
  text-decoration:none;
  box-shadow:0 10px 30px rgba(108,124,255,0.25);
  cursor:pointer;
  border:none;
}

.secondary{
  padding:14px 26px;
  background:transparent;
  border:1px solid var(--border);
  color:var(--text);
  border-radius:12px;
  cursor:pointer;
}

/* FEATURES */
.features{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:20px;
  margin-top:80px;
}

.card{
  background:var(--panel);
  border:1px solid var(--border);
  padding:24px;
  border-radius:14px;
}

.card h3{
  margin-bottom:10px;
}

.card p{
  color:var(--muted);
  font-size:14px;
  line-height:1.5;
}

/* LIVE SECTION */
.live{
  margin-top:80px;
  padding:30px;
  border-radius:14px;
  background:linear-gradient(135deg, rgba(108,124,255,0.08), rgba(0,212,255,0.05));
  border:1px solid var(--border);
}

pre{
  background:#0A1020;
  padding:20px;
  border-radius:12px;
  overflow:auto;
  color:#A9B4D0;
}

/* PRICING */
.pricing{
  margin-top:90px;
  text-align:center;
}

.price-box{
  display:inline-block;
  padding:30px;
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:16px;
}

.price{
  font-size:46px;
  font-weight:800;
}

.small{
  color:var(--muted);
  margin-top:8px;
}

/* FOOTER */
footer{
  margin-top:90px;
  text-align:center;
  color:var(--muted);
  font-size:13px;
}

/* RESPONSIVE */
@media(max-width:900px){
  .features{
    grid-template-columns:1fr;
  }

  .hero h1{
    font-size:38px;
  }
}
</style>
</head>

<body>

<div class="container">

  <!-- HERO -->
  <section class="hero">
    <h1>MacFlip AI</h1>
    <p>
      AI scans eBay in real-time and finds undervalued MacBooks with guaranteed profit potential before the market reacts.
    </p>

    <div class="buttons">
      <button class="cta" onclick="checkout()">Get Deal Alerts — $9.99/mo</button>
      <button class="secondary" onclick="loadDemo()">View Live Demo</button>
    </div>
  </section>

  <!-- FEATURES -->
  <section class="features">

    <div class="card">
      <h3>🔍 Real-Time Scanning</h3>
      <p>Continuously scans eBay listings and detects underpriced MacBooks instantly.</p>
    </div>

    <div class="card">
      <h3>💰 Profit AI Engine</h3>
      <p>Estimates resale value using market trends, specs, and demand signals.</p>
    </div>

    <div class="card">
      <h3>⚡ Instant Alerts</h3>
      <p>Get notified within minutes when profitable flips appear.</p>
    </div>

  </section>

  <!-- LIVE DEMO -->
  <section class="live">
    <h2>📦 Live Deal Feed</h2>
    <p style="color:var(--muted); margin:10px 0 20px;">
      Example output from MacFlip AI engine:
    </p>

    <pre id="demoBox">
Click "View Live Demo" to simulate deals...
    </pre>
  </section>

  <!-- PRICING -->
  <section class="pricing">
    <h2>Simple Pricing</h2>

    <div class="price-box">
      <div class="price">$9.99</div>
      <div class="small">per month</div>
      <div class="small">Cancel anytime • Instant alerts</div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer>
    MacFlip AI • Built for MacBook flippers • Powered by eBay data + AI
  </footer>

</div>

<script>
/* ─────────────────────────────
   STRIPE CHECKOUT
───────────────────────────── */
async function checkout(){
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: "guest_user",
      email: "guest@example.com"
    })
  });

  const data = await res.json();
  if(data.url) window.location.href = data.url;
}

/* ─────────────────────────────
   DEMO SIMULATION
───────────────────────────── */
function loadDemo(){
  document.getElementById("demoBox").innerText = `
🔥 MACBOOK FLIP ALERT

MacBook Air M1 (2020)
8GB RAM • 256GB SSD

Buy Price: $280 CAD
Estimated Resale: $420 CAD
Profit: +$140 CAD

Detected 2 minutes ago
Status: HIGH CONFIDENCE FLIP
  `;
}
</script>

</body>
</html>