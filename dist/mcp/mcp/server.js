#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const runtime_js_1 = require('../src/mcp-server/runtime.js');
(0, runtime_js_1.runOrchestratorServer)().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
