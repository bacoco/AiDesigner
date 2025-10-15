# TweakCN MCP Integration

The TweakCN MCP server keeps Tailwind-based themes in sync between AiDesigner and the hosted TweakCN editor. Follow these steps to enable it locally.

## 1. Add the server to `.mcp.json`

Update your project MCP profile so the orchestrator can spawn the server. The default AiDesigner profiles already include the entry:

```json
{
  "mcpServers": {
    "tweakcn": {
      "command": "npx",
      "args": ["-y", "tweakcn-mcp-server"]
    }
  }
}
```

If you generated a project before this change, copy the `tweakcn` block into your `.mcp.json` manually (see `mcp/aidesigner-config.json` and `mcp/quick-designer-config.json`).

## 2. Supply credentials

The server accepts two optional environment variables:

- `TWEAKCN_THEME_PREVIEW_URL` – Direct link to the TweakCN preview you want AiDesigner to mirror.
- `TWEAKCN_API_TOKEN` – API token for authenticated theme saves.

The `aidesigner` CLI can prompt for both when you opt into the server during project scaffolding. Prefer supplying credentials via environment variables so secrets are not written to `.mcp.json`. You can define them in your shell or an ignored `.env.local` before rerunning `npx aidesigner init`.

Security note:

- Do not commit API tokens to version control.
- Use environment variables or a `.env.local` excluded by `.gitignore`.

## 3. Smoke test the orchestrator

Once the entry exists, launch the orchestrator and ask it to list the configured MCP servers. TweakCN should appear alongside the other integrations:

```bash
node .dev/tools/cli.js mcp list
```

```text
📡 MCP Servers Configuration
...
● tweakcn [ACTIVE] (aidesigner)
  Command: npx
  Args: -y tweakcn-mcp-server
...
```

This confirms the orchestrator sees the TweakCN profile and will spawn the published server when the host environment loads `.mcp.json`.【244ff3†L1-L27】
