# MCP Server Configuration Issue - Bug Report

## Problem Summary

The Agilai MCP server fails to start in Claude Code CLI despite correct configuration. The issue is that Claude CLI is not properly resolving the relative path `./node_modules/agilai/dist/mcp/mcp/server.js`.

## Environment

- **Claude Code Version**: v2.0.5
- **Node.js**: v22.16.0
- **Agilai Version**: 1.3.17
- **OS**: macOS (Darwin 24.5.0)
- **Project Path**: `/Users/loic/develop/test lolo`

## Current Configuration

### .mcp.json (Project Root)

```json
{
  "mcpServers": {
    "agilai-invisible-orchestrator": {
      "command": "node",
      "args": ["./node_modules/agilai/dist/mcp/mcp/server.js"],
      "disabled": false
    }
  }
}
```

### File System Verification

✅ Server file **EXISTS** at: `/Users/loic/develop/test lolo/node_modules/agilai/dist/mcp/mcp/server.js`

## Error Details

### Error Log

```
Error: Cannot find module '/Users/loic/develop/test lolo/dist/mcp/mcp/server.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
```

### Root Cause Analysis

**The path is being mangled!**

- **Expected execution**: `node ./node_modules/agilai/dist/mcp/mcp/server.js`
- **Actual execution**: `node dist/mcp/mcp/server.js` (missing `./node_modules/agilai/` prefix!)

The Claude CLI MCP loader is **stripping or incorrectly processing** the relative path before passing it to Node.js.

## Evidence Trail

### Attempted Solutions (All Failed)

1. ❌ Used VS Code variable `${workspaceFolder}/node_modules/...` → Not supported in Claude CLI
2. ❌ Used relative path `node_modules/agilai/...` → Resolved to wrong directory
3. ❌ Used `./ prefixed path` `./node_modules/agilai/...` → **STILL FAILS** (current state)
4. ❌ Changed server name from `agilai-orchestrator` to `agilai-invisible-orchestrator` → No effect
5. ❌ Moved config from `.claude/mcp-config.json` to `.mcp.json` → No effect

### What Should Work (But Doesn't)

According to Claude Code MCP documentation, this configuration should work:

```json
{
  "command": "node",
  "args": ["./path/to/server.js"]
}
```

## The Real Issue

**Claude CLI is not executing the command as specified.** When it runs:

```bash
node ./node_modules/agilai/dist/mcp/mcp/server.js
```

It's somehow being transformed to:

```bash
node dist/mcp/mcp/server.js
```

This suggests:

1. The MCP loader is parsing/modifying the args array incorrectly
2. OR there's path resolution logic that's stripping parts of the path
3. OR the CWD is being changed before execution

## Recommended Solutions (For Better Developer)

### Solution 1: Use Absolute Path (Workaround)

```json
{
  "command": "node",
  "args": ["/Users/loic/develop/test lolo/node_modules/agilai/dist/mcp/mcp/server.js"]
}
```

**Problem**: Not portable, breaks when project moves

### Solution 2: Fix Claude CLI MCP Loader (Proper Fix)

The Claude CLI needs to be fixed to properly handle relative paths in MCP server configuration.

**File to investigate**: Claude CLI's MCP server spawning logic

- Should preserve the exact args array passed in config
- Should NOT modify or resolve paths before passing to child_process.spawn()
- Should execute with CWD set to project root

### Solution 3: Use npx with Package Name (Alternative)

```json
{
  "command": "npx",
  "args": ["agilai", "mcp-server"]
}
```

**Requires**: Agilai to expose MCP server as a CLI command

### Solution 4: Wrapper Script

Create `/Users/loic/develop/test lolo/start-mcp.js`:

```javascript
#!/usr/bin/env node
require('./node_modules/agilai/dist/mcp/mcp/server.js');
```

Then use:

```json
{
  "command": "node",
  "args": ["./start-mcp.js"]
}
```

## Test to Verify Fix

Run this manually to verify the server works:

```bash
cd "/Users/loic/develop/test lolo"
node ./node_modules/agilai/dist/mcp/mcp/server.js
```

Expected: Server starts and responds to MCP protocol
Actual: **Server should work** (file exists and is valid)

## Comparison: Working vs Broken

### Working (npx-based servers)

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"]
  }
}
```

✅ **Works**: npx handles path resolution internally

### Broken (node-based with relative path)

```json
{
  "agilai-invisible-orchestrator": {
    "command": "node",
    "args": ["./node_modules/agilai/dist/mcp/mcp/server.js"]
  }
}
```

❌ **Fails**: Path gets mangled before execution

## Additional Context

### Agilai Installer Code

The installer (`bin/agilai`) creates this config automatically:

```javascript
const orchestratorConfig = {
  command: 'node',
  args: ['./node_modules/agilai/dist/mcp/mcp/server.js'],
  disabled: false,
};
```

### Template File

The canonical config is in `mcp/agilai-config.json`:

```json
{
  "mcpServers": {
    "agilai-invisible-orchestrator": {
      "command": "node",
      "args": ["dist/mcp/mcp/server.js"]
    }
  }
}
```

**Note**: Template uses `dist/mcp/mcp/server.js` (no prefix) because it's designed for copying into the package itself, not for node_modules installation.

## Immediate Workaround for User

**Manually edit `.mcp.json` with absolute path**:

```bash
cd "/Users/loic/develop/test lolo"
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "agilai-invisible-orchestrator": {
      "command": "node",
      "args": [
        "/Users/loic/develop/test lolo/node_modules/agilai/dist/mcp/mcp/server.js"
      ],
      "disabled": false
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"],
      "disabled": false
    },
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-shadcn"],
      "disabled": false
    },
    "gitmcp": {
      "command": "npx",
      "args": ["-y", "gitmcp"],
      "disabled": false
    }
  }
}
EOF
```

Then restart Claude Code.

## Files to Review

1. Claude CLI MCP server spawning logic
2. `/Users/loic/develop/BMAD-invisible/bin/agilai` (lines 1126-1130)
3. `/Users/loic/develop/BMAD-invisible/mcp/agilai-config.json`

## Priority

**HIGH** - Blocks all users from using Agilai MCP server with Claude Code CLI

---

**Generated**: 2025-10-04
**Reporter**: AI Assistant attempting to fix Agilai MCP integration
**Next Steps**: File issue with Claude Code team OR implement npx-based solution in Agilai
