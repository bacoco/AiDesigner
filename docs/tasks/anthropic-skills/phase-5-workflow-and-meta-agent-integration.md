# Phase 5 – Workflow & Meta-Agent Integration Tasks

**Master Plan Reference**: [Anthropic Skills Integration Plan](../../plans/anthropic-skills-integration.md)

## Objectives

- Embed Skill generation and installation into AiDesigner's orchestrated agent workflows.
- Preserve provenance metadata for generated Skills.

## Dependencies

- **Upstream**: Phase 2 (requires authoring pipeline), Phase 4 (optional - for remote publishing)
- **Downstream**: Phase 6 (seed library generation may use workflow integration)

## Task List

- [ ] Identify existing meta-agent workflows in `packages/meta-agents/` and `aidesigner-core/workflows/` that could benefit from Skill generation.
- [ ] Update identified workflows to optionally emit Skill bundles alongside existing artifacts (PRD, architecture docs, user stories).
- [ ] Define workflow hooks or adapters that call the Skill authoring pipeline using context from the active session.
- [ ] Implement post-run automation to install generated Skills into local Claude environments (`~/.claude/skills`) when enabled.
- [ ] Capture provenance metadata (source workflow, input parameters, deliverable references) and inject it into Skill frontmatter fields.
- [ ] Provide user-facing toggles to control whether workflows generate and install Skills automatically.
- [ ] Ensure generated Skills respect access controls and do not leak private data when exported.
- [ ] Add regression tests verifying that workflows can run with and without Skill generation without side effects.

## Deliverables

- Updated workflow definitions in `aidesigner-core/workflows/` and `packages/meta-agents/` highlighting new Skill integration options.
- Orchestrator documentation updates in `docs/core-architecture.md` explaining Skill generation hooks.
- Automated tests and sample transcripts demonstrating Skill generation in action (saved to `docs/examples/workflow-skill-generation/`).

## Workflow Integration Details

Generated Skills can be emitted alongside existing AiDesigner workflow artifacts:
- **Discovery workflows**: Generate Skills capturing discovery patterns and research templates
- **Architecture workflows**: Generate Skills for architecture review and QA processes
- **UI Design workflows**: Generate Skills for design system adherence and validation

## File Locations

- **Workflow Definitions**: `aidesigner-core/workflows/*.yaml`
- **Meta-Agent Orchestrators**: `packages/meta-agents/src/`
- **Workflow Documentation**: `docs/core-architecture.md`
- **Example Transcripts**: `docs/examples/workflow-skill-generation/`
