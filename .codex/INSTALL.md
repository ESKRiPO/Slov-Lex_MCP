# Slov-Lex MCP pre OpenAI Codex CLI (Codex CLI)

## Automatická inštalácia

Povedz Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.codex/INSTALL.md
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
args = ["/home/<user>/.local/share/slov-lex-mcp/dist/index.js"]
```

> Poznámka: V `config.toml` **nepoužívaj** `~` v ceste (tilda sa tu typicky neexpanduje). Použi plnú cestu ako vyššie.

### 3. Reštartuj Codex

```bash
codex
```

## Dostupné nástroje

- `get_law` - Základné info o zákone
- `get_version` - Úplné znenie k dátumu
- `get_paragraph` - Konkrétny paragraf
- `search` - Vyhľadávanie zákonov

## Overenie

```bash
codex mcp list
codex mcp get slov-lex
```

## Test

```
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```

## Troubleshooting

### `MCP startup failed: No such file or directory (os error 2)`

Najčastejšie príčiny:

1) **Zlá konfigurácia `command`/`args` v `~/.codex/config.toml`**

✅ Správne:
```toml
[mcp_servers.slov-lex]
command = "node"
args = ["/home/<user>/.local/share/slov-lex-mcp/dist/index.js"]
```

❌ Nesprávne (celé ako jeden string):
```toml
[mcp_servers.slov-lex]
command = "node /home/<user>/.local/share/slov-lex-mcp/dist/index.js"
```

2) **Cesta v `args` neexistuje**

- Over:
  - či si spustil `npm run build`
  - či existuje `dist/index.js`

3) **Použitá `~` v ceste v config súbore**

- V TOML configoch sa `~` typicky neexpanduje → použi plnú cestu.
