import axios from "axios";
import * as cheerio from "cheerio";

/* ─────────────────────────────
   CONFIG
───────────────────────────── */

export const CONFIG = {
  query: "cleaning services Edmonton Alberta",
  timeout: 10000,
  delay: 1200,

  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
};

/* ─────────────────────────────
   HELPERS
───────────────────────────── */

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const clean = (text = "") =>
  text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();

/* ─────────────────────────────
   URL HELPERS (MORE ROBUST)
───────────────────────────── */

export function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function normalizeUrl(url) {
  try {
    if (!url || typeof url !== "string") return null;

    // ignore relative / junk links
    if (!url.startsWith("http")) return null;

    const parsed = new URL(url);

    // strip tracking + fragments
    parsed.hash = "";
    parsed.searchParams.forEach(() => {});
    parsed.search = "";

    return parsed.toString();
  } catch {
    return null;
  }
}