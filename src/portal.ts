import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

function norm(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function directChildText($el: cheerio.Cheerio<AnyNode>) {
  return norm($el.children("div.text").first().text());
}

function labelFromId(prefix: string, id: string | undefined) {
  if (!id) return "";
  const m = id.match(new RegExp(`${prefix}-(\\d+)(?:\\b|$)`));
  return m ? m[1] : "";
}

function renderUnit(
  $: cheerio.CheerioAPI,
  el: AnyNode,
  indent: number,
  depth: number,
): string[] {
  if (depth > 20) return [];
  const $el = $(el);
  const classList = ($el.attr("class") ?? "").split(/\s+/);
  const isOdsek = classList.includes("odsek");
  const isPismeno = classList.includes("pismeno");
  const isBod = classList.includes("bod");

  let label = "";
  if (isOdsek) {
    label = norm($el.children("div.odsekOznacenie").first().text());
    if (!label) {
      const num = labelFromId("odsek", $el.attr("id"));
      label = num ? `(${num})` : "(?)";
    }
  } else if (isPismeno) {
    label = norm($el.children("div.pismenoOznacenie").first().text()) || "?";
  } else if (isBod) {
    label = norm($el.children("div.bodOznacenie").first().text()) || "?";
  }

  const text = directChildText($el);
  const lines: string[] = [];
  if (label || text) {
    lines.push(`${" ".repeat(indent)}${[label, text].filter(Boolean).join(" ")}`.trimEnd());
  }

  const childSelector = [
    "div.odsek",
    "div.pismeno",
    "div.bod",
  ].join(", ");

  $el.children(childSelector).each((_, child) => {
    const childClasses = ($(child).attr("class") ?? "").split(/\s+/);
    const childIndent =
      childClasses.includes("bod") || childClasses.includes("pismeno") || childClasses.includes("odsek")
        ? indent + 2
        : indent + 2;
    lines.push(...renderUnit($, child, childIndent, depth + 1));
  });

  return lines;
}

export function extractParagrafFromPortalHtml(portalHtml: string, paragrafId: string) {
  const $ = cheerio.load(portalHtml);
  const id = paragrafId.replace(/^§/i, "").trim().replace(/\s+/g, "");
  const cssId = `paragraf-${id.toLowerCase()}`;
  const $par = $(`div.paragraf#${cssId}`);
  if ($par.length === 0) return null;
  return { $, $par: $par.first() };
}

export function renderParagraf($: cheerio.CheerioAPI, $par: cheerio.Cheerio<AnyNode>) {
  const ozn = norm($par.children("div.paragrafOznacenie").first().text());
  const nadpis = norm($par.children("div.paragrafNadpis").first().text());
  const header = [ozn, nadpis ? `- ${nadpis}` : ""].join(" ").trim();
  const lines: string[] = [header];

  const childSelector = ["div.odsek", "div.pismeno", "div.bod"].join(", ");
  $par.children(childSelector).each((_, el) => {
    lines.push(...renderUnit($, el, 0, 0));
  });

  return lines.filter(Boolean).join("\n");
}

export function renderWholeLawText(portalHtml: string, maxChars: number) {
  const $ = cheerio.load(portalHtml);
  const parts: string[] = [];
  $("div.paragraf").each((_, el) => {
    const $par = $(el);
    const text = renderParagraf($, $par);
    if (text.trim()) parts.push(text.trim());
  });

  const full = parts.join("\n\n");
  if (full.length <= maxChars) return { text: full, truncated: false };
  return { text: full.slice(0, maxChars) + `\n\n…(truncated to ${maxChars} chars)…`, truncated: true };
}
