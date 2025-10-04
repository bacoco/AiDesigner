# V6 Module Layout Proof-of-Concept Results

## Summary

- **Objective**: Validate how BMAD-Invisible’s invisible orchestrator assets behave when mounted inside the BMAD V6 alpha module
  architecture.
- **Approach**: Created `src/v6-poc/modules/invisible/module.ts` to mimic a V6 module adapter and run compatibility probes against
  the existing codebase.
- **Outcome**: Identified four critical blockers plus two warnings that must be resolved before a full migration.

## Findings

### Blockers

1. **Missing module registration point**
   - V6 alpha exposes `src/modules/bmm`, `bmb`, and `cis` only. No slot exists for an `invisible` orchestrator module, so assets
     cannot be registered without upstream changes.
2. **CommonJS vs ESM incompatibility**
   - `lib/bmad-bridge.js` exports via CommonJS and depends on `fs-extra`. V6 build graph expects ESM modules and fails to load the
     bridge without shims.
3. **TypeScript ESM import failure**
   - Importing `src/mcp-server/runtime.ts` from an ESM context throws because it compiles to CommonJS paths and performs dynamic
     `require()` calls. V6 modules run under pure ESM loaders, so the orchestrator runtime must be refactored.
4. **Persona asset pipeline missing**
   - `agents/invisible-orchestrator.md` lacks a destination in the V6 module layout. There is no `agents/` asset folder or copy
     task for custom personas.

### Warnings

- **Lazy dependency resolution** – `runOrchestratorServer` loads hooks and utilities at runtime. V6 bundling will eagerly bundle
  modules, so lazy loading strategies need to be adapted or replaced with dependency injection.
- **Directory assumptions** – Deliverable writers and lane selectors assume `docs/` and legacy paths that may move under `bmad/`
  in V6. Need to confirm final artifact locations.

### Notes

- Persona file located successfully in legacy repo, indicating content can migrate once a target directory is defined.
- BMAD bridge API is otherwise complete once module format issues are resolved.

## Next Steps

- Engage upstream V6 owners about introducing an `invisible` module manifest entry.
- Plan a CommonJS→ESM rewrite (or build adapter) for `BMADBridge`, MCP runtime, and supporting hooks.
- Define a persona/deliverable asset pipeline aligned with V6 packaging rules.
- Update migration checklist once blockers are mitigated.

## Legacy Compatibility Snapshot

The current Agilai packages continue to export the legacy `bmad-core/` layout and `npm run bmad*` scripts. Keep these pathways documented for teams that have not migrated yet, but route new automation through `npx agilai` and the modular `agilai/src/modules` structure. Capture any blockers that force reliance on the legacy tree so they can be burned down before deprecating the older assets.
