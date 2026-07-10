# Slov-Lex MCP Server

**MCP server pre prístup k Zbierke zákonov Slovenskej republiky**

[![Version](https://img.shields.io/badge/version-1.3.1-blue.svg)](https://github.com/ESKRiPO/Slov-Lex_MCP)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.29-green.svg)](https://modelcontextprotocol.io/)

---

## Popis

Slov-Lex MCP je Model Context Protocol server, ktorý umožňuje AI asistentom pristupovať k právnym predpisom zo [Slov-Lex.sk](https://www.slov-lex.sk/) - oficiálneho právneho a informačného portálu Ministerstva spravodlivosti SR.

### Funkcie

- Vyhľadávanie predpisov podľa čísla, roku alebo kľúčových slov
- Stránkované načítanie znenia predpisu k ľubovoľnému dátumu účinnosti
- Extrahovanie konkrétnych paragrafov vrátane paragrafov s priamym textom
- Podpora paragrafov, novelizačných článkov, ústavných článkov a príloh
- **Podpora tabuliek** - tabuľky v predpisoch sa renderujú do Markdown formátu
- **RSS feed** - sledovanie posledných 20 vyhlásených predpisov
- Inteligentné cachovanie pre rýchle odpovede

---

## Nástroje

| Nástroj | Popis |
|---------|-------|
| `get_law` | Získa základné informácie o predpise podľa čísla a roku |
| `get_version` | Načíta stránku znenia predpisu k danému dátumu |
| `get_paragraph` | Extrahuje konkrétny paragraf z predpisu |
| `search` | Vyhľadá predpisy podľa kľúčových slov (autocomplete alebo fulltext) |
| `get_recent` | Získa posledných 20 vyhlásených predpisov z RSS feedu |

Každý nástroj vracia čitateľný text aj strojovo spracovateľný `structuredContent`.
Výstupy obsahujú oficiálny zdrojový odkaz na Slov-Lex.

### Parametre

#### `get_law`

| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `number` | string/number | áno | Číslo predpisu |
| `year` | string/number | áno | Rok vydania |

#### `get_version`

| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `law` | string | áno | Číslo predpisu (napr. `595/2003`) alebo IRI |
| `date` | string | nie | Dátum znenia `YYYY-MM-DD` (default: dnes v `Europe/Bratislava`) |
| `max_chars` | number | nie | Počet znakov jednej stránky (default: 20000, max: 100000) |
| `offset` | number | nie | Znakový offset pre pokračovanie (default: 0) |

Ak odpoveď obsahuje `has_more: true`, ďalšiu stránku načítaj s hodnotou
`next_offset` použitou ako nový parameter `offset`.

#### `get_paragraph`

| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `law` | string | áno | Číslo predpisu alebo IRI |
| `paragraph` | string | áno | Číslo paragrafu (napr. `3` alebo `§3`) |
| `date` | string | nie | Dátum znenia `YYYY-MM-DD` (default: dnes v `Europe/Bratislava`) |

#### `search`

| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `query` | string | áno | Hľadaný výraz |
| `mode` | string | nie | Režim vyhľadávania: `autocomplete` (default) alebo `fulltext` |
| `limit` | number | nie | Max počet výsledkov (default: 10, max: 25) |

**Režimy vyhľadávania:**

- `autocomplete` - predvolený režim; kombinuje návrhy, vyhľadávanie v názvoch a fulltext, odstráni duplicity a zoradí výsledky podľa relevancie
- `fulltext` - vyhľadávanie v názvoch a nadpisoch paragrafov (napr. "Hromadné prepúšťanie"), takisto s lokálnym zoradením relevancie

Radenie toleruje bežné rozdiely v tvaroch slov (napr. `daň`/`dani`, `cestná`/`cestnej`), rozvíja skratky `DPH`, `GDPR` a `ZVO` a pri rovnakej téme uprednostní účinný základný predpis pred historickými alebo novelizačnými zákonmi.

Živý audit širšej sady vyhľadávacích scenárov spustíš cez `npm run audit:search`. Kontroluje presné názvy, skloňovanie, text bez diakritiky, skratky, citácie, nadpisy paragrafov, všeobecné heslá, prirodzené otázky, historické predpisy, duplicity aj limity výsledkov.

#### `get_recent`

Tento nástroj nemá žiadne parametre. Vracia posledných 20 vyhlásených predpisov z RSS feedu Slov-Lex.

> **Poznámka:** RSS feed obsahuje len 20 najnovších položiek, nie kompletný archív.

---

## Rýchla inštalácia (One-liner)

Použi one-liner pre konkrétneho klienta podľa svojho AI asistenta:

### Claude Code / Claude Desktop

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.claude/INSTALL.md
```

### OpenAI Codex CLI

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.codex/INSTALL.md
```

### Google Antigravity / Antigravity CLI

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.antigravity/INSTALL.md
```

### Cursor

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.cursor/INSTALL.md
```

### VS Code

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.vscode/INSTALL.md
```

Podrobné návody:

| AI Systém | Podrobné inštrukcie |
|-----------|---------------------|
| Claude Code / Claude Desktop | [.claude/INSTALL.md](.claude/INSTALL.md) |
| OpenAI Codex CLI | [.codex/INSTALL.md](.codex/INSTALL.md) |
| Google Antigravity / Antigravity CLI | [.antigravity/INSTALL.md](.antigravity/INSTALL.md) |
| Cursor | [.cursor/INSTALL.md](.cursor/INSTALL.md) |
| VS Code | [.vscode/INSTALL.md](.vscode/INSTALL.md) |

---

## Manuálna inštalácia

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm ci
npm run build
```

Priamy HTTP prístup obvykle stačí. Ak prostredie blokuje statický Slov-Lex a server
ohlási chýbajúci Playwright Chromium, nainštaluj voliteľný browser fallback:

```bash
npm run install:browser
```

---

## Aktualizácia na 1.3.1

```bash
cd ~/.local/share/slov-lex-mcp
git pull --ff-only
npm ci
npm run check
```

Potom reštartuj MCP klienta. Názvy existujúcich piatich nástrojov sa nezmenili.
Verzia 1.3.1 zlepšuje vyhľadávanie prirodzených výrazov, radenie relevancie,
rozpoznávanie bežných tvarov slov a uprednostňovanie účinných základných predpisov.

---

## Použitie

### Vývojový režim

```bash
npm run dev
```

### Produkčný režim

```bash
npm run build
npm start
```

### Kontroly projektu

```bash
npm test       # offline regresné testy
npm run check  # TypeScript build + testy
npm run smoke  # živý test proti Slov-Lex, Ústave a RSS
```

---

## MCP Konfigurácia

### Claude Code

Odporúčaná registrácia cez CLI:

```bash
claude mcp add --scope user slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

> `--scope user` spraví server dostupný naprieč projektmi. Ak ho vynecháš, Claude Code použije lokálny scope.

### Claude Desktop

Claude Desktop je podporovaný na macOS a Windows. Otvor `Settings` → `Developer` →
`Edit Config`. Konfiguračný súbor je na macOS v
`~/Library/Application Support/Claude/claude_desktop_config.json` a na Windows
v `%APPDATA%\Claude\claude_desktop_config.json`.

Príklad pre macOS:

```json
{
  "mcpServers": {
    "slov-lex": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/<user>/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

Na Windows môže cesta v `args` vyzerať ako
`C:/Users/<user>/.local/share/slov-lex-mcp/dist/index.js`. Ak Desktop nenájde
príkaz `node`, použi v poli `command` jeho plnú absolútnu cestu.

### OpenAI Codex CLI

Odporúčaná registrácia cez CLI:

```bash
codex mcp add slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

Podrobné a **kanonické** inštrukcie sú v [.codex/INSTALL.md](.codex/INSTALL.md) vrátane riešenia chyby `os error 2`.

### Google Antigravity / Antigravity CLI

Použi globálny `~/.gemini/config/mcp_config.json` alebo workspace konfiguráciu
`.agents/mcp_config.json`:

> Adresár `.gemini` v globálnej ceste je súčasťou aktuálneho formátu
> Antigravity; nejde o zastaraný Gemini CLI konfiguračný súbor.

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["/home/<user>/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

V Antigravity IDE otvor `MCP Servers` → `Manage MCP Servers` → `View raw config`.
V Antigravity CLI otvor Interactive MCP Manager príkazom `/mcp`. Podrobnosti sú
v [.antigravity/INSTALL.md](.antigravity/INSTALL.md) a v
[oficiálnej Antigravity dokumentácii](https://antigravity.google/docs/mcp).

### Cursor

Pridajte do `~/.cursor/mcp.json` alebo projektového `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["/home/<user>/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

### VS Code

Pridajte do `.vscode/mcp.json` v projekte alebo do user profile `mcp.json`:

```json
{
  "servers": {
    "slov-lex": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/<user>/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

---

## Technológie

- **Runtime:** Node.js 22+
- **Jazyk:** TypeScript 6.0
- **MCP SDK:** @modelcontextprotocol/sdk 1.29
- **HTML parsing:** Cheerio
- **Fallback browser:** Playwright

Projekt nepoužíva CI/CD. GitHub Security audit kontroluje závislosti raz týždenne
a dá sa spustiť aj manuálne z karty Actions; nespúšťa sa pri každom commite.

---

## Dôležité upozornenie

Právne predpisy sa menia v čase. Pri použití výsledku skontroluj dátum znenia a
oficiálny zdrojový odkaz. Výstup MCP servera nenahrádza právne poradenstvo.

---

## Licencia

MIT

---

## Autor

[ESKRiPO](https://github.com/ESKRiPO)

---

## Poďakovanie

Vytvorené v spolupráci s [**Desiatok.sk**](https://desiatok.sk) - komunitnou AI daňovou kalkulačkou pre Slovensko.
