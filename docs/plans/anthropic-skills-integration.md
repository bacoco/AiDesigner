# Anthropic Skills Integration Plan

## Context

- AiDesigner already delivers an end-to-end conversational pipeline from ideation through UI design and into development hand-off, supported by a rich library of tasks, templates, and orchestrated agents.
- Anthropic’s Skills let Claude dynamically load focused folders of instructions, scripts, and assets so specialized workflows can be applied automatically across Claude apps, Claude Code, and the API.
- The Agent Skills design pattern organizes knowledge in `SKILL.md` files with progressive disclosure and optional executable code, aligning well with AiDesigner’s modular artifacts and agent ecosystem.

## Objectives

1. Offer a first-class “Skill Builder” experience that packages AiDesigner playbooks into Anthropic-compliant Skill folders.
2. Let users manage Skill lifecycles (create, validate, publish, version) from the existing CLI, MCP workflows, and API server.
3. Ensure generated Skills stay synchronized with AiDesigner’s project state, meta-agents, and deliverables.

## Phase 0 – Research & Alignment

- [ ] Document the canonical Skill file/folder schema (frontmatter metadata, progressive disclosure strategy, executable tooling requirements) and map it against AiDesigner’s current assets and bridge infrastructure.
- [ ] Audit which AiDesigner tasks, checklists, and templates are highest value to externalize as reusable Skills (e.g., discovery flows, architecture reviews, QA validations).

## Phase 1 – Domain Modeling & Persistence

- [ ] Extend shared types with `SkillDefinition`, `SkillVersion`, and `SkillBundle` interfaces plus validation schemas for SKILL metadata (name, description, triggers, assets).
- [ ] Update `ProjectState` to persist a `.skills` collection (installed Skill IDs, active versions, per-project overrides) alongside existing user preferences and integration metadata.
- [ ] Add configuration flags (e.g., `skills.enabled`, default install path) to the CLI config surface and package metadata so new commands can target predictable directories.

## Phase 2 – Skill Authoring Pipeline

- [ ] Introduce a new `packages/skills` workspace module that can:
  1. Load AiDesigner content (agent YAML, task markdown, deliverables) via `AidesignerBridge`.
  2. Transform it into Skill folder structures with generated `SKILL.md`, referenced artifacts, and optional executable helpers (e.g., code templates, validation scripts).
- [ ] Provide Skill templating utilities (frontmatter builders, markdown sections, asset bundling) plus unit tests to guarantee deterministic output.
- [ ] Implement progressive disclosure heuristics (split long instructions, link supplemental files) so Skills stay context-window friendly per Anthropic guidance.

## Phase 3 – CLI & Tooling Enhancements

- [ ] Add `aidesigner skills` subcommands (e.g., `init`, `generate`, `preview`, `publish`) to the primary CLI entry point for interactive users, reusing existing environment bootstrapping and project state management.
- [ ] Wire equivalent non-interactive commands into `.dev/tools/cli.js` for automation pipelines (CI, MCP packaging), mirroring the structure used for build and MCP commands.
- [ ] Expose npm scripts (`skills:generate`, `skills:publish`) that wrap the new CLI flows to align with the project’s existing script conventions.

## Phase 4 – API & Remote Publishing

- [ ] Create a `SkillService` in `packages/api-server` to list, render, validate, and publish Skills via Anthropic’s `/v1/skills` API, including authentication management and error reporting.
- [ ] Extend REST routes and controllers so external clients (e.g., dashboards, MCP servers) can trigger Skill operations with consistent payloads and receive status callbacks.
- [ ] Implement background jobs or queues for long-running publish tasks (upload assets, poll version status) with retries and logging hooks.

## Phase 5 – Workflow & Meta-Agent Integration

- [ ] Allow meta-agent workflows (Genesis, Librarian, Refactor) to emit Skill bundles as optional artifacts when they complete, so knowledge discovered during runs can be preserved as reusable Skills.
- [ ] Provide orchestrator hooks so generated Skills can be automatically installed into the local Claude environment (e.g., writing to `~/.claude/skills`) or exported for team sharing.
- [ ] Capture trace metadata (origin workflow, inputs, deliverables) in the Skill frontmatter to retain provenance for auditing.

## Phase 6 – Seed Skill Library & Examples

- [ ] Curate an initial catalog of high-impact Skills (Discovery Journey, UI Design System Lock-In, Architecture QA, Agile Story Writer) derived from AiDesigner’s core assets, and bundle them for quick installation.
- [ ] Ship example executables (e.g., spreadsheet validators, presentation generators) where deterministic code is preferred, following Anthropic’s best practices for secure execution.
- [ ] Provide unit/regression tests to ensure each seed Skill renders correctly and all referenced assets resolve.

## Phase 7 – Quality, Security, and Documentation

- [ ] Create Skill linting and validation checks (frontmatter schema, markdown lint, asset existence) and integrate them into `npm run validate` so CI fails fast on malformed Skills.
- [ ] Document Skill workflows (how to generate, edit, publish, and roll back) in the user guide and MCP docs, emphasizing security considerations for executable content.
- [ ] Publish a migration guide that explains how existing Projects can export their accumulated knowledge into Skills for cross-conversation reuse.

## Dependencies & Risks

- **Anthropic API Access** – Requires Code Execution Tool beta and valid credentials; plan integration tests around sandbox environments.
- **Security Review** – Executable Skill assets must undergo security audits before distribution.
- **Backward Compatibility** – Ensure CLI additions and project state extensions remain optional to avoid breaking current workflows.

## Open Questions

- How should enterprise installs manage shared Skill catalogs and version governance?
- Do we auto-sync Skills to MCP servers or leave it as an explicit publish step?
- What telemetry (if any) is needed to measure Skill usage without violating the project’s local-first commitments?
