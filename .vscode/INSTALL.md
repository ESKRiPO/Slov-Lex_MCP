# Slov-Lex MCP pre VS Code

## Automatická inštalácia

Povedz VS Code agentovi:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.vscode/INSTALL.md
```

## Manuálna inštalácia

### 1. Klonovanie

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm install && npm run build
```

### 2. Konfigurácia MCP

Vo VS Code môžeš použiť:

- workspace config: `.vscode/mcp.json`
- user profile config: otvor cez `MCP: Open User Configuration`

Príklad `.vscode/mcp.json`:

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

> VS Code používa top-level kľúč `servers`, nie `mcpServers`.
>
> V JSON konfigurácii používaj plnú absolútnu cestu, nie `~`.

### 3. Overenie

Vo VS Code použi:

- `MCP: List Servers`
- `MCP: Open Workspace Folder MCP Configuration`

## Dostupné nástroje

- `get_law` - Základné info o zákone
- `get_version` - Úplné znenie k dátumu
- `get_paragraph` - Konkrétny paragraf
- `search` - Vyhľadávanie zákonov
- `get_recent` - Posledných 20 vyhlásených predpisov

## Test

```text
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```
