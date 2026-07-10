# Slov-Lex MCP - Inštalačné inštrukcie

## Čo je Slov-Lex MCP?

MCP server pre prístup k Zbierke zákonov Slovenskej republiky cez [Slov-Lex.sk](https://www.slov-lex.sk/).

**Funkcie:**

- Vyhľadávanie predpisov podľa čísla, roku alebo kľúčových slov
- Stránkované načítanie znenia predpisu k ľubovoľnému dátumu účinnosti
- Render paragrafov, ústavných a novelizačných článkov, tabuliek a príloh
- Strojovo spracovateľný `structuredContent` a oficiálne zdrojové odkazy
- RSS pre posledných 20 vyhlásených predpisov
- Inteligentné cachovanie

---

## Rýchly výber podľa klienta

Použi návod pre svoj konkrétny AI klient:

- Claude Code / Claude Desktop:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.claude/INSTALL.md`
- OpenAI Codex CLI:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.codex/INSTALL.md`
- Google Antigravity / Antigravity CLI:
  `Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.antigravity/INSTALL.md`
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
npm ci
npm run build
```

Playwright Chromium je iba voliteľný fallback pre prostredia, ktoré blokujú
priamy prístup k statickému Slov-Lex. Ak server ohlási chýbajúci browser, spusti:

```bash
npm run install:browser
```

### Aktualizácia na 1.3.1

```bash
cd ~/.local/share/slov-lex-mcp
git pull --ff-only
npm ci
npm run check
```

Po aktualizácii reštartuj MCP klienta. Existujúce konfigurácie servera zostávajú
platné. Verzia 1.3.1 zlepšuje vyhľadávanie prirodzených výrazov a radenie
relevancie bez zmeny názvov MCP nástrojov.

### 2. Konfigurácia AI klienta

> V JSON/TOML konfiguráciách používaj plnú absolútnu cestu, nie `~`.

#### Claude Code

Odporúčaná registrácia cez CLI:

```bash
claude mcp add --scope user slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

#### Claude Desktop

Claude Desktop je podporovaný na macOS a Windows. Otvor `Settings` → `Developer` →
`Edit Config`. Súbor je na macOS v
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

Na Windows použi napríklad
`C:/Users/<user>/.local/share/slov-lex-mcp/dist/index.js`. Ak Desktop nenájde
`node`, zadaj jeho plnú absolútnu cestu do poľa `command`.

#### OpenAI Codex CLI

Odporúčaná registrácia cez CLI:

```bash
codex mcp add slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

Alternatíva je `~/.codex/config.toml`. Pozri [.codex/INSTALL.md](.codex/INSTALL.md).

#### Google Antigravity / Antigravity CLI

Pridaj server do globálneho `~/.gemini/config/mcp_config.json` alebo do
workspace súboru `.agents/mcp_config.json`:

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

V Antigravity IDE použi `MCP Servers` → `Manage MCP Servers` → `View raw config`.
V Antigravity CLI zadaj `/mcp`. Podrobný postup je v
[.antigravity/INSTALL.md](.antigravity/INSTALL.md).

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
| `get_law` | Základné info o predpise (číslo/rok) |
| `get_version` | Stránkované znenie k dátumu |
| `get_paragraph` | Konkrétny paragraf |
| `search` | Vyhľadávanie predpisov |
| `get_recent` | Posledných 20 vyhlásených predpisov |

**Test:**

```text
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```

---

## Požiadavky

- Node.js 22+
- npm

Výstupy obsahujú dátum znenia a oficiálny zdrojový odkaz. Pri rozhodujúcom
právnom použití vždy over text priamo na Slov-Lex; server nenahrádza právne poradenstvo.

---

## Problémy?

- GitHub Issues: https://github.com/ESKRiPO/Slov-Lex_MCP/issues
- Dokumentácia: https://github.com/ESKRiPO/Slov-Lex_MCP#readme
