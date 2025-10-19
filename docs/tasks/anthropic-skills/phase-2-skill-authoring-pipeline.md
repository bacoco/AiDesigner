# Phase 2 – Skill Authoring Pipeline Tasks

## Objectives

- Build tooling to generate Anthropic Skill bundles from AiDesigner assets.
- Ensure generated content is deterministic, well-structured, and compliant with context limits.

## Task List

- [ ] Scaffold a new `packages/skills` workspace module with build tooling, linting, and test harness aligned to repo standards.
- [ ] Implement loaders that pull agent YAML, task markdown, templates, and deliverables via `AidesignerBridge` or equivalent APIs.
- [ ] Create transformation utilities to assemble Skill folders, generating `SKILL.md`, copying linked assets, and packaging executable helpers when required.
- [ ] Encode progressive disclosure heuristics (section chunking, inline linking, appendix references) to keep instructions within Claude context guidelines.
- [ ] Add deterministic templating helpers (frontmatter builders, markdown sections) with snapshot or golden-file tests.
- [ ] Provide configuration options for naming conventions, output directories, and asset bundling strategies.
- [ ] Document the authoring workflow with examples for both manual and automated invocation.

## Deliverables

- Working Skill generation module with automated tests covering transformation logic.
- Sample Skill output checked into `docs/examples` or similar for review.
