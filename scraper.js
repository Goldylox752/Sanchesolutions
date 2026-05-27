import axios from "axios";
import cheerio from "cheerio";

/* ─────────────────────────────
   CONFIG
───────────────────────────── */

const CONFIG = {
  query: "cleaning services Edmonton Alberta",
  timeout: 8000,
  delay: 1200,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
};

/* ─────────────────────────────
   HELPERS
───────────────────────────── */

const clean = (t = "") => t.replace(/\s+/g, " ").trim();

function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  if (!url || !url.startsWith("http")) return null;
  return url.split("#")[0].split("?")[0];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ─────────────────────────────
   STEP 1: GOOGLE SCRAPER
───────────────────────────── */

async function scrapeGoogle(query = CONFIG.query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(
    query
  )}&num=20`;

  const { data } = await axios.get(url, {
    headers: { "User-Agent": CONFIG.userAgent },
  });

  const $ = cheerio.load(data);

  const leads = [];
  const seen = new Set();

  $("div.g").each((_, el) => {
    const name = clean($(el).find("h3").text());
    const link = normalizeUrl($(el).find("a").attr("href"));

    if (!name || !link) return;

    const domain = getDomain(link);
    if (!domain) return;

    const blocked = [
      "google",
      "facebook",
      "instagram",
      "linkedin",
      "yelp",
      "tiktok",
    ];

    if (blocked.some((b) => domain.includes(b))) return;
    if (seen.has(domain)) return;

    seen.add(domain);

    leads.push({
      name,
      website: link,
      domain,
    });
  });

  return leads;
}

/* ─────────────────────────────
   STEP 2: CONTACT DISCOVERY
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

  const results = [];

  for (const path of paths) {
    try {
      const url = baseUrl + path;

      const res = await axios.get(url, {
        timeout: CONFIG.timeout,
        headers: { "User-Agent": CONFIG.userAgent },
      });

      if (res?.data?.length > 200) results.push(url);
    } catch {}
  }

  return results;
}

/* ─────────────────────────────
   STEP 3: CONTACT EXTRACTION
───────────────────────────── */

function extractContacts(html = "") {
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
   STEP 4: ENRICH LEADS (SAAS LOGIC)
───────────────────────────── */

async function enrichLeads(leads) {
  const output = [];

  for (const lead of leads) {
    console.log(`🔍 Processing: ${lead.name}`);

    let emails = [];
    let phones = [];
    let socials = [];

    try {
      const res = await axios.get(lead.website, {
        timeout: CONFIG.timeout,
        headers: { "User-Agent": CONFIG.userAgent },
      });

      const main = extractContacts(res.data);
      emails.push(...main.emails);
      phones.push(...main.phones);
      socials.push(...main.socials);

      const contactPages = await findContactPages(lead.website);

      for (const page of contactPages) {
        try {
          const r = await axios.get(page, {
            timeout: CONFIG.timeout,
            headers: { "User-Agent": CONFIG.userAgent },
          });

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

    // ───────────── SCORE ENGINE ─────────────
    const score =
      uniqueEmails.length * 12 +
      uniquePhones.length * 6 +
      uniqueSocials.length * 3;

    const tier =
      score > 20 ? "hot" : score > 10 ? "warm" : "cold";

    output.push({
      ...lead,
      emails: uniqueEmails,
      phones: uniquePhones,
      socials: uniqueSocials,
      hasContact: uniqueEmails.length > 0 || uniquePhones.length > 0,
      score,
      tier,
      createdAt: new Date().toISOString(),
    });

    await sleep(CONFIG.delay);
  }

  return output;
}

/* ─────────────────────────────
   MAIN RUN
───────────────────────────── */

async function run() {
  console.log("🚀 CleanFlow SaaS Engine Starting...");

  const leads = await scrapeGoogle();
  console.log(`📦 Leads found: ${leads.length}`);

  const enriched = await enrichLeads(leads);

  const sorted = enriched.sort((a, b) => b.score - a.score);

  console.log("🔥 Top Lead:");
  console.log(sorted[0]);

  // Ready for SaaS (replace file save later with Supabase insert)
  return sorted;
}

run();