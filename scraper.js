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

async function scrape() {
  try {
    console.log("🔎 Searching leads...");

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

      // filter junk results
      if (!domain) return;
      if (domain.includes("google") || domain.includes("youtube")) return;

      leads.push({
        name,
        website: link,
        domain,
        snippet,
        source: "google",
        stage: "cold",
        createdAt: new Date().toISOString()
      });
    });

    // remove duplicates by domain
    const uniqueLeads = Array.from(
      new Map(leads.map(l => [l.domain, l])).values()
    );

    // rank leads (simple quality score)
    const scored = uniqueLeads.map(l => ({
      ...l,
      score: scoreLead(l)
    }));

    scored.sort((a, b) => b.score - a.score);

    fs.writeFileSync("leads.json", JSON.stringify(scored, null, 2));

    console.log(`✅ Leads saved: ${scored.length}`);
    console.log("🔥 Top lead:", scored[0]);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// simple scoring system (important upgrade)
function scoreLead(lead) {
  let score = 0;

  if (lead.snippet?.toLowerCase().includes("clean")) score += 3;
  if (lead.snippet?.toLowerCase().includes("service")) score += 2;
  if (lead.domain?.includes(".ca")) score += 2;
  if (lead.website?.includes("contact")) score += 1;

  return score;
}

scrape();