#!/usr/bin/env node
import { runOrchestratorServer } from "../src/mcp-server/runtime.js";

runOrchestratorServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
