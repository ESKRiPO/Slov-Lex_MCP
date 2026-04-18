# Slov-Lex MCP pre Google Gemini CLI

## Automatická inštalácia

Povedz Gemini:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.gemini/INSTALL.md
```

## Manuálna inštalácia

### 1. Klonovanie

```bash
git clone https://github.com/ESKRiPO/Slov-Lex_MCP.git ~/.local/share/slov-lex-mcp
cd ~/.local/share/slov-lex-mcp
npm install && npm run build
```

### 2. Registrácia cez CLI

Odporúčané pre globálne použitie:

```bash
gemini mcp add --scope user slov-lex node "$HOME/.local/share/slov-lex-mcp/dist/index.js"
```

Ak to chceš len pre aktuálny projekt, použi `--scope project`.

Overenie:

```bash
gemini mcp list
```

### 3. Manuálna konfigurácia

Pridaj do `~/.gemini/settings.json`:

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

> V `settings.json` používaj plnú absolútnu cestu, nie `~`.

### 4. Reštartuj Gemini CLI

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
