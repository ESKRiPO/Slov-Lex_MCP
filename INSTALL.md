# Slov-Lex MCP - Inštalačné inštrukcie

## Čo je Slov-Lex MCP?

MCP server pre prístup k Zbierke zákonov Slovenskej republiky cez [Slov-Lex.sk](https://www.slov-lex.sk/).

**Funkcie:**
- Vyhľadávanie zákonov podľa čísla, roku alebo kľúčových slov
- Načítanie úplného znenia zákona k ľubovoľnému dátumu účinnosti
- Extrahovanie konkrétnych paragrafov s podporou tabuliek
- Inteligentné cachovanie

---

## Rýchly výber podľa klienta

Použi návod pre svoj konkrétny AI klient:

- Claude Code / Claude Desktop:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.claude/INSTALL.md`
- OpenAI Codex CLI:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.codex/INSTALL.md`
- Google Gemini CLI:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.gemini/INSTALL.md`
- Cursor:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.cursor/INSTALL.md`
- VS Code:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.vscode/INSTALL.md`

---

## Manuálna inštalácia

### 1. Klonovanie a build

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm install
npm run build
```

### 2. Konfigurácia AI klienta

> V JSON/TOML konfiguráciách používaj plnú absolútnu cestu, nie `~`.

#### Claude Code

Odporúčaná registrácia cez CLI:

```bash
claude mcp add --scope user slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

#### Claude Desktop

Pridaj do `~/.claude/claude_desktop_config.json`:

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

#### OpenAI Codex CLI

Odporúčaná registrácia cez CLI:

```bash
codex mcp add slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

Alternatíva je `~/.codex/config.toml`. Pozri [.codex/INSTALL.md](.codex/INSTALL.md).

#### Google Gemini CLI

Odporúčaná registrácia cez CLI:

```bash
gemini mcp add --scope user slov-lex node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

Alebo pridaj do `~/.gemini/settings.json`:

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

#### Cursor

Pridaj do `~/.cursor/mcp.json` alebo projektového `.cursor/mcp.json`:

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

#### VS Code

Pridaj do `.vscode/mcp.json` alebo do user profile `mcp.json`:

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

## Overenie inštalácie

Po reštarte AI klienta by mali byť dostupné tieto nástroje:

| Nástroj | Popis |
|---------|-------|
| `get_law` | Základné info o zákone (číslo/rok) |
| `get_version` | Úplné znenie k dátumu |
| `get_paragraph` | Konkrétny paragraf |
| `search` | Vyhľadávanie zákonov |
| `get_recent` | Posledných 20 vyhlásených predpisov |

**Test:**

```text
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```

---

## Požiadavky

- Node.js 22+
- npm

---

## Problémy?

- GitHub Issues: https://github.com/ESKRiPO/Slov-Lex_MCP/issues
- Dokumentácia: https://github.com/ESKRiPO/Slov-Lex_MCP#readme
