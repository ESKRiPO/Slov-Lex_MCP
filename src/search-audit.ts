import { searchPredpisy, type SearchMode } from "./search.js";

type RankingCase = {
  query: string;
  expectedCitation: string;
  maxRank?: number;
  mode?: SearchMode;
};

const rankingCases: RankingCase[] = [
  { query: "daň z príjmov", expectedCitation: "595/2003" },
  { query: "dani z príjmov", expectedCitation: "595/2003" },
  { query: "dane z príjmov", expectedCitation: "595/2003" },
  { query: "dan z prijmov", expectedCitation: "595/2003" },
  { query: "daň z pridanej hodnoty", expectedCitation: "222/2004" },
  { query: "DPH", expectedCitation: "222/2004" },
  { query: "daňový poriadok", expectedCitation: "563/2009" },
  { query: "zákonník práce", expectedCitation: "311/2001" },
  { query: "Hromadné prepúšťanie", expectedCitation: "311/2001" },
  { query: "Pracovný pomer na určitú dobu", expectedCitation: "311/2001" },
  { query: "trestný zákon", expectedCitation: "300/2005" },
  { query: "Nutná obrana", expectedCitation: "300/2005" },
  { query: "občiansky zákonník", expectedCitation: "40/1964" },
  { query: "Ochrana osobnosti", expectedCitation: "40/1964" },
  { query: "obchodný zákonník", expectedCitation: "513/1991" },
  { query: "zákon o rodine", expectedCitation: "36/2005" },
  { query: "výživné", expectedCitation: "36/2005", maxRank: 3 },
  { query: "cestná premávka", expectedCitation: "8/2009" },
  { query: "verejné obstarávanie", expectedCitation: "343/2015" },
  { query: "ZVO", expectedCitation: "343/2015" },
  { query: "slobodný prístup k informáciám", expectedCitation: "211/2000" },
  { query: "ochrana osobných údajov", expectedCitation: "18/2018" },
  { query: "GDPR", expectedCitation: "18/2018" },
  { query: "ochrana oznamovateľov protispoločenskej činnosti", expectedCitation: "54/2019" },
  { query: "ústava slovenskej republiky", expectedCitation: "460/1992" },
  { query: "595/2003", expectedCitation: "595/2003" },
  { query: "311/2001 Z. z.", expectedCitation: "311/2001" },
  { query: "práca", expectedCitation: "311/2001", maxRank: 5 },
  { query: "rodina", expectedCitation: "36/2005", maxRank: 5 },
  { query: "stavebný zákon", expectedCitation: "25/2025" },
  { query: "zákon o športe", expectedCitation: "440/2015" },
  { query: "školský zákon", expectedCitation: "245/2008" },
  { query: "sociálne poistenie", expectedCitation: "461/2003" },
  { query: "zdravotné poistenie", expectedCitation: "580/2004" },
  { query: "obecné zriadenie", expectedCitation: "369/1990" },
  { query: "správny súdny poriadok", expectedCitation: "162/2015" },
  { query: "civilný sporový poriadok", expectedCitation: "160/2015" },
  { query: "civilný mimosporový poriadok", expectedCitation: "161/2015" },
  { query: "trestný poriadok", expectedCitation: "301/2005" },
  { query: "autorský zákon", expectedCitation: "185/2015" },
  { query: "konkurz a reštrukturalizácia", expectedCitation: "7/2005" },
  { query: "kybernetická bezpečnosť", expectedCitation: "69/2018" },
  { query: "elektronické komunikácie", expectedCitation: "452/2021" },
  { query: "ochrana spotrebiteľa", expectedCitation: "108/2024" },
  { query: "služby zamestnanosti", expectedCitation: "5/2004" },
  { query: "Krajná núdza", expectedCitation: "300/2005" },
  { query: "verejne obstaravanie", expectedCitation: "343/2015" },
  { query: "ochrana osobnych udajov", expectedCitation: "18/2018" },
  { query: "ktory zakon upravuje verejne obstaravanie", expectedCitation: "343/2015", maxRank: 3 },
  { query: "aký zákon rieši daň z príjmov", expectedCitation: "595/2003", maxRank: 3 },
  { query: "Hromadné prepúšťanie", expectedCitation: "311/2001", mode: "fulltext" },
  { query: "Nutná obrana", expectedCitation: "300/2005", mode: "fulltext" },
];

function baseLawKey(iri: string) {
  return iri.match(/^\/SK\/ZZ\/\d{4}\/\d+/u)?.[0] ?? iri;
}

async function run() {
  const startedAt = performance.now();
  const failures: string[] = [];
  let checks = 0;

  for (const item of rankingCases) {
    const mode = item.mode ?? "autocomplete";
    const results = await searchPredpisy(item.query, mode, 10);
    const rank = results.findIndex((result) => result.citation?.startsWith(item.expectedCitation)) + 1;
    const maxRank = item.maxRank ?? 1;
    checks += 1;
    if (rank < 1 || rank > maxRank) {
      const top = results
        .slice(0, 3)
        .map((result) => `${result.citation ?? "?"} ${result.title ?? "?"}`)
        .join(" | ");
      failures.push(`${mode} "${item.query}": ${item.expectedCitation} má poradie ${rank || "-"}; top: ${top}`);
    }
  }

  const ambiguous = await searchPredpisy("Skúšobná doba", "fulltext", 5);
  const ambiguousCitations = ambiguous.slice(0, 3).map((result) => result.citation ?? "");
  checks += 1;
  if (
    !ambiguousCitations.some((citation) => citation.startsWith("300/2005")) ||
    !ambiguousCitations.some((citation) => citation.startsWith("311/2001"))
  ) {
    failures.push(`fulltext "Skúšobná doba" neobsahuje v top 3 Trestný zákon aj Zákonník práce.`);
  }

  const genericTax = await searchPredpisy("daň", "autocomplete", 10);
  checks += 1;
  if (
    genericTax.length === 0 ||
    /^(?:Zákon|Nariadenie|Vyhláška),? ktor/u.test(genericTax[0]?.title ?? "")
  ) {
    failures.push(`Všeobecné heslo "daň" vrátilo na prvom mieste novelizačný alebo prázdny výsledok.`);
  }

  const missing = await searchPredpisy("qzxwvunoplkmabcdef987654", "autocomplete", 10);
  checks += 1;
  if (missing.length !== 0) failures.push(`Nezmyselný dotaz vrátil ${missing.length} výsledkov namiesto nuly.`);

  for (const limit of [1, 25]) {
    const results = await searchPredpisy("daň", "autocomplete", limit);
    const uniqueLaws = new Set(results.map((result) => baseLawKey(result.iri)));
    checks += 1;
    if (results.length > limit || uniqueLaws.size !== results.length) {
      failures.push(`Limit ${limit}: počet=${results.length}, unikátne predpisy=${uniqueLaws.size}.`);
    }
  }

  const elapsedMs = Math.round(performance.now() - startedAt);
  if (failures.length > 0) {
    console.error(`Search audit zlyhal: ${checks - failures.length}/${checks} kontrol prešlo (${elapsedMs} ms).`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Search audit OK: ${checks}/${checks} kontrol prešlo (${elapsedMs} ms).`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
