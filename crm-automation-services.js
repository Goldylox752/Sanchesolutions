"use client";

export default function CRMPage() {

  const startCheckout = async (plan) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <main style={styles.page}>

      {/* HERO */}
      <section style={styles.hero}>
        <h1>AI CRM Revenue Automation System</h1>

        <p style={styles.subheading}>
          Turn your CRM into a predictable revenue engine that follows up,
          qualifies, and books customers automatically.
        </p>

        <p style={styles.text}>
          Most businesses don’t have a lead problem. They have a revenue leakage problem.
          Leads come in… then go cold.
        </p>

        <a href="#pricing" style={styles.button}>
          View Pricing
        </a>
      </section>

      {/* PROBLEM */}
      <section style={styles.section}>
        <h2>The Problem</h2>
        <p>
          Leads are lost every day due to slow follow-up, inconsistent outreach,
          and manual CRM processes.
        </p>
        <p>
          By the time you respond, the customer has already moved on.
        </p>
      </section>

      {/* WHAT IT DOES */}
      <section style={styles.section}>
        <h2>What This System Does</h2>

        <ul>
          <li>Responds to new leads in under 60 seconds</li>
          <li>Automatically qualifies prospects</li>
          <li>Books appointments into your calendar</li>
          <li>Runs automated follow-ups until conversion</li>
          <li>Keeps CRM pipeline updated in real time</li>
          <li>Works 24/7 without manual effort</li>
        </ul>
      </section>

      {/* COST OF NOT HAVING */}
      <section style={styles.darkSection}>
        <h2>The Cost of Not Having This System</h2>

        <ul>
          <li>30–70% of leads never followed up properly</li>
          <li>Slow response times (hours instead of minutes)</li>
          <li>Lost deals from forgotten follow-ups</li>
          <li>Messy and outdated CRM data</li>
          <li>Constant revenue leakage</li>
        </ul>
      </section>

      {/* OUTCOME */}
      <section style={styles.section}>
        <h2>What Changes After Implementation</h2>

        <ul>
          <li>Instant lead response</li>
          <li>Consistent automated follow-up</li>
          <li>No missed opportunities</li>
          <li>Clear, real-time pipeline visibility</li>
          <li>Fully automated sales process</li>
        </ul>

        <h3>You stop chasing leads. The system does it for you.</h3>
      </section>

      {/* HOW IT WORKS */}
      <section style={styles.section}>
        <h2>How It Works</h2>

        <ol>
          <li>Revenue Audit</li>
          <li>System Design</li>
          <li>Automation Buildout</li>
          <li>AI Follow-Up Engine</li>
          <li>Optimization</li>
        </ol>
      </section>

      {/* PRICING + STRIPE */}
      <section id="pricing" style={styles.section}>
        <h2>Investment</h2>
        <p>Choose the level of automation your business needs.</p>

        <div style={styles.grid}>

          <div style={styles.card}>
            <h3>Starter</h3>
            <p style={styles.price}>$2,000</p>
            <p>CRM automation foundation system</p>
            <button style={styles.buttonDark} onClick={() => startCheckout("starter")}>
              Get Starter
            </button>
          </div>

          <div style={styles.card}>
            <h3>Growth</h3>
            <p style={styles.price}>$5,000</p>
            <p>Advanced AI follow-up + booking system</p>
            <button style={styles.buttonDark} onClick={() => startCheckout("growth")}>
              Most Popular
            </button>
          </div>

          <div style={styles.card}>
            <h3>Scale</h3>
            <p style={styles.price}>$10,000</p>
            <p>Full AI revenue automation system</p>
            <button style={styles.buttonDark} onClick={() => startCheckout("scale")}>
              Full System
            </button>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2>Apply for a CRM Revenue System Audit</h2>
        <p>
          We’ll review your current system and show exactly where revenue is being lost.
        </p>

        <a href="mailto:youremail@example.com" style={styles.button}>
          Book Audit
        </a>
      </section>

    </main>
  );
}

/* STYLES */
const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    lineHeight: 1.6,
    color: "#111",
  },

  hero: {
    padding: "100px 20px",
    textAlign: "center",
    background: "#0f0f0f",
    color: "white",
  },

  section: {
    padding: "80px 20px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  darkSection: {
    padding: "80px 20px",
    background: "#111",
    color: "white",
  },

  cta: {
    padding: "100px 20px",
    textAlign: "center",
    background: "#1a1a1a",
    color: "white",
  },

  subheading: {
    fontSize: "18px",
    opacity: 0.9,
  },

  text: {
    marginTop: "20px",
    opacity: 0.8,
  },

  button: {
    display: "inline-block",
    marginTop: "20px",
    padding: "12px 24px",
    background: "white",
    color: "#000",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "bold",
  },

  buttonDark: {
    marginTop: "15px",
    padding: "12px 18px",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginTop: "30px",
  },

  card: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    textAlign: "center",
  },

  price: {
    fontSize: "28px",
    fontWeight: "bold",
  },
};