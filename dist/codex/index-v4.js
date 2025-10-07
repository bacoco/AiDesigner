#!/usr/bin/env node
'use strict';
/**
 * Quick Designer v4 - MCP Server Entry Point
 * AI-Driven UI Generation System
 */
Object.defineProperty(exports, '__esModule', { value: true });
const runtime_v4_js_1 = require('./runtime-v4.js');
const main = async () => {
  try {
    await (0, runtime_v4_js_1.runQuickDesignerV4)({
      serverInfo: {
        name: 'quick-designer-v4',
        version: '4.0.0',
      },
      projectRoot: process.cwd(),
      onServerReady: () => {
        console.error('Quick Designer v4 MCP Server is running');
        console.error('AI-Driven UI Generation Ready!');
      },
    });
  } catch (error) {
    console.error('Failed to start Quick Designer v4:', error);
    process.exit(1);
  }
};
// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down Quick Designer v4...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.error('\nShutting down Quick Designer v4...');
  process.exit(0);
});
// Run the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
