---
title: 'Drawbridge Integration PRD'
description: 'Product requirements to fuse Drawbridge visual annotation workflows with AiDesigner automation.'
status: 'In Progress'
author: 'AI Product Team'
revision: '0.2'
---

# Drawbridge Integration PRD

## 1. Executive Summary

AiDesigner teams rely on natural-language orchestration while Drawbridge operators capture high-fidelity visual feedback through annotated screenshots. Today these systems are disconnected, forcing humans to manually transcribe annotations into AiDesigner tasks. This PRD defines the requirements to ingest Drawbridge task artifacts, surface them within AiDesigner workflows, and automate downstream actions. The release will ship phased capabilities spanning ingestion, context distribution, swarm autonomy controls, documentation synchronization, and UX feedback loops.

## 2. Goals & Non-Goals

### Goals

- Convert Drawbridge artifacts (`moat-tasks.md`, `moat-tasks-detail.json`, `/screenshots`) into structured inputs for AiDesigner orchestrations.
- Enrich expansion pack workflows with screenshot-assisted context packs generated from Drawbridge sessions.
- Map Drawbridge processing modes to AiDesigner swarm autonomy controls so operators can tune pace and oversight.
- Auto-compile Drawbridge annotations into AiDesigner PRD templates and architecture docs for traceability.
- Close the loop between user testing feedback captured in Drawbridge and AiDesigner QA/review checklists.

### Non-Goals

- Replacing Drawbridge capture tooling or modifying its Chrome extension UI.
- Building net-new visualization dashboards; integrations surface data within existing AiDesigner interfaces.
- Automating decision making without human approval when Drawbridge tasks contain conflicting directives.

## 3. User Stories

1. **As an invisible orchestrator operator**, I want Drawbridge task bundles ingested automatically so I can route them to the correct specialization lanes without manual copy/paste.
2. **As a creative expansion pack agent**, I need recent screenshots paired with prompts to understand the current UI state when executing revisions.
3. **As a release manager**, I want to select Drawbridge processing modes that mirror the autonomy level for a swarm run.
4. **As a product manager**, I need Drawbridge annotations reflected in our PRD and architecture docs so written requirements stay aligned with visual intent.
5. **As a UX facilitator**, I want demo feedback logged via Drawbridge to propagate into QA gate checklists and CLI review queues.

## 4. Functional Requirements

| ID  | Requirement                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR1 | Implement a `drawbridge-visual-feedback` watcher in `aidesigner-core/tasks` that ingests `moat-tasks.md`, `moat-tasks-detail.json`, and linked screenshots, normalizes selectors, and emits structured task objects for the invisible orchestrator.                  |
| FR2 | Extend orchestrator workflows to add a "Visual Feedback" phase that routes parsed Drawbridge items to the appropriate agent lanes (UI tuning, copy edits, engineering fixes) based on selector metadata.                                                             |
| FR3 | Provide a CLI utility (`tools/drawbridge-context-pack.mjs`) that assembles Drawbridge screenshots with markdown deltas and attaches the bundle as optional context when invoking expansion pack workflows.                                                           |
| FR4 | Expose a workflow parameter `drawbridge_mode` accepting `step`, `batch`, or `yolo`, and align swarm dispatch logic to the selected mode, including human approval checkpoints for `step`, grouped execution for `batch`, and regression-guarded autonomy for `yolo`. |
| FR5 | Build a documentation compiler that maps Drawbridge comments into sections of `docs/prd.md` (or feature-specific PRDs) and architecture templates, including links to screenshots and DOM selectors.                                                                 |
| FR6 | Update QA workflows to pull Drawbridge-sourced feedback into `docs/qa/gates/` checklists and surface a summarized "Drawbridge Review Queue" via `bin/aidesigner review`.                                                                                             |
| FR7 | Store all Drawbridge ingestion and processing metadata within project state so downstream agents can reference original annotations and processing decisions.                                                                                                        |

## 5. Non-Functional Requirements

- **Traceability**: Persist references between Drawbridge task IDs, screenshots, and resulting AiDesigner tasks/commits.
- **Security**: Treat screenshot artifacts as sensitive; respect existing storage policies and avoid embedding raw data in logs.
- **Performance**: Ingestion should process typical Drawbridge batches (≤100 annotations, ≤200MB screenshots) within 60 seconds.
- **Resilience**: When Drawbridge files are malformed or missing, surface actionable errors and allow operators to retry after corrections.
- **Configurability**: Allow projects to opt-in per workflow and override default `drawbridge_mode` without code changes.

## 6. Acceptance Criteria

1. Uploading a Drawbridge export into the watcher queue results in normalized tasks visible to the orchestrator with correct screenshot references.
2. Expansion pack workflows invoked with Drawbridge context packs display the screenshot bundle in agent prompts/logs.
3. Swarm runs respect the selected `drawbridge_mode`, including pauses for human approval in `step` mode and automated guardrails in `yolo` mode.
4. The documentation compiler updates PRD sections with annotated requirement entries linked to Drawbridge screenshots.
5. QA gate checklists automatically include Drawbridge-derived items after a demo session, and `bin/aidesigner review` lists outstanding issues.
6. Project state stores Drawbridge metadata, allowing any agent to retrieve the original annotation set for auditing.

## 7. Launch Plan

### Delivered to Date

- ✅ FR1: `drawbridge-visual-feedback` watcher added to core tasks and referenced in orchestrator workflows.
- ✅ FR2: Greenfield/Brownfield workflows expose a dedicated "Visual Feedback" phase with lane-aware routing.
- ✅ FR3: `tools/drawbridge-context-pack.mjs` CLI utility generates context packs, refreshes docs, and copies screenshots.
- ✅ FR4: Workflow parameter `drawbridge_mode` available across UI/full-stack playbooks.
- ✅ FR5: Documentation compiler updates `docs/prd.md` and `docs/implementation/drawbridge-visual-feedback.md` with annotation data.
- ✅ FR6: QA gate checklist `docs/qa/gates/drawbridge-review.md` and `bin/aidesigner review` surface outstanding feedback.
- ✅ FR7: Project state persistence expanded (`integrations.drawbridge`) with helper retrieval methods.

1. **Phase 0 – Foundations**: Implement ingestion watcher (FR1) and metadata persistence (FR7); deliver CLI tooling skeletons.
2. **Phase 1 – Workflow Integration**: Wire orchestrator phase routing (FR2) and swarm autonomy mapping (FR4); pilot with internal teams.
3. **Phase 2 – Context & Documentation**: Release context pack utility (FR3) and documentation compiler (FR5); update operator guides.
4. **Phase 3 – QA Loop Closure**: Integrate QA checklist updates and CLI review queue (FR6); run end-to-end demo session to validate.
5. **Enablement**: Produce runbooks covering ingestion troubleshooting, autonomy mode selection, and documentation sync procedures.

## 8. Open Questions

- What storage mechanism best handles Drawbridge screenshot retention—reuse existing artifact buckets or establish a dedicated namespace?
- Should Drawbridge ingestion deduplicate annotations across multiple exports automatically, or require operator confirmation?
- How should conflicting annotations (e.g., two comments targeting the same selector with divergent actions) be resolved within orchestrator workflows?

---

_Version 0.1 — Draft PRD for aligning Drawbridge annotations with AiDesigner orchestration._
