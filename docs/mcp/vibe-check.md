# Vibe Check MCP Server Configuration

The Vibe Check MCP server scores copy for tone, confidence, and audience alignment so product and marketing teams can iterate quickly on brand messaging.

## Prerequisites

- **API Access** – Generate a Vibe Check API key from your workspace dashboard. Save it somewhere secure; you will map it to the `VIBE_CHECK_API_KEY` environment variable.
- **Model Selection** – The server defaults to Anthropic's Claude 3.5 Sonnet weights. Override the model by setting `VIBE_CHECK_MODEL` if your workspace has access to alternative checkpoints.

## Installing with the CLI

```bash
npm run mcp:install vibe-check -- --config both
```

The installer pulls the published profile and writes the configuration to both the AiDesigner and Claude Desktop MCP profiles. Skip the `--config` flag to target the active profile only.

## Environment Variables

| Variable             | Required | Description                                                  |
| -------------------- | -------- | ------------------------------------------------------------ |
| `VIBE_CHECK_API_KEY` | Yes      | Workspace API token used to authenticate requests.           |
| `VIBE_CHECK_MODEL`   | No       | Model identifier (defaults to `claude-3-5-sonnet-20241022`). |

### Secure Storage

Use the MCP security manager to encrypt credentials locally:

```bash
npm run mcp:secure
```

This command scans your MCP configuration, identifies insecure credentials (including `VIBE_CHECK_API_KEY`), and migrates them to the AiDesigner vault. It replaces plaintext references in your configuration files with secure handles.

## Manual Configuration

If you manage configuration manually, add the following block to your profile (for example `mcp/aidesigner-config.json`):

```json
"vibe-check": {
  "command": "npx",
  "args": ["-y", "vibe-check-mcp-server"],
  "env": {
    "VIBE_CHECK_API_KEY": "${VIBE_CHECK_API_KEY}",
    "VIBE_CHECK_MODEL": "claude-3-5-sonnet-20241022"
  }
}
```

Restart the orchestrator after saving changes so the new server is registered.
