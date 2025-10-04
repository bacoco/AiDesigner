# BMAD v6 Module Bridge Prototype

## 1. Observed v6 Module Layout

The v6-alpha planning notes confirm that BMAD reorganizes runtime assets into a consolidated `bmad/` directory with `src/core/` and `src/modules/` replacing the legacy `agilai-core/` layout.【F:later-todo.md†L15-L34】【F:later-todo.md†L110-L118】 Each module (e.g., BMM, BMB, CIS) groups its agents and shared resources under the module subtree. This prototype assumes:

- Agents live in `bmad/src/modules/<module>/agents/*.md`
- Shared assets (tasks, templates, checklists, data) live in sibling folders below each module
- Module-level manifests will prefer normalized identifiers that combine module and agent IDs

These assumptions allow us to discover v6 assets without hard-coding the final manifest schema (still evolving during alpha).

## 2. Module Discovery Strategy

The new `V6ModuleLoader` scans `bmad/src/modules/*` and recursively indexes agents, tasks, templates, checklists, and data. It normalizes identifiers, records potential collisions, and exposes list/read helpers that return the owning module, filesystem path, and parsed YAML for agent definitions.【F:lib/v6-module-loader.js†L1-L205】 The loader caches its catalog so the invisible bridge can access v6 resources with the same APIs it uses for the legacy core.

## 3. Bridge Integration

`BMADBridge` now auto-detects whether the legacy `agilai-core/` tree or the new v6 modules are installed. When it finds `bmad/src/modules`, it instantiates the module loader, exposes environment metadata, and routes agent/resource lookups through the v6 indexes while keeping the existing method signatures unchanged.【F:lib/bmad-bridge.js†L1-L451】 Listing helpers (`listAgents`, `listTasks`, `listTemplates`) now return module-qualified identifiers to reflect v6 packaging.【F:lib/bmad-bridge.js†L382-L451】

## 4. Entry-Point Hook

The MCP runtime still calls `BMADBridge` lazily, but it now logs whenever the bridge reports a v6 module environment so operators know the orchestrator bound to the new layout. This keeps the entry point compatible with both directory structures while documenting the detection in the server logs.【F:src/mcp-server/runtime.ts†L100-L138】

## 5. Agent Manifest Prototype

The invisible orchestrator agent advertises a `module` block that mirrors emerging v6 conventions—declaring its package (`bmm`), kind (`orchestrator`), exported agent ID, and a compatibility note explaining that the runtime now resolves v6 assets dynamically.【F:agents/invisible-orchestrator.md†L1-L15】 This gives installers and manifest compilers a predictable hook even while v6 stabilizes.

## 6. Compatibility Notes & Open Risks

- **Assumptions about folder layout**: The loader expects agents/resources under `agents/`, `tasks/`, `templates/`, `checklists/`, and `data` subfolders. If the v6 branch renames or nests these differently, discovery will need schema tweaks.
- **Duplicate identifiers**: Collisions are recorded but not yet resolved automatically; the first match wins. Future work should surface conflicts via telemetry.
- **Resource parity gaps**: Tasks/templates are loaded generically, but v6 may introduce new resource types or metadata (e.g., JSON schemas) that the bridge should expose explicitly.
- **Testing**: No automated tests cover a real v6 tree yet. Once the upstream alpha stabilizes, add fixtures and unit tests to guard the discovery logic.

With these caveats documented, the orchestrator can now boot against either the legacy or v6 layouts without code changes, and follow-up work can focus on tightening schemas once upstream settles.
