import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

const query = "cleaning services Edmonton Alberta";

/* ─────────────────────────────
   HELPERS
───────────────────────────── */

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
  if (!url.startsWith("http")) return null;
  return url.split("#")[0].split("?")[0];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ─────────────────────────────
   STEP 1: GOOGLE SCRAPER
───────────────────────────── */

async function scrapeGoogle() {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  const $ = cheerio.load(data);

  const leads = [];
  const seenDomains = new Set();

  $("div.g").each((_, el) => {
    const title = clean($(el).find("h3").text());
    let link = normalizeUrl($(el).find("a").attr("href"));

    if (!title || !link) return;

    const domain = getDomain(link);
    if (!domain) return;

    // block junk platforms
    const blocked = [
      "google",
      "facebook",
      "instagram",
      "linkedin",
      "yelp",
      "tiktok",
    ];

    if (blocked.some((b) => domain.includes(b))) return;
    if (seenDomains.has(domain)) return;

    seenDomains.add(domain);

    leads.push({
      name: title,
      website: link,
      domain,
    });
  });

  return leads;
}

/* ─────────────────────────────
   STEP 2: FIND CONTACT PAGES
───────────────────────────── */

async function findContactPages(baseUrl) {
  const paths = [
    "/contact",
    "/contact-us",
    "/about",
    "/about-us",
    "/services",
    "/get-a-quote",
    "/book",
  ];

  const found = [];

  for (const path of paths) {
    try {
      const url = baseUrl + path;

      const res = await axios.get(url, {
        timeout: 5000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (res?.data && res.data.length > 200) {
        found.push(url);
      }
    } catch {
      // ignore broken pages
    }
  }

  return found;
}

/* ─────────────────────────────
   STEP 3: EXTRACT CONTACTS
───────────────────────────── */

function extractContacts(html) {
  const emails =
    html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

  const phones =
    html.match(/(\+?1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g) || [];

  const socials =
    html.match(
      /https?:\/\/(www\.)?(facebook|instagram|tiktok|linkedin)[^\s"']+/g
    ) || [];

  const cleanEmails = [...new Set(emails)].filter(
    (e) =>
      !e.includes("example") &&
      !e.includes("test") &&
      !e.includes("domain")
  );

  return {
    emails: cleanEmails,
    phones: [...new Set(phones)],
    socials: [...new Set(socials)],
  };
}

/* ─────────────────────────────
   STEP 4: ENRICH LEADS
───────────────────────────── */

async function enrich(leads) {
  const enriched = [];

  for (const lead of leads) {
    console.log(`🔍 Scanning: ${lead.name}`);

    let emails = [];
    let phones = [];
    let socials = [];

    try {
      const res = await axios.get(lead.website, {
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const main = extractContacts(res.data);

      emails.push(...main.emails);
      phones.push(...main.phones);
      socials.push(...main.socials);

      const contactPages = await findContactPages(lead.website);

      for (const page of contactPages) {
        try {
          const r = await axios.get(page, { timeout: 5000 });
          const extra = extractContacts(r.data);

          emails.push(...extra.emails);
          phones.push(...extra.phones);
          socials.push(...extra.socials);
        } catch {}
      }
    } catch {}

    const uniqueEmails = [...new Set(emails)];
    const uniquePhones = [...new Set(phones)];
    const uniqueSocials = [...new Set(socials)];

    /* ─────────────────────────────
       SCORING SYSTEM (SaaS STYLE)
    ───────────────────────────── */

    const score =
      uniqueEmails.length * 12 +
      uniquePhones.length * 6 +
      uniqueSocials.length * 3;

    enriched.push({
      ...lead,
      emails: uniqueEmails,
      phones: uniquePhones,
      socials: uniqueSocials,
      hasContact: uniqueEmails.length > 0 || uniquePhones.length > 0,
      score,
      tier:
        score > 20 ? "hot" : score > 10 ? "warm" : "cold",
    });

    await sleep(1200);
  }

  return enriched;
}

/* ─────────────────────────────
   MAIN RUN
───────────────────────────── */

async function run() {
  console.log("🚀 CleanFlow Lead Engine Starting...");

  const leads = await scrapeGoogle();
  console.log(`📦 Leads found: ${leads.length}`);

  const enriched = await enrich(leads);

  const sorted = enriched.sort((a, b) => b.score - a.score);

  fs.writeFileSync(
    "leads.json",
    JSON.stringify(sorted, null, 2)
  );

  console.log("✅ DONE");
  console.log("🔥 Top Lead:");
  console.log(sorted[0]);
}

run();