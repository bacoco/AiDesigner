import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BMADRuntime } from "./runtime.js";

const runtime = new BMADRuntime();

// Create server instance
const server = new Server(
  {
    name: "bmad-invisible-orchestrator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: runtime.listTools(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    return await runtime.callTool(name, args);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  await runtime.ensureReady();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BMAD Invisible Orchestrator MCP Server v1.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
