"use client";

export default function SalesAutomationPage() {

  const startCheckout = async (plan) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        <h1>AI Sales Automation System</h1>

        <p style={styles.subheading}>
          Turn your leads into booked calls and paying customers automatically using AI follow-up, AI qualification, and automated sales workflows.
        </p>

        <p style={styles.text}>
          Most businesses don’t have a lead problem.  
          They have a **follow-up and conversion problem.**
        </p>

        <a href="#pricing" style={styles.button}>
          View Automation Packages
        </a>
      </section>

      {/* PROBLEM */}
      <section style={styles.section}>
        <h2>The Problem</h2>

        <p>
          Leads are generated—but not converted.
        </p>

        <ul>
          <li>Slow response times lose deals instantly</li>
          <li>No consistent follow-up system</li>
          <li>Sales teams forget or delay leads</li>
          <li>CRM pipelines are not actively managed</li>
        </ul>

        <p>
          Every delay = lost revenue.
        </p>
      </section>

      {/* WHAT IT DOES */}
      <section style={styles.section}>
        <h2>What This System Does</h2>

        <ul>
          <li>AI responds to leads instantly (SMS + email)</li>
          <li>Automatically qualifies prospects</li>
          <li>Books calls directly into your calendar</li>
          <li>Follows up until conversion or disqualification</li>
          <li>Works 24/7 without human input</li>
          <li>Syncs with your CRM in real time</li>
        </ul>
      </section>

      {/* WHY YOU LOSE MONEY */}
      <section style={styles.darkSection}>
        <h2>Where You Are Losing Revenue</h2>

        <ul>
          <li>Leads go cold within 5–15 minutes</li>
          <li>Humans cannot follow up consistently at scale</li>
          <li>No structured follow-up sequences</li>
          <li>Missed appointments and no-shows</li>
          <li>Manual CRM updates slow everything down</li>
        </ul>
      </section>

      {/* OUTCOME */}
      <section style={styles.section}>
        <h2>What Happens After Automation</h2>

        <ul>
          <li>Every lead is contacted instantly</li>
          <li>More booked calls from the same traffic</li>
          <li>Higher close rates from consistent follow-up</li>
          <li>Zero manual chasing</li>
          <li>Predictable pipeline growth</li>
        </ul>

        <h3>You don’t need more leads. You need better conversion systems.</h3>
      </section>

      {/* HOW IT WORKS */}
      <section style={styles.section}>
        <h2>How It Works</h2>

        <ol>
          <li>Sales Flow Audit</li>
          <li>Conversion Strategy Design</li>
          <li>AI Workflow Buildout</li>
          <li>CRM + Messaging Integration</li>
          <li>Optimization & Scaling</li>
        </ol>
      </section>

      {/* EXAMPLE FLOW */}
      <section style={styles.section}>
        <h2>Example AI Sales Flow</h2>

        <ol>
          <li>Lead submits form or clicks ad</li>
          <li>AI responds instantly (SMS/email)</li>
          <li>AI qualifies lead automatically</li>
          <li>Booking link is sent</li>
          <li>Call is scheduled</li>
          <li>Follow-up continues if no response</li>
          <li>CRM updates automatically</li>
        </ol>
      </section>

      {/* PRICING */}
      <section id="pricing" style={styles.section}>
        <h2>Automation Packages</h2>
        <p>Choose the level of sales automation your business needs.</p>

        <div style={styles.grid}>

          <div style={styles.card}>
            <h3>Starter SDR</h3>
            <p style={styles.price}>$3,000</p>
            <p>Basic AI follow-up + CRM integration</p>
            <button style={styles.buttonDark} onClick={() => startCheckout("starter")}>
              Get Starter
            </button>
          </div>

          <div style={styles.card}>
            <h3>Growth SDR</h3>
            <p style={styles.price}>$7,500</p>
            <p>AI qualification + booking automation system</p>
            <button style={styles.buttonDark} onClick={() => startCheckout("growth")}>
              Most Popular
            </button>
          </div>

          <div style={styles.card}>
            <h3>Elite AI Sales Engine</h3>
            <p style={styles.price}>$15,000</p>
            <p>Full AI SDR + pipeline automation + optimization</p>
            <button style={styles.buttonDark} onClick={() => startCheckout("scale")}>
              Full System
            </button>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2>Apply for AI Sales Automation Setup</h2>

        <p>
          We’ll analyze your current sales process and show you exactly how many leads you’re losing—and how to fix it with AI automation.
        </p>

        <a href="mailto:youremail@example.com" style={styles.button}>
          Book Strategy Call
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