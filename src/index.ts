import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getPortalHtml,
  getRecentPredpisy,
  getRozsireneByCislo,
  getRozsireneByIri,
  getVersionIriForDate,
  parseLawBaseIri,
  searchNavrhy,
  searchRozsirene,
} from "./slovlex.js";
import { extractParagrafFromPortalHtml, renderParagraf, renderWholeLawText } from "./portal.js";

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

const server = new McpServer({
  name: "slov-lex-mcp",
  version: "1.2.3",
});

server.tool(
  "get_law",
  "Získa základné informácie o zákone podľa čísla a roku (napr. 595/2003).",
  {
    number: z.union([z.string(), z.number()]).describe("Číslo zákona"),
    year: z.union([z.string(), z.number()]).describe("Rok vydania"),
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
  "Získa úplné znenie zákona. DÔLEŽITÉ: Bez parametra 'date' vráti AKTUÁLNE platné znenie (k dnešnému dňu). Zákony sa menia v čase - pre historické prípady (napr. daňové priznanie za rok 2023) použi parameter 'date' s príslušným dátumom.",
  {
    law: z.string().describe("Číslo zákona (napr. '595/2003') alebo IRI"),
    date: z.string().optional().describe("Dátum znenia YYYY-MM-DD. Bez tohto parametra = dnešný dátum. Pre historické prípady zadaj relevantný dátum (napr. '2023-12-31' pre rok 2023)."),
    max_chars: z.number().int().positive().optional().describe("Max počet znakov (default: 20000)"),
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
  "Získa konkrétny paragraf zo zákona. DÔLEŽITÉ: Bez parametra 'date' vráti AKTUÁLNE platné znenie (k dnešnému dňu). Pre historické prípady použi parameter 'date'.",
  {
    law: z.string().describe("Číslo zákona (napr. '595/2003') alebo IRI"),
    paragraph: z.string().describe("Číslo paragrafu (napr. '3' alebo '§3')"),
    date: z.string().optional().describe("Dátum znenia YYYY-MM-DD. Bez tohto parametra = dnešný dátum. Pre historické prípady zadaj relevantný dátum."),
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
  "Vyhľadá zákony v Zbierke zákonov SR podľa kľúčových slov. Režim 'autocomplete' hľadá v názvoch zákonov (rýchle). Režim 'fulltext' hľadá aj v nadpisoch paragrafov (pomalšie, ale komplexnejšie).",
  {
    query: z.string().describe("Hľadaný výraz"),
    mode: z.enum(["autocomplete", "fulltext"]).optional().describe("Režim vyhľadávania: 'autocomplete' (default) = rýchle vyhľadávanie v názvoch, 'fulltext' = vyhľadávanie aj v nadpisoch paragrafov"),
    limit: z.number().int().positive().max(25).optional().describe("Max počet výsledkov (default: 10, max: 25)"),
  },
  async ({ query, mode, limit }) => {
    const searchMode = mode ?? "autocomplete";
    const maxResults = limit ?? 10;

    if (searchMode === "fulltext") {
      const results = await searchRozsirene(query, maxResults);
      if (!results.length) return textResult("Bez výsledkov.");
      const out = results
        .map((r) => {
          const header = `${r.cislo ?? r.iri} - ${r.nazov ?? ""}`.trim();
          const matchingNadpisy = r.nadpisy?.filter((n) =>
            n.toLowerCase().includes(query.toLowerCase())
          );
          const nadpisyInfo = matchingNadpisy?.length
            ? `\nZhodné nadpisy: ${matchingNadpisy.slice(0, 5).join(", ")}${matchingNadpisy.length > 5 ? "..." : ""}`
            : "";
          return `${header}${nadpisyInfo}\nIRI: ${r.iri}`;
        })
        .join("\n\n");
      return textResult(out);
    }

    // autocomplete mode
    const items = await searchNavrhy(query, maxResults);
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

server.tool(
  "get_recent",
  "Získa posledných 20 vyhlásených predpisov z RSS feedu Slov-Lex. POZOR: RSS feed obsahuje len 20 najnovších položiek, nie kompletný archív.",
  {},
  async () => {
    const items = await getRecentPredpisy();
    if (!items.length) return textResult("RSS feed je prázdny.");
    const out = items
      .map((i, idx) => {
        const date = i.pubDate ? ` (${i.pubDate})` : "";
        const creator = i.creator ? `\nVydal: ${i.creator}` : "";
        return `${idx + 1}. ${i.cislo}${date}\n${i.nazov}${creator}\n${i.link}`;
      })
      .join("\n\n");
    return textResult(`Posledných 20 vyhlásených predpisov:\n\n${out}`);
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
