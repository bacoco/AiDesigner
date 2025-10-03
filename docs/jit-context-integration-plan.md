# JIT Context Injection Integration Plan

## V6 Story Context Recap

- V6 introduces a "story-context" command that generates just-in-time developer context immediately after the scrum master drafts a story, prior to the developer execution step.【F:later-todo.md†L86-L109】
- The V6 flow replaces always-on context files with targeted expertise injections (for example, attaching a specialist persona for UI work) so the developer prompt is purpose-built for the current story.【F:later-todo.md†L42-L56】
- Fresh context validation tasks optionally run in clean windows to confirm that the generated context is bias-free before coding begins.【F:later-todo.md†L58-L70】

## Invisible Orchestrator Adaptation Strategy

1. **Context Injector Pipeline**
   - Extend `BMADBridge` with a pluggable context injector registry so runtime components can contribute targeted sections before a prompt is sent to any agent.
   - Each injector receives the agent id and current execution context and can return structured sections (`title`, `body`, `priority`) that are merged into the user message for the LLM.【F:lib/bmad-bridge.js†L12-L23】【F:lib/bmad-bridge.js†L101-L171】

2. **Developer Story Context Injector**
   - Register a developer-specific injector from the MCP runtime after the bridge initializes. The injector aggregates:
     - The latest story deliverable authored by the scrum master (`docs/` output captured in project state).
     - Consolidated requirements, decisions, and next steps tracked by the orchestrator state store.
     - Recent user/assistant conversation snippets for situational awareness.【F:src/mcp-server/runtime.ts†L9-L124】【F:src/mcp-server/runtime.ts†L214-L250】
   - Sections are prioritized (high/medium/low) so future heuristics can decide ordering or trimming if the prompt needs to shrink.

3. **Prompt Assembly Changes**
   - Updated prompt builder appends an explicit "Targeted Context Injection" section, mirroring V6’s practice of handing the developer a curated packet directly inside the LLM conversation.【F:lib/bmad-bridge.js†L76-L115】

4. **Extensibility Hooks**
   - Runtime keeps injector registration idempotent, enabling future additions (e.g., QA, UX) without duplicate sections.
   - Bridge exposes methods to register or clear injectors, letting other subsystems (phase hooks, CLI) compose their own V6-inspired context packages.【F:lib/bmad-bridge.js†L117-L171】

## Next Steps

- Expand project state to persist structured story context (e.g., acceptance criteria, reference links) so injectors can output richer sections.
- Introduce validation hooks similar to V6’s `validate-story-context` command by running injectors inside a clean LLM session for audit trails.
- Evaluate model token budgets once additional sections are enabled and add heuristics for trimming or summarizing when necessary.
