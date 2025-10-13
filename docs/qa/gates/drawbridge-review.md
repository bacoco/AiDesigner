# Drawbridge Review Gate

Use this checklist when Drawbridge annotations are ingested to ensure visual feedback is triaged before release.

## Gate Criteria

- [ ] `tools/drawbridge-context-pack.mjs` executed with latest export and success confirmed.
- [ ] `docs/prd.md` Drawbridge section updated (verify markers refreshed).
- [ ] `docs/implementation/drawbridge-visual-feedback.md` regenerated with current tasks.
- [ ] `bin/aidesigner review` run and queue reviewed by PO/QA.
- [ ] Outstanding items assigned to appropriate lane (UI tuning, copy edit, engineering fix).
- [ ] Screenshots accessible from context pack location (no broken paths).
- [ ] Project state (`.aidesigner/state.json`) reflects ingestion metadata (pack id, mode, stats).

## Review Notes

- Capture decisions or deferrals here for auditability.
- Link follow-up stories or tasks that resolve each Drawbridge annotation.
