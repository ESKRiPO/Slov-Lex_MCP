import assert from "node:assert/strict";
import test from "node:test";
import { httpGetText } from "../src/http.js";
import {
  extractParagrafFromPortalHtml,
  renderParagraf,
  renderWholeLawText,
} from "../src/portal.js";
import { expandSearchQueries, rankSearchCandidates, type SearchCandidate } from "../src/search.js";
import {
  getOfficialPortalUrl,
  isValidIsoDate,
  parseLawBaseIri,
  todayInSlovakia,
} from "../src/slovlex.js";

const DIRECT_PARAGRAPH_HTML = `
  <div id="predpis">
    <div class="predpisNadpis">TRESTNÝ ZÁKON</div>
    <div class="paragraf Skupina" id="paragraf-16">
      <div class="paragrafOznacenie">§ 16</div>
      <div class="text">Trestný čin je spáchaný z nedbanlivosti, ak páchateľ konal nedbanlivo.</div>
    </div>
  </div>
`;

test("paragraf s priamym div.text nestratí obsah", () => {
  const extracted = extractParagrafFromPortalHtml(DIRECT_PARAGRAPH_HTML, "§ 16");
  assert.ok(extracted);
  const text = renderParagraf(extracted.$, extracted.$par);
  assert.match(text, /^§ 16/m);
  assert.match(text, /Trestný čin je spáchaný z nedbanlivosti/);
});

test("prázdne označenie odseku sa doplní z id", () => {
  const html = `
    <div id="predpis">
      <div class="paragraf Skupina" id="paragraf-1">
        <div class="paragrafOznacenie">§ 1</div>
        <div class="odsek Skupina" id="paragraf-1.odsek-2">
          <div class="odsekOznacenie"></div>
          <div class="text">Text druhého odseku.</div>
        </div>
      </div>
    </div>
  `;
  assert.match(renderWholeLawText(html, 10_000).text, /\(2\) Text druhého odseku\./);
});

test("vyhľadanie paragrafu používa presnú hodnotu id", () => {
  assert.equal(
    extractParagrafFromPortalHtml(DIRECT_PARAGRAPH_HTML, "16, div.paragraf"),
    null,
  );
});

test("celé znenie renderuje ústavné články a štrukturálne nadpisy", () => {
  const html = `
    <div id="predpis">
      <div class="predpisNadpis">ÚSTAVA SLOVENSKEJ REPUBLIKY</div>
      <div class="hlava Skupina">
        <div class="hlavaOznacenie">PRVÁ HLAVA</div>
        <div class="hlavaNadpis">ZÁKLADNÉ USTANOVENIA</div>
        <div class="ustavnyclanok Skupina" id="ustavnyclanok-1">
          <div class="ustavnyclanokOznacenie">Čl. 1</div>
          <div class="odsek Skupina" id="ustavnyclanok-1.odsek-1">
            <div class="odsekOznacenie">(1)</div>
            <div class="text">Slovenská republika je zvrchovaný, demokratický a právny štát.</div>
          </div>
        </div>
      </div>
    </div>
  `;
  const rendered = renderWholeLawText(html, 10_000);
  assert.match(rendered.text, /PRVÁ HLAVA/);
  assert.match(rendered.text, /Čl\. 1/);
  assert.match(rendered.text, /Slovenská republika je zvrchovaný/);
  assert.equal(rendered.hasMore, false);
});

test("celé znenie renderuje novelizačný článok bez duplikovania vnoreného paragrafu", () => {
  const html = `
    <div id="predpis">
      <div class="clanok Skupina" id="predpis.clanok-1">
        <div class="clanokOznacenie">Čl. I</div>
        <div class="bod Skupina">
          <div class="bodOznacenie">1.</div>
          <div class="text">V § 1 sa text nahrádza týmto znením:</div>
          <div class="citat">
            <div class="paragraf Skupina" id="paragraf-1">
              <div class="paragrafOznacenie">„§ 1</div>
              <div class="text">Nové znenie.“</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  const text = renderWholeLawText(html, 10_000).text;
  assert.match(text, /Čl\. I/);
  assert.match(text, /Nové znenie/);
  assert.equal(text.match(/Nové znenie/g)?.length, 1);
});

test("zmiešaný text zachová všetky tabuľky a escapuje zvislé čiary", () => {
  const html = `
    <div id="predpis">
      <div class="paragraf Skupina" id="paragraf-1">
        <div class="paragrafOznacenie">§ 1</div>
        <div class="odsek Skupina">
          <div class="odsekOznacenie">(1)</div>
          <div class="text2">
            Pred tabuľkou
            <table><tr><th>A|B</th><th>C</th></tr><tr><td>1</td><td>2</td></tr></table>
            Medzi tabuľkami
            <table><tr><th>D</th></tr><tr><td>3</td></tr></table>
            Za tabuľkou
          </div>
        </div>
      </div>
    </div>
  `;
  const text = renderWholeLawText(html, 10_000).text;
  assert.match(text, /Pred tabuľkou/);
  assert.match(text, /\| A\\\|B \| C \|/);
  assert.match(text, /Medzi tabuľkami/);
  assert.match(text, /\| D \|/);
  assert.match(text, /Za tabuľkou/);
});

test("príloha sa renderuje aj s oficiálnym PDF odkazom", () => {
  const html = `
    <div id="predpis"><div class="predpisNadpis">Zákon</div></div>
    <div id="prilohy">
      <div class="priloha Skupina" id="priloha-1">
        <div class="prilohaOznacenie">Príloha č. 1</div>
        <div class="text"><a href="/static/SK/ZZ/2020/1/vyhlasene_znenie.priloha-1.pdf">Prevziať prílohu</a></div>
      </div>
    </div>
  `;
  const text = renderWholeLawText(html, 10_000).text;
  assert.match(text, /Príloha č\. 1/);
  assert.match(
    text,
    /\[Prevziať prílohu\]\(https:\/\/static\.slov-lex\.sk\/static\/SK\/ZZ\/2020\/1\/vyhlasene_znenie\.priloha-1\.pdf\)/,
  );
});

test("stránkovanie vracia stabilný offset a celkovú dĺžku", () => {
  const first = renderWholeLawText(DIRECT_PARAGRAPH_HTML, 20);
  assert.equal(first.offset, 0);
  assert.ok(first.endOffset > 0 && first.endOffset <= 20);
  assert.equal(first.hasMore, true);
  assert.equal(first.nextOffset, first.endOffset);

  const second = renderWholeLawText(DIRECT_PARAGRAPH_HTML, 20, first.nextOffset);
  assert.equal(second.offset, 20);
  assert.equal(second.totalChars, first.totalChars);
  assert.notEqual(second.text, first.text);
});

test("validácia dátumu odmietne neexistujúce dni", () => {
  assert.equal(isValidIsoDate("2024-02-29"), true);
  assert.equal(isValidIsoDate("2025-02-29"), false);
  assert.equal(isValidIsoDate("2025-02-31"), false);
  assert.equal(isValidIsoDate("2025-13-01"), false);
});

test("dnešný dátum sa počíta explicitne v Europe/Bratislava", () => {
  assert.equal(todayInSlovakia(new Date("2025-07-08T22:30:00Z")), "2025-07-09");
  assert.equal(todayInSlovakia(new Date("2025-12-31T23:30:00Z")), "2026-01-01");
});

test("IRI parser akceptuje citáciu, IRI aj oficiálnu URL a odmietne prílepky", () => {
  const expected = { number: "595", year: "2003", baseIri: "/SK/ZZ/2003/595" };
  assert.deepEqual(parseLawBaseIri("595/2003"), expected);
  assert.deepEqual(parseLawBaseIri("595/2003 Z. z."), expected);
  assert.deepEqual(parseLawBaseIri("/SK/ZZ/2003/595/20250101"), expected);
  assert.deepEqual(
    parseLawBaseIri(
      "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2003/595/20250101/",
    ),
    expected,
  );
  assert.throws(() => parseLawBaseIri("text 595/2003 navyše"), /Neviem parsovať/);
});

test("oficiálna URL sa vytvorí z verziovaného IRI", () => {
  assert.equal(
    getOfficialPortalUrl("/SK/ZZ/2003/595/20250101"),
    "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2003/595/20250101/",
  );
});

test("vyhľadávanie zohľadní skloňovanie a uprednostní hlavný zákon pred novelou", () => {
  const candidates: SearchCandidate[] = [
    {
      iri: "/SK/ZZ/2004/177/20040501",
      citation: "177/2004 Z. z.",
      title:
        "Zákon o európskom zoskupení hospodárskych záujmov, ktorým sa mení a dopĺňa zákon č. 595/2003 Z. z. o dani z príjmov",
      description: null,
      matchingHeadings: [],
    },
    {
      iri: "/SK/ZZ/2025/152/20260101",
      citation: "152/2025 Z. z.",
      title: "Zákon, ktorým sa mení a dopĺňa zákon č. 595/2003 Z. z. o dani z príjmov",
      description: null,
      matchingHeadings: [],
    },
    {
      iri: "/SK/ZZ/2003/595/20260101",
      citation: "595/2003 Z. z.",
      title: "Zákon o dani z príjmov",
      description: null,
      matchingHeadings: [],
    },
  ];

  assert.equal(rankSearchCandidates(candidates, "daň z príjmov", 10)[0]?.citation, "595/2003 Z. z.");
  assert.equal(rankSearchCandidates(candidates, "595/2003", 10)[0]?.citation, "595/2003 Z. z.");
});

test("presná zhoda nadpisu paragrafu prekoná všeobecnú textovú zhodu", () => {
  const candidates: SearchCandidate[] = [
    {
      iri: "/SK/ZZ/2004/5/20260623",
      citation: "5/2004 Z. z.",
      title: "Zákon o službách zamestnanosti",
      description: "Predpis obsahuje ustanovenia o prepúšťaní.",
      matchingHeadings: [],
    },
    {
      iri: "/SK/ZZ/2001/311/20260607",
      citation: "311/2001 Z. z.",
      title: "Zákonník práce",
      description: null,
      matchingHeadings: ["Hromadné prepúšťanie"],
    },
  ];

  assert.equal(rankSearchCandidates(candidates, "Hromadné prepúšťanie", 10)[0]?.citation, "311/2001 Z. z.");
});

test("radenie toleruje slovenské pádové koncovky", () => {
  const candidates: SearchCandidate[] = [
    {
      iri: "/SK/ZZ/1961/135/20250401",
      citation: "135/1961 Zb.",
      title: "Zákon o pozemných komunikáciách (cestný zákon)",
      description: null,
      matchingHeadings: [],
    },
    {
      iri: "/SK/ZZ/2009/8/20260101",
      citation: "8/2009 Z. z.",
      title: "Zákon o cestnej premávke a o zmene a doplnení niektorých zákonov",
      description: null,
      matchingHeadings: [],
    },
  ];

  assert.equal(rankSearchCandidates(candidates, "cestná premávka", 10)[0]?.citation, "8/2009 Z. z.");
});

test("historicky neúčinný predpis nepredbehne aktuálny zákon", () => {
  const candidates: SearchCandidate[] = [
    {
      iri: "/SK/ZZ/1963/94/20040101",
      citation: "94/1963 Zb.",
      title: "Zákon o rodine",
      description: null,
      matchingHeadings: [],
      effectiveTo: "2005-03-31T00:00:00Z",
    },
    {
      iri: "/SK/ZZ/2005/36/20260601",
      citation: "36/2005 Z. z.",
      title: "Zákon o rodine a o zmene a doplnení niektorých zákonov",
      description: null,
      matchingHeadings: [],
      effectiveTo: "2099-12-31T00:00:00Z",
    },
  ];

  assert.equal(rankSearchCandidates(candidates, "zákon o rodine", 10)[0]?.citation, "36/2005 Z. z.");
});

test("predmet uvedený na začiatku názvu prekoná vedľajšiu zmienku", () => {
  const candidates: SearchCandidate[] = [
    {
      iri: "/SK/ZZ/2018/159/20180501",
      citation: "159/2018 Z. z.",
      title:
        "Vyhláška Ministerstva zdravotníctva Slovenskej republiky o podrobnostiach o poistnom na verejné zdravotné poistenie",
      description: null,
      matchingHeadings: ["Verejné zdravotné poistenie"],
    },
    {
      iri: "/SK/ZZ/2004/580/20260101",
      citation: "580/2004 Z. z.",
      title: "Zákon o zdravotnom poistení a o zmene a doplnení zákona č. 95/2002 Z. z.",
      description: null,
      matchingHeadings: [],
    },
  ];

  assert.equal(rankSearchCandidates(candidates, "zdravotné poistenie", 10)[0]?.citation, "580/2004 Z. z.");
});

test("bežné právne skratky sa rozvinú bez straty pôvodného dotazu", () => {
  assert.deepEqual(expandSearchQueries("sadzba DPH"), ["sadzba DPH", "sadzba daň z pridanej hodnoty"]);
  assert.deepEqual(expandSearchQueries("GDPR"), ["GDPR", "ochrana osobných údajov"]);
  assert.deepEqual(expandSearchQueries("ZVO"), ["ZVO", "verejné obstarávanie"]);
  assert.deepEqual(expandSearchQueries("výživné"), ["výživné", "zákon o rodine"]);
});

test("HTTP 404 sa neopakuje", async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    return new Response("nenájdené", { status: 404, statusText: "Not Found" });
  };
  await assert.rejects(
    httpGetText("https://example.test/missing", {
      retries: 3,
      fetchImpl,
      sleep: async () => undefined,
    }),
    /404 Not Found/,
  );
  assert.equal(calls, 1);
});

test("HTTP 5xx používa obmedzený exponenciálny retry", async () => {
  let calls = 0;
  const delays: number[] = [];
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    if (calls < 3) return new Response("chyba", { status: 503, statusText: "Unavailable" });
    return new Response("OK", { status: 200 });
  };
  const body = await httpGetText("https://example.test/retry", {
    retries: 2,
    retryDelayMs: 10,
    fetchImpl,
    sleep: async (delay) => {
      delays.push(delay);
    },
  });
  assert.equal(body, "OK");
  assert.equal(calls, 3);
  assert.deepEqual(delays, [10, 20]);
});

test("HTTP 429 rešpektuje Retry-After", async () => {
  let calls = 0;
  const delays: number[] = [];
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response("spomaľ", {
        status: 429,
        headers: { "retry-after": "2" },
      });
    }
    return new Response("OK");
  };
  await httpGetText("https://example.test/rate-limit", {
    retries: 1,
    fetchImpl,
    sleep: async (delay) => {
      delays.push(delay);
    },
  });
  assert.deepEqual(delays, [2_000]);
});
