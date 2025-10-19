# Phase 3 – CLI & Tooling Enhancements Tasks

## Objectives

- Provide command-line surfaces to author, preview, and publish Skills.
- Align automation hooks with existing build and deployment workflows.

## Task List

- [ ] Design UX for `aidesigner skills` subcommands (`init`, `generate`, `preview`, `publish`, `list`) including help text and examples.
- [ ] Implement CLI handlers that invoke the Phase 2 authoring module and respect project configuration defaults.
- [ ] Ensure commands integrate with existing authentication flows (API tokens, environment variables) without duplicating logic.
- [ ] Update `.dev/tools/cli.js` and any automation entrypoints to expose non-interactive equivalents for CI and MCP packaging.
- [ ] Add npm scripts (`skills:generate`, `skills:publish`) and document their usage in `README.md` or developer guides.
- [ ] Create unit and integration tests covering command parsing, happy-path execution, and error handling for missing configuration.
- [ ] Provide telemetry or logging hooks consistent with project privacy guidelines.

## Deliverables

- Updated CLI binary and supporting scripts with documentation and automated tests.
- Release notes summarizing new commands and migration considerations for developers.
