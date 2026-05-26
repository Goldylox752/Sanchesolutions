import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

const query = "cleaning services Edmonton Alberta";

async function scrape() {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);

    let leads = [];

    $(".tF2Cxc").each((i, el) => {
      const name = $(el).find("h3").text();
      const link = $(el).find("a").attr("href");
      const snippet = $(el).find(".VwiC3b").text();

      if (name) {
        leads.push({
          name,
          link,
          snippet
        });
      }
    });

    fs.writeFileSync("leads.json", JSON.stringify(leads, null, 2));

    console.log("✅ Leads saved:", leads.length);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

scrape();