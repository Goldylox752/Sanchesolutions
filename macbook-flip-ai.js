<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>MacFlip AI — eBay Deal Finder Bot</title>
<meta name="description" content="MacFlip AI scans eBay for undervalued MacBooks and shows you real flipping profit opportunities in real time." />

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<style>
:root {
  --bg:#070A12;
  --panel:#0E1424;
  --text:#EAF0FF;
  --muted:#9AA6C3;
  --accent:#6C7CFF;
  --accent2:#00D4FF;
  --border:rgba(255,255,255,0.08);
}

* {
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Inter, sans-serif;
}

body {
  background: radial-gradient(circle at top, #0C1226, var(--bg));
  color:var(--text);
}

.container {
  max-width:1100px;
  margin:0 auto;
  padding:60px 20px;
}

/* HERO */
.hero {
  text-align:center;
  padding:80px 20px 40px;
}

.hero h1 {
  font-size:52px;
  font-weight:800;
  letter-spacing:-1px;
}

.hero p {
  margin-top:18px;
  font-size:18px;
  color:var(--muted);
}

.cta {
  margin-top:30px;
  display:inline-block;
  padding:14px 26px;
  background:linear-gradient(135deg, var(--accent), var(--accent2));
  color:white;
  border-radius:10px;
  font-weight:600;
  text-decoration:none;
  box-shadow:0 10px 30px rgba(108,124,255,0.25);
}

/* FEATURES */
.features {
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:20px;
  margin-top:80px;
}

.card {
  background:var(--panel);
  border:1px solid var(--border);
  padding:24px;
  border-radius:14px;
}

.card h3 {
  margin-bottom:10px;
}

.card p {
  color:var(--muted);
  font-size:14px;
}

/* DEMO */
.demo {
  margin-top:80px;
  background:linear-gradient(135deg, rgba(108,124,255,0.08), rgba(0,212,255,0.05));
  border:1px solid var(--border);
  padding:30px;
  border-radius:14px;
}

.demo pre {
  background:#0A1020;
  padding:20px;
  border-radius:10px;
  overflow:auto;
  color:#A9B4D0;
}

/* FOOTER */
footer {
  margin-top:80px;
  text-align:center;
  color:var(--muted);
  font-size:13px;
}

/* RESPONSIVE */
@media(max-width:900px){
  .features {
    grid-template-columns:1fr;
  }

  .hero h1 {
    font-size:36px;
  }
}
</style>
</head>

<body>

<div class="container">

  <!-- HERO -->
  <section class="hero">
    <h1>MacFlip AI</h1>
    <p>AI-powered eBay scanner that finds undervalued MacBooks and calculates your flipping profit in real time.</p>
    <a class="cta" href="#demo">Start Scanning Deals</a>
  </section>

  <!-- FEATURES -->
  <section class="features">

    <div class="card">
      <h3>🔍 Live eBay Scanning</h3>
      <p>Continuously scans MacBook listings and detects underpriced deals before others see them.</p>
    </div>

    <div class="card">
      <h3>💰 Profit Calculator AI</h3>
      <p>Estimates resale value based on RAM, storage, condition, and market demand.</p>
    </div>

    <div class="card">
      <h3>⚡ Instant Alerts</h3>
      <p>Get notified on Telegram or Discord when a high-profit flip appears.</p>
    </div>

  </section>

  <!-- DEMO -->
  <section class="demo" id="demo">
    <h2>📦 Example Deal Output</h2>
    <p style="color:var(--muted); margin-top:8px;">
      This is what your AI will generate in real time:
    </p>

    <pre>
🔥 DEAL FOUND

MacBook Air M1 2020 - 8GB RAM - 256GB SSD
Buy Price: $280 CAD
Estimated Resale: $410 CAD
Profit: +$130 CAD

https://ebay.com/example-listing
    </pre>
  </section>

  <!-- FOOTER -->
  <footer>
    Built for automation flippers • macbook-flip-ai-js • deployable Node.js system
  </footer>

</div>

</body>
</html>