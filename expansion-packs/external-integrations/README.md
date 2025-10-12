# External Integration Workspace

This directory houses configuration and working directories for mirroring external ecosystems into AiDesigner.

- `manifest.yaml` — Source-of-truth manifest that drives `bin/sync-external-agents` and associated tooling.
- `sources/` — Git mirrors or exported artifacts for each upstream integration (ignored from version control).
- `generated/` — Derived registries and manifests produced by ingestion scripts (ignored from version control).

## Tooling

Custom ingestion utilities live under `.dev/tools/external` and are referenced from the manifest pipelines:

- `normalize-compounding-engine.js` — Aggregates personas, workflows, and policies into a consumable registry.
- `build-awesome-ui-registry.js` — Synthesises component metadata for architect planner hints.
- `export-superdesign-manifest.js` — Produces recipe/prompt/asset manifests for the SuperDesign generator.
- `validate-vibe-check-credentials.js` — Audits Vibe Check credential metadata and enforces safety gating.

Run `npm run sync:external -- --execute` to execute the full pipeline once repositories are cloned into `sources/`.
