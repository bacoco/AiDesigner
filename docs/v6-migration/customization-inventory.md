# Agilai Invisible Critical Customizations

This inventory captures the invisible-first features that must be preserved during any migration to the Agilai V6 module architecture.

## 1. MCP Server (`src/mcp-server`)

### Purpose

- Hosts the invisible orchestration workflow over Model Context Protocol (MCP) so Codex and other clients can interact through stdio.
- Orchestrates tooling exposure, lane routing, and deliverable generation without revealing Agilai internals to the user.

### Key Components

- **`codex-server.ts`**
  - Configurable model routing with default/quick/complex lanes that map to multiple providers/models via environment variables.
  - Approval-mode safety guardrails that gate sensitive operations (auto command execution, deliverable persistence, etc.).
  - Bootstraps the orchestrator runtime with lane-aware LLM clients and logs MCP availability for Codex integration.
- **`runtime.ts`**
- Lazily loads Agilai core services (`ProjectState`, `BMADBridge`, deliverable generator, brownfield analyzer) and hooks modules dynamically.
  - Exposes a rich tool surface (phase detection, lane selection, deliverable generation, workflow execution) via MCP handlers.
  - Implements dual-lane execution (`quick` vs. `complex`) with explicit approval hooks and project state updates.
  - Persists lane decisions, conversation history, and deliverables through shared project state utilities.

### Migration Risks

- V6 restructures modules under `src/modules` with command-first workflows, so the MCP server must be re-wired into the new module registry.
- Dynamic imports rely on existing directory layout (`lib`, `hooks`), which will shift to V6 module packaging.
- Approval hooks and lane tracking assume invisible orchestrator semantics that may not exist in the command-driven V6 runtime.

## 2. BMAD Bridge (`lib/bmad-bridge.js`)

### Purpose

- Provides glue between invisible orchestrator and Agilai core assets (agents, tasks, templates, checklists).
- Ensures agent personas remain discoverable and executable without exposing methodology details to the user.

### Key Capabilities

- Loads agent definitions with YAML front-matter parsing to construct detailed system prompts.
- Wraps `LLMClient` with persona-driven prompts and contextual message building for consistent tone.
- Resolves dependencies (tasks/templates/checklists) with graceful degradation when resources are missing.
- Generates documents from YAML/Markdown templates for downstream deliverable generator.
- Enumerates agents/tasks/templates for discovery features.

### Migration Risks

- V6 relocates agents/tasks/templates into module-scoped directories (e.g., `src/modules/bmm/agents`), breaking current filesystem paths.
- Uses CommonJS and `fs-extra`; V6 modules default to ESM with shared dependency loaders, requiring refactor.
- Persona prompts embed entire agent Markdown files — V6’s hashed artifact protection might prevent direct file inclusion without adapters.

## 3. Invisible Orchestrator Persona (`agents/invisible-orchestrator.md`)

### Purpose

- Defines the invisible-first conversational contract that hides Agilai phases, agents, and jargon from end users.
- Documents mandatory MCP tool usage patterns for brownfield detection, phase transitions, and deliverable generation.

### Critical Behaviors to Preserve

- Immediate brownfield detection routines (`get_codebase_summary`, `scan_codebase`, `detect_existing_docs`, `load_previous_state`).
- Phase detection loop using `detect_phase` after each user interaction with minimum confidence thresholds.
- Dual-lane workflow branching (`quick` vs. `complex`) with mandated user validation checkpoints.
- Persona guardrails forbidding any mention of BMAD internals, phases, or agent terminology.
- Automatic deliverable generation flow with invisible transitions between Analyst→PM→Architect→SM→Dev→QA→PO.

### Migration Risks

- V6 commands expose phase names and agent workflows explicitly; needs an invisibility layer that masks command semantics.
- Tooling references must map to V6 equivalents (e.g., command-driven `cmd plan-project`) without leaking terminology.
- Persona expects MCP tool names that may change in V6; requires compatibility mapping or proxy layer.

## Additional Custom Touchpoints

- **Phase transition hooks (`hooks/phase-transition.js`)** and **context preservation (`hooks/context-preservation.js`)** provide invisible validation logic that current V6 command flow does not implement.
- **Lane selector (`lib/lane-selector.js`)** integrates quick/complex heuristics absent from V6 scale-level routing, requiring adaptation.
- **Auto-command execution (`lib/auto-commands.js`)** is invoked through approval-guarded pathways that V6 must continue to support.

## Summary Checklist for Migration Effort

- [ ] Recreate MCP server entrypoints inside V6 module registration without losing lane routing or approval controls.
- [ ] Provide filesystem abstraction or adapter so `BMADBridge` can resolve agents/templates within V6’s module directories.
- [ ] Reconcile persona tool invocations with V6 command set while maintaining invisible conversational contract.
- [ ] Port supporting hooks (phase transition, context preservation, lane selector, auto commands) into V6 lifecycle.
- [ ] Validate deliverable outputs remain in `docs/` and maintain naming conventions for downstream tooling.

### Legacy Compatibility Notes

Until the V6 refactor ships, maintainers should continue shipping the legacy `.bmad-core/` tree and `npm run bmad*` scripts alongside the new Agilai tooling. Document any custom hooks or environment expectations that rely on those legacy assets so they can be rewritten or replaced before the compatibility layer is eventually removed.
