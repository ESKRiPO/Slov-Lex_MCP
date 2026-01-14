import { LRUCache } from "lru-cache";
import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { httpGetJson, httpGetText } from "./http.js";

const API_BASE = "https://api-gateway.slov-lex.sk";
const STATIC_BASE = "https://static.slov-lex.sk/static";

type PredpisRozsireneDoc = {
  iri: string;
  cislo?: string;
  nazov?: string;
  typPredp_value?: string;
  vyhlaseny?: string;
  ucinnyOd?: string;
  ucinnyDo?: string;
  zodpovedajucaUcinnost?: string;
  nadpisy?: string[];
};

type RozsireneResponse = {
  numFound: number;
  start: number;
  docs: PredpisRozsireneDoc[];
};

type ZnenieResponse = {
  numFound: number;
  start: number;
  numFoundExact?: boolean;
  docs: Array<{ iri: string }>;
};

type NavrhyItem = {
  iri: string;
  typ: string;
  nazovPola?: string;
  hodnotaPola?: string;
  menovka?: string;
  popis?: string;
};

const portalHtmlCache = new LRUCache<string, string>({
  max: 64,
  ttl: 1000 * 60 * 60 * 6,
});

const rozsireneCache = new LRUCache<string, PredpisRozsireneDoc>({
  max: 256,
  ttl: 1000 * 60 * 60 * 24,
});

const searchCache = new LRUCache<string, NavrhyItem[]>({
  max: 256,
  ttl: 1000 * 60 * 10,
});

function toYyyyMmDd(date: Date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseLawBaseIri(input: string) {
  const trimmed = input.trim();
  const iriMatch = trimmed.match(/\/?SK\/ZZ\/(\d{4})\/(\d{1,6})/);
  if (iriMatch) {
    const year = iriMatch[1];
    const number = iriMatch[2];
    return { number, year, baseIri: `/SK/ZZ/${year}/${number}` };
  }
  const cisloMatch = trimmed.match(/(\d{1,6})\s*\/\s*(\d{4})/);
  if (cisloMatch) {
    const number = cisloMatch[1];
    const year = cisloMatch[2];
    return { number, year, baseIri: `/SK/ZZ/${year}/${number}` };
  }
  throw new Error(
    `Neviem parsovať zákon: "${input}". Očakávam napr. "595/2003" alebo "/SK/ZZ/2003/595".`,
  );
}

export async function getRozsireneByCislo(cislo: string) {
  const cacheKey = `cislo:${cislo}`;
  const cached = rozsireneCache.get(cacheKey);
  if (cached) return cached;
  const url = `${API_BASE}/vyhladavanie/predpisZbierky/rozsirene?cislo=${encodeURIComponent(cislo)}`;
  const data = await httpGetJson<RozsireneResponse>(url);
  const doc = data.docs?.[0];
  if (!doc) throw new Error(`Predpis nenájdený: ${cislo}`);
  rozsireneCache.set(cacheKey, doc);
  return doc;
}

export async function getRozsireneByIri(iri: string) {
  const cacheKey = `iri:${iri}`;
  const cached = rozsireneCache.get(cacheKey);
  if (cached) return cached;
  const url = `${API_BASE}/vyhladavanie/predpisZbierky/rozsirene?iri=${encodeURIComponent(iri)}`;
  const data = await httpGetJson<RozsireneResponse>(url);
  const doc = data.docs?.[0];
  if (!doc) throw new Error(`Predpis nenájdený (iri): ${iri}`);
  rozsireneCache.set(cacheKey, doc);
  return doc;
}

export async function getVersionIriForDate(baseIri: string, dateIso?: string) {
  const date = dateIso?.trim() ? dateIso.trim() : toYyyyMmDd(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Neplatný dátum: "${date}". Očakávam YYYY-MM-DD.`);
  }
  const url =
    `${API_BASE}/vyhladavanie/predpisZbierky/znenie?` +
    `zodpovedajucaUcinnost=${encodeURIComponent(date)}&predpis=${encodeURIComponent(baseIri)}`;
  const data = await httpGetJson<ZnenieResponse>(url);
  const doc = data.docs?.[0];
  if (!doc?.iri) throw new Error(`Nenašlo sa znenie pre ${baseIri} k dátumu ${date}.`);
  return { versionIri: doc.iri, date };
}

export async function getPortalHtml(versionIri: string) {
  const cached = portalHtmlCache.get(versionIri);
  if (cached) return cached;

  const url = `${STATIC_BASE}${versionIri}.portal`;
  try {
    const html = await httpGetText(url, { headers: { accept: "text/html" } });
    portalHtmlCache.set(versionIri, html);
    return html;
  } catch (err) {
    // Fallback: load via Playwright (some environments block direct static fetch).
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const htmlPromise = new Promise<string>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Playwright fallback timed out.")),
          30_000,
        );
        page.on("response", async (res) => {
          const resUrl = res.url();
          if (resUrl === url) {
            clearTimeout(timer);
            try {
              resolve(await res.text());
            } catch (e) {
              reject(e);
            }
          }
        });
      });
      await page.goto("https://www.slov-lex.sk/ezbierky/", { waitUntil: "domcontentloaded" });
      await page.evaluate((u) => fetch(u).catch(() => null), url);
      const html = await htmlPromise;
      portalHtmlCache.set(versionIri, html);
      return html;
    } finally {
      await browser.close();
    }
  }
}

export async function searchNavrhy(query: string, limit: number) {
  const q = query.trim();
  if (!q) return [];
  const key = `navrhy:${q}::${limit}`;
  const cached = searchCache.get(key);
  if (cached) return cached;
  const url =
    `${API_BASE}/vyhladavanie/predpisZbierky/navrhy?` +
    `dopyt=${encodeURIComponent(q)}&rows=${encodeURIComponent(String(limit))}&typ=predpisZbierky`;
  const items = await httpGetJson<NavrhyItem[]>(url);
  searchCache.set(key, items);
  return items;
}

type RozsireneSearchResult = {
  iri: string;
  cislo?: string;
  nazov?: string;
  nadpisy?: string[];
  typPredp_value?: string;
  ucinnyOd?: string;
  ucinnyDo?: string;
};

export async function searchRozsirene(query: string, limit: number): Promise<RozsireneSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const key = `rozsirene:${q}::${limit}`;
  const cached = searchCache.get(key);
  if (cached) return cached as unknown as RozsireneSearchResult[];
  const url =
    `${API_BASE}/vyhladavanie/predpisZbierky/rozsirene?` +
    `text=${encodeURIComponent(q)}&rows=${encodeURIComponent(String(limit))}`;
  const data = await httpGetJson<RozsireneResponse>(url);
  const results = data.docs ?? [];
  searchCache.set(key, results as unknown as NavrhyItem[]);
  return results;
}

const RSS_URL = "https://vyhladavanie.slov-lex.sk/rss/predpisZbierky";

export type RecentPredpis = {
  cislo: string;
  nazov: string;
  link: string;
  pubDate: string;
  creator?: string;
};

const recentCache = new LRUCache<string, RecentPredpis[]>({
  max: 1,
  ttl: 1000 * 60 * 10, // 10 minút
});

/**
 * Získa posledných 20 vyhlásených predpisov z RSS feedu Slov-Lex.
 * POZOR: RSS feed obsahuje len 20 najnovších položiek, nie kompletný archív.
 */
export async function getRecentPredpisy(): Promise<RecentPredpis[]> {
  const cached = recentCache.get("recent");
  if (cached) return cached;

  const xml = await httpGetText(RSS_URL);
  const $ = cheerio.load(xml, { xmlMode: true });

  const items: RecentPredpis[] = [];
  $("item").each((_, el) => {
    const $item = $(el);
    items.push({
      cislo: $item.find("description").text().trim(),
      nazov: $item.find("title").text().trim(),
      link: $item.find("link").text().trim(),
      pubDate: $item.find("pubDate").text().trim(),
      creator: $item.find("dc\\:creator").text().trim() || undefined,
    });
  });

  recentCache.set("recent", items);
  return items;
}
