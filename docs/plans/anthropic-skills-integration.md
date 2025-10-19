# Anthropic Skills Integration Plan

**Integration Plan Reference**: This document provides the master roadmap for integrating Anthropic Skills with AiDesigner. Each phase has a detailed task list document in `docs/tasks/anthropic-skills/`.

## Context

- AiDesigner already delivers an end-to-end conversational pipeline from ideation through UI design and into development hand-off, supported by a rich library of tasks, templates, and orchestrated agents.
- Anthropic's Skills let Claude dynamically load focused folders of instructions, scripts, and assets so specialized workflows can be applied automatically across Claude apps, Claude Code, and the API.
- The Agent Skills design pattern organizes knowledge in `SKILL.md` files with progressive disclosure and optional executable code, aligning well with AiDesigner's modular artifacts and agent ecosystem.

## Objectives

1. Offer a first-class "Skill Builder" experience that packages AiDesigner playbooks into Anthropic-compliant Skill folders.
2. Let users manage Skill lifecycles (create, validate, publish, version) from the existing CLI and MCP workflows.
3. Ensure generated Skills stay synchronized with AiDesigner's project state, meta-agents, and deliverables.
4. Maintain AiDesigner's **local-first, private** commitment while optionally supporting remote Skill publishing for users who opt in.

## Phase 0 – Research & Alignment

**Reference**: [Phase 0 Task List](../tasks/anthropic-skills/phase-0-research-and-alignment.md)

- [ ] Document the canonical Skill file/folder schema (frontmatter metadata, progressive disclosure strategy, executable tooling requirements) and map it against AiDesigner's current assets and bridge infrastructure. ([Anthropic Skills Documentation](https://docs.anthropic.com/en/docs/build-with-claude/skills))
- [ ] Audit which AiDesigner tasks, checklists, and templates are highest value to externalize as reusable Skills (e.g., discovery flows, architecture reviews, QA validations).

**Dependencies**: None (foundation phase)

**Privacy Considerations**: Skills can be generated and used entirely locally without external API calls.

## Phase 1 – Domain Modeling & Persistence

**Reference**: [Phase 1 Task List](../tasks/anthropic-skills/phase-1-domain-modeling-and-persistence.md)

- [ ] Define Skill schemas in YAML format (`aidesigner-core/data/schemas/skill-definition.yaml`) following AiDesigner's **Natural Language First** principle.
- [ ] Create TypeScript validation interfaces in `packages/shared-types/` (tooling layer only) to validate the YAML schemas at build time.
- [ ] Update `ProjectState` to persist a `.skills` collection (installed Skill IDs, active versions, per-project overrides) alongside existing user preferences and integration metadata.
- [ ] Add configuration flags (e.g., `skills.enabled`, default install path) to the CLI config surface and package metadata so new commands can target predictable directories.

**Dependencies**: Phase 0 (research outputs inform schema design)

**Architecture Note**: Per CLAUDE.md line 32, core domain concepts must be defined in YAML/markdown in `aidesigner-core/data/`. TypeScript interfaces exist only in the tooling layer (`packages/`, `.dev/`) for validation.

## Phase 2 – Skill Authoring Pipeline

**Reference**: [Phase 2 Task List](../tasks/anthropic-skills/phase-2-skill-authoring-pipeline.md)

- [ ] Create authoring pipeline tooling in `packages/skills/` (tooling layer) that can:
  1. Load AiDesigner content (agents, tasks, templates from `aidesigner-core/`) via existing loaders.
  2. Transform it into Skill folder structures with generated `SKILL.md`, referenced artifacts, and optional executable helpers.
- [ ] Provide Skill templating utilities (frontmatter builders, markdown sections, asset bundling) plus unit tests to guarantee deterministic output.
- [ ] Implement progressive disclosure heuristics (split long instructions, link supplemental files) so Skills stay context-window friendly per Anthropic guidance.

**Dependencies**: Phase 1 (requires Skill schemas and type definitions)

**MCP Integration Note**: Skills can be generated via MCP server tools (dist/mcp/mcp/server.js) for seamless integration with Claude CLI workflows.

## Phase 3 – CLI & Tooling Enhancements

**Reference**: [Phase 3 Task List](../tasks/anthropic-skills/phase-3-cli-and-tooling-enhancements.md)

- [ ] Add `aidesigner skills` subcommands (e.g., `init`, `generate`, `preview`, `list`) to the primary CLI entry point (`bin/aidesigner`) for interactive users, reusing existing environment bootstrapping and project state management.
- [ ] Wire equivalent non-interactive commands into `.dev/tools/cli.js` for automation pipelines (CI, MCP packaging), mirroring the structure used for `build`, `build:mcp`, and `validate` commands.
- [ ] Expose npm scripts (`skills:generate`, `skills:validate`) that wrap the new CLI flows to align with the project's existing script conventions (see package.json lines 37-98).

**Dependencies**: Phase 2 (requires authoring pipeline APIs)

**Build Integration**: Skills validation will integrate with `npm run validate` and `npm run pre-release` workflows per CLAUDE.md lines 54-59.

## Phase 4 – API & Remote Publishing (Optional)

**Reference**: [Phase 4 Task List](../tasks/anthropic-skills/phase-4-api-and-remote-publishing.md)

- [ ] **OPTIONAL**: Create a `SkillService` in `packages/api-server` to list, render, validate, and publish Skills via Anthropic's `/v1/skills` API, including authentication management and error reporting. ([Anthropic Skills API Documentation](https://docs.anthropic.com/en/api/skills))
- [ ] Extend REST routes and controllers so external clients (e.g., dashboards, MCP servers) can trigger Skill operations with consistent payloads and receive status callbacks.
- [ ] Implement background jobs or queues for long-running publish tasks (upload assets, poll version status) with retries and logging hooks.

**Dependencies**: Phase 2 and Phase 3 (requires local authoring pipeline and CLI commands)

**Privacy & Local-First Commitment**:
- **Core Skill functionality (Phases 0-3, 5-7) operates entirely locally** with no external API calls
- Phase 4 remote publishing is **completely optional** and requires explicit user opt-in
- Users can generate, validate, and use Skills locally without Anthropic API credentials
- Credential storage follows existing patterns in the codebase for secure, encrypted storage

**Credential Management**:
- API keys stored using existing secure credential patterns
- Environment variable support: `ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`
- Local Skills work without any credentials

## Phase 5 – Workflow & Meta-Agent Integration

**Reference**: [Phase 5 Task List](../tasks/anthropic-skills/phase-5-workflow-and-meta-agent-integration.md)

- [ ] Identify existing meta-agent workflows in `packages/meta-agents/` and `aidesigner-core/workflows/` that could emit Skill bundles as optional artifacts when they complete.
- [ ] Provide orchestrator hooks so generated Skills can be automatically installed into the local Claude environment (e.g., writing to `~/.claude/skills`) or exported for team sharing.
- [ ] Capture trace metadata (origin workflow, inputs, deliverables) in the Skill frontmatter to retain provenance for auditing.

**Dependencies**:
- Phase 2 (requires authoring pipeline)
- Phase 4 (optional - for remote publishing after workflow completion)

**Workflow Integration**: Generated Skills can be emitted alongside existing artifacts (PRD, architecture docs, user stories) currently produced by AiDesigner workflows.

## Phase 6 – Seed Skill Library & Examples

**Reference**: [Phase 6 Task List](../tasks/anthropic-skills/phase-6-seed-skill-library-and-examples.md)

- [ ] Curate an initial catalog of high-impact Skills (Discovery Journey, UI Design System Adherence, Architecture QA, Agile Story Writer) derived from AiDesigner's core assets, and bundle them for quick installation.
- [ ] Ship example executables (e.g., spreadsheet validators, presentation generators) where deterministic code is preferred, following Anthropic's best practices for secure execution.
- [ ] Provide unit/regression tests to ensure each seed Skill renders correctly and all referenced assets resolve.

**Dependencies**:
- Phase 0 (candidate Skill prioritization informs selection)
- Phase 2 (requires authoring pipeline to generate bundles)
- Phase 3 (requires CLI for local testing)
- Phase 5 (ensures selected workflows can emit Skill bundles)

**Terminology Note**: "UI Design System Adherence" (formerly "Lock-In") better reflects the goal of enforcing design consistency.

## Phase 7 – Quality, Security, and Documentation

**Reference**: [Phase 7 Task List](../tasks/anthropic-skills/phase-7-quality-security-and-documentation.md)

- [ ] Create Skill linting and validation checks (frontmatter schema, markdown lint, asset existence) and integrate them into `npm run validate` and `npm run pre-release` so CI fails fast on malformed Skills.
- [ ] Document Skill workflows (how to generate, edit, publish, and roll back) in the user guide and MCP docs, emphasizing security considerations for executable content.
- [ ] Publish a migration guide that explains how existing Projects can export their accumulated knowledge into Skills for cross-conversation reuse.

**Dependencies**: Early tasks (validation tooling) can begin in parallel with Phase 2-5; late tasks (comprehensive validation, training materials) require Phase 6 completion.

**Test Strategy**: See comprehensive test coverage section below.

## Test Strategy

### Unit Test Coverage
- **Target**: 80%+ coverage for Skill authoring pipeline (Phase 2)
- **Scope**: Schema validation, transformation logic, frontmatter generation, asset bundling
- **Tools**: Jest (existing test framework per CLAUDE.md line 204-210)

### Integration Tests
- **Phase 2**: Skill generation from sample AiDesigner assets (agents, tasks, templates)
- **Phase 3**: CLI command execution (generate, validate, list)
- **Phase 4** (Optional): Mocked Anthropic API calls for publish/validate endpoints
- **Phase 5**: Workflow integration - verify Skills emitted alongside existing artifacts

### Test Fixtures
- Sample Skills in `docs/examples/skills/` for regression testing
- Golden file tests for deterministic Skill output (Phase 2 deliverable)
- Mock AiDesigner assets (minimal agent, task, template set) for pipeline testing

### CI/CD Integration
- Phase 7 validation checks integrated into `.github/workflows/` CI pipeline
- `npm run pre-release` includes Skill validation (alongside existing format:check, lint)
- Automated tests run on all PRs touching Skill-related code

## Dependencies & Risks

- **Anthropic API Access (Optional)** – Phase 4 remote publishing requires opt-in API credentials; core functionality (Phases 0-3, 5-7) operates entirely locally with no API dependencies.
- **Security Review** – Executable Skill assets must undergo security audits before distribution. Define sandboxing expectations and dependency scanning processes.
- **Backward Compatibility** – Ensure CLI additions and project state extensions remain optional to avoid breaking current workflows.

## Privacy & Local-First Commitment

AiDesigner's core principle (README.md line 132-136) is **local-first, private** operation with no external API calls. The Skills integration maintains this commitment:

- **Local-First**: Phases 0-3, 5-7 operate entirely locally without external services
- **Optional Remote Publishing**: Phase 4 is completely optional and requires explicit user opt-in
- **No Mandatory API Calls**: Users can generate, validate, and use Skills without Anthropic API credentials
- **Data Privacy**: Skill generation processes user data locally; remote publishing only occurs when user explicitly triggers it

## Open Questions

- How should enterprise installs manage shared Skill catalogs and version governance?
- Should Skills auto-install to `~/.claude/skills` after workflow completion, or require explicit user action?
- What telemetry (if any) is acceptable for measuring Skill usage while respecting local-first commitments? (Recommendation: purely local analytics stored in project state, no external reporting)
