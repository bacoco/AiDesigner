# Phase 3 – CLI & Tooling Enhancements Tasks

**Master Plan Reference**: [Anthropic Skills Integration Plan](../../plans/anthropic-skills-integration.md)

## Objectives

- Provide command-line surfaces to author, preview, and validate Skills.
- Align automation hooks with existing build and deployment workflows.

## Dependencies

- **Upstream**: Phase 2 (requires authoring pipeline APIs)
- **Downstream**: Phase 5 (workflow integration uses CLI commands), Phase 7 (validation integration)

## Task List

- [ ] Design UX for `aidesigner skills` subcommands (`init`, `generate`, `preview`, `list`, `validate`) including help text and examples, following patterns in `bin/aidesigner`.
- [ ] Implement CLI handlers in `bin/aidesigner` that invoke the Phase 2 authoring module and respect project configuration defaults.
- [ ] Ensure commands integrate with existing authentication flows (API tokens, environment variables) for optional Phase 4 publishing without duplicating logic.
- [ ] Update `.dev/tools/cli.js` to expose non-interactive equivalents for CI and MCP packaging, mirroring structure used for `build`, `build:mcp`, and `validate` commands.
- [ ] Add npm scripts (`skills:generate`, `skills:validate`) to `package.json` and document their usage in `README.md` per CLAUDE.md lines 37-98 conventions.
- [ ] Create unit and integration tests covering command parsing, happy-path execution, and error handling for missing configuration.
- [ ] Provide structured logging hooks consistent with project privacy guidelines (no external telemetry per local-first principle).

## Deliverables

- Updated CLI binary (`bin/aidesigner`) and supporting scripts in `.dev/tools/cli.js` with documentation and automated tests.
- npm scripts added to `package.json` following existing conventions.
- Release notes summarizing new commands and migration considerations for developers (saved to `docs/release-notes/skills-cli-release.md`).

## Build Integration

Per CLAUDE.md lines 54-59 and master plan Phase 3 dependencies:
- Skills validation will integrate with `npm run validate` workflow
- Skills validation included in `npm run pre-release` (runs validate + format:check + lint)
- CLI commands follow existing patterns for consistency

## File Locations

- **CLI Entry Point**: `bin/aidesigner` (primary user-facing CLI)
- **CLI Implementation**: `.dev/tools/cli.js` (automation and non-interactive commands)
- **npm Scripts**: `package.json` lines 37-98
- **Documentation**: `README.md`, `docs/user-guide.md`
