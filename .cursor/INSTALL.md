# Slov-Lex MCP pre Cursor

## Automatická inštalácia

Povedz Cursoru:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.cursor/INSTALL.md
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

### 2. Konfigurácia MCP

Pridaj do `~/.cursor/mcp.json` pre globálne použitie alebo do projektového `.cursor/mcp.json`:

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

> V JSON konfigurácii používaj plnú absolútnu cestu, nie `~`.

### 3. Reštartuj Cursor

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

## VS Code

Pre VS Code použi samostatný návod: [.vscode/INSTALL.md](../.vscode/INSTALL.md)
