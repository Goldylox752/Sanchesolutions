import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

const query = "cleaning services Edmonton Alberta";

// -------------------- HELPERS --------------------

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// -------------------- STEP 1: GOOGLE SCRAPE --------------------

async function scrapeGoogle() {
  const url = `https://www.google.com/search?q=${encodeURIComponent(
    query
  )}&num=20`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  const $ = cheerio.load(data);

  const leads = [];

  $("a h3").each((_, el) => {
    const name = clean($(el).text());
    const parent = $(el).closest("a");
    const link = parent.attr("href");

    if (!name || !link) return;
    if (!link.startsWith("http")) return;

    const domain = getDomain(link);
    if (!domain) return;

    // filter junk
    if (
      domain.includes("google") ||
      domain.includes("facebook") ||
      domain.includes("instagram") ||
      domain.includes("yelp")
    ) {
      return;
    }

    leads.push({
      name,
      website: link,
      domain,
    });
  });

  return leads;
}

// -------------------- STEP 2: FIND CONTACT PAGES --------------------

async function findContactPages(baseUrl) {
  const possiblePaths = [
    "/contact",
    "/contact-us",
    "/about",
    "/about-us",
    "/book",
  ];

  const found = [];

  for (const path of possiblePaths) {
    try {
      const url = baseUrl + path;

      const { data } = await axios.get(url, {
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (data) found.push(url);
    } catch {}
  }

  return found;
}

// -------------------- STEP 3: EXTRACT EMAILS + PHONES --------------------

function extractContacts(html) {
  const emails =
    html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];

  const phones =
    html.match(
      /(\+?1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g
    ) || [];

  const cleanEmails = [...new Set(emails)].filter(
    (e) =>
      !e.includes("example") &&
      !e.includes("test") &&
      !e.includes("domain")
  );

  const cleanPhones = [...new Set(phones)];

  return {
    emails: cleanEmails,
    phones: cleanPhones,
  };
}

// -------------------- STEP 4: ENRICH LEADS --------------------

async function enrich(leads) {
  const enriched = [];

  for (const lead of leads) {
    console.log(`🔍 Scanning: ${lead.name}`);

    let emails = [];
    let phones = [];

    try {
      const { data } = await axios.get(lead.website, {
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const main = extractContacts(data);
      emails.push(...main.emails);
      phones.push(...main.phones);

      // try contact pages
      const contactPages = await findContactPages(lead.website);

      for (const page of contactPages) {
        try {
          const res = await axios.get(page, { timeout: 5000 });
          const extra = extractContacts(res.data);

          emails.push(...extra.emails);
          phones.push(...extra.phones);
        } catch {}
      }
    } catch {}

    const uniqueEmails = [...new Set(emails)];
    const uniquePhones = [...new Set(phones)];

    enriched.push({
      ...lead,
      emails: uniqueEmails,
      phones: uniquePhones,
      hasContact: uniqueEmails.length > 0 || uniquePhones.length > 0,
      score: uniqueEmails.length * 10 + uniquePhones.length * 5,
    });

    await sleep(1200);
  }

  return enriched;
}

// -------------------- MAIN --------------------

async function run() {
  console.log("🚀 Scraping Google leads...");

  const leads = await scrapeGoogle();
  console.log(`📦 Found: ${leads.length}`);

  console.log("📡 Enriching leads with contacts...");
  const enriched = await enrich(leads);

  const sorted = enriched.sort((a, b) => b.score - a.score);

  fs.writeFileSync("leads.json", JSON.stringify(sorted, null, 2));

  console.log("✅ DONE");
  console.log("🔥 Best lead:", sorted[0]);
}

run();