# Phase 2 – Skill Authoring Pipeline Tasks

**Master Plan Reference**: [Anthropic Skills Integration Plan](../../plans/anthropic-skills-integration.md)

## Objectives

- Build tooling to generate Anthropic Skill bundles from AiDesigner assets.
- Ensure generated content is deterministic, well-structured, and compliant with context limits.

## Dependencies

- **Upstream**: Phase 1 (requires Skill schemas and type definitions)
- **Downstream**: Phase 3 (CLI requires authoring pipeline APIs), Phase 5 (workflow integration)

## Task List

- [ ] Scaffold a new `packages/skills/` workspace module with build tooling, linting, and test harness aligned to repo standards (see CLAUDE.md for conventions).
- [ ] Implement loaders that pull agent markdown, task markdown, and templates from `aidesigner-core/` directories via existing content loading patterns.
- [ ] Create transformation utilities to assemble Skill folders, generating `SKILL.md`, copying linked assets, and packaging executable helpers when required.
- [ ] Encode progressive disclosure heuristics (section chunking, inline linking, appendix references) to keep instructions within Claude context guidelines per Anthropic best practices.
- [ ] Add deterministic templating helpers (frontmatter builders, markdown sections) with snapshot or golden-file tests to guarantee reproducible output.
- [ ] Provide configuration options for naming conventions, output directories, and asset bundling strategies.
- [ ] Document the authoring workflow with examples for both manual invocation (`npm run skills:generate`) and automated invocation (via MCP tools).

## Deliverables

- Working Skill generation module at `packages/skills/` with automated tests covering transformation logic (target: 80%+ coverage per test strategy).
- Sample Skill output checked into `docs/examples/skills/` for review and regression testing.
- Golden file tests demonstrating deterministic Skill generation from AiDesigner assets.

## MCP Integration

Skills can be generated via MCP server tools (`dist/mcp/mcp/server.js`) for seamless integration with Claude CLI workflows. Add MCP tool definition for Skill generation in Phase 3.

## File Locations

- **Authoring Pipeline** (Tooling Layer): `packages/skills/src/`
- **Loaders**: `packages/skills/src/loaders/`
- **Transformers**: `packages/skills/src/transformers/`
- **Templates**: `packages/skills/src/templates/`
- **Tests**: `packages/skills/test/`
- **Sample Output**: `docs/examples/skills/`
