## Invisible Orchestrator (Zero-Knowledge Onboarding)

This feature lets a user chat naturally while BMAD’s multi-phase methodology happens **behind the scenes**.

### Why this exists

- Users don’t want to learn methodology terms; they want outcomes.
- We keep BMAD’s phases invisible, but still produce the usual deliverables.

### What got added (plain English)

1. **Agents**
   - `agents/invisible-orchestrator.md` — the one “face” the user talks to.
   - `agents/phase-detector.md` — internal helper that infers which phase is needed next.
2. **Auto-Commands** (one per major phase)
   - **Included**:
     - `commands/auto-analyze.md` (Analyst)
     - `commands/auto-plan.md` (PM)
     - `commands/auto-architect.md` (Architecture)
     - `commands/auto-stories.md` (Scrum Master)
     - `commands/auto-dev.md` (Developer)
     - `commands/auto-qa.md` (QA)
     - `commands/auto-ux.md` (UX)
     - `commands/auto-po.md` (Product Owner)
3. **Hooks**
   - `hooks/phase-transition.js` — safely evaluates and performs phase switches.
   - `hooks/context-preservation.js` — merges requirements/decisions across phases.
4. **MCP Server**
   - `mcp/server.ts` — spec-compliant server exposing tools for project state & deliverables.
5. **Tests & Scripts**
   - Jest unit tests for schema guarantees and phase safety rails.
   - NPM scripts to build and run the MCP server.

### Quick start

```bash
npm install
npm run build:mcp
npm test
npm run mcp
```

### Architectural flow (high-level)

```
User message
  → agents/invisible-orchestrator.md
    → agents/phase-detector.md (internal only)
      → hooks/phase-transition.js (if phase change)
        → commands/auto-*.md (runs the right phase invisibly)
        → mcp/server.ts (persist state, generate deliverables)
```

### Security & UX guardrails

- Never reveal BMAD/agent jargon to the user.
- Confidence threshold before switching phases.
- Input schemas validated in MCP tools.

### References to source artifacts in this PR

- Original concept & prompts (your uploaded work): invisible orchestrator, phase detector, MCP tools, and hooks. See those ideas reflected here with production-safe code paths.

### Targeted epic specs & story workflow

- `lib/deliverable-generator.js` now emits a dedicated spec bundle whenever the architect lane supplies `epicData.spec`.
  - Machine-consumable JSON → `docs/epics/epic-<n>-<slug>.spec.json`
  - Human-readable summary → `docs/epics/epic-<n>-<slug>.spec.md`
- Story generation automatically loads the matching spec for the epic and injects an **Epic Spec Context** block into `docs/stories/story-<epic>-<story>-*.md`.
- Use `cmd tech-spec` (Architect) followed by `cmd auto-stories` to refresh the per-epic spec before creating the next story. Only the next incomplete epic is targeted, keeping backlog focus tight.
