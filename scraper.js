import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

const query = "cleaning services Edmonton Alberta";

function cleanText(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

async function scrape() {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);

    let leads = [];

    $(".tF2Cxc").each((i, el) => {
      const name = cleanText($(el).find("h3").text());
      const link = $(el).find("a").attr("href");
      const snippet = cleanText($(el).find(".VwiC3b").text());

      if (!name || !link) return;

      const domain = extractDomain(link);

      // filter junk / irrelevant results
      if (!domain || domain.includes("google")) return;

      leads.push({
        name,
        website: link,
        domain,
        snippet,
        source: "google",
        status: "new",
        createdAt: new Date().toISOString()
      });
    });

    // remove duplicates
    const unique = Array.from(
      new Map(leads.map(l => [l.domain, l])).values()
    );

    // sort best results first (simple heuristic)
    unique.sort((a, b) => b.snippet.length - a.snippet.length);

    fs.writeFileSync("leads.json", JSON.stringify(unique, null, 2));

    console.log(`✅ Leads saved: ${unique.length}`);
    console.log("📦 Sample lead:", unique[0]);
  } catch (err) {
    console.error("Scraper error:", err.message);
  }
}

scrape();