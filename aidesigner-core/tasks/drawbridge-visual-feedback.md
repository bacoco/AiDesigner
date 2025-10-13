<!-- Powered by BMAD™ Core -->

# drawbridge-visual-feedback

Normalize Drawbridge exports into orchestrator-ready tasks, distribute screenshot context packs, and update project state metadata for visual feedback routing.

## Purpose

Provide a watcher lane that ingests Drawbridge session bundles (`moat-tasks.md`, `moat-tasks-detail.json`, and `/screenshots`), maps annotations to selectors, and emits structured tasks for downstream agents (UI tuning, copy edits, engineering fixes).

## Trigger

- A Drawbridge export folder is dropped into the project's intake directory or referenced explicitly during a swarm run.
- Operator supplies desired `drawbridge_mode` (`step`, `batch`, or `yolo`).

## Inputs

- `moat-tasks-detail.json` – canonical Drawbridge task metadata.
- `moat-tasks.md` – markdown deltas with reviewer commentary.
- `/screenshots` – annotated visual captures.
- Optional: CLI flag `--pack-id` when reprocessing existing bundles.

## Watcher Steps

1. **Validate export completeness**
   - Confirm presence of `moat-tasks-detail.json` or `moat-tasks.md`.
   - Warn if `/screenshots` is missing; continue but mark tasks as `no-screenshot`.

2. **Generate context pack**
   - Run `node tools/drawbridge-context-pack.mjs --input <export-path> --mode <drawbridge_mode>`.
   - Script outputs `.aidesigner/drawbridge/context-packs/<pack-id>/pack.json` with normalized tasks and copies screenshots into the pack directory.
   - Project state automatically records ingestion metadata (`integrations.drawbridge`).

3. **Annotate orchestrator state**
   - Update lane routing hints using project state:
     - `copy-edit` for text changes (`innerText`, `aria-label`).
     - `ui-tuning` for CSS/layout selectors.
     - `engineering-fix` for behavioral selectors (`data-testid`, event handlers).
   - Persist `drawbridge_mode` to `integrations.drawbridge.lastMode` for swarm coordination.

4. **Emit task objects**
   - For each normalized item, emit an orchestrator task payload:
     ```yaml
     task:
       id: <drawbridge-task-id>
       summary: <one-line synopsis>
       lane: <copy-edit|ui-tuning|engineering-fix>
       selectors: [<css|aria|test selectors>]
       screenshot: <relative path to pack screenshot>
       markdown_excerpt: <trimmed comment block>
       status: pending
       source:
         pack_id: <pack-id>
         mode: <drawbridge_mode>
     ```
   - Attach pack-relative screenshot paths for UI agents; fallback to markdown excerpt when image missing.

5. **Update docs**
   - Script injects/refreshes the `<!-- DRAWBRIDGE_FEEDBACK_START -->` section in `docs/prd.md`.
   - Generates `docs/implementation/drawbridge-visual-feedback.md` mapping selectors to lanes and actions.

6. **Surface QA follow-up**
   - Append pending items into `docs/qa/gates/drawbridge-review.md` (see QA checklist) before PO/QA review sessions.
   - Ensure `bin/aidesigner review` reflects identical queue counts.

## Outputs

- Context pack JSON + screenshot bundle in `.aidesigner/drawbridge/context-packs/`.
- Project state ingestion record with stats, docs, and mode selection.
- Updated `docs/prd.md` Drawbridge section.
- Updated `docs/implementation/drawbridge-visual-feedback.md`.
- Fresh entries appended to QA gate checklist.

## Failure Recovery

- Missing JSON/markdown → raise actionable error and do not mark ingestion as complete.
- Screenshot copy failure → continue without image, flag `screenshot: null` in task metadata.
- Project state write failure → abort run and prompt operator to re-run once storage permissions are fixed.

## Handoff Notes

- Subsequent agents fetch drawbridge metadata via project state helper `getDrawbridgeReviewQueue()`.
- Expansion pack workflows can attach the latest `pack.json` contents as optional context for creative tasks.
- Maintain audit trail by referencing `pack_id` in commit messages when resolving feedback.
