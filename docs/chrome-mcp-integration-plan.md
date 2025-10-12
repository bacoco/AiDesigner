# Chrome MCP Integration Completion Plan

## Objective
Deliver a production-ready Chrome MCP-powered design extraction loop that works end-to-end in the AiDesigner CLI, including live availability checks, token extraction from real web pages, evidence storage, and prompt hydration.

## Current Gaps
- The adapter still stubs out the actual MCP call path: `executeChromeMCP()` returns simulated palettes instead of talking to the Chrome DevTools MCP server, and `checkAvailability()` hard-codes `true`, so runtime checks always succeed even when the server is missing.【F:.dev/src/mcp-server/chrome-mcp-adapter.ts†L181-L220】【F:.dev/src/mcp-server/chrome-mcp-adapter.ts†L405-L415】
- Epic 3 documentation flags that real Chrome MCP end-to-end testing, fallback validation, evidence storage checks, and prompt hydration remain unfinished.【F:docs/EPIC3_CHROME_MCP_IMPLEMENTATION.md†L156-L207】
- The 2025-10-06 implementation status likewise lists manual validation steps for Chrome MCP availability, extraction, evidence persistence, and fallback as unchecked, confirming the feature is not yet exercised in the CLI.【F:docs/implementation/IMPLEMENTATION_STATUS_2025-10-06.md†L146-L162】

## Workstream 1 — Production Chrome MCP Adapter
1. **Introduce transport & client wrapper**
   - Add a `ChromeMCPClient` module that wraps `@modelcontextprotocol/sdk` stdio client transport for `chrome-devtools-mcp`.
   - Support configurable command/args/env via existing MCP config manager so users can point at custom binaries or remote transports.
   - Implement connection lifecycle (`connect()`, `callTool()`, `close()`) with retry/backoff aligned to adapter `retryAttempts`.
2. **Implement real extraction pipeline**
   - Replace `executeChromeMCP()` with calls to Chrome MCP tools: navigate to URL, run the `evaluate` script for token scraping, capture DOM/CSS artifacts, and download assets as needed.
   - Normalize tool results into the existing `DesignSpec` structure and propagate Chrome MCP metadata (page title, viewport, timestamp, selectors inspected).
   - Surface structured errors (timeout, navigation failure, security error) so the runtime can branch to fallbacks gracefully.
3. **Screenshot & element capture**
   - Implement `extractFromScreenshot()` using Chrome MCP screenshot tooling (e.g., `page_capture_screenshot`) and pipe the image through the existing analysis utilities or a lightweight vision pipeline.
   - Store derived evidence artifacts alongside URL captures for parity with the docs workflow.
4. **Availability probing**
   - Replace `checkAvailability()` with a handshake that lists Chrome MCP tools and validates required capabilities (navigate, evaluate, screenshot) before marking the server as ready.
   - Cache results per session but invalidate on connection failure so repeated CLI runs re-check availability.

## Workstream 2 — Runtime Integration & Fallbacks
1. **Wire adapter into runtime handlers**
   - Update `.dev/src/mcp-server/runtime.ts` / `runtime-v4.ts` tools (`check_chrome_mcp_available`, `extract_design_tokens_from_url`, `extract_design_tokens_from_screenshot`) to call the new adapter methods instead of stubs.
   - Ensure tool responses include structured success/failure payloads plus human-readable messages for the LLM.
2. **Graceful fallback pathways**
   - On adapter errors, trigger the documented fallback flow: recommend manual token capture, mark confidence as low, and ensure prompts flag the inference source.
   - Record fallback invocations in telemetry logs (or CLI output) for troubleshooting.
3. **Configuration UX**
   - Extend `aidesigner mcp install chrome-devtools` to verify the binary launches and optionally auto-start it (or document manual start) before extraction begins.
   - Update `quick-designer` scripts to detect missing Chrome MCP and prompt installation.

## Workstream 3 — Evidence Storage & Prompt Hydration
1. **Persist evidence artifacts**
   - Save raw Chrome MCP outputs (JSON dumps, screenshots) under `docs/ui/chrome-mcp/` with deterministic naming for reuse.
   - Maintain or update the manifest referenced in Epic 3 so downstream tasks can locate evidence.
2. **Hydrate design prompts**
   - Ensure the visual prompt generator reads freshly stored tokens and attaches `confidenceNotes` reflecting whether data came from Chrome MCP or fallback defaults.
   - Backfill any missing wiring so Quick Designer variations automatically pull the stored evidence.
3. **Cross-agent reuse**
   - Expose an API for other agents (e.g., implementation QA) to fetch Chrome MCP evidence, enabling the “Chrome MCP Debug Loop” described in the strategy pack.

## Workstream 4 — Testing & Validation
1. **Automated tests**
   - Add integration tests that spin up a local chrome-devtools-mcp instance (headless) and validate navigate/evaluate flows against a fixture site.
   - Add unit tests covering adapter error handling, retry logic, and fallback conversions.
2. **Manual validation checklist**
   - Execute the outstanding manual checks from `IMPLEMENTATION_STATUS_2025-10-06.md`, updating the doc with results.
   - Perform end-to-end CLI smoke tests: start conversation → provide URL → verify evidence stored → generate prompts referencing evidence.
3. **CI gating**
   - Introduce a CI job that conditionally runs Chrome MCP tests (skip when Chrome not available) but blocks releases if the adapter regressions are detected.

## Workstream 5 — Documentation & Developer Enablement
1. **Update developer docs**
   - Refresh Epic 3 and Quick Designer docs to remove “stub” language and describe the real connection setup, including troubleshooting steps for Chrome MCP failures.
   - Document prerequisites (Chrome installation, DevTools protocol permissions) and how to run the MCP server in different environments.
2. **User guidance**
   - Provide a short guide for designers on how evidence appears in the workspace and how to re-run extraction if the inspiration site changes.
3. **Change management**
   - Announce the completion via CHANGELOG and align release notes with the new capabilities.

## Dependencies & Risks
- Requires Chrome browser availability on developer machines or CI runners; define fallback virtualization (e.g., using Chrome for Testing) to keep tests deterministic.
- Chrome MCP server is still evolving; pin to a tested version and monitor upstream API changes.
- Ensure secure handling of URLs and data captured from protected domains; update MCP security policies accordingly.

## Definition of Done
- Adapter methods exercise real Chrome MCP calls without simulation in normal runs.
- CLI workflows pass all outstanding manual checks and automated tests, producing persisted evidence and hydrated prompts by default.
- Documentation reflects the real behavior, and release notes announce Chrome MCP support as generally available.
