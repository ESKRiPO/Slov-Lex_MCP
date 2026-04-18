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
npm install && npm run build
```

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

> V config súbore používaj plnú absolútnu cestu, nie `~`.

### 4. Reštart

- Claude Code: spusti novú session alebo `claude`
- Claude Desktop: aplikáciu po zmene configu reštartuj

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
