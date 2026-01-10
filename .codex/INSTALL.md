# Slov-Lex MCP pre OpenAI Codex CLI

## Automatická inštalácia

Povedz Codex:

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

### 2. Registrácia MCP servera

```bash
codex mcp add slov-lex -- node ~/.local/share/slov-lex-mcp/dist/index.js
```

Alebo pridaj do `~/.codex/config.toml`:

```toml
[mcp_servers.slov-lex]
command = "node"
args = ["~/.local/share/slov-lex-mcp/dist/index.js"]
```

### 3. Reštartuj Codex

```bash
codex
```

## Dostupné nástroje

- `get_law` - Základné info o zákone
- `get_version` - Úplné znenie k dátumu
- `get_paragraph` - Konkrétny paragraf
- `search` - Vyhľadávanie zákonov

## Test

```
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```
