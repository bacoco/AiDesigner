# Code Review: Inference Pipeline Gaps

## Token inference (`packages/inference/src/tokens.ts`)
- `inferTokens` currently returns hard-coded scaffolding and dereferences multiple identifiers that are never defined in scope—`spacing`, `fonts`, `artifacts`, `colorTokens`, and `radii`—so any runtime call will immediately throw a `ReferenceError` before returning tokens.【F:packages/inference/src/tokens.ts†L25-L52】
- The implementation never reads from the captured artifacts that are passed in via `input`, yet it tries to access `artifacts.url` in the return payload; this further confirms the function is still a mock and cannot succeed with real capture data.【F:packages/inference/src/tokens.ts†L3-L54】
- All of the helper logic below `inferTokens` references types and constants that are neither imported nor defined anywhere (`StyleRuleSummary`, `ColorStat`, `BACKGROUND_LUMINANCE_PRIMARY`, `MUTED_BLEND_AMOUNT`, `DEFAULT_FONT`, `COLOR_SIMILARITY_THRESHOLD`, etc.), so TypeScript compilation will fail long before runtime.【F:packages/inference/src/tokens.ts†L57-L534】

## Component detection (`packages/inference/src/components.ts`)
- `detectComponents` returns data from `roles`, `classTokens`, `patterns`, `intents`, `sizes`, and `states`, but none of those collections are declared in scope. The first call will crash with `ReferenceError`, which shows this entry-point is still stubbed out.【F:packages/inference/src/components.ts†L3-L29】
- The file expects constants such as `MAX_CLASSES_LIKE_BUTTON`, `MAX_CLASSES_LIKE_CARD`, `MAX_CLASSES_LIKE_INPUT`, and `MIN_CONTENT_LENGTH_FOR_LABELLED`, yet none are defined or imported, leaving additional runtime/compile-time failures once the earlier issues are addressed.【F:packages/inference/src/components.ts†L16-L181】
- Helper signatures rely on an `AttributeMap` type that is not declared or imported, which again prevents the file from compiling today and signals the logic is unfinished scaffolding.【F:packages/inference/src/components.ts†L33-L218】

These blockers mean the MCP-driven analysis flow in `apps/aidesigner-poc` cannot produce tokens or component maps: both inference entry-points are mocks that must be completed before the pipeline can work end-to-end.【F:apps/aidesigner-poc/src/run-url-analysis.ts†L1-L87】
