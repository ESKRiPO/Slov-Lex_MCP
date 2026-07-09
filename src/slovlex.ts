import { existsSync } from "node:fs";
import * as cheerio from "cheerio";
import { LRUCache } from "lru-cache";
import { z } from "zod";
import { httpGetJson, httpGetText } from "./http.js";

const API_BASE = "https://api-gateway.slov-lex.sk";
const STATIC_BASE = "https://static.slov-lex.sk/static";
const PORTAL_BASE = "https://www.slov-lex.sk/ezbierky/pravne-predpisy";
const RSS_URL = "https://vyhladavanie.slov-lex.sk/rss/predpisZbierky";
const SLOVAK_TIME_ZONE = "Europe/Bratislava";

const predpisRozsireneDocSchema = z
  .object({
    iri: z.string().min(1),
    cislo: z.string().optional(),
    nazov: z.string().optional(),
    typPredp_value: z.string().optional(),
    vyhlaseny: z.string().optional(),
    ucinnyOd: z.string().optional(),
    ucinnyDo: z.string().optional(),
    zodpovedajucaUcinnost: z.string().optional(),
    nadpisy: z.array(z.string()).optional(),
  })
  .passthrough();

const rozsireneResponseSchema = z
  .object({
    docs: z.array(predpisRozsireneDocSchema),
  })
  .passthrough();

const znenieResponseSchema = z
  .object({
    docs: z.array(z.object({ iri: z.string().min(1) }).passthrough()),
  })
  .passthrough();

const navrhyItemSchema = z
  .object({
    iri: z.string().min(1),
    typ: z.string().optional(),
    nazovPola: z.string().optional(),
    hodnotaPola: z.string().optional(),
    menovka: z.string().optional(),
    popis: z.string().optional(),
  })
  .passthrough();

const navrhyResponseSchema = z.array(navrhyItemSchema);

export type PredpisRozsireneDoc = z.infer<typeof predpisRozsireneDocSchema>;
export type NavrhyItem = z.infer<typeof navrhyItemSchema>;
export type RozsireneSearchResult = PredpisRozsireneDoc;

const MINUTE = 60_000;
const createCache = <T extends {}>(max: number, ttl: number) => new LRUCache<string, T>({ max, ttl });
const portalHtmlCache = createCache<string>(64, 6 * 60 * MINUTE);
const rozsireneCache = createCache<PredpisRozsireneDoc>(256, 24 * 60 * MINUTE);
const navrhySearchCache = createCache<NavrhyItem[]>(256, 10 * MINUTE);
const rozsireneSearchCache = createCache<RozsireneSearchResult[]>(256, 10 * MINUTE);

async function cached<T extends {}>(cache: LRUCache<string, T>, key: string, load: () => Promise<T>): Promise<T> {
  const cachedValue = cache.get(key);
  if (cachedValue !== undefined) return cachedValue;
  const value = await load();
  cache.set(key, value);
  return value;
}

function normalizeSearch(query: string, limit: number) {
  const value = query.trim();
  if (!value) return null;
  return {
    value,
    normalizedValue: value.toLocaleLowerCase("sk-SK"),
    limit: Math.min(Math.max(Math.floor(limit), 1), 25),
  };
}

function parseUpstream<T>(schema: z.ZodType<T>, data: unknown, source: string): T {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  const location = issue?.path.length ? issue.path.join(".") : "odpoveď";
  throw new Error(`Slov-Lex vrátil neočakávaný formát (${source}, ${location}): ${issue?.message ?? "neznáma chyba"}.`);
}

export function isValidIsoDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return false;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function todayInSlovakia(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SLOVAK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getOfficialPortalUrl(versionIri: string) {
  const normalizedIri = `/${versionIri.trim().replace(/^\/+|\/+$/g, "")}`;
  return `${PORTAL_BASE}${normalizedIri}/`;
}

export function parseLawBaseIri(input: string) {
  const trimmed = input.trim();
  const iriMatch = trimmed.match(/\/SK\/ZZ\/(\d{4})\/(\d{1,6})(?:\/\d{8})?\/?(?:[?#].*)?$/i);
  if (iriMatch) {
    const year = iriMatch[1];
    const number = iriMatch[2];
    return { number, year, baseIri: `/SK/ZZ/${year}/${number}` };
  }

  const citationMatch = trimmed.match(/^(\d{1,6})\s*\/\s*(\d{4})(?:\s+Z\.\s*z\.)?$/iu);
  if (citationMatch) {
    const number = citationMatch[1];
    const year = citationMatch[2];
    return { number, year, baseIri: `/SK/ZZ/${year}/${number}` };
  }

  throw new Error(`Neviem parsovať zákon: "${input}". Očakávam napr. "595/2003" alebo "/SK/ZZ/2003/595".`);
}

async function getRozsirene(field: "cislo" | "iri", value: string) {
  return cached(rozsireneCache, `${field}:${value}`, async () => {
    const url = `${API_BASE}/vyhladavanie/predpisZbierky/rozsirene?` + `${field}=${encodeURIComponent(value)}`;
    const raw = await httpGetJson<unknown>(url);
    const data = parseUpstream(rozsireneResponseSchema, raw, url);
    const matchingDoc = data.docs.find((item) =>
      field === "iri" ? item.iri === value : item.cislo?.startsWith(value),
    );
    const doc = matchingDoc ?? data.docs[0];
    if (!doc) {
      const detail = field === "iri" ? ` (IRI): ${value}` : `: ${value}`;
      throw new Error(`Predpis nenájdený${detail}`);
    }
    return doc;
  });
}

export function getRozsireneByCislo(cislo: string) {
  return getRozsirene("cislo", cislo);
}

export function getRozsireneByIri(iri: string) {
  return getRozsirene("iri", iri);
}

export async function getVersionIriForDate(baseIri: string, dateIso?: string) {
  const date = dateIso?.trim() ? dateIso.trim() : todayInSlovakia();
  if (!isValidIsoDate(date)) {
    throw new Error(`Neplatný kalendárny dátum: "${date}". Očakávam YYYY-MM-DD.`);
  }

  const url =
    `${API_BASE}/vyhladavanie/predpisZbierky/znenie?` +
    `zodpovedajucaUcinnost=${encodeURIComponent(date)}&predpis=${encodeURIComponent(baseIri)}`;
  const raw = await httpGetJson<unknown>(url);
  const data = parseUpstream(znenieResponseSchema, raw, url);
  const doc = data.docs[0];
  if (!doc?.iri) throw new Error(`Nenašlo sa znenie pre ${baseIri} k dátumu ${date}.`);
  return { versionIri: doc.iri, date };
}

async function getPortalHtmlWithPlaywright(url: string) {
  const { chromium } = await import("playwright");
  const executablePath = chromium.executablePath();
  if (!existsSync(executablePath)) {
    throw new Error(`Playwright Chromium nie je nainštalovaný (${executablePath}). Spusti "npm run install:browser".`);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto("https://www.slov-lex.sk/ezbierky/", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const responsePromise = page.waitForResponse((response) => response.url() === url, {
      timeout: 30_000,
    });
    const [response] = await Promise.all([
      responsePromise,
      page.evaluate(async (targetUrl) => {
        await fetch(targetUrl);
      }, url),
    ]);

    if (!response.ok()) {
      throw new Error(`Playwright fallback dostal HTTP ${response.status()} ${response.statusText()}.`);
    }
    return await response.text();
  } finally {
    await browser.close();
  }
}

export async function getPortalHtml(versionIri: string) {
  return cached(portalHtmlCache, versionIri, async () => {
    const url = `${STATIC_BASE}${versionIri}.portal`;
    try {
      return await httpGetText(url, { headers: { accept: "text/html" } });
    } catch (directError) {
      try {
        return await getPortalHtmlWithPlaywright(url);
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new AggregateError(
          [directError, fallbackError],
          `Nepodarilo sa načítať portálové HTML pre ${versionIri} priamo ani cez Playwright fallback: ${fallbackMessage}`,
        );
      }
    }
  });
}

export async function searchNavrhy(query: string, limit: number) {
  const search = normalizeSearch(query, limit);
  if (!search) return [];
  const key = `navrhy:${search.normalizedValue}::${search.limit}`;
  return cached(navrhySearchCache, key, async () => {
    const url =
      `${API_BASE}/vyhladavanie/predpisZbierky/navrhy?` +
      `dopyt=${encodeURIComponent(search.value)}&rows=${search.limit}&typ=predpisZbierky`;
    const raw = await httpGetJson<unknown>(url);
    return parseUpstream(navrhyResponseSchema, raw, url);
  });
}

export async function searchRozsirene(query: string, limit: number) {
  const search = normalizeSearch(query, limit);
  if (!search) return [];
  const key = `rozsirene:${search.normalizedValue}::${search.limit}`;
  return cached(rozsireneSearchCache, key, async () => {
    const url =
      `${API_BASE}/vyhladavanie/predpisZbierky/rozsirene?` +
      `text=${encodeURIComponent(search.value)}&rows=${search.limit}`;
    const raw = await httpGetJson<unknown>(url);
    return parseUpstream(rozsireneResponseSchema, raw, url).docs;
  });
}

export type RecentPredpis = {
  cislo: string;
  nazov: string;
  link: string;
  pubDate: string;
  creator?: string;
};

const recentCache = createCache<RecentPredpis[]>(1, 10 * MINUTE);

/** Získa najviac 20 najnovších položiek z RSS feedu Slov-Lex. */
export async function getRecentPredpisy(): Promise<RecentPredpis[]> {
  return cached(recentCache, "recent", async () => {
    const xml = await httpGetText(RSS_URL);
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: RecentPredpis[] = [];

    $("item").each((_, element) => {
      if (items.length >= 20) return false;
      const $item = $(element);
      const item: RecentPredpis = {
        cislo: $item.find("description").text().trim(),
        nazov: $item.find("title").text().trim(),
        link: $item.find("link").text().trim(),
        pubDate: $item.find("pubDate").text().trim(),
        creator: $item.find("dc\\:creator").text().trim() || undefined,
      };
      if (item.cislo && item.nazov && item.link) items.push(item);
    });

    return items;
  });
}
