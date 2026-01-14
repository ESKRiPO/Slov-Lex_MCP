# Slov-Lex MCP Server

**MCP server pre prístup k Zbierke zákonov Slovenskej republiky**

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/ESKRiPO/Slov-Lex_MCP)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.25-green.svg)](https://modelcontextprotocol.io/)

---

## Popis

Slov-Lex MCP je Model Context Protocol server, ktorý umožňuje AI asistentom pristupovať k právnym predpisom zo [Slov-Lex.sk](https://www.slov-lex.sk/) - oficiálneho právneho a informačného portálu Ministerstva spravodlivosti SR.

### Funkcie

- Vyhľadávanie zákonov podľa čísla, roku alebo kľúčových slov
- Načítanie úplného znenia zákona k ľubovoľnému dátumu účinnosti
- Extrahovanie konkrétnych paragrafov
- **Podpora tabuliek** - tabuľky v zákonoch sa renderujú do markdown formátu
- **RSS feed** - sledovanie posledných 20 vyhlásených predpisov
- Inteligentné cachovanie pre rýchle odpovede

---

## Nástroje

| Nástroj | Popis |
|---------|-------|
| `get_law` | Získa základné informácie o zákone podľa čísla a roku |
| `get_version` | Načíta úplné znenie zákona k danému dátumu |
| `get_paragraph` | Extrahuje konkrétny paragraf zo zákona |
| `search` | Vyhľadá zákony podľa kľúčových slov (autocomplete alebo fulltext) |
| `get_recent` | Získa posledných 20 vyhlásených predpisov z RSS feedu |

### Parametre

#### `get_law`
| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `number` | string/number | áno | Číslo zákona |
| `year` | string/number | áno | Rok vydania |

#### `get_version`
| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `law` | string | áno | Číslo zákona (napr. `595/2003`) alebo IRI |
| `date` | string | nie | Dátum znenia `YYYY-MM-DD` (default: dnes) |
| `max_chars` | number | nie | Max počet znakov (default: 20000) |

#### `get_paragraph`
| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `law` | string | áno | Číslo zákona alebo IRI |
| `paragraph` | string | áno | Číslo paragrafu (napr. `3` alebo `§3`) |
| `date` | string | nie | Dátum znenia `YYYY-MM-DD` (default: dnes) |

#### `search`
| Parameter | Typ | Povinný | Popis |
|-----------|-----|---------|-------|
| `query` | string | áno | Hľadaný výraz |
| `mode` | string | nie | Režim vyhľadávania: `autocomplete` (default) alebo `fulltext` |
| `limit` | number | nie | Max počet výsledkov (default: 10, max: 25) |

**Režimy vyhľadávania:**
- `autocomplete` - rýchle vyhľadávanie v názvoch zákonov
- `fulltext` - vyhľadávanie aj v nadpisoch paragrafov (napr. "Hromadné prepúšťanie")

#### `get_recent`

Tento nástroj nemá žiadne parametre. Vracia posledných 20 vyhlásených predpisov z RSS feedu Slov-Lex.

> **Poznámka:** RSS feed obsahuje len 20 najnovších položiek, nie kompletný archív.

---

## Rýchla inštalácia (One-liner)

Povedz svojmu AI asistentovi:

```
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/INSTALL.md
```

| AI Systém | Podrobné inštrukcie |
|-----------|---------------------|
| Claude Code / Claude Desktop | [.claude/INSTALL.md](.claude/INSTALL.md) |
| OpenAI Codex CLI | [.codex/INSTALL.md](.codex/INSTALL.md) |
| Google Gemini CLI | [.gemini/INSTALL.md](.gemini/INSTALL.md) |
| Cursor / VS Code | [.cursor/INSTALL.md](.cursor/INSTALL.md) |

---

## Manuálna inštalácia

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm install
npm run build
```

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

---

## MCP Konfigurácia

### Claude Desktop / Claude Code

Pridajte do konfigurácie MCP serverov:

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["/cesta/k/Slov-Lex_MCP/dist/index.js"]
    }
  }
}
```

### OpenAI Codex CLI

Pridajte do `~/.codex/config.toml`:

```toml
[mcp_servers.slov-lex]
command = "node"
args = ["/cesta/k/Slov-Lex_MCP/dist/index.js"]
```

Alebo cez CLI:

```bash
codex mcp add slov-lex -- node /cesta/k/Slov-Lex_MCP/dist/index.js
```

### Google Gemini CLI

Pridajte do `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["/cesta/k/Slov-Lex_MCP/dist/index.js"]
    }
  }
}
```

---

## Technológie

- **Runtime:** Node.js 22+
- **Jazyk:** TypeScript 5.9
- **MCP SDK:** @modelcontextprotocol/sdk 1.25
- **HTML parsing:** Cheerio
- **Fallback browser:** Playwright

---

## Licencia

MIT

---

## Autor

[ESKRiPO](https://github.com/ESKRiPO)

---

## Poďakovanie

Vytvorené v spolupráci s [**Desiatok.sk**](https://desiatok.sk) - komunitnou AI daňovou kalkulačkou pre Slovensko.
