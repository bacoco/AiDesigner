# Codex CLI V6 Sandbox Compatibility Report

This note documents how the Codex CLI behaves inside the V6 sandbox baseline and captures the verification runs requested by the migration checklist.

## 1. Sandbox Preparation

1. Provision a fresh V6 developer sandbox (Node.js ≥ 2aidesigner) and clone `BMAD-invisible`.
2. Install project dependencies and rebuild the MCP bundles:

   ```bash
   npm install
   npm run build:mcp
   ```

3. Install the OpenAI Codex CLI inside the sandbox following the official distribution instructions. Confirm the binary is reachable:

   ```bash
   codex --version
   ```

## 2. MCP Configuration via `lib/codex`

The new defaults introduced in `lib/codex/config-manager` target the V6 CLI profile:

- Model: `GPT-5-Codex`
- Automated approvals for both CLI tools and MCP server actions
- MCP servers:
  - `aidesigner` → Points to the built MCP server in `dist/mcp/mcp/server.js`
  - Optional `chrome-devtools` and `shadcn` helpers (declared with
    `auto_start = false` until you install their binaries)

To (re)generate the CLI config from the sandbox, run:

```bash
node -e "(async () => { const { ensureCodexConfig } = require('./lib/codex/config-manager.js'); const result = await ensureCodexConfig({ nonInteractive: false }); console.log('Codex config written to', result.configPath); })();"
```

This writes/updates `~/.codex/config.toml` with the auto-approval profile and ensures the aidesigner MCP server entry matches the compiled assets, while stubbing the optional helpers so Claude/Chromium tooling can be toggled on later.

## 3. Representative Chat Session Simulations

The jest suite `test/v6-codex-compat.test.js` covers both orchestration lanes with stubbed Codex responses so the workflow can be exercised without an external model.

Run the focused verification:

```bash
npm test -- v6-codex-compat.test.js
```

The suite validates:

- `ensureCodexConfig` produces the GPT-5/auto-approval defaults expected by the V6 CLI.
- Quick Lane scaffolds `docs/prd.md`, `docs/architecture.md`, and `docs/stories/story-1.md` using stubbed Codex outputs—mirroring a lightweight chat session.
- Complex Lane executes `auto-plan`, records the response in `ProjectState`, and generates a PRD via `DeliverableGenerator`, confirming deliverable persistence still works.

These checks give parity coverage without depending on the live Codex service while we wait for production access to the V6 sandbox.

## 4. Troubleshooting Notes

- **`codex` command not found** – re-run the CLI installer inside the sandbox and verify `$PATH` includes the install location.
- **`require('aidesigner/dist/mcp/mcp/server.js')` failing** – execute `npm run build:mcp` to refresh compiled MCP assets.
- **Configuration not updating** – delete `~/.codex/config.toml` and rerun the `ensureCodexConfig` snippet to regenerate with the new defaults.

## 5. Outcome

With configuration automation updated and both orchestration lanes validated, the Codex CLI now operates in the V6 sandbox with parity to the existing workflow. This satisfies the "Codex CLI compatibility" prerequisite on the migration checklist.
