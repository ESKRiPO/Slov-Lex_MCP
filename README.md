# slov-lex-mcp

MCP server pre Slov-Lex (Zbierka zákonov SR). Poskytuje nástroje na načítanie právneho predpisu, konkrétneho § a znenia k dátumu účinnosti.

## Nástroje

- `get_law(number, year)` – metadáta + odkazy pre zákon
- `get_paragraph(law, paragraph, date?)` – konkrétny § (napr. `§15`, `15a`)
- `get_version(law, date?, max_chars?)` – celé znenie (truncované podľa `max_chars`)
- `search(query, limit?)` – návrhy (autocomplete) podľa čísla/názvu

## Príklad

```text
get_paragraph({ "law": "595/2003", "paragraph": "§15", "date": "2025-01-01" })
```

## Spustenie

```bash
npm i
npm run dev
```

Build:

```bash
npm run build
npm run smoke
```

## MCP konfigurácia (stdio)

Príklad (názov a cesta uprav podľa seba):

```json
{
  "mcpServers": {
    "slov-lex-mcp": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```
