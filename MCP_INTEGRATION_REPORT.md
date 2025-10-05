# aidesigner MCP Integration Report

**Date:** 2025-10-04
**Project:** aidesigner (formerly BMAD-invisible)
**Objective:** Integrate aidesigner orchestrator as MCP server in Claude Code CLI

---

## Executive Summary

Successfully published aidesigner with MCP server integration. However, the MCP server fails to connect in Claude Code CLI due to ongoing path resolution issues. Published versions: **1.3.17 → 1.3.21** with multiple path resolution attempts.

**Current Status:** ❌ **Failed** - MCP server not connecting in Claude Code CLI despite correct configuration.

---

## Problem Statement

aidesigner package includes an MCP server that should expose orchestration tools to Claude Code CLI. The server code exists and builds correctly, but fails to connect when Claude Code attempts to launch it.

---

## Technical Architecture

### MCP Server Location

- **Source:** `.dev/mcp/server.ts`
- **TypeScript Build:** Compiles to `dist/mcp/mcp/server.js`
- **Package Structure:**
  ```
  aidesigner/
  ├── .dev/
  │   └── dist/mcp/         # ❌ NOT published (excluded by .npmignore)
  ├── dist/
  │   └── mcp/
  │       ├── mcp/
  │       │   └── server.js  # ✅ Published entry point
  │       ├── src/
  │       │   └── mcp-server/
  │       │       └── runtime.js  # Core server logic
  │       └── lib/          # Supporting libraries
  └── bin/
      └── aidesigner           # Installer script
  ```

### MCP Server Entry Point

```javascript
#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const runtime_js_1 = require('../src/mcp-server/runtime.js');
(0, runtime_js_1.runOrchestratorServer)().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

---

## Attempted Solutions

### Version 1.3.17 - Initial Approach

**Configuration:**

```json
{
  "command": "node",
  "args": ["-e", "require('aidesigner/dist/mcp/mcp/server.js')"]
}
```

**Result:** ❌ Path not found - `dist/mcp/mcp/server.js` doesn't exist in published package

### Version 1.3.18 - Package Name Fix

- Updated optional MCP server packages to correct names:
  - `chrome-devtools-mcp` (instead of `@modelcontextprotocol/server-chrome-devtools`)
  - `@jpisnice/shadcn-ui-mcp-server` (instead of `@modelcontextprotocol/server-shadcn`)
  - `@modelcontextprotocol/server-github` (instead of `gitmcp`)
- Added interactive GitHub token prompt
  **Result:** ✅ Optional servers fixed, but aidesigner server still failing

### Version 1.3.19 - Server Rename

**Configuration:**

```json
{
  "mcpServers": {
    "aidesigner": {
      // Renamed from "aidesigner-invisible-orchestrator"
      "command": "node",
      "args": ["-e", "require('aidesigner/dist/mcp/mcp/server.js')"]
    }
  }
}
```

**Result:** ❌ Still path not found

### Version 1.3.20 - Correct Path Discovery

**Configuration:**

```json
{
  "command": "node",
  "args": ["-e", "require('aidesigner/.dev/dist/mcp/mcp/server.js')"]
}
```

**Result:** ❌ `.dev/dist/mcp/` is excluded from npm package by `.npmignore`

### Version 1.3.21 - Direct File Path

**Configuration:**

```json
{
  "command": "node",
  "args": ["node_modules/aidesigner/dist/mcp/mcp/server.js"]
}
```

**Result:** ❌ Still failing - **Current state**

---

## Root Cause Analysis

### Issue 1: Build Output Location Mismatch

- **TypeScript config** (`tsconfig.json`) outputs to `dist/mcp/`
- **Build script** also creates `.dev/dist/mcp/` (duplicate)
- **npm package** includes `dist/mcp/` but excludes `.dev/`
- **Server file exists** in published package at correct path

### Issue 2: Missing `server.js` in Published Package

The critical issue: **`dist/mcp/mcp/server.js` is missing from the npm package**

Verified by:

```bash
ls -la node_modules/aidesigner/dist/mcp/mcp/
# Output: server.d.ts only (no server.js)
```

The TypeScript compilation creates only `.d.ts` files initially. The `.js` file is created by the `postinstall` script when users install the package.

### Issue 3: Postinstall Script Dependency

```json
{
  "scripts": {
    "postinstall": "node .dev/tools/postinstall-build-mcp.js",
    "build:mcp": "tsc -p .dev/mcp/tsconfig.json && ..."
  }
}
```

The MCP server `.js` file is built **during installation**, not during package publishing. This creates a chicken-and-egg problem:

1. Package is published without `server.js`
2. User installs package
3. Postinstall runs `build:mcp`
4. `server.js` is created locally
5. But Claude Code may try to connect before postinstall completes

### Issue 4: Claude Code Path Resolution

Claude Code CLI appears to have issues with relative paths:

- `./node_modules/aidesigner/...` gets stripped to `dist/...`
- `node_modules/aidesigner/...` may not resolve correctly
- Absolute paths work but aren't portable

### Issue 5: Legacy Server Entries

User's `.claude.json` contains duplicate legacy servers:

- `aidesigner-invisible-orchestrator` (old name)
- `gitmcp` (non-existent package)

These appear in `/mcp` list as failed, causing confusion.

---

## Current Configuration

### Project `.mcp.json` (v1.3.21)

```json
{
  "mcpServers": {
    "aidesigner": {
      "command": "node",
      "args": ["node_modules/aidesigner/dist/mcp/mcp/server.js"],
      "disabled": false
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"],
      "disabled": false
    },
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "@jpisnice/shadcn-ui-mcp-server"],
      "disabled": false
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "disabled": false
    }
  }
}
```

### MCP Server Status

- ❌ **aidesigner**: Failed
- ❌ **chrome-devtools**: Failed
- ❌ **shadcn-ui**: Failed (not in config above, likely in user's global)
- ✅ **github**: Connected
- ❌ **aidesigner-invisible-orchestrator**: Failed (legacy, should be removed)
- ❌ **gitmcp**: Failed (legacy, should be removed)

---

## Recommendations for Next Developer

### Immediate Actions

1. **Fix Build Process**

   ```bash
   # Ensure server.js is built BEFORE publishing
   npm run build:mcp
   # Verify file exists
   ls dist/mcp/mcp/server.js
   # Then publish
   npm publish
   ```

2. **Update .npmignore**

   ```
   # Remove .dev/ exclusion OR
   # Ensure dist/mcp/ includes ALL built files including .js
   ```

3. **Verify Package Contents**

   ```bash
   npm pack --dry-run | grep "dist/mcp/mcp/server.js"
   # Should show the file is included
   ```

4. **Test Installation**

   ```bash
   # In a test directory
   npm install aidesigner@latest
   ls node_modules/aidesigner/dist/mcp/mcp/server.js
   # File must exist
   ```

5. **Clean User Config**
   Remove legacy servers from `/Users/loic/.claude.json`:
   - `aidesigner-invisible-orchestrator`
   - `gitmcp`

### Structural Fixes

1. **Simplify Build**
   - Build MCP server as part of main `npm run build`
   - Remove dependency on `postinstall` script
   - Ensure `dist/mcp/mcp/server.js` exists in published package

2. **Alternative: Bin Wrapper**
   Add to `package.json`:

   ```json
   {
     "bin": {
       "aidesigner-mcp": "dist/mcp/mcp/server.js"
     }
   }
   ```

   Then use:

   ```json
   {
     "command": "aidesigner-mcp",
     "args": []
   }
   ```

3. **Alternative: npx Approach**
   Create a dedicated npm package `@aidesigner/mcp-server`:

   ```json
   {
     "command": "npx",
     "args": ["-y", "@aidesigner/mcp-server"]
   }
   ```

4. **Path Resolution Test**
   Add to installer:
   ```javascript
   const serverPath = path.join('node_modules', 'aidesigner', 'dist', 'mcp', 'mcp', 'server.js');
   if (!fs.existsSync(serverPath)) {
     console.error('❌ MCP server not found. Running build...');
     execSync('npm run build:mcp', { cwd: path.dirname(__dirname) });
   }
   ```

### Testing Protocol

1. **Fresh Installation Test**

   ```bash
   mkdir test-aidesigner-mcp
   cd test-aidesigner-mcp
   npm init -y
   npm install aidesigner@latest

   # Verify server exists
   ls node_modules/aidesigner/dist/mcp/mcp/server.js

   # Test server starts
   node node_modules/aidesigner/dist/mcp/mcp/server.js
   ```

2. **Claude Code Integration Test**

   ```bash
   # Create .mcp.json
   echo '{
     "mcpServers": {
       "aidesigner": {
         "command": "node",
         "args": ["node_modules/aidesigner/dist/mcp/mcp/server.js"]
       }
     }
   }' > .mcp.json

   # Test with Claude Code
   claude
   # Run: /mcp
   # Check aidesigner shows "✔ connected"
   ```

3. **npx Installation Test**
   ```bash
   cd /tmp
   npx aidesigner@latest start
   # Should create working .mcp.json
   # Then test with Claude Code
   ```

---

## Known Working Configurations

### GitHub MCP (✅ Working)

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
  }
}
```

**Why it works:** Package exists on npm and is properly published with executable.

---

## Files Modified

### Published Package

- `bin/aidesigner` - Installer script (lines 1129-1172)
  - Updated MCP configuration logic
  - Added path migration
  - Added interactive prompts

### Version History

- `1.3.17`: Initial MCP integration
- `1.3.18`: Fixed optional server package names
- `1.3.19`: Renamed server `aidesigner-invisible-orchestrator` → `aidesigner`
- `1.3.20`: Updated to `.dev/dist/mcp/` path (incorrect)
- `1.3.21`: Updated to `node_modules/aidesigner/dist/mcp/` path (current)

---

## Debug Information

### Error Logs Location

```
/Users/loic/Library/Caches/claude-cli-nodejs/-Users-loic-develop-test-lolo
```

### Test Commands

```bash
# Verify MCP server file exists
ls -la node_modules/aidesigner/dist/mcp/mcp/server.js

# Test server manually
cd node_modules/aidesigner
node dist/mcp/mcp/server.js

# Check what's published
npm pack --dry-run | grep mcp

# Rebuild MCP server
npm run build:mcp
```

---

## Conclusion

The aidesigner MCP server integration is **partially complete** but **not functional** in Claude Code CLI. The core issue is that `dist/mcp/mcp/server.js` is not included in the published npm package or is not being built before publishing.

**Recommendation:** The next developer should focus on ensuring the MCP server `.js` file is built and included in the published package BEFORE any other work. Once this fundamental issue is resolved, the path resolution should work correctly.

**Estimated Time to Fix:** 1-2 hours with proper build process understanding.

---

## Contact Information

**Session Date:** October 4, 2025
**Claude Version:** Sonnet 4.5
**Working Directory:** `/Users/loic/develop/BMAD-invisible`
**Published Package:** `aidesigner` on npm
**Latest Version:** 1.3.21

---

_Generated by Claude Code during troubleshooting session_
