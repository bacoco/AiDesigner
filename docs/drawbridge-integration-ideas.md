# Integrating Drawbridge with AiDesigner

The Drawbridge project couples a Chrome extension for visual annotations with a markdown-based task workflow (`drawbridge-workflow.mdc`, `moat-tasks.md`, `moat-tasks-detail.json`, and `/screenshots`). Its "bridge" command processes batched visual feedback for downstream automation, supporting incremental, batch, and autonomous processing modes. Building on these mechanics, here are five imaginative ways to weave Drawbridge into the AiDesigner ecosystem.

## 1. Visual Feedback Ingestion Pipeline for the Invisible Orchestrator

- **Concept**: Extend the invisible orchestrator agent so it can ingest Drawbridge's `moat-tasks.md` and `moat-tasks-detail.json` files as structured inputs.
- **Implementation Sketch**:
  - Add a watcher task in `aidesigner-core/tasks` that parses Drawbridge task files and enriches them with selectors, screenshots, and dependency data.
  - Update relevant workflows (e.g., front-end design flows) to include a "Visual Feedback" phase that routes Drawbridge annotations to specialized UI-tuning agents.
  - Let the orchestrator cross-reference selectors with component blueprints to scope edits precisely.
- **Benefit**: Designers can annotate live previews, and AiDesigner automatically converts those annotations into actionable tickets for agents without manual translation.

## 2. Screenshot-Assisted Context Packs for Expansion Packs

- **Concept**: Use Drawbridge's screenshot capture to generate context packs for expansion packs (such as `bmad-2d-phaser-game-dev` or `bmad-creative-writing`).
- **Implementation Sketch**:
  - Create a utility script in `tools/` that bundles Drawbridge screenshots with markdown prompts describing visual deltas.
  - Attach these bundles as optional context when invoking expansion-pack workflows, giving creative agents concrete visual cues.
  - Surface the screenshots in QA checklists so reviewers can verify that requested visual changes match the latest captures.
- **Benefit**: Enriches domain-specific workflows with high-fidelity visual evidence, improving both ideation and validation phases.

## 3. Bridge-Driven Multi-Agent Swarm Mode

- **Concept**: Map Drawbridge's processing modes (`step`, `batch`, `yolo`) to AiDesigner swarm strategies to dynamically throttle autonomy.
- **Implementation Sketch**:
  - Introduce workflow parameters that accept a Drawbridge mode flag.
  - In "step" mode, orchestrator dispatches one agent at a time and requests human approval between stages, mirroring Drawbridge's approval checkpoints.
  - In "batch" mode, orchestrator groups related tasks (e.g., styling updates) and coordinates multi-agent collaboration with synchronized commits.
  - In "yolo" mode, unlock a higher-autonomy swarm routine that runs regression guards before finalizing changes.
- **Benefit**: Aligns human trust levels with automation intensity, allowing teams to scale from cautious iteration to rapid execution using a familiar mental model.

## 4. Annotated Design-to-PRD Auto-Compiler

- **Concept**: Convert Drawbridge annotations into structured requirements for AiDesigner's PRD and architecture templates.
- **Implementation Sketch**:
  - Build a parser that clusters Drawbridge comments by component or user story and maps them into sections of `docs/prd.md` and related templates.
  - Automatically attach screenshot references and selectors to each requirement entry for traceability.
  - Trigger this compiler as part of the `npm run pre-release` validation to ensure documentation stays synchronized with accepted annotations.
- **Benefit**: Keeps product documentation current with design feedback, reducing drift between visual intent and written requirements.

## 5. Cross-Tool UX Review Loop

- **Concept**: Use Drawbridge to capture user-testing feedback during AiDesigner demo sessions, feeding it back into iteration loops.
- **Implementation Sketch**:
  - During demos (e.g., via `demo-quick-designer.html`), facilitators record participant feedback as Drawbridge annotations.
  - A dedicated QA workflow reads the resulting tasks and populates `docs/qa/gates/` checklists with actionable items, including screenshot thumbnails.
  - Integrate with the CLI (`bin/aidesigner`) to present a "Review queue" command that summarizes outstanding Drawbridge-sourced UX issues.
- **Benefit**: Creates a continuous discovery loop where qualitative observations become structured tasks, accelerating UX improvements across releases.

These integrations blend Drawbridge's visual-first task capture with AiDesigner's orchestrated agent workflows, enabling richer context, tighter feedback loops, and adaptable autonomy across the product lifecycle.
