# Invisible Review Checkpoints

The invisible orchestrator now enforces three governance gates that run on a fresh reviewer lane. Each checkpoint spins up a clean MCP context via `run_review_checkpoint` so reviewer personas evaluate deliverables without inheriting development chat history.

## Checkpoint Catalog

| Checkpoint ID                | Reviewer Lane                  | Scope                                                                     | Expected Output                                                                                        |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `pm_plan_review`             | `review` (Product Owner)       | Validates PRD, roadmap, and delivery risks after the PM plan is approved. | JSON payload with status (`approve`, `revise`, or `block`), summary, risk list, and follow-up actions. |
| `architecture_design_review` | `review` (Principal Architect) | Audits architecture/system design packages before stories are written.    | Same JSON schema focusing on feasibility and integration risks.                                        |
| `story_scope_review`         | `review` (Senior QA)           | Confirms stories/epics are testable and scoped prior to implementation.   | Same JSON schema with emphasis on acceptance coverage and testability.                                 |

## Running a Review

1. Confirm the user has validated the deliverable for the current phase.
2. Call the MCP tool:
   ```json
   {
     "name": "run_review_checkpoint",
     "arguments": {
       "checkpoint": "architecture_design_review",
       "notes": "User wants to ensure cloud costs stay under $2k/mo."
     }
   }
   ```
3. The MCP server instantiates a dedicated `BMADBridge` wired to the `review` lane. Deliverables from the source phase plus the overall project snapshot are passed as context.
4. The reviewer agent responds with JSON. Results are stored automatically via `ProjectState.recordReviewOutcome()` in `.bmad-invisible/reviews.json` for auditability.
5. If the reviewer returns `revise` or `block`, stay in the current phase, address the findings with the user, and re-run the checkpoint.

## Data Capture

`recordReviewOutcome` stores:

- Checkpoint identifier and source phase
- Reviewer agent and lane used
- Status, summary, and enumerated risks/follow-up actions
- Any additional notes passed to the reviewer
- Raw reviewer payload for traceability

These records surface in future MCP context exports to keep governance decisions visible without exposing the user to BMAD internals.
