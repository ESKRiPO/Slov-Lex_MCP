# Slov-Lex MCP pre Google Antigravity a Antigravity CLI

## Automatická inštalácia

Povedz Antigravity agentovi:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/ESKRiPO/Slov-Lex_MCP/master/.antigravity/INSTALL.md
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

### 2. MCP konfigurácia

Antigravity IDE aj Antigravity CLI používajú rovnaký formát konfigurácie:

- globálne: `~/.gemini/config/mcp_config.json`
- iba pre aktuálny workspace: `.agents/mcp_config.json`

> Adresár `.gemini` v globálnej ceste je súčasťou aktuálneho formátu
> Antigravity; nejde o zastaraný Gemini CLI konfiguračný súbor.

Aktuálny formát a ovládanie sú popísané aj v
[oficiálnej Antigravity MCP dokumentácii](https://antigravity.google/docs/mcp).

Do vybraného súboru pridaj:

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

> Použi plnú absolútnu cestu, nie `~`. Na macOS bude začínať napríklad
> `/Users/<user>/...`; na Windows môžeš v JSON použiť cestu
> `C:/Users/<user>/.local/share/slov-lex-mcp/dist/index.js`.

### 3. Antigravity IDE

V agent paneli otvor `...` → `MCP Servers` → `Manage MCP Servers` →
`View raw config`. Po uložení konfigurácie server obnov alebo reštartuj.

### 4. Antigravity CLI

V prompt paneli zadaj `/mcp`. Interactive MCP Manager zobrazí stav servera,
umožní znovu načítať konfiguráciu a otvorí logy pripojenia.

## Dostupné nástroje

- `get_law` - Základné informácie o predpise
- `get_version` - Stránkované znenie k dátumu
- `get_paragraph` - Konkrétny paragraf
- `search` - Vyhľadávanie predpisov
- `get_recent` - Posledných 20 vyhlásených predpisov

## Test

```text
Čo hovorí § 33 zákona 595/2003 o daňovom bonuse?
```
