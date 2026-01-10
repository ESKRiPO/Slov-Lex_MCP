# Slov-Lex MCP pre Cursor / VS Code

## Automatická inštalácia

Povedz AI asistentovi:

```
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/INSTALL.md
```

## Manuálna inštalácia

### 1. Klonovanie

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm install && npm run build
```

### 2. Konfigurácia

Pridaj do `.cursor/mcp.json` alebo `.vscode/mcp.json` v tvojom projekte:

```json
{
  "mcpServers": {
    "slov-lex": {
      "command": "node",
      "args": ["/home/USER/.local/share/slov-lex-mcp/dist/index.js"]
    }
  }
}
```

### 3. Reštartuj Cursor / VS Code

## Dostupné nástroje

- `get_law` - Základné info o zákone
- `get_version` - Úplné znenie k dátumu
- `get_paragraph` - Konkrétny paragraf
- `search` - Vyhľadávanie zákonov

## Test

```
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```
