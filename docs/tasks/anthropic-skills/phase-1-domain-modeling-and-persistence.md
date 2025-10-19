# Phase 1 – Domain Modeling & Persistence Tasks

**Master Plan Reference**: [Anthropic Skills Integration Plan](../../plans/anthropic-skills-integration.md)

## Objectives

- Model Skills as first-class entities following AiDesigner's **Natural Language First** principle.
- Prepare configuration surfaces to toggle Skill features per project.

## Dependencies

- **Upstream**: Phase 0 (research outputs inform schema design)
- **Downstream**: Phase 2 (authoring pipeline requires schemas and types)

## Architecture Note

Per CLAUDE.md line 32: **"Natural Language First - Everything is markdown/YAML, no code in core framework. Code exists only in tooling layer."**

- Core domain schemas defined in YAML/markdown in `aidesigner-core/data/`
- TypeScript interfaces in `packages/shared-types/` exist only for validation (tooling layer)

## Task List

- [ ] Define Skill domain schemas in YAML format at `aidesigner-core/data/schemas/skill-definition.yaml`, `skill-version.yaml`, and `skill-bundle.yaml`, ensuring alignment with Anthropic metadata (name, description, triggers, categories, assets).
- [ ] Create TypeScript validation interfaces in `packages/shared-types/src/skills.ts` (tooling layer only) that validate the YAML schemas at build time.
- [ ] Add Zod validators in `packages/validators/src/skill-validators.ts` covering required and optional Skill fields, including semantic version formatting and asset path normalization.
- [ ] Extend `ProjectState` (and related serialization) with a `.skills` collection to capture installed Skill IDs, version pins, and project-specific overrides.
- [ ] Update persistence adapters (filesystem, database, workspace caches) to read/write the new `.skills` data without breaking backward compatibility.
- [ ] Introduce configuration flags such as `skills.enabled`, `skills.defaultInstallPath`, and `skills.publishTargets` across CLI config files and environment variable mappings.
- [ ] Provide migration scripts or guards to populate default Skill-related values for existing projects when the Skills feature is first enabled.

## Deliverables

- YAML schema definitions in `aidesigner-core/data/schemas/` with documentation.
- TypeScript validation interfaces in `packages/shared-types/` with unit tests.
- Project state migration notes and configuration documentation outlining new Skill-related flags (saved to `docs/configuration/skills-configuration.md`).

## File Locations

- **Core Schemas** (Natural Language): `aidesigner-core/data/schemas/skill-*.yaml`
- **Validation Types** (Tooling Layer): `packages/shared-types/src/skills.ts`
- **Validators** (Tooling Layer): `packages/validators/src/skill-validators.ts`
- **Configuration**: CLI config files, environment variables
