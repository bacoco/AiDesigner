# V6 Phase Progression vs. Dual-Lane Workflows

## Source Phases

V6 alpha defines three primary phases prior to its forthcoming enterprise additions: **Analysis**, **Planning**, and an iterative **Development Cycle** that repeats per epic.【F:later-todo.md†L73-L114】 These phases emphasize explicit command-driven transitions and validation checkpoints.【F:later-todo.md†L73-L114】

## Quick Lane Mapping

Quick fixes and narrowly scoped requests align with a reduced V6 progression:

1. **Analysis (Lite Variant)** – confirm the intent, dependencies, and acceptance details without spinning up the full research stack.
2. **Development (Single-Pass)** – implement and validate the change in one focused loop, optionally pairing with a reviewer for safeguard.

The prototype `v6.lane-selection-prototype` module converts the existing quick-lane heuristics into this shortened progression so V6 can skip formal planning assets when the signal strength strongly favors small scope.【F:lib/v6/lane-selection-module.js†L1-L86】

## Complex Lane Mapping

Complex initiatives continue to flow through the complete V6 experience:

1. **Analysis (Deep-Dive)** – generate brainstorming artifacts, research notes, and the product brief.
2. **Planning (Full-Stack)** – produce the PRD, architecture, and per-epic tech specs before entering build.
3. **Development (Iterative Epic Cycle)** – run the story creation, context, implementation, and review loop per epic as V6 prescribes.【F:later-todo.md†L73-L114】【F:lib/v6/lane-selection-module.js†L10-L82】

## Dual-Lane Compatibility Notes

- **Lane Detection Reuse** – `lib/lane-selector.js` feeds directly into the V6 prototype without modification, showing the scoring model can act as an upstream signal for module routing.【F:lib/v6/lane-selection-module.js†L1-L86】
- **Phase Blueprint Export** – the module exposes `getPhaseBlueprint` so orchestration layers can audit or override the default quick/complex progressions before execution.【F:lib/v6/lane-selection-module.js†L60-L83】
- **Next Validation Step** – integrate with a real V6 runtime once module loading hooks are available to confirm command triggers and artifact writers receive the lane context.

## Conclusion

The study indicates that quick-lane work naturally collapses into a two-phase V6 path, while complex-lane work mirrors the canonical three-phase progression. The prototype demonstrates that our dual-lane selector can supply phase plans without altering its heuristics, suggesting migration risk is mainly in V6 runtime wiring rather than decision logic.【F:lib/v6/lane-selection-module.js†L1-L86】
