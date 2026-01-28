# Slov-Lex MCP - Inštalačné inštrukcie

## Čo je Slov-Lex MCP?

MCP server pre prístup k Zbierke zákonov Slovenskej republiky cez [Slov-Lex.sk](https://www.slov-lex.sk/).

**Funkcie:**
- Vyhľadávanie zákonov podľa čísla, roku alebo kľúčových slov
- Načítanie úplného znenia zákona k ľubovoľnému dátumu účinnosti
- Extrahovanie konkrétnych paragrafov s podporou tabuliek
- Inteligentné cachovanie

---

## Rýchla inštalácia

### 1. Klonovanie a build

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm install
npm run build
```

### 2. Konfigurácia AI asistenta

Pridaj do konfigurácie svojho AI asistenta:

---

#### Claude Code / Claude Desktop

Súbor: `~/.claude/claude_desktop_config.json` alebo cez `claude mcp add`

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["~/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

Alebo cez CLI:
```bash
claude mcp add slov-lex -- node ~/.local/share/slov-lex-mcp/dist/index.js
```

---

#### OpenAI Codex CLI

Súbor: `~/.codex/config.toml`

Pozri [.codex/INSTALL.md](.codex/INSTALL.md) (canonical inštrukcie + troubleshooting).

---

#### Google Gemini CLI

Súbor: `~/.gemini/settings.json`

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["~/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

---

#### Cursor / VS Code s MCP

Súbor: `.cursor/mcp.json` alebo `.vscode/mcp.json`

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["~/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

---

#### Cline (VS Code extension)

Súbor: `~/.cline/mcp_settings.json`

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["~/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

---

## Overenie inštalácie

Po reštarte AI asistenta by mali byť dostupné tieto nástroje:

| Nástroj | Popis |
|---------|-------|
| `get_law` | Základné info o zákone (číslo/rok) |
| `get_version` | Úplné znenie k dátumu |
| `get_paragraph` | Konkrétny paragraf |
| `search` | Fulltextové vyhľadávanie |

**Test:**
```
Aký je § 33 zákona 595/2003 o dani z príjmov?
```

---

## Požiadavky

- Node.js 22+
- npm

---

## Problémy?

- GitHub Issues: https://github.com/ESKRiPO/Slov-Lex_MCP/issues
- Dokumentácia: https://github.com/ESKRiPO/Slov-Lex_MCP#readme
