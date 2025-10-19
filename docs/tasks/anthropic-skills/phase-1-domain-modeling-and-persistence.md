# Phase 1 – Domain Modeling & Persistence Tasks

## Objectives

- Model Skills as first-class entities in shared types and persistence layers.
- Prepare configuration surfaces to toggle Skill features per project.

## Task List

- [ ] Draft TypeScript interfaces for `SkillDefinition`, `SkillVersion`, and `SkillBundle`, ensuring alignment with Anthropic metadata (name, description, triggers, categories, assets).
- [ ] Add Zod or JSON schema validators covering required and optional Skill fields, including semantic version formatting and asset path normalization.
- [ ] Extend `ProjectState` (and related serialization) with a `.skills` collection to capture installed Skill IDs, version pins, and project-specific overrides.
- [ ] Update persistence adapters (filesystem, database, workspace caches) to read/write the new `.skills` data without breaking backward compatibility.
- [ ] Introduce configuration flags such as `skills.enabled`, `skills.defaultInstallPath`, and `skills.publishTargets` across CLI config files and environment variable mappings.
- [ ] Provide migration scripts or guards that populate default values for existing projects when Skills are disabled.

## Deliverables

- Updated shared type definitions and validation schemas committed with unit tests.
- Project state migration notes and configuration documentation outlining new Skill-related flags.
