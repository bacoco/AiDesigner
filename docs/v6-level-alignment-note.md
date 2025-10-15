# V6 Scale-Adaptive Workflow Alignment

## Context

The V6 documentation introduces scale-adaptive workflows that classify engagements from **Level 0 simple minor tasks** to **Level 4 massive enterprise-scale efforts**.【F:later-todo.md†L14-L31】 The invisible orchestrator previously differentiated only between quick and complex lanes, so we mapped these levels onto existing automation and captured remaining gaps.

## Level Mapping Summary

| V6 Level | Invisible Orchestration Handling                                                                                                                                                                                                 | Notes                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Level 0  | Quick lane with new Level 0 classification, skipping heavy PM/Architect phases while staying invisible to the user.【F:agents/invisible-orchestrator.md†L21-L37】【F:.dev/lib/lane-selector.js†L118-L148】                       | Works for trivial fixes and housekeeping tasks.                  |
| Level 1  | Quick lane with confirmation + implementation guidance; keeps planning lightweight while logging the inferred level for downstream tools.【F:agents/invisible-orchestrator.md†L21-L37】【F:.dev/lib/lane-selector.js†L118-L148】 | Ensures slightly broader requests still receive context capture. |
| Level 2  | Complex lane baseline; retains standard Analyst→Dev progression but encourages lean artifacts to avoid overproduction.【F:agents/invisible-orchestrator.md†L29-L37】【F:.dev/lib/lane-selector.js†L149-L170】                    | Matches most focused feature work.                               |
| Level 3  | Complex lane with multi-scope signals; enforces richer architecture/story outputs and extra checkpoints.【F:agents/invisible-orchestrator.md†L33-L37】【F:.dev/lib/lane-selector.js†L149-L170】                                  | Aligns with multi-epic coordination.                             |
| Level 4  | Complex lane with enterprise-scale triggers; requires broader discovery, explicit risk capture, and cross-agent collaboration.【F:agents/invisible-orchestrator.md†L33-L37】【F:.dev/lib/lane-selector.js†L171-L186】            | Designed for large programs and multi-phase engagements.         |

## Gaps & Refactors

- **Source Detail for Levels 1-3**: V6 documentation only specifies Level 0 and Level 4 explicitly; intermediate guidance remains inferred. Capture future clarifications once official definitions are published.【F:later-todo.md†L14-L31】
- **Lane Selector Signal Expansion**: The selector now records `level` and `levelRationale`, but downstream consumers (e.g., MCP analytics, reporting) must be updated to read these fields.
- **Enterprise Safeguards**: Level 4 heuristics rely on high-complexity keywords and context flags. Additional signals (team size, compliance/regulatory requirements) should be incorporated when data becomes available.

## Next Steps

1. Wire the new level metadata into MCP decision logs and dashboards.
2. Revisit heuristics when upstream V6 documentation provides richer Level 1–3 definitions.
3. Extend orchestrator validation prompts to optionally mention multi-team alignment when Level ≥ 3 (without exposing methodology terminology).
