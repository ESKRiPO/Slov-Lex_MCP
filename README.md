# Slov-Lex MCP Server

**MCP server pre prístup k Zbierke zákonov Slovenskej republiky**

[![Version](https://img.shields.io/badge/version-1.2.5-blue.svg)](https://github.com/ESKRiPO/Slov-Lex_MCP)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.29-green.svg)](https://modelcontextprotocol.io/)

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

Použi client-specific one-liner podľa svojho AI asistenta:

### Claude Code / Claude Desktop

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.claude/INSTALL.md
```

### OpenAI Codex CLI

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.codex/INSTALL.md
```

### Google Gemini CLI

```bash
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.gemini/INSTALL.md
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
| Google Gemini CLI | [.gemini/INSTALL.md](.gemini/INSTALL.md) |
| Cursor | [.cursor/INSTALL.md](.cursor/INSTALL.md) |
| VS Code | [.vscode/INSTALL.md](.vscode/INSTALL.md) |

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

### Claude Code

Odporúčaná registrácia cez CLI:

```bash
claude mcp add --scope user slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

> `--scope user` spraví server dostupný naprieč projektmi. Ak ho vynecháš, Claude Code použije lokálny scope.

### Claude Desktop

Pridajte do `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slov-lex": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/<user>/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

### OpenAI Codex CLI

Odporúčaná registrácia cez CLI:

```bash
codex mcp add slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

Podrobné a **canonical** inštrukcie sú v [.codex/INSTALL.md](.codex/INSTALL.md) vrátane troubleshootingu pre `os error 2`.

### Google Gemini CLI

Odporúčaná registrácia cez CLI:

```bash
gemini mcp add --scope user slov-lex node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

Alebo pridajte do `~/.gemini/settings.json`:

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

---

## Licencia

MIT

---

## Autor

[ESKRiPO](https://github.com/ESKRiPO)

---

## Poďakovanie

Vytvorené v spolupráci s [**Desiatok.sk**](https://desiatok.sk) - komunitnou AI daňovou kalkulačkou pre Slovensko.
