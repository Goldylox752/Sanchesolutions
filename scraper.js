import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

const query = "cleaning services Edmonton Alberta";

function clean(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

// STEP 1: scrape google
async function scrapeGoogle() {
  const { data } = await axios.get(
    `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      }
    }
  );

  const $ = cheerio.load(data);

  let leads = [];

  $(".tF2Cxc").each((i, el) => {
    const name = clean($(el).find("h3").text());
    const link = $(el).find("a").attr("href");
    const snippet = clean($(el).find(".VwiC3b").text());

    if (!name || !link) return;

    const domain = getDomain(link);

    if (!domain || domain.includes("google")) return;

    leads.push({
      name,
      website: link,
      domain,
      snippet
    });
  });

  return leads;
}

// STEP 2: find emails on website
async function findEmails(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      }
    });

    const emails = data.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    );

    if (!emails) return [];

    // filter junk emails
    return [...new Set(emails)].filter(
      (e) =>
        !e.includes("example") &&
        !e.includes("domain") &&
        !e.includes("test")
    );
  } catch {
    return [];
  }
}

// STEP 3: enrich leads
async function enrich(leads) {
  let enriched = [];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    console.log(`🔍 Checking: ${lead.name}`);

    const emails = await findEmails(lead.website);

    enriched.push({
      ...lead,
      emails,
      hasEmail: emails.length > 0,
      score: emails.length > 0 ? 10 : 5
    });

    // slow down to avoid blocking
    await new Promise((r) => setTimeout(r, 1500));
  }

  return enriched;
}

// MAIN RUN
async function run() {
  console.log("🚀 Scraping Google...");
  const leads = await scrapeGoogle();

  console.log(`📦 Found: ${leads.length} leads`);

  console.log("📡 Enriching with emails...");
  const enriched = await enrich(leads);

  const sorted = enriched.sort((a, b) => b.score - a.score);

  fs.writeFileSync("leads.json", JSON.stringify(sorted, null, 2));

  console.log("✅ DONE - leads.json updated");
  console.log("🔥 Sample lead:", sorted[0]);
}

run();