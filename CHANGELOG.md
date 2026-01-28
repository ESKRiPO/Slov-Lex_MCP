# Changelog

Všetky významné zmeny v tomto projekte sú dokumentované v tomto súbore.

Formát je založený na [Keep a Changelog](https://keepachangelog.com/sk/1.0.0/).

---

## [1.2.3] - 2026-01-28

### Zmenené

- Dokumentácia pre OpenAI Codex CLI je canonical v `.codex/INSTALL.md` (odstránené duplicity v `README.md`/`INSTALL.md`)
- Pridané troubleshooting pre chybu `MCP startup failed: No such file or directory (os error 2)` (správne rozdelenie `command`/`args` a poznámka o `~`)

---

## [1.2.0] - 2025-01-10

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

## [1.1.0] - 2025-01-09

### Pridané

- Základná funkcionalita MCP servera
- Nástroje: `get_law`, `get_version`, `get_paragraph`, `search`
- LRU cache pre portal HTML, metadáta a vyhľadávanie
- Playwright fallback pre statický obsah
- Smoke test

---

## [1.0.0] - 2025-01-08

### Pridané

- Prvé vydanie
- Pripojenie k Slov-Lex API
- HTML parsing pomocou Cheerio
