---
title: Strategic Integration Plan
status: draft
updated: 2024-07-05
contributors: ['gpt-5-codex']
---

# Strategic Integration Plan for External Agent Ecosystem Inputs

## Purpose

This document proposes a concrete roadmap for leveraging external agent repositories and integrating the `vibe-check-mcp-server` MCP within the AiDesigner ecosystem. The goal is to transform the recommendations spread across the `agents/` directory into a cohesive implementation program that dramatically expands the framework's capabilities.

## Context Recap

- The `agents/` directory already defines a multi-layer agent orchestration model (meta-agents, developer agents, QA agents, MCP inspector).
- The AiDesigner architecture separates _knowledge_ (Markdown/YAML) from _execution logic_ (tooling/MCP servers).
- Existing MCP integration (`quick-designer`) demonstrates how a standalone MCP server can be wired into both CLI and orchestrator flows via configuration JSON files.

Any external integration must therefore:

1. Preserve the separation of concerns—new knowledge flows into `aidesigner-core`/`agents`, executable components live in MCP servers.
2. Expose capabilities through the MCP inspector pipeline so that every meta-agent can discover and utilize them automatically.
3. Ship with validation and QA loops aligned with the orchestrator and QA meta-agent definitions.

## Phase 1 – Assess and Fork the Target Repository

1. **Audit the external repository**
   - Catalogue its components (agents, workflows, datasets, tool wrappers).
   - Identify overlap or gaps relative to current AiDesigner meta-agents.
   - Document any licensing or dependency implications.
2. **Decide integration shape**
   - _Expansion Pack_: mirror the structure under `expansion-packs/` for domain-specific capabilities.
   - _Core Augmentation_: if it improves orchestrator logic or reusable tasks, fork and adapt content into `aidesigner-core/`.
   - _Tooling Asset_: if it mainly provides executable utilities, wrap them as an MCP server similar to Quick Designer.
3. **Create a maintained fork**
   - Establish a dedicated branch in the fork for AiDesigner-specific adaptations.
   - Set up CI mirroring AiDesigner’s lint/format requirements to ensure consistency before syncing changes downstream.

## Phase 2 – Map External Recommendations to AiDesigner Agents

1. **Meta-Agent Alignment**
   - Translate high-level orchestration strategies into updates to the relevant meta-agent Markdown files (e.g., augment `meta-agent-orchestrator.md` with new coordination patterns).
   - Where the external repo defines new personas, capture them as new meta-agents or developer agents with YAML frontmatter for dependency declarations.
2. **Reusable Task Extraction**
   - Promote concrete, repeatable instructions into `aidesigner-core/tasks/`.
   - Link them via `dependencies.tasks` in the affected agent definitions to keep orchestration modular.
3. **Workflow Synthesis**
   - Build composite workflows in `aidesigner-core/workflows/` that reflect the recommended sequences (planning → implementation → validation), ensuring compatibility with existing CLI invocations.
4. **Knowledge Base Updates**
   - Expand `aidesigner-core/checklists/` and `data/` resources to capture decision matrices, heuristics, or evaluation rubrics gleaned from the external repository.

## Phase 3 – Implementation Mechanics

1. **Repository Synchronisation**
   - Use Git submodules or a periodic content import script (e.g., `bin/sync-external-agents`) to pull updates from the fork while preserving AiDesigner-specific modifications.
   - Maintain mapping metadata (manifest file) documenting source paths and transformation rules.
2. **Automated Translation Pipeline**
   - Create a CLI command that:
     - Fetches upstream updates.
     - Applies templating or formatting conversions (YAML frontmatter, Markdown style).
     - Runs `npm run format` and `npm run lint:fix`.
     - Emits a changelog fragment for `CHANGELOG.md` summarising imported improvements.
3. **Observability Hooks**
   - Extend QA workflows to include regression checks validating that imported agents execute correctly against sample prompts.
   - Capture metrics (execution time, success/failure rate) and surface them to the orchestrator via the QA meta-agent reports.

## Phase 4 – Integrating `vibe-check-mcp-server`

1. **Repository Evaluation**
   - Review the README and source to understand available endpoints, authentication, and data contracts.
   - Identify dependencies (Node, Python, etc.) and align with AiDesigner’s build system.
2. **Server Packaging**
   - Mirror the existing MCP build pipeline:
     - Add the server under `mcp/` (e.g., `mcp/vibe-check/` for TypeScript/JavaScript sources).
     - Update `package.json` with build scripts (`build:vibe-check`, `start:vibe-check`).
     - Extend `npm run build:mcp` to include the new server.
3. **Configuration Exposure**
   - Register the MCP in `quick-designer-mcp-config.json` (or a dedicated config) with command/args pointing to the compiled server.
   - Update the MCP inspector documentation to mention the new toolset.
4. **Agent Consumption Plan**
   - Define a specialist agent (e.g., `vibe-quality-analyst.md`) that depends on the new MCP for sentiment/context validation.
   - Update meta-agents to call this specialist when emotional tone or UX feedback is required.
5. **Testing and QA**
   - Add integration tests invoking the MCP server through the CLI to ensure deterministic responses.
   - Document fallback behaviours when the MCP is unavailable (graceful degradation via orchestrator instructions).

## Phase 5 – Governance and Continuous Improvement

- **Change Management:** Establish a governance document describing criteria for importing future updates from the fork.
- **Documentation:** For every integration, update `docs/user-guide.md` and `docs/architecture.md` to reflect new capabilities.
- **Feedback Loop:** Use QA agents to gather post-integration learnings, feeding refinements back into the fork and AiDesigner core.
- **Release Cadence:** Align integration releases with `npm run pre-release` and `npm run version:patch` to maintain version hygiene.

## Next Actions Checklist

1. Perform an offline review of the target repository (blocked in this environment—requires external network access).
2. Draft mapping tables between external agents and AiDesigner personas.
3. Prototype the import automation script in `bin/` with dry-run support.
4. Scaffold the `vibe-check` MCP server directory and stubs pending documentation review.
5. Plan updates to QA workflows to account for the new sentiment analysis capability.

Completing these steps will enable AiDesigner to ingest rich external recommendations while remaining faithful to its orchestrated, tool-driven architecture.
