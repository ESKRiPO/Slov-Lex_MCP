# Changelog

Všetky významné zmeny v tomto projekte sú dokumentované v tomto súbore.

Formát je založený na [Keep a Changelog](https://keepachangelog.com/sk/1.0.0/).

---

## [1.3.1] - 11. 7. 2026

### Pridané

- Živý audit vyhľadávania `npm run audit:search` so širšou sadou právnych scenárov
- Rozvíjanie bežných právnych skratiek `DPH`, `GDPR` a `ZVO`

### Zmenené

- Predvolený autocomplete kombinuje návrhy, vyhľadávanie v názvoch a fulltext
- Radenie relevancie toleruje bežné slovenské pádové koncovky a text bez diakritiky
- Účinné základné predpisy majú prednosť pred historickými zákonmi, novelami a vedľajšími zmienkami
- Výsledky z rôznych zdrojov sa zlučujú podľa základného IRI a vracajú bez duplicít

### Opravené

- Výrazy ako `daň z príjmov`, `dane z príjmov`, `cestná premávka`, `verejné obstarávanie`, `zákon o rodine`, `stavebný zákon` a `autorský zákon` radia aktuálny hlavný predpis na prvé miesto
- Autocomplete už pri relevantnom fulltextovom výsledku nevracia prázdny názov

## [1.3.0] - 9. 7. 2026

### Pridané

- Stránkovanie `get_version` pomocou `offset`, `has_more` a `next_offset`
- Strojovo spracovateľný `structuredContent`, výstupné schémy a oficiálne zdrojové odkazy
- Offline regresné testy renderera, dátumov a HTTP retry logiky
- Týždenný a manuálne spustiteľný GitHub Security audit bez CI/CD triggerov pri commitoch
- Voliteľný príkaz `npm run install:browser` pre Playwright Chromium fallback

### Zmenené

- MCP nástroje používajú aktuálne `registerTool`, read-only anotácie a prísnejšie vstupné schémy
- Predvolený dátum sa počíta v časovom pásme `Europe/Bratislava`
- API odpovede Slov-Lex sa kontrolujú runtime schémami
- Registrácia MCP nástrojov je oddelená od štartu servera a spoločné načítanie znení, cache a formátovanie sú zjednotené
- Runtime závislosti a lockfile sú aktualizované bez známych `npm audit` zraniteľností
- Inštalačné návody prešli z ukončeného Gemini CLI na Google Antigravity a Antigravity CLI
- Opravené platformové cesty ku konfigurácii Claude Desktop pre macOS a Windows

### Opravené

- Paragrafy s textom priamo v `div.text` už nestrácajú obsah, napríklad § 16 zákona 300/2005
- Celé znenie podporuje ústavné články, novelizačné články, štrukturálne nadpisy a prílohy
- Zmiešaný `text2` obsah zachová všetky tabuľky aj text pred nimi, medzi nimi a za nimi
- Neexistujúce kalendárne dátumy sa odmietnu lokálne namiesto chybového volania upstreamu
- HTTP retry sa už nespúšťa pre nerelevantné 4xx odpovede a rešpektuje `Retry-After`

---

## [1.2.5] - 18. 4. 2026

### Zmenené

- Aktualizované runtime a dev dependencies na novšie kompatibilné verzie vrátane `@modelcontextprotocol/sdk 1.29`, `TypeScript 6.0` a novších verzií `playwright`, `cheerio`, `lru-cache` a `zod`
- Po upgrade je projekt bez známych `npm audit` zraniteľností

### Opravené

- Inštalačné návody pre MCP klientov boli zosúladené s vtedajšími konfiguráciami pre Claude Code, Claude Desktop, Codex CLI, Gemini CLI (dnes Antigravity CLI), Cursor a VS Code
- VS Code dokumentácia už používa správny formát `.vscode/mcp.json` s top-level kľúčom `servers`
- One-linery v dokumentácii už smerujú na client-specific `INSTALL.md` súbory namiesto generického zastaraného postupu

---

## [1.2.4] - 27. 3. 2026

### Opravené

- `get_version` už renderuje celé znenie zo skutočných paragrafov a neberie navigačné bloky zo Slov-Lex portálu
- Sieťové volania na Slov-Lex majú timeout a limitovaný retry pri dočasných zlyhaniach
- Smoke test teraz overuje aj render celého znenia a dostupnosť RSS feedu

---

## [1.2.3] - 28. 1. 2026

### Zmenené

- Dokumentácia pre OpenAI Codex CLI je canonical v `.codex/INSTALL.md` (odstránené duplicity v `README.md`/`INSTALL.md`)
- Pridané troubleshooting pre chybu `MCP startup failed: No such file or directory (os error 2)` (správne rozdelenie `command`/`args` a poznámka o `~`)

---

## [1.2.0] - 10. 1. 2025

### Pridané

- **Podpora pre tabuľky v zákonoch** - parser teraz správne extrahuje a renderuje HTML tabuľky do markdown formátu
- **Podpora pre `div.text2` elementy** - pokračujúci text za zoznamami (písmená, body) sa teraz správne zobrazuje na konci odseku
- **One-liner inštalácia** - univerzálny INSTALL.md pre automatickú inštaláciu cez AI asistentov
- **Konfiguračné súbory pre AI systémy** - `.claude/`, `.codex/`, `.gemini/`, `.cursor/` priečinky s inštrukciami

### Opravené

- **§ 33 ods. 6 zákona 595/2003** - tabuľka percentuálnych limitov daňového bonusu sa teraz správne zobrazuje
- **§ 128 ods. 2 zákona 300/2005** - text "ak je s výkonom takej funkcie..." sa teraz zobrazuje až za písmenami a), b), c), d)
- Správne poradie obsahu v odsekoch: hlavný text → detské elementy (písmená/body) → trailing content (tabuľky/pokračujúci text)

### Technické detaily

- Nová funkcia `renderTable()` v `portal.ts` - konvertuje HTML `<table>` na markdown tabuľku
- Rozdelenie `directChildText()` na `getMainText()` a `getTrailingContent()` pre správne poradie obsahu
- Fix sa aplikuje na všetky zákony automaticky

---

## [1.1.0] - 9. 1. 2025

### Pridané

- Základná funkcionalita MCP servera
- Nástroje: `get_law`, `get_version`, `get_paragraph`, `search`
- LRU cache pre portal HTML, metadáta a vyhľadávanie
- Playwright fallback pre statický obsah
- Smoke test

---

## [1.0.0] - 8. 1. 2025

### Pridané

- Prvé vydanie
- Pripojenie k Slov-Lex API
- HTML parsing pomocou Cheerio
