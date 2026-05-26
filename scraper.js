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

function normalizeUrl(url) {
  if (!url) return null;
  if (url.startsWith("/")) return null;
  return url.split("&")[0];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// -------------------- STEP 1: GOOGLE SCRAPE (IMPROVED) --------------------

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
  const seen = new Set();

  $("div.g").each((_, el) => {
    const title = clean($(el).find("h3").text());
    let link = $(el).find("a").attr("href");

    link = normalizeUrl(link);

    if (!title || !link) return;

    const domain = getDomain(link);
    if (!domain) return;

    // filter junk domains
    if (
      domain.includes("google") ||
      domain.includes("facebook") ||
      domain.includes("instagram") ||
      domain.includes("yelp") ||
      domain.includes("linkedin")
    ) {
      return;
    }

    if (seen.has(domain)) return;
    seen.add(domain);

    leads.push({
      name: title,
      website: link,
      domain,
    });
  });

  return leads;
}

// -------------------- STEP 2: FIND CONTACT PATHS --------------------

async function findContactPages(baseUrl) {
  const paths = [
    "/contact",
    "/contact-us",
    "/about",
    "/about-us",
    "/services",
    "/book",
    "/get-a-quote",
  ];

  const found = [];

  for (const path of paths) {
    try {
      const url = baseUrl + path;

      const { data } = await axios.get(url, {
        timeout: 6000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (data && data.length > 100) {
        found.push(url);
      }
    } catch {}
  }

  return found;
}

// -------------------- STEP 3: EXTRACT CONTACTS --------------------

function extractContacts(html) {
  const emails =
    html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];

  const phones =
    html.match(
      /(\+?1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g
    ) || [];

  const socials = [];

  const socialMatches =
    html.match(/https?:\/\/(www\.)?(facebook|instagram|tiktok|linkedin)[^\s"']+/g) ||
    [];

  socials.push(...socialMatches);

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
    socials: [...new Set(socials)],
  };
}

// -------------------- STEP 4: ENRICH LEADS --------------------

async function enrich(leads) {
  const enriched = [];

  for (const lead of leads) {
    console.log(`🔍 Scanning: ${lead.name}`);

    let emails = [];
    let phones = [];
    let socials = [];

    try {
      const { data } = await axios.get(lead.website, {
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const main = extractContacts(data);
      emails.push(...main.emails);
      phones.push(...main.phones);
      socials.push(...main.socials);

      const contactPages = await findContactPages(lead.website);

      for (const page of contactPages) {
        try {
          const res = await axios.get(page, { timeout: 6000 });

          const extra = extractContacts(res.data);
          emails.push(...extra.emails);
          phones.push(...extra.phones);
          socials.push(...extra.socials);
        } catch {}
      }
    } catch {}

    const uniqueEmails = [...new Set(emails)];
    const uniquePhones = [...new Set(phones)];
    const uniqueSocials = [...new Set(socials)];

    // -------------------- SCORING --------------------
    let score = 0;
    score += uniqueEmails.length * 12;
    score += uniquePhones.length * 6;
    score += uniqueSocials.length * 3;

    enriched.push({
      ...lead,
      emails: uniqueEmails,
      phones: uniquePhones,
      socials: uniqueSocials,
      hasContact: uniqueEmails.length > 0 || uniquePhones.length > 0,
      score,
    });

    await sleep(1200);
  }

  return enriched;
}

// -------------------- MAIN --------------------

async function run() {
  console.log("🚀 Starting lead scrape...");

  const leads = await scrapeGoogle();
  console.log(`📦 Found leads: ${leads.length}`);

  const enriched = await enrich(leads);

  const sorted = enriched.sort((a, b) => b.score - a.score);

  fs.writeFileSync("leads.json", JSON.stringify(sorted, null, 2));

  console.log("✅ DONE");
  console.log("🔥 Best lead:");
  console.log(sorted[0]);
}

run();