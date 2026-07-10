import {
  searchNavrhy,
  searchNazvy,
  searchRozsirene,
  type NavrhyItem,
  type PredpisRozsireneDoc,
} from "./slovlex.js";

export type SearchMode = "autocomplete" | "fulltext";

export type SearchCandidate = {
  iri: string;
  citation: string | null;
  title: string | null;
  description: string | null;
  matchingHeadings: string[];
  effectiveTo?: string | null;
};

const SEARCH_ALIASES: Array<[RegExp, string]> = [
  [/\bdph\b/giu, "daň z pridanej hodnoty"],
  [/\bgdpr\b/giu, "ochrana osobných údajov"],
  [/\bzvo\b/giu, "verejné obstarávanie"],
  [/^(?:výživné|vyzivne)$/giu, "zákon o rodine"],
];

const STOP_WORDS = new Set([
  "a",
  "aj",
  "alebo",
  "do",
  "k",
  "ku",
  "na",
  "o",
  "od",
  "po",
  "pod",
  "pre",
  "pri",
  "s",
  "so",
  "v",
  "vo",
  "z",
  "za",
  "zo",
]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("sk-SK")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function meaningfulTokens(value: string) {
  return normalizeText(value)
    .split(/\s+/u)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function tokenMatches(queryToken: string, candidateToken: string) {
  if (queryToken === candidateToken) return true;
  const shorter = queryToken.length <= candidateToken.length ? queryToken : candidateToken;
  const longer = queryToken.length <= candidateToken.length ? candidateToken : queryToken;
  if (shorter.length >= 3 && longer.startsWith(shorter)) return true;

  let commonPrefixLength = 0;
  const maxPrefixLength = Math.min(queryToken.length, candidateToken.length);
  while (
    commonPrefixLength < maxPrefixLength &&
    queryToken[commonPrefixLength] === candidateToken[commonPrefixLength]
  ) {
    commonPrefixLength += 1;
  }
  return (
    commonPrefixLength >= 3 &&
    (commonPrefixLength >= 4 || maxPrefixLength <= 4) &&
    commonPrefixLength / maxPrefixLength >= 2 / 3
  );
}

function tokenCoverage(queryTokens: string[], value: string) {
  if (queryTokens.length === 0) return 0;
  const candidateTokens = meaningfulTokens(value);
  const matched = queryTokens.filter((queryToken) =>
    candidateTokens.some((candidateToken) => tokenMatches(queryToken, candidateToken)),
  ).length;
  return matched / queryTokens.length;
}

function orderedTokenMatchStart(queryTokens: string[], value: string) {
  if (queryTokens.length === 0) return null;
  const candidateTokens = meaningfulTokens(value);
  let candidateIndex = 0;
  let firstMatchIndex: number | null = null;
  const matched = queryTokens.every((queryToken) => {
    while (candidateIndex < candidateTokens.length) {
      const currentIndex = candidateIndex;
      const candidateToken = candidateTokens[candidateIndex++];
      if (candidateToken && tokenMatches(queryToken, candidateToken)) {
        firstMatchIndex ??= currentIndex;
        return true;
      }
    }
    return false;
  });
  return matched ? firstMatchIndex : null;
}

function isAmendingAct(title: string) {
  const normalized = normalizeText(title);
  return (
    /^(?:zakon|nariadenie|vyhlaska)(?: narodnej rady slovenskej republiky)? ktorym/u.test(normalized) ||
    /^(?:zakon|nariadenie|vyhlaska)(?: narodnej rady slovenskej republiky)? ktorou/u.test(normalized) ||
    /\bktorym sa (?:meni|doplna)\b/u.test(normalized) ||
    /\bktorou sa (?:meni|doplna)\b/u.test(normalized) ||
    /^(?:zakon|nariadenie|vyhlaska) o (?:zmene|doplneni|zmene a doplneni)\b/u.test(normalized) ||
    normalized.startsWith("uplne znenie")
  );
}

function isBaseAct(title: string) {
  const normalized = normalizeText(title);
  return (
    /^(?:zakon|zakon narodnej rady slovenskej republiky) o\b/u.test(normalized) ||
    /^(?:zakonnik|[a-z]+ zakonnik|[a-z]+ zakon|ustava slovenskej republiky)\b/u.test(normalized)
  );
}

function isHistoricallyInactive(effectiveTo: string | null | undefined) {
  if (!effectiveTo) return false;
  const endDate = effectiveTo.slice(0, 10);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bratislava",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return endDate < today;
}

function scoreCandidate(candidate: SearchCandidate, query: string) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = meaningfulTokens(query);
  const title = candidate.title ?? "";
  const description = candidate.description ?? "";
  const normalizedTitle = normalizeText(title);
  const normalizedCitation = normalizeText(candidate.citation ?? "");
  const titleCoverage = tokenCoverage(queryTokens, title);
  const descriptionCoverage = tokenCoverage(queryTokens, description);
  const headingCoverages = candidate.matchingHeadings.map((heading) => tokenCoverage(queryTokens, heading));
  const bestHeadingCoverage = headingCoverages.length ? Math.max(...headingCoverages) : 0;
  const titleMatchStart = orderedTokenMatchStart(queryTokens, title);

  let score = 0;
  if (
    normalizedCitation === normalizedQuery ||
    (normalizedQuery && normalizedCitation.startsWith(`${normalizedQuery} `))
  ) {
    score += 1_000;
  }
  if (normalizedTitle === normalizedQuery) score += 140;
  else if (normalizedTitle.includes(normalizedQuery)) score += 90;
  if (titleCoverage === 1) score += 110;
  else score += titleCoverage * 35;
  if (titleMatchStart !== null) score += 60;
  if (titleMatchStart !== null && titleMatchStart <= 1) score += 140;
  if (titleCoverage === 1 && isBaseAct(title)) score += 100;
  if (descriptionCoverage === 1) score += 20;
  else score += descriptionCoverage * 10;
  if (bestHeadingCoverage === 1) score += 80;
  else score += bestHeadingCoverage * 30;
  if (candidate.matchingHeadings.some((heading) => normalizeText(heading).includes(normalizedQuery))) score += 50;
  if (title && isAmendingAct(title)) score -= 75;
  if (isHistoricallyInactive(candidate.effectiveTo)) score -= 200;
  score -= Math.min(normalizedTitle.length, 300) / 100;
  return score;
}

export function rankSearchCandidates(candidates: SearchCandidate[], query: string | string[], limit: number) {
  const queries = Array.isArray(query) ? query : [query];
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: Math.max(...queries.map((searchQuery) => scoreCandidate(candidate, searchQuery))),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function locallyRelevantCandidates(candidates: SearchCandidate[], queries: string[]) {
  return candidates.filter((candidate) =>
    queries.some((searchQuery) => scoreCandidate(candidate, searchQuery) > 0),
  );
}

export function expandSearchQueries(query: string) {
  let expanded = query;
  for (const [pattern, replacement] of SEARCH_ALIASES) {
    expanded = expanded.replace(pattern, replacement);
  }
  return expanded === query ? [query] : [query, expanded];
}

function titleFromSuggestion(item: NavrhyItem) {
  const description = item.popis?.trim();
  if (!description) return null;
  const citation = item.hodnotaPola ?? item.menovka;
  if (citation && description.startsWith(citation)) {
    return description.slice(citation.length).replace(/^\s*-\s*/u, "").trim() || null;
  }
  const separator = description.indexOf(" - ");
  return separator >= 0 ? description.slice(separator + 3).trim() || null : description;
}

function matchingHeadings(headings: string[] | undefined, query: string) {
  const queryTokens = meaningfulTokens(query);
  return headings?.filter((heading) => tokenCoverage(queryTokens, heading) === 1) ?? [];
}

function fromSuggestion(item: NavrhyItem): SearchCandidate {
  return {
    iri: item.iri,
    citation: item.hodnotaPola ?? item.menovka ?? null,
    title: titleFromSuggestion(item),
    description: item.popis ?? null,
    matchingHeadings: [],
    effectiveTo: null,
  };
}

function fromFulltext(result: PredpisRozsireneDoc, query: string): SearchCandidate {
  return {
    iri: result.iri,
    citation: result.cislo ?? null,
    title: result.nazov ?? null,
    description: null,
    matchingHeadings: matchingHeadings(result.nadpisy, query),
    effectiveTo: result.ucinnyDo ?? null,
  };
}

function isRelevantTitleResult(result: PredpisRozsireneDoc, query: string) {
  return tokenCoverage(meaningfulTokens(query), result.nazov ?? "") > 0;
}

function lawKey(iri: string) {
  return iri.match(/^\/SK\/ZZ\/\d{4}\/\d+/u)?.[0] ?? iri;
}

function mergeCandidates(...candidateGroups: SearchCandidate[][]) {
  const merged = new Map<string, SearchCandidate>();
  for (const candidate of candidateGroups.flat()) {
    const key = lawKey(candidate.iri);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, candidate);
      continue;
    }
    merged.set(key, {
      iri: current.iri,
      citation: current.citation ?? candidate.citation,
      title: current.title ?? candidate.title,
      description: current.description ?? candidate.description,
      matchingHeadings: [...new Set([...current.matchingHeadings, ...candidate.matchingHeadings])],
      effectiveTo: current.effectiveTo ?? candidate.effectiveTo,
    });
  }
  return [...merged.values()];
}

export async function searchPredpisy(query: string, mode: SearchMode, limit: number) {
  const candidateLimit = Math.min(25, Math.max(20, limit * 2));
  const queries = expandSearchQueries(query);
  if (mode === "fulltext") {
    const resultGroups = await Promise.all(
      queries.flatMap((searchQuery) => [
        searchRozsirene(searchQuery, candidateLimit).then((results) => ({ results, searchQuery })),
        searchNazvy(searchQuery, candidateLimit).then((results) => ({
          results: results.filter((result) => isRelevantTitleResult(result, searchQuery)),
          searchQuery,
        })),
      ]),
    );
    const candidates = mergeCandidates(
      ...resultGroups.map(({ results, searchQuery }) =>
        results.map((result) => fromFulltext(result, searchQuery)),
      ),
    );
    return rankSearchCandidates(candidates, queries, limit);
  }

  const resultGroups = await Promise.all(
    queries.flatMap((searchQuery) => [
      searchRozsirene(searchQuery, candidateLimit).then((results) => ({ results, searchQuery })),
      searchNazvy(searchQuery, candidateLimit).then((results) => ({
        results: results.filter((result) => isRelevantTitleResult(result, searchQuery)),
        searchQuery,
      })),
    ]),
  );
  const suggestionGroups = await Promise.all(queries.map((searchQuery) => searchNavrhy(searchQuery, candidateLimit)));
  const candidates = mergeCandidates(
    ...resultGroups.map(({ results, searchQuery }) =>
      results.map((result) => fromFulltext(result, searchQuery)),
    ),
    ...suggestionGroups.map((results) => results.map(fromSuggestion)),
  );
  return rankSearchCandidates(locallyRelevantCandidates(candidates, queries), queries, limit);
}
