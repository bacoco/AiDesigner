# MCP Usage Audit

This audit captures every MCP server referenced by the default AiDesigner configuration and documents the concrete implementation evidence for each server. The goal is to ensure that live integrations—not mocks—back the entries in our configuration files.

## Summary Table

| Server ID         | Launch Command                                          | Implementation Evidence                                                                                          | Usage Status                      |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| aidesigner        | `node dist/mcp/mcp/server.js`                           | Main orchestrator entry point that boots the runtime server.                                                     | Active                            |
| quick-designer-v4 | `node dist/mcp/src/mcp-server/quick-designer-server.js` | Quick Designer server exposes real tool handlers via the MCP SDK.                                                | Active                            |
| chrome-devtools   | `npx -y chrome-devtools-mcp`                            | Runtime checks and instructions expect the official Chrome MCP to be present during token extraction.            | Active (requires external server) |
| shadcn            | `npx -y @jpisnice/shadcn-ui-mcp-server`                 | CLI enables the server and scaffolds real `components.json` metadata when it is active.                          | Opt-in, implemented               |
| tweakcn           | `npx -y tweakcn-mcp-server`                             | Profiles and CLI scaffolding enable the published TweakCN theme server for Tailwind design sync.                 | Available                         |
| github            | `npx -y @modelcontextprotocol/server-github`            | CLI bundles GitHub in the install catalog so workflows can provision the official server.                        | Available                         |
| vibe-check        | `npx -y vibe-check-mcp-server`                          | Configuration and installation guide exist; orchestration hooks are staged but not yet wired into runtime tools. | Planned integration               |

## Evidence

### aidesigner orchestrator

- Configured in the default MCP profile alongside other servers.【F:mcp/aidesigner-config.json†L1-L35】
- Launches the compiled orchestrator runtime that powers AiDesigner’s tool surface.【F:dist/mcp/mcp/server.js†L1-L8】

### quick-designer-v4 server

- Declared in the profile and launched as a standalone Node process.【F:mcp/aidesigner-config.json†L8-L15】
- Implements full MCP handlers (tool listing and call routing) via the official SDK, demonstrating production logic rather than a stub.【F:dist/mcp/src/mcp-server/quick-designer-server.js†L1-L160】

### chrome-devtools bridge

- Included in the MCP profile so the orchestrator can spawn the published Chrome DevTools server.【F:mcp/aidesigner-config.json†L16-L19】
- Runtime automation checks for the server before token extraction and instructs the operator to invoke real Chrome MCP tools, confirming reliance on the live integration.【F:dist/mcp/src/mcp-server/runtime.js†L2767-L2902】

### shadcn UI helper

- Optional helper surfaced in the CLI’s MCP catalog, pointing at the published server package.【F:mcp/aidesigner-config.json†L20-L23】【F:bin/aidesigner†L806-L827】
- When enabled, the CLI writes the shadcn `components.json` schema and validates prerequisites, so the helper feeds an actual toolchain rather than a mock.【F:bin/aidesigner†L1513-L1644】

### GitHub integration

- Configured in the default profile and exposed through the MCP install catalog, ensuring projects can provision the official GitHub server directly from the CLI.【F:mcp/aidesigner-config.json†L24-L27】【F:dist/mcp/tools/mcp-registry.js†L15-L55】

### Vibe Check safety gate

- Present in the profile with required environment variables, pointing to the published `vibe-check-mcp-server` package.【F:mcp/aidesigner-config.json†L28-L35】
- Installation guide in the docs outlines the activation workflow; runtime wiring is scheduled but not yet active, so this entry remains in planned status rather than a mock implementation.【F:docs/mcp/vibe-check.md†L1-L43】

### TweakCN theme assistant

- Declared in both default MCP profiles so orchestration can spawn the official server package.【F:mcp/aidesigner-config.json†L1-L28】【F:mcp/quick-designer-config.json†L1-L22】
- Included in the CLI's optional MCP catalog with environment prompts for preview URLs and API tokens, guaranteeing scaffolded projects capture needed credentials.【F:bin/aidesigner†L793-L852】【F:bin/aidesigner†L1528-L1573】
- Verified via the orchestrator registry listing, which now shows the TweakCN server alongside other integrations.【244ff3†L1-L27】
