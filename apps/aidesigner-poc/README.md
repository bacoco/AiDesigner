# AiDesigner POC — UI Design Phase Implementation

## Context

This POC demonstrates the **UI Design Phase (Phase 2)** of the complete AiDesigner workflow:

**Complete Journey:**

1. Idea & Discovery
2. **UI Design** ← This POC
3. Agile Implementation

**What this POC does:**

- Extracts design tokens from inspiration URLs via Chrome MCP
- Infers component patterns and design system
- Generates React code with design-locked tokens
- Produces validation reports for design consistency

**How it fits:**

- Used during conversational UI design sessions
- Token extraction when user shares inspiration
- Evidence packs inform PRD and architecture generation
- Not a standalone tool - part of larger workflow

See [docs/COMPLETE-WORKFLOW.md](../../docs/COMPLETE-WORKFLOW.md) for the full journey.

## Prerequisites

- Node 18+
- Chrome DevTools MCP server running
- Dependencies (see below)

## Dependencies

```json
{
  "dependencies": {
    "ts-morph": "^21.0.0",
    "jscodeshift": "^0.15.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2"
  }
}
```

## Run

```bash
pnpm -w install
pnpm -w --filter aidesigner-poc dev https://stripe.com
```

Outputs:

- `out/<ts>/evidence/*` (DOM/CSS/console snapshots)
- `out/<ts>/data/tokens.json`, `components.map.json`
- `out/<ts>/generated/shadcn-app/src/app/page.tsx`
- `out/<ts>/reports/drift.json`

## Data Lifecycle Management

Evidence packs can grow large. Recommended practices:

- **Size limits**: Cap evidence packs at 100MB per analysis
- **Cleanup**: Auto-delete evidence older than 30 days
- **Storage**: Use `.gitignore` for `out/` directory
- **Archiving**: Compress and archive significant evidence packs for audit trails
