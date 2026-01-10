import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

function norm(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function renderTable($: cheerio.CheerioAPI, $table: cheerio.Cheerio<AnyNode>): string {
  const rows: string[][] = [];
  $table.find("tr").each((_, tr) => {
    const cells: string[] = [];
    $(tr)
      .find("td, th")
      .each((__, cell) => {
        cells.push(norm($(cell).text()));
      });
    if (cells.length > 0) rows.push(cells);
  });
  if (rows.length === 0) return "";

  // Calculate column widths
  const colWidths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      colWidths[i] = Math.max(colWidths[i] ?? 0, cell.length);
    });
  }

  // Render table as text
  const lines: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const paddedCells = row.map((cell, j) => cell.padEnd(colWidths[j]));
    lines.push("| " + paddedCells.join(" | ") + " |");
    // Add separator after header row
    if (i === 0) {
      lines.push("| " + colWidths.map((w) => "-".repeat(w)).join(" | ") + " |");
    }
  }
  return lines.join("\n");
}

function getMainText($el: cheerio.Cheerio<AnyNode>) {
  // Get text only from div.text (the main text at the beginning of the unit)
  return norm($el.children("div.text").first().text());
}

function getTrailingContent($: cheerio.CheerioAPI, $el: cheerio.Cheerio<AnyNode>, indent: number): string[] {
  // Get content from div.text2 (appears AFTER child elements like písmenká/body)
  // May contain tables or continuation text
  const lines: string[] = [];

  $el.children("div.text2").each((_, text2) => {
    const $text2 = $(text2);
    // Check for tables
    const $table = $text2.find("table").first();
    if ($table.length > 0) {
      const tableText = renderTable($, $table);
      if (tableText) {
        // Add table lines with proper indentation
        for (const line of tableText.split("\n")) {
          lines.push(" ".repeat(indent) + line);
        }
      }
    } else {
      // Fallback to plain text
      const plainText = norm($text2.text());
      if (plainText) {
        lines.push(" ".repeat(indent) + plainText);
      }
    }
  });

  return lines;
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

  const text = getMainText($el);
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

  // Add trailing content (div.text2) AFTER child elements
  lines.push(...getTrailingContent($, $el, indent));

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
