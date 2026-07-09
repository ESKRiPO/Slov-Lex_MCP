import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const OFFICIAL_STATIC_BASE = "https://static.slov-lex.sk";

const TOP_LEVEL_UNIT_CLASSES = new Set(["paragraf", "ustavnyclanok", "clanok", "priloha"]);

const GROUP_CLASSES = new Set([
  ...TOP_LEVEL_UNIT_CLASSES,
  "odsek",
  "pismeno",
  "bod",
  "veta",
  "oznacenaPolozka",
  "poznamka",
  "blokTextu",
  "citat",
]);

const STRUCTURAL_HEADING_CLASSES = new Set([
  "predpisNadpis",
  "predpisPodnadpis",
  "castOznacenie",
  "castNadpis",
  "hlavaOznacenie",
  "hlavaNadpis",
  "oddielOznacenie",
  "oddielNadpis",
  "dielOznacenie",
  "dielNadpis",
]);

function norm(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function classList($element: cheerio.Cheerio<AnyNode>) {
  return ($element.attr("class") ?? "").split(/\s+/).filter(Boolean);
}

function hasAnyClass($element: cheerio.Cheerio<AnyNode>, names: Set<string>) {
  return classList($element).some((name) => names.has(name));
}

function isGroup($element: cheerio.Cheerio<AnyNode>) {
  const classes = classList($element);
  return classes.includes("Skupina") || classes.some((name) => GROUP_CLASSES.has(name));
}

function isTopLevelUnit($element: cheerio.Cheerio<AnyNode>) {
  return hasAnyClass($element, TOP_LEVEL_UNIT_CLASSES);
}

function directChildWithClassSuffix($: cheerio.CheerioAPI, $element: cheerio.Cheerio<AnyNode>, suffix: string) {
  return $element
    .children()
    .filter((_, child) => classList($(child)).some((name) => name.endsWith(suffix)))
    .first();
}

function inferGroupLabel($element: cheerio.Cheerio<AnyNode>) {
  const classes = classList($element);
  const id = $element.attr("id") ?? "";
  const idPart = (kind: string) => id.match(new RegExp(`(?:^|[.])${kind}-([^.]+)`))?.[1];

  const odsek = classes.includes("odsek") ? idPart("odsek") : null;
  if (odsek) return `(${odsek})`;
  const pismeno = classes.includes("pismeno") ? idPart("pismeno") : null;
  if (pismeno) return `${pismeno})`;
  const bod = classes.includes("bod") ? idPart("bod") : null;
  if (bod) return `${bod}.`;
  const paragraf = classes.includes("paragraf") ? idPart("paragraf") : null;
  if (paragraf) return `§ ${paragraf}`;
  const article = classes.includes("ustavnyclanok") ? idPart("ustavnyclanok") : null;
  if (article) return `Čl. ${article}`;
  return "";
}

function resolveHttpUrl(href: string | undefined) {
  if (!href || href.startsWith("#")) return null;
  try {
    const url = new URL(href, OFFICIAL_STATIC_BASE);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function escapeMarkdownLinkLabel(value: string) {
  return value.replace(/([\\[\]])/g, "\\$1");
}

function inlineMarkdown($: cheerio.CheerioAPI, node: AnyNode): string {
  if (node.type === "text") return $(node).text();

  const $node = $(node);
  const tagName = String($node.prop("tagName") ?? "").toLowerCase();
  if (tagName === "br") return " ";

  if (tagName === "a") {
    const label = norm($node.text());
    const href = resolveHttpUrl($node.attr("href"));
    if (label && href) return `[${escapeMarkdownLinkLabel(label)}](${href})`;
    return label;
  }

  return $node
    .contents()
    .toArray()
    .map((child) => inlineMarkdown($, child))
    .join("");
}

function escapeTableCell(value: string) {
  return norm(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function renderTable($: cheerio.CheerioAPI, $table: cheerio.Cheerio<AnyNode>): string[] {
  const rows: string[][] = [];

  $table.find("tr").each((_, row) => {
    const cells: string[] = [];
    $(row)
      .children("th, td")
      .each((__, cell) => {
        const $cell = $(cell);
        cells.push(escapeTableCell($cell.text()));
        const colspan = Number.parseInt($cell.attr("colspan") ?? "1", 10);
        for (let i = 1; i < colspan; i += 1) cells.push("");
      });
    if (cells.length > 0) rows.push(cells);
  });

  if (rows.length === 0) return [];
  const columnCount = Math.max(...rows.map((row) => row.length));
  for (const row of rows) {
    while (row.length < columnCount) row.push("");
  }
  const [header, ...body] = rows;
  return [
    `| ${header.join(" | ")} |`,
    `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`),
  ];
}

function renderContentBlock(
  $: cheerio.CheerioAPI,
  $element: cheerio.Cheerio<AnyNode>,
  indent: number,
  depth: number,
): string[] {
  if (depth > 30) return [];

  const lines: string[] = [];
  let inlineBuffer = "";
  const indentation = " ".repeat(indent);

  const flushInline = () => {
    const value = norm(inlineBuffer);
    if (value) lines.push(`${indentation}${value}`);
    inlineBuffer = "";
  };

  $element.contents().each((_, child) => {
    if (child.type === "text") {
      inlineBuffer += $(child).text();
      return;
    }

    const $child = $(child);
    const tagName = String($child.prop("tagName") ?? "").toLowerCase();

    if (tagName === "br") {
      inlineBuffer += " ";
      return;
    }

    if (tagName === "table") {
      flushInline();
      lines.push(...renderTable($, $child).map((line) => `${indentation}${line}`));
      return;
    }

    if (isGroup($child)) {
      flushInline();
      lines.push(...renderGroup($, child, indent, depth + 1));
      return;
    }

    if (["div", "p", "ul", "ol", "li"].includes(tagName)) {
      flushInline();
      const childLines = renderContentBlock($, $child, indent, depth + 1);
      if (tagName === "li" && childLines.length > 0) {
        childLines[0] = `${indentation}- ${childLines[0].slice(indent)}`;
      }
      lines.push(...childLines);
      return;
    }

    inlineBuffer += inlineMarkdown($, child);
  });

  flushInline();
  return lines;
}

function renderGroup($: cheerio.CheerioAPI, element: AnyNode, indent: number, depth: number): string[] {
  if (depth > 30) return [];

  const $element = $(element);
  const $label = directChildWithClassSuffix($, $element, "Oznacenie");
  const $title = directChildWithClassSuffix($, $element, "Nadpis");
  const label = norm($label.text()) || inferGroupLabel($element);
  const title = norm($title.text());
  const header = [label, title ? `- ${title}` : ""].filter(Boolean).join(" ");
  const separateHeader = isTopLevelUnit($element);
  const lines: string[] = [];
  let pendingLabel = separateHeader ? "" : header;
  const indentation = " ".repeat(indent);

  if (separateHeader && header) lines.push(`${indentation}${header}`);

  const flushPendingLabel = () => {
    if (!pendingLabel) return;
    lines.push(`${indentation}${pendingLabel}`);
    pendingLabel = "";
  };

  const appendContent = (contentLines: string[]) => {
    if (contentLines.length === 0) return;
    if (pendingLabel) {
      const first = contentLines[0].slice(indent).trimStart();
      lines.push(`${indentation}${pendingLabel}${first ? ` ${first}` : ""}`);
      pendingLabel = "";
      lines.push(...contentLines.slice(1));
      return;
    }
    lines.push(...contentLines);
  };

  $element.contents().each((_, child) => {
    if (child === $label.get(0) || child === $title.get(0)) return;
    if (child.type === "text") {
      const value = norm($(child).text());
      if (value) appendContent([`${indentation}${value}`]);
      return;
    }

    const $child = $(child);
    const tagName = String($child.prop("tagName") ?? "").toLowerCase();

    if (tagName === "table") {
      appendContent(renderTable($, $child).map((line) => `${indentation}${line}`));
      return;
    }

    if (isGroup($child)) {
      flushPendingLabel();
      const childIndent = separateHeader ? indent : indent + 2;
      lines.push(...renderGroup($, child, childIndent, depth + 1));
      return;
    }

    appendContent(renderContentBlock($, $child, indent, depth + 1));
  });

  flushPendingLabel();
  return lines.filter((line) => line.trim());
}

function collectDocumentBlocks($: cheerio.CheerioAPI, $root: cheerio.Cheerio<AnyNode>, blocks: AnyNode[]) {
  $root.children().each((_, child) => {
    const $child = $(child);
    const classes = classList($child);

    if (
      isTopLevelUnit($child) ||
      classes.some((name) => STRUCTURAL_HEADING_CLASSES.has(name)) ||
      classes.includes("text") ||
      classes.includes("text2")
    ) {
      blocks.push(child);
      return;
    }

    collectDocumentBlocks($, $child, blocks);
  });
}

export function extractParagrafFromPortalHtml(portalHtml: string, paragrafId: string) {
  const $ = cheerio.load(portalHtml);
  const normalizedId = paragrafId.replace(/^§/iu, "").trim().replace(/\s+/g, "").toLowerCase();
  const expectedId = `paragraf-${normalizedId}`;
  const $paragraf = $("div.paragraf")
    .filter((_, element) => ($(element).attr("id") ?? "").toLowerCase() === expectedId)
    .first();
  if ($paragraf.length === 0) return null;
  return { $, $par: $paragraf };
}

export function renderParagraf($: cheerio.CheerioAPI, $paragraf: cheerio.Cheerio<AnyNode>) {
  const element = $paragraf.get(0);
  if (!element) return "";
  return renderGroup($, element, 0, 0).join("\n");
}

export function renderWholeLawText(portalHtml: string, maxChars: number, offset = 0) {
  if (!Number.isSafeInteger(maxChars) || maxChars <= 0) {
    throw new Error("maxChars musí byť kladné celé číslo.");
  }
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error("offset musí byť nezáporné celé číslo.");
  }

  const $ = cheerio.load(portalHtml);
  const blocks: AnyNode[] = [];
  const $predpis = $("#predpis").first();

  if ($predpis.length > 0) {
    collectDocumentBlocks($, $predpis, blocks);
  } else {
    $("div.paragraf[id^='paragraf-'], div.ustavnyclanok, div.clanok").each((_, element) => {
      blocks.push(element);
    });
  }

  $("#prilohy")
    .first()
    .children("div.priloha")
    .each((_, element) => {
      blocks.push(element);
    });

  const parts = blocks
    .map((element) => {
      const $element = $(element);
      if (isTopLevelUnit($element)) return renderGroup($, element, 0, 0).join("\n");
      const classes = classList($element);
      if (classes.some((name) => STRUCTURAL_HEADING_CLASSES.has(name))) {
        return norm($element.text());
      }
      return renderContentBlock($, $element, 0, 0).join("\n");
    })
    .map((part) => part.trim())
    .filter(Boolean);

  const fullText = parts.join("\n\n").replace(/\n{3,}/g, "\n\n");
  if (offset > fullText.length) {
    throw new Error(`Offset ${offset} je mimo rozsahu dokumentu (${fullText.length} znakov).`);
  }

  const requestedEnd = Math.min(offset + maxChars, fullText.length);
  let endOffset = requestedEnd;
  if (requestedEnd < fullText.length) {
    const minimumBoundary = offset + Math.floor(maxChars * 0.75);
    for (const separator of ["\n\n", "\n", " "]) {
      const boundary = fullText.lastIndexOf(separator, requestedEnd - 1);
      if (boundary >= minimumBoundary) {
        endOffset = boundary + separator.length;
        break;
      }
    }
  }
  const text = fullText.slice(offset, endOffset);
  const hasMore = endOffset < fullText.length;

  return {
    text,
    offset,
    endOffset,
    totalChars: fullText.length,
    hasMore,
    nextOffset: hasMore ? endOffset : null,
    truncated: offset > 0 || hasMore,
  };
}
