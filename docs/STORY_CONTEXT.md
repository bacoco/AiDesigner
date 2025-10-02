# Invisible Story Context (V6-Inspired)

BMAD V6 introduced a `story-context` command that prepares developers with just-in-time context packages before they start coding a story. BMAD-Invisible now adopts a lightweight variant that fits our conversational, hidden-phase workflow.

## Core Steps in V6 `story-context`

1. **Select the active story** – The Scrum Master identifies the next story in the epic backlog and captures its metadata (story ID, title, scope, acceptance criteria).
2. **Gather authoritative references** – Pulls the epic, architecture shards, PRD excerpts, linked research, and any implementation decisions tagged to the story.
3. **Summarize prior work** – Surfaces previous story outcomes, open follow-ups, and unresolved bugs that impact the new story.
4. **Highlight constraints & dependencies** – Includes coding standards, integration points, feature flags, and external blockers that the developer must observe.
5. **Deliver a consolidated packet** – Packages the data with persona reminders and validation checkpoints so the development agent can work in isolation with minimal back-and-forth.

These steps ensure V6’s developer agent receives everything needed without manually hunting through documents.

## Lightweight Equivalent for BMAD-Invisible

BMAD-Invisible keeps the same spirit but embraces our invisible orchestration:

- **Context Enrichment Hooks** – New hooks assemble persona and context snippets moments before an agent runs, instead of relying on explicit CLI commands.
- **Dynamic Story Loading** – Story metadata, markdown sections (overview, acceptance criteria, definition of done), and linked resources are extracted on demand.
- **Progressive Merging** – Multiple enrichers can contribute fragments; their outputs are merged, deduplicated, and appended to the agent’s system prompt or user message.
- **Fallback-Safe Design** – If a story is missing fields, the hook gracefully falls back to defaults (recent conversation, core requirements) without blocking execution.
- **Invisible Delivery** – Developers never invoke a command; the orchestrator injects the enriched packet when transitioning into development or review phases.

## What the Invisible Packet Contains

The default enrichers currently supply:

- Persona reminders (user role, persona section, or structured persona attributes).
- Story overview (title, sequence, description/summary, contextual notes).
- Acceptance criteria, definition of done, and testing strategy bullet lists.
- Technical notes and dependency call-outs taken from story markdown or metadata.

Additional enrichers can be registered to append design docs, recent decisions, or external links.

## Implementation Notes

- `lib/bmad-bridge.js` now calls context enrichment hooks before every agent execution, merging the resulting persona fragments into the system prompt and inserting context sections into the user message.【F:lib/bmad-bridge.js†L1-L210】
- Default enrichers live in `hooks/context-enrichment.js`. They parse story files, normalize checklists, and push well-labeled sections into the context payload.【F:hooks/context-enrichment.js†L1-L158】
- Teams can register additional enrichers at runtime (`bmadBridge.registerContextEnricher`) to customize the packet per project lane without modifying the core hook file.【F:lib/bmad-bridge.js†L210-L274】

## Using the Feature

1. Ensure your story metadata is stored in `docs/stories` or passed as `context.story` when invoking agents.
2. Optional: register custom enrichers to inject architecture updates or validation checklists.
3. Run the invisible workflow as normal; when the orchestrator reaches development, the enriched packet is automatically included for the `dev` and `qa` agents.

This approach keeps the workflow silent for end users while achieving parity with V6’s story preparedness philosophy.
