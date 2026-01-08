import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getPortalHtml,
  getRozsireneByCislo,
  getRozsireneByIri,
  getVersionIriForDate,
  parseLawBaseIri,
  searchNavrhy,
} from "./slovlex.js";
import { extractParagrafFromPortalHtml, renderParagraf, renderWholeLawText } from "./portal.js";

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

const server = new McpServer({
  name: "slov-lex-mcp",
  version: "0.1.0",
});

server.tool(
  "get_law",
  {
    number: z.union([z.string(), z.number()]),
    year: z.union([z.string(), z.number()]),
  },
  async ({ number, year }) => {
    const cislo = `${String(number).trim()}/${String(year).trim()}`;
    const doc = await getRozsireneByCislo(cislo);
    const out = [
      `${doc.cislo ?? cislo} - ${doc.nazov ?? ""}`.trim(),
      doc.typPredp_value ? `Typ: ${doc.typPredp_value}` : null,
      doc.vyhlaseny ? `Vyhlásené: ${doc.vyhlaseny}` : null,
      doc.ucinnyOd || doc.ucinnyDo
        ? `Účinnosť: ${doc.ucinnyOd ?? "?"} - ${doc.ucinnyDo ?? "?"}`
        : null,
      doc.iri ? `IRI: ${doc.iri}` : null,
      doc.nadpisy?.length ? `Nadpisy: ${doc.nadpisy.slice(0, 40).join(" | ")}${doc.nadpisy.length > 40 ? " | …" : ""}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    return textResult(out);
  },
);

server.tool(
  "get_version",
  {
    law: z.string(),
    date: z.string().optional(),
    max_chars: z.number().int().positive().optional(),
  },
  async ({ law, date, max_chars }) => {
    const { baseIri } = parseLawBaseIri(law);
    const { versionIri, date: resolvedDate } = await getVersionIriForDate(baseIri, date);
    const meta = await getRozsireneByIri(versionIri);
    const portalHtml = await getPortalHtml(versionIri);
    const maxChars = max_chars ?? 20_000;
    const rendered = renderWholeLawText(portalHtml, maxChars);
    const header = [
      `${law} – znenie k ${resolvedDate}`,
      meta.ucinnyOd || meta.ucinnyDo ? `Účinnosť: ${meta.ucinnyOd ?? "?"} - ${meta.ucinnyDo ?? "?"}` : null,
      `IRI: ${versionIri}`,
    ]
      .filter(Boolean)
      .join("\n");
    return textResult(`${header}\n\n${rendered.text}`);
  },
);

server.tool(
  "get_paragraph",
  {
    law: z.string(),
    paragraph: z.string(),
    date: z.string().optional(),
  },
  async ({ law, paragraph, date }) => {
    const { baseIri } = parseLawBaseIri(law);
    const { versionIri, date: resolvedDate } = await getVersionIriForDate(baseIri, date);
    const meta = await getRozsireneByIri(versionIri);
    const portalHtml = await getPortalHtml(versionIri);

    const extracted = extractParagrafFromPortalHtml(portalHtml, paragraph);
    if (!extracted) {
      return textResult(`Nenašiel som ${paragraph} v ${law} (IRI: ${versionIri}).`);
    }
    const paraText = renderParagraf(extracted.$, extracted.$par);

    const header = [
      `${law} – ${paragraph} (k ${resolvedDate})`,
      meta.ucinnyOd || meta.ucinnyDo ? `Účinnosť: ${meta.ucinnyOd ?? "?"} - ${meta.ucinnyDo ?? "?"}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    return textResult(`${header}\n\n${paraText}`);
  },
);

server.tool(
  "search",
  {
    query: z.string(),
    limit: z.number().int().positive().max(25).optional(),
  },
  async ({ query, limit }) => {
    const items = await searchNavrhy(query, limit ?? 10);
    if (!items.length) return textResult("Bez výsledkov.");
    const out = items
      .map((i) => {
        const label = i.menovka ?? i.hodnotaPola ?? i.iri;
        const desc = i.popis ? ` - ${i.popis}` : "";
        return `${label}${desc}\nIRI: ${i.iri}`;
      })
      .join("\n\n");
    return textResult(out);
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
