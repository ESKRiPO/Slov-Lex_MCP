# Slov-Lex MCP pre Claude Code / Claude Desktop

## Automatická inštalácia

Povedz Claude:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.claude/INSTALL.md
```

## Manuálna inštalácia

### 1. Klonovanie

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm ci
npm run build
```

> Playwright Chromium je voliteľný fallback. Ak server ohlási chýbajúci browser,
> spusti v priečinku projektu `npm run install:browser`.

### 2. Claude Code

Odporúčaná registrácia cez CLI:

```bash
claude mcp add --scope user slov-lex -- node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

> `--scope user` spraví server dostupný vo všetkých projektoch. Ak ho vynecháš, Claude Code použije lokálny scope.

Overenie:

```bash
claude mcp list
claude mcp get slov-lex
```

### 3. Claude Desktop

Claude Desktop je podporovaný na macOS a Windows. V aplikácii otvor
`Settings` → `Developer` → `Edit Config`.

Konfiguračný súbor sa nachádza na týchto miestach:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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
`C:/Users/<user>/.local/share/slov-lex-mcp/dist/index.js`.

> V config súbore používaj plné absolútne cesty. Ak Desktop nenájde príkaz
> `node`, nahraď ho absolútnou cestou z `which node` (macOS) alebo `where node`
> (Windows).

### 4. Reštart

- Claude Code: spusti novú session alebo `claude`
- Claude Desktop: aplikáciu po zmene configu reštartuj

## Dostupné nástroje

- `get_law` - Základné info o predpise
- `get_version` - Stránkované znenie k dátumu
- `get_paragraph` - Konkrétny paragraf
- `search` - Vyhľadávanie predpisov
- `get_recent` - Posledných 20 vyhlásených predpisov

## Test

```text
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```
