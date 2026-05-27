import axios from "axios";
import * as cheerio from "cheerio";

const CONFIG = {
  query: "cleaning services Edmonton Alberta",
  timeout: 8000,
  delay: 1200,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clean(t = "") {
  return t.replace(/\s+/g, " ").trim();
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  try {
    if (!url?.startsWith("http")) return null;
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return null;
  }
}