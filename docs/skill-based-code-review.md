# Claude Skill-Based Code Review

## Summary

- The CLI already centralizes provider resolution, credential prompting, and orchestrator bootstrapping, making it a strong foundation for a future skill-management surface once command handlers are extended. 【F:bin/aidesigner†L27-L357】【F:bin/aidesigner†L1147-L1245】
- Discovery workflows and drawbridge ingestion scripts encode a comprehensive journey from research through QA, but the skill bundle should expose health signals from these pipelines to creators. 【F:aidesigner-core/workflows/greenfield-fullstack.yaml†L1-L108】【F:tools/drawbridge-context-pack.mjs†L1-L200】
- Front-end design templates and CLI scaffolding already enforce design-system conventions; aligning generated shadcn configuration with the committed example keeps UI Skills trustworthy. 【F:aidesigner-core/templates/front-end-spec-tmpl.yaml†L1-L120】【F:bin/aidesigner†L1722-L1765】【F:front-end/components.json†L1-L26】
- Architecture templates enumerate exhaustive governance checkpoints; pairing them with automated readiness exports will complete the Architecture QA Skill loop. 【F:aidesigner-core/templates/fullstack-architecture-tmpl.yaml†L1-L198】
- Expansion manifests script multi-repository ingestion, yet there is no common reporting surface to show skill authors whether sync pipelines succeeded. 【F:expansion-packs/external-integrations/manifest.yaml†L1-L160】

## 1. Skill Builder & CLI Orchestration

### Strengths Observed

- `bin/aidesigner` normalizes Anthropic/GLM provider flags, reads `.env` files safely, and backfills environment variables so downstream commands run without manual exports. 【F:bin/aidesigner†L27-L357】
- The CLI already exposes a command table for orchestrating initialization, chats, validation, and review flows, giving a natural home for `skills` subcommands. 【F:bin/aidesigner†L1147-L2445】

### Gaps & Risks

- There is no `skills` entry in the command dispatcher, so maintainers cannot yet list, validate, or publish the new Claude Skills from the CLI. 【F:bin/aidesigner†L1147-L2445】
- Skill metadata under `.claude/skills/` is currently disconnected from `ProjectState`, preventing audit logs or integrity checks before sharing bundles. 【F:bin/aidesigner†L2431-L2441】【F:tools/drawbridge-context-pack.mjs†L7-L40】

### Recommended Actions

- Add a `skills` command namespace that enumerates, lints, and packages entries inside `.claude/skills/`, reusing the existing command registration pattern. 【F:bin/aidesigner†L1147-L2445】
- Extend `ProjectState` persistence to mirror skill activation history so the CLI can warn when a bundle is stale relative to project artifacts. 【F:bin/aidesigner†L2431-L2441】【F:tools/drawbridge-context-pack.mjs†L7-L40】

## 2. Discovery Journey & Visual Inspiration

### Strengths Observed

- The greenfield full-stack workflow choreographs analyst → PM → UX → architecture → QA transitions, including Drawbridge loops and document sharding, capturing the end-to-end discovery journey a Skill should replay. 【F:aidesigner-core/workflows/greenfield-fullstack.yaml†L1-L185】
- Drawbridge ingestion sanitizes paths, enforces allowed modes, and extracts context snippets, which can be surfaced as diagnostics when a discovery skill runs. 【F:tools/drawbridge-context-pack.mjs†L1-L200】

### Gaps & Risks

- No automated summary of Drawbridge ingestion health is published back to creators, so a Skill invocation cannot indicate whether annotations were applied or skipped. 【F:tools/drawbridge-context-pack.mjs†L43-L152】
- Discovery outputs rely on manual copying into `docs/` per workflow notes, leaving room for drift without scripted exports. 【F:aidesigner-core/workflows/greenfield-fullstack.yaml†L25-L107】

### Recommended Actions

- Emit a JSON or markdown status report from the Drawbridge tool and surface it via the discovery skill so teams know which annotations were ingested. 【F:tools/drawbridge-context-pack.mjs†L43-L200】
- Provide a CLI helper (e.g., `aidesigner discovery export`) that syncs generated markdown into project docs to keep artifacts in lock-step. 【F:aidesigner-core/workflows/greenfield-fullstack.yaml†L25-L185】【F:bin/aidesigner†L1147-L2445】

## 3. UI Design System Adherence

### Strengths Observed

- The UI/UX specification template elicits personas, navigation, flows, and concept explorations, ensuring Skills capture the same rigor human designers follow. 【F:aidesigner-core/templates/front-end-spec-tmpl.yaml†L1-L120】
- The CLI bootstraps shadcn configuration with registry hints and prerequisite checks, tying UI deliverables to actual component sources. 【F:bin/aidesigner†L1722-L1765】
- The example front-end package includes normalized color utilities and tests, demonstrating how generated UI specs can map to coded theming. 【F:front-end/src/lib/theme.ts†L1-L54】【F:front-end/src/lib/theme.test.ts†L1-L52】

### Gaps & Risks

- The CLI writes `cssVariables: true` into generated `components.json`, while the committed example defaults to `false`, creating conflicting guidance for Skill consumers. 【F:bin/aidesigner†L1750-L1765】【F:front-end/components.json†L1-L26】
- There is no automated validator ensuring that personas and flows captured in the UI spec stay synchronized with available shadcn components or registries. 【F:aidesigner-core/templates/front-end-spec-tmpl.yaml†L15-L79】【F:bin/aidesigner†L1722-L1765】

### Recommended Actions

- Align the CLI’s generated shadcn configuration with the repository baseline (or expose a flag) so Skills deliver consistent setup instructions. 【F:bin/aidesigner†L1722-L1765】【F:front-end/components.json†L1-L26】
- Add a design-system check that compares requested UI patterns from the spec against registry metadata and flags missing components before implementation. 【F:aidesigner-core/templates/front-end-spec-tmpl.yaml†L40-L106】【F:bin/aidesigner†L1722-L1765】

## 4. Architecture QA & Tech Stack Governance

### Strengths Observed

- The full-stack architecture template walks through starter evaluation, platform selection, repository structure, and detailed tech-stack tables, mirroring the governance checkpoints outlined in the Skill. 【F:aidesigner-core/templates/fullstack-architecture-tmpl.yaml†L1-L198】
- Workflow steps loop architecture decisions back into PRD updates and PO validation, providing an approval chain Skills can enforce. 【F:aidesigner-core/workflows/greenfield-fullstack.yaml†L51-L185】

### Gaps & Risks

- There is no automated export of the architecture readiness checklist, making it hard for Skills to block promotion when required sections are incomplete. 【F:aidesigner-core/templates/fullstack-architecture-tmpl.yaml†L57-L198】
- Architecture diagrams depend on manual Mermaid authoring without linting or render validation during CLI runs. 【F:aidesigner-core/templates/fullstack-architecture-tmpl.yaml†L104-L118】

### Recommended Actions

- Add a CLI verifier that inspects generated architecture docs for populated sections/diagrams and emits a readiness score before sprint planning. 【F:aidesigner-core/templates/fullstack-architecture-tmpl.yaml†L57-L198】【F:bin/aidesigner†L1147-L2445】
- Integrate Mermaid validation (e.g., via `@mermaid-js/mermaid-cli`) into the architecture skill workflow to catch syntax errors early. 【F:aidesigner-core/templates/fullstack-architecture-tmpl.yaml†L104-L118】

## 5. Expansion Creator Enablement

### Strengths Observed

- The external integrations manifest codifies sync cadence, governance owners, and scripted pipelines for multiple upstream sources, providing a repeatable pattern for Skill-authored expansions. 【F:expansion-packs/external-integrations/manifest.yaml†L1-L160】
- Supporting developer tools already exist under `.dev/tools/external/`, enabling automation for registry normalization and validation. 【F:expansion-packs/external-integrations/manifest.yaml†L31-L158】

### Gaps & Risks

- There is no consolidated report showing whether each source pipeline ran successfully, leaving expansion creators blind to failures. 【F:expansion-packs/external-integrations/manifest.yaml†L23-L158】
- Expansion documentation references module prototypes and legacy pack locations that are not part of the current tree, risking confusion for new authors. 【F:docs/expansion-packs.md†L5-L29】

### Recommended Actions

- Capture pipeline run results (exit codes, timestamps) into a manifest ledger that the expansion skill can display or fail on. 【F:expansion-packs/external-integrations/manifest.yaml†L23-L158】
- Refresh the expansion documentation to reflect the active `external-integrations` structure and link to any new module prototype repositories or branches. 【F:docs/expansion-packs.md†L5-L29】
