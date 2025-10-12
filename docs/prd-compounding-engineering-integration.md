---
title: 'Compounding Engineering Integration PRD'
description: 'Product requirements documenting the fully vendored Compounding Engineering planner inside AiDesigner.'
status: 'Executed'
last_updated: '2025-02-14'
---

# Compounding Engineering Integration PRD

## 1. Overview

AiDesigner now bundles the Every Marketplace Compounding Engineering planner directly inside the repository. This PRD defines the
requirements for removing the external dependency, ensuring predictable task decomposition in all environments, and codifying the
verification story so downstream agents can rely on the planner without manual setup.

## 2. Goals

1. Eliminate the need to clone `everymarketplace/compounding-engineering` by shipping the manifest and CLI in `packages/compounding-engineering/`.
2. Provide a deterministic `/create-tasks` implementation that converts feature briefs into multi-lane missions with dependency metadata.
3. Update documentation and tooling to reflect the built-in assets and expose health checks via `npx aidesigner companion-sync`.
4. Capture the integration scope in a living PRD so future contributors understand guarantees, configuration, and validation hooks.

## 3. Success Metrics

| Metric                                 | Target                                       |
| -------------------------------------- | -------------------------------------------- |
| Planner availability in fresh checkout | 100% of installs without extra git commands  |
| Task graph output                      | JSON with ≥4 sequenced missions per request  |
| Companion sync command                 | Reports asset status in <2 seconds locally   |
| Documentation coverage                 | README/plan docs reference vendored workflow |

## 4. Functional Requirements

1. **FR1 – Vendored Assets:** The repository MUST include `packages/compounding-engineering/manifest.json` and
   `packages/compounding-engineering/cli.mjs` with an executable `/create-tasks` command.
2. **FR2 – Planner Output:** Invoking the CLI with a feature brief via STDIN MUST return structured JSON containing tasks, personas,
   dependencies, and plugin metadata to feed the Architect adapter.
3. **FR3 – CLI Health Check:** `npx aidesigner companion-sync` MUST validate that the manifest and CLI exist and report actionable errors if
   files are missing.
4. **FR4 – Documentation:** Integration guides and roadmaps MUST describe the vendored setup, including configuration overrides and
   troubleshooting steps.
5. **FR5 – Configuration:** `packages/meta-agents/config/compounding-engineering.json` MUST point to the vendored assets while supporting
   overrides through `COMPOUNDING_ENGINEERING_ROOT` for testing scenarios.

## 5. Non-Functional Requirements

1. **NFR1 – Deterministic Output:** The CLI SHOULD generate consistent task IDs per brief by using slug-based identifiers.
2. **NFR2 – Node Compatibility:** Implementation MUST use Node.js 20+ built-ins only (no external dependencies) to keep the planner portable.
3. **NFR3 – Observability:** Planner metadata SHOULD include highlights of goals, constraints, and context to aid downstream debugging.
4. **NFR4 – Maintainability:** Documentation and configuration MUST require no manual edits when running in CI or a clean developer machine.

## 6. User Flow

1. Developer runs `npx aidesigner start` (or any workflow).
2. Architect agent invokes the Compounding Engineering adapter.
3. Adapter loads `packages/meta-agents/config/compounding-engineering.json`, resolves the vendored manifest, and executes the CLI.
4. CLI reads the feature brief JSON, emits a four-stage mission plan, and surfaces metadata for dependencies and validation lanes.
5. Adapter normalizes the response and continues orchestration without prompting the user for external repository setup.

## 7. Implementation Notes

- The CLI script should accept `/create-tasks` as the command argument and default to JSON formatting.
- Task generation must include discovery, planning, implementation, and validation lanes with explicit dependency chains.
- Environment variables (`COMPOUNDING_ENGINEERING_API_KEY`, `COMPOUNDING_ENGINEERING_WORKSPACE_ID`) are passed through unchanged for future
  authenticated scenarios.
- CI should eventually add a smoke test that pipes a sample brief into the CLI to guard against regressions.

## 8. Validation Checklist

- [x] Vendored manifest and CLI exist in `packages/compounding-engineering/`.
- [x] `packages/meta-agents/config/compounding-engineering.json` references the vendored paths.
- [x] `npx aidesigner companion-sync` reports the manifest and CLI as present.
- [x] Documentation updated across integration plans and the dedicated integration guide.
- [x] Planner CLI returns a JSON mission plan when provided with a minimal feature brief.

## 9. Rollout & Communication

- Announce the built-in planner in release notes and highlight that no external clone is required.
- Update onboarding materials to remove manual git instructions.
- Encourage contributors to file issues if additional planner commands should be vendored in the future.

## 10. Future Enhancements

- Add regression fixtures mirroring Every Marketplace scenarios to benchmark output quality.
- Parameterize task count or lane focus via flags (e.g., `--lanes discovery,implementation`).
- Emit optional markdown summaries alongside JSON for human-readable previews.
