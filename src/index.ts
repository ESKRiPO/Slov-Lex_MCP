import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { PACKAGE_VERSION } from "./version.js";

const server = new McpServer(
  {
    name: "slov-lex-mcp",
    version: PACKAGE_VERSION,
  },
  {
    instructions:
      "Právne predpisy sa menia v čase. Pri odpovedi vždy zohľadni dátum znenia a používateľovi ponechaj oficiálny zdrojový odkaz. Výstup nenahrádza právne poradenstvo; pri rozhodujúcom použití over znenie na Slov-Lex.",
  },
);

registerTools(server);

const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error(error);
  process.exit(1);
});
