# Phase 5 – Workflow & Meta-Agent Integration Tasks

## Objectives

- Embed Skill generation and installation into AiDesigner’s orchestrated agent workflows.
- Preserve provenance metadata for generated Skills.

## Task List

- [ ] Update Genesis, Librarian, Refactor, and other meta-agent workflows to optionally emit Skill bundles alongside existing artifacts.
- [ ] Define workflow hooks or adapters that call the Skill authoring pipeline using context from the active session.
- [ ] Implement post-run automation to install generated Skills into local Claude environments (`~/.claude/skills`) when enabled.
- [ ] Capture provenance metadata (source workflow, input parameters, deliverable references) and inject it into Skill frontmatter fields.
- [ ] Provide user-facing toggles to control whether workflows generate and install Skills automatically.
- [ ] Ensure generated Skills respect access controls and do not leak private data when exported.
- [ ] Add regression tests verifying that workflows can run with and without Skill generation without side effects.

## Deliverables

- Updated workflow definitions and orchestrator documentation highlighting new Skill integration options.
- Automated tests and sample transcripts demonstrating Skill generation in action.
