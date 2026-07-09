import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { extractParagrafFromPortalHtml, renderParagraf, renderWholeLawText } from "./portal.js";
import {
  getOfficialPortalUrl,
  getPortalHtml,
  getRecentPredpisy,
  getRozsireneByCislo,
  getRozsireneByIri,
  getVersionIriForDate,
  isValidIsoDate,
  parseLawBaseIri,
  searchNavrhy,
  searchRozsirene,
} from "./slovlex.js";

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

const nullableString = z.string().nullable();
const sourceUrl = z.string().url();
const dateInput = z
  .string()
  .trim()
  .refine(isValidIsoDate, "Dátum musí byť reálny kalendárny dátum vo formáte YYYY-MM-DD.");
const lawIdentifierInput = z.string().trim().min(1).max(200);
const lawNumberInput = z.union([
  z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, "Číslo predpisu musí obsahovať 1 až 6 číslic."),
  z.number().int().min(1).max(999_999),
]);
const lawYearInput = z.union([
  z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Rok musí mať štyri číslice."),
  z.number().int().min(1000).max(9999),
]);

const lawOutputSchema = z.object({
  citation: z.string(),
  title: nullableString,
  type: nullableString,
  declared_at: nullableString,
  effective_from: nullableString,
  effective_to: nullableString,
  iri: z.string(),
  source_url: sourceUrl,
  headings: z.array(z.string()),
});

const datedLawOutputShape = {
  law: z.string(),
  resolved_date: z.string(),
  effective_from: nullableString,
  effective_to: nullableString,
  version_iri: z.string(),
  source_url: sourceUrl,
};

const versionOutputSchema = z.object({
  ...datedLawOutputShape,
  text: z.string(),
  offset: z.number().int().nonnegative(),
  end_offset: z.number().int().nonnegative(),
  returned_chars: z.number().int().nonnegative(),
  total_chars: z.number().int().nonnegative(),
  has_more: z.boolean(),
  next_offset: z.number().int().nonnegative().nullable(),
  truncated: z.boolean(),
});

const paragraphOutputSchema = z.object({
  ...datedLawOutputShape,
  paragraph: z.string(),
  found: z.boolean(),
  text: nullableString,
});

const searchItemOutputSchema = z.object({
  iri: z.string(),
  citation: nullableString,
  title: nullableString,
  description: nullableString,
  matching_headings: z.array(z.string()),
  source_url: sourceUrl,
});

const searchOutputSchema = z.object({
  query: z.string(),
  mode: z.enum(["autocomplete", "fulltext"]),
  results: z.array(searchItemOutputSchema),
});

const recentItemOutputSchema = z.object({
  citation: z.string(),
  title: z.string(),
  link: sourceUrl,
  published_at: z.string(),
  creator: nullableString,
});

const recentOutputSchema = z.object({
  results: z.array(recentItemOutputSchema),
});

function toolResult<T extends Record<string, unknown>>(text: string, structuredContent: T) {
  return {
    content: [{ type: "text" as const, text }],
    structuredContent,
  };
}

function compactLines(lines: Array<string | null>) {
  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

function effectivityLine(effectiveFrom: string | null, effectiveTo: string | null) {
  return effectiveFrom || effectiveTo ? `Účinnosť: ${effectiveFrom ?? "?"} - ${effectiveTo ?? "?"}` : null;
}

async function loadLawVersion(law: string, date?: string) {
  const { baseIri } = parseLawBaseIri(law);
  const { versionIri, date: resolvedDate } = await getVersionIriForDate(baseIri, date);
  const [meta, portalHtml] = await Promise.all([getRozsireneByIri(versionIri), getPortalHtml(versionIri)]);
  return {
    law,
    resolved_date: resolvedDate,
    effective_from: meta.ucinnyOd ?? null,
    effective_to: meta.ucinnyDo ?? null,
    version_iri: versionIri,
    source_url: getOfficialPortalUrl(versionIri),
    portalHtml,
  };
}

export function registerTools(server: McpServer) {
  server.registerTool(
    "get_law",
    {
      title: "Informácie o predpise",
      description: "Získa základné informácie o predpise podľa čísla a roku.",
      inputSchema: z.object({
        number: lawNumberInput.describe("Číslo predpisu"),
        year: lawYearInput.describe("Rok vydania"),
      }),
      outputSchema: lawOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ number, year }) => {
      const citation = `${String(number).trim()}/${String(year).trim()}`;
      const doc = await getRozsireneByCislo(citation);
      const source = getOfficialPortalUrl(doc.iri);
      const output = {
        citation: doc.cislo ?? citation,
        title: doc.nazov ?? null,
        type: doc.typPredp_value ?? null,
        declared_at: doc.vyhlaseny ?? null,
        effective_from: doc.ucinnyOd ?? null,
        effective_to: doc.ucinnyDo ?? null,
        iri: doc.iri,
        source_url: source,
        headings: doc.nadpisy ?? [],
      };
      const text = compactLines([
        `${output.citation} - ${output.title ?? ""}`.trim(),
        output.type ? `Typ: ${output.type}` : null,
        output.declared_at ? `Vyhlásené: ${output.declared_at}` : null,
        effectivityLine(output.effective_from, output.effective_to),
        `IRI: ${output.iri}`,
        `Zdroj: ${source}`,
        output.headings.length
          ? `Nadpisy: ${output.headings.slice(0, 40).join(" | ")}${output.headings.length > 40 ? " | …" : ""}`
          : null,
      ]);
      return toolResult(text, output);
    },
  );

  server.registerTool(
    "get_version",
    {
      title: "Znenie predpisu k dátumu",
      description:
        "Vráti stránkovaný text predpisu k zadanému dátumu. Bez 'date' použije dnešný dátum v časovom pásme Europe/Bratislava. Ak 'has_more' je true, pokračuj s hodnotou 'next_offset'.",
      inputSchema: z.object({
        law: lawIdentifierInput.describe("Číslo predpisu, napr. '595/2003', alebo IRI"),
        date: dateInput.optional().describe("Dátum znenia YYYY-MM-DD"),
        max_chars: z
          .number()
          .int()
          .min(1)
          .max(100_000)
          .optional()
          .describe("Počet znakov jednej stránky; default 20000, maximum 100000"),
        offset: z
          .number()
          .int()
          .nonnegative()
          .max(10_000_000)
          .optional()
          .describe("Znakový offset pre pokračovanie; default 0"),
      }),
      outputSchema: versionOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ law, date, max_chars, offset }) => {
      const { portalHtml, ...lawVersion } = await loadLawVersion(law, date);
      const rendered = renderWholeLawText(portalHtml, max_chars ?? 20_000, offset ?? 0);
      const output = {
        ...lawVersion,
        text: rendered.text,
        offset: rendered.offset,
        end_offset: rendered.endOffset,
        returned_chars: rendered.text.length,
        total_chars: rendered.totalChars,
        has_more: rendered.hasMore,
        next_offset: rendered.nextOffset,
        truncated: rendered.truncated,
      };
      const header = compactLines([
        `${law} – znenie k ${lawVersion.resolved_date}`,
        effectivityLine(output.effective_from, output.effective_to),
        `IRI: ${lawVersion.version_iri}`,
        `Zdroj: ${lawVersion.source_url}`,
        `Rozsah: znaky ${rendered.offset}-${rendered.endOffset} z ${rendered.totalChars}`,
        rendered.nextOffset !== null ? `Ďalší offset: ${rendered.nextOffset}` : null,
      ]);
      return toolResult(`${header}\n\n${rendered.text}`, output);
    },
  );

  server.registerTool(
    "get_paragraph",
    {
      title: "Paragraf predpisu",
      description:
        "Získa konkrétny paragraf predpisu. Bez 'date' použije dnešný dátum v časovom pásme Europe/Bratislava.",
      inputSchema: z.object({
        law: lawIdentifierInput.describe("Číslo predpisu alebo IRI"),
        paragraph: z.string().trim().min(1).max(32).describe("Číslo paragrafu, napr. '3', '3a' alebo '§ 3'"),
        date: dateInput.optional().describe("Dátum znenia YYYY-MM-DD"),
      }),
      outputSchema: paragraphOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ law, paragraph, date }) => {
      const { portalHtml, ...lawVersion } = await loadLawVersion(law, date);
      const extracted = extractParagrafFromPortalHtml(portalHtml, paragraph);
      const renderedParagraph = extracted ? renderParagraf(extracted.$, extracted.$par).trim() : "";
      const paragraphText = renderedParagraph || null;
      const output = {
        ...lawVersion,
        paragraph,
        found: paragraphText !== null,
        text: paragraphText,
      };

      if (!paragraphText) {
        return toolResult(
          `Nenašiel som ${paragraph} v ${law} (IRI: ${lawVersion.version_iri}).\nZdroj: ${lawVersion.source_url}`,
          output,
        );
      }

      const header = compactLines([
        `${law} – ${paragraph} (k ${lawVersion.resolved_date})`,
        effectivityLine(output.effective_from, output.effective_to),
        `Zdroj: ${lawVersion.source_url}`,
      ]);
      return toolResult(`${header}\n\n${paragraphText}`, output);
    },
  );

  server.registerTool(
    "search",
    {
      title: "Vyhľadávanie predpisov",
      description:
        "Vyhľadá predpisy podľa kľúčových slov. 'autocomplete' je rýchly režim; 'fulltext' hľadá aj v nadpisoch paragrafov.",
      inputSchema: z.object({
        query: z.string().trim().min(1).max(200).describe("Hľadaný výraz"),
        mode: z.enum(["autocomplete", "fulltext"]).optional().describe("Režim vyhľadávania; default autocomplete"),
        limit: z.number().int().min(1).max(25).optional().describe("Počet výsledkov; default 10"),
      }),
      outputSchema: searchOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ query, mode, limit }) => {
      const searchMode = mode ?? "autocomplete";
      const maxResults = limit ?? 10;
      const normalizedQuery = query.toLocaleLowerCase("sk-SK");
      const outputResults =
        searchMode === "fulltext"
          ? (await searchRozsirene(query, maxResults)).map((result) => ({
              iri: result.iri,
              citation: result.cislo ?? null,
              title: result.nazov ?? null,
              description: null,
              matching_headings:
                result.nadpisy?.filter((heading) => heading.toLocaleLowerCase("sk-SK").includes(normalizedQuery)) ?? [],
              source_url: getOfficialPortalUrl(result.iri),
            }))
          : (await searchNavrhy(query, maxResults)).map((item) => ({
              iri: item.iri,
              citation: item.hodnotaPola ?? item.menovka ?? null,
              title: null,
              description: item.popis ?? null,
              matching_headings: [],
              source_url: getOfficialPortalUrl(item.iri),
            }));
      const output = { query, mode: searchMode, results: outputResults };
      if (outputResults.length === 0) return toolResult("Bez výsledkov.", output);
      const text = outputResults
        .map((result) => {
          const label = result.citation ?? result.iri;
          const summary =
            searchMode === "fulltext"
              ? `${label} - ${result.title ?? ""}`.trim()
              : result.description?.startsWith(label)
                ? result.description
                : `${label}${result.description ? ` - ${result.description}` : ""}`;
          const headings = result.matching_headings.length
            ? `\nZhodné nadpisy: ${result.matching_headings.slice(0, 5).join(", ")}${result.matching_headings.length > 5 ? "…" : ""}`
            : "";
          return `${summary}${headings}\nIRI: ${result.iri}\nZdroj: ${result.source_url}`;
        })
        .join("\n\n");
      return toolResult(text, output);
    },
  );

  server.registerTool(
    "get_recent",
    {
      title: "Najnovšie vyhlásené predpisy",
      description: "Získa najviac 20 najnovších vyhlásených predpisov z RSS feedu Slov-Lex; nejde o kompletný archív.",
      outputSchema: recentOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      const items = await getRecentPredpisy();
      const output = {
        results: items.map((item) => ({
          citation: item.cislo,
          title: item.nazov,
          link: item.link,
          published_at: item.pubDate,
          creator: item.creator ?? null,
        })),
      };
      if (output.results.length === 0) return toolResult("RSS feed je prázdny.", output);
      const text = output.results
        .map((item, index) => {
          const date = item.published_at ? ` (${item.published_at})` : "";
          const creator = item.creator ? `\nVydal: ${item.creator}` : "";
          return `${index + 1}. ${item.citation}${date}\n${item.title}${creator}\n${item.link}`;
        })
        .join("\n\n");
      return toolResult(`Posledné vyhlásené predpisy:\n\n${text}`, output);
    },
  );
}
