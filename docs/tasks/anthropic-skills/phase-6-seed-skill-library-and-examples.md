# Phase 6 – Seed Skill Library & Examples Tasks

**Master Plan Reference**: [Anthropic Skills Integration Plan](../../plans/anthropic-skills-integration.md)

## Objectives

- Deliver a curated set of ready-to-install Skills derived from AiDesigner workflows.
- Provide executable examples and tests that prove Skill quality.

## Dependencies

- **Upstream**: Phase 0 (candidate prioritization), Phase 2 (authoring pipeline), Phase 3 (CLI for testing), Phase 5 (workflow integration)
- **Downstream**: Phase 7 (comprehensive validation of seed library)

## Task List

- [ ] Select high-impact workflows (Discovery Journey, UI Design System Adherence, Architecture QA, Agile Story Writer) from Phase 0 prioritization and map their assets to Skill templates.
- [ ] Generate initial Skill bundles using the authoring pipeline and review for instruction quality, progressive disclosure, and asset completeness.
- [ ] Develop optional executable helpers (e.g., spreadsheet validators, presentation generators) where deterministic automation adds value.
- [ ] Create automated tests or validation scripts ensuring each Skill’s assets resolve correctly and no broken references remain.
- [ ] Write usage notes for each Skill, including prerequisites, expected inputs, and typical outputs.
- [ ] Package seed Skills for distribution (compressed archives, npm artifacts, or Git bundles) with version metadata.
- [ ] Coordinate with design and documentation teams to capture screenshots or walkthroughs demonstrating Skill usage.

## Deliverables

- Published seed Skill library stored in `aidesigner-core/skills/` or separate repository with version control.
- Documentation set describing each seed Skill and associated executable helpers (saved to `docs/skills/seed-library-guide.md`).
- Distribution packages (compressed archives, npm artifacts) with semantic versioning.

## Terminology Note

"UI Design System Adherence" (formerly "Lock-In") better reflects the goal of enforcing design consistency without negative connotations.

## Skill Selection Criteria

Based on Phase 0 impact vs. effort scoring:
- **High Impact**: Workflows with broad applicability across projects
- **Reusability**: Patterns that users frequently need
- **Quality**: Well-documented workflows with clear inputs/outputs
- **Completeness**: All required assets available in `aidesigner-core/`

## File Locations

- **Seed Skills**: `aidesigner-core/skills/` (or separate repository)
- **Documentation**: `docs/skills/seed-library-guide.md`
- **Distribution Packages**: `dist/skills/` (generated archives)
- **Usage Examples**: `docs/examples/skills/`
