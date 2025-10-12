---
title: 'Final Integration Execution Plan'
status: active
updated: 2025-02-14
contributors: ['gpt-5-codex']
---

# Final Integration Execution Plan

This document consolidates the most recent planning notes for external ecosystem ingestion, Chrome MCP completion, and V6-inspired context injection so the team can execute a single, coherent roadmap.

## Source Documents Reviewed

- [Strategic Integration Plan](strategic-integration-plan.md)
- [External Integration Plan](aidesigner-external-integration-plan.md)
- [Chrome MCP Integration Completion Plan](chrome-mcp-integration-plan.md)
- [JIT Context Injection Integration Plan](jit-context-integration-plan.md)

## Latest Implementation Updates

> **2025-02-14** — External ecosystem groundwork landed.
>
> - Published the source-of-truth manifest at `expansion-packs/external-integrations/manifest.yaml`, capturing ownership, cadence, and ingestion pipelines for Compounding Engine, Awesome UI, SuperDesign, and Vibe Check assets.
> - Introduced the dry-run friendly orchestration command `bin/sync-external-agents` (also available via `npm run sync:external`) to automate cloning/fetching, formatting, and optional validation passes per manifest pipeline.
> - Established structured console and JSON output so MCP inspector agents can surface stale integrations inside planning reviews.

## Delivery Pillars

### 1. External Ecosystem Consolidation

**Goals**

- Normalize guidance from the Every Marketplace compounding engine, Awesome UI component registry, SuperDesign generator, and Vibe Check MCP safety layer into AiDesigner orchestrations.
- Maintain a sustainable import pipeline that preserves separation of knowledge (Markdown/YAML) and execution (MCP servers and tooling).

**Key Outcomes**

1. Fork and audit external repositories, mapping personas, tasks, and workflows into the corresponding AiDesigner directories.
2. Stand up ingestion scripts that keep UI component intelligence (Awesome UI) and generative assets (SuperDesign) synchronized with the orchestrator.
3. Establish governance artifacts (manifests, changelog entries, QA loops) so future updates stay traceable and safe.

**Action Steps**

- Create an `expansion-packs/external-integrations/manifest.yaml` describing upstream sources, sync cadence, and ownership.
- Prototype a CLI task (`bin/sync-external-agents`) that fetches upstream changes, applies formatting, and runs lint/format commands before proposing updates.
- Add checklist items to the MCP inspector meta-agent to validate Vibe Check credentials and highlight stale external artifacts during planning reviews.

### 2. Chrome MCP Production Readiness

**Goals**

- Replace stubbed Chrome MCP interactions with real stdio connections, covering navigation, evaluation, screenshot capture, and availability probing.
- Ensure evidence storage and downstream prompt hydration automatically benefit from freshly scraped tokens and metadata.

**Key Outcomes**

1. Implement a `ChromeMCPClient` wrapper with retry logic and structured error handling.
2. Wire runtime tools (`check_chrome_mcp_available`, `extract_design_tokens_*`) to call the new adapter methods and record fallbacks when needed.
3. Persist Chrome MCP evidence under a deterministic directory structure and surface it to designers, QA, and other agents via documented APIs.

**Action Steps**

- Extend `.dev/src/mcp-server/chrome-mcp-adapter.ts` with real transport code and replace hard-coded availability responses.
- Update CLI install/start scripts to verify the MCP binary launches before extraction begins, guiding users through troubleshooting steps.
- Author automated and manual validation tests, gating releases on adapter regressions and capturing outputs in Epic 3 documentation.

### 3. V6-Aligned Context Injection

**Goals**

- Adopt the V6 just-in-time context injection loop inside the invisible orchestrator so developer prompts include curated story insights.
- Keep injectors modular so future personas (QA, UX) can contribute targeted sections without altering the base orchestrator.

**Key Outcomes**

1. Implement a pluggable injector registry in `aidesignerBridge` that merges structured sections into prompts.
2. Register a developer-specific injector that aggregates story deliverables, orchestrator state, and recent conversations before hand-off.
3. Introduce validation hooks to audit injected context in a clean LLM session, mirroring V6’s bias checks.

**Action Steps**

- Expand project state persistence to store acceptance criteria, decision logs, and references for injector consumption.
- Add prompt builder updates that clearly label injected context and prioritize sections for potential trimming.
- Draft heuristics for token budgeting and fallback summarization when prompts risk exceeding limits.

## Integrated Timeline (6 Weeks)

| Week | Focus                            | Milestones                                                                                                                     |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1    | External repo audit & governance | Fork target repos, publish manifest draft, add MCP inspector checklist updates.                                                |
| 2    | Sync tooling prototype           | Ship `bin/sync-external-agents` dry run, document formatting rules, run first ingestion against Awesome UI sample.             |
| 3    | Chrome MCP adapter foundation    | Land `ChromeMCPClient`, replace availability stubs, validate against local server.                                             |
| 4    | Chrome evidence & QA             | Persist artifacts, update Quick Designer workflows, add automated tests and manual validation checklist updates.               |
| 5    | Context injector scaffolding     | Merge injector registry changes, add developer injector, capture project state expansions.                                     |
| 6    | Validation & rollout             | Execute full end-to-end run (external sync → Chrome extraction → context injection), finalize documentation and release notes. |

## Sprint-Ready Backlog (Next 2 Weeks)

1. Finish the compounding-engineering adapter tests and smoke checks so CI detects missing companion repos early.
2. Implement the initial Awesome UI ingestion script that generates `ui-components.registry.json` and annotate Architect planner tasks with component hints.
3. Draft SuperDesign API client interfaces and configuration docs to unblock orchestration wiring in Phase 2.
4. Build the `ChromeMCPClient` skeleton with connect/call/close lifecycle and swap the availability check to use the real handshake.
5. Add MCP inspector checklist enforcement for Vibe Check credentials, ensuring the safety gate becomes a blocking requirement.

## Governance & Reporting

- Update Epic, architecture, and user guide documentation once each pillar reaches definition of done, highlighting automation and safety gains.
- Record each integration iteration in a shared knowledge base (plan, generated assets, Vibe Check scores) to fuel the compounding feedback loop.
- Publish release notes summarizing milestone completion and align version bumps with the `npm run pre-release` workflow.

This plan unifies the latest strategy discussions into a single execution track so AiDesigner can scale responsibly while expanding its agent ecosystem.
