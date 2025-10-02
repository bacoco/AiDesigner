'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const index_js_1 = require('@modelcontextprotocol/sdk/server/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const runtime_js_1 = require('./runtime.js');
const runtime = new runtime_js_1.BMADRuntime();
// Create server instance
const server = new index_js_1.Server(
  {
    name: 'bmad-invisible-orchestrator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);
// Register tool handlers
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
  tools: runtime.listTools(),
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    return await runtime.callTool(name, args);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
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
  const transport = new stdio_js_1.StdioServerTransport();
  await server.connect(transport);
  console.error('BMAD Invisible Orchestrator MCP Server v1.0.0 running on stdio');
}
main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
