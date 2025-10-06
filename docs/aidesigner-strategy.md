---
title: 'AiDesigner — Chrome MCP Strategy Pack'
description: 'Strategy, PRD, and technical specification for AiDesigner with Chrome MCP, Gemini 2.5 Flash, and Nano Banana integration'
---

# AiDesigner — Chrome MCP × Gemini/Nano Banana Strategy Pack

This document provides strategic direction for AiDesigner's UI Design phase, integrating Chrome DevTools MCP (never Playwright), Gemini 2.5 Flash Image / Nano Banana, SuperDesign, Drawbridge, and UI component library mappings.

**Context**: This is **Phase 2** of the complete AiDesigner workflow:

- Phase 1: Idea & Discovery
- **Phase 2: UI Design** ← This document
- Phase 3: Agile Implementation

See [COMPLETE-WORKFLOW.md](COMPLETE-WORKFLOW.md) for the full journey.

Contents:

1. **Top ideas** (impact × feasibility)
2. **Actionable PRD** (Personas, KPIs, scenarios)
3. **Technical specification** (JSON schemas, MCP flows, test playbooks, reports)

---

## 1. Top Ideas (Impact × Feasibility)

1. **Token Inference + Evidence Pack** — Extract tokens and generate comprehensive evidence pack from Chrome MCP (DOM/CSSOM/a11y, multi-state captures, repetition heatmaps) to ensure confidence.
2. **"Design-Locked" Contracts** — Every generation (image → UI → code) constrained by `tokens.json` + `components.map.json` with validators (contrast, spacing, grid).
3. **Nano Banana as "UI Vision Oracle"** — Precisely describe screens (components, hierarchy) and cross-reference with MCP data.
4. **Assisted "Visual-to-HTML"** — Convert concepts (Nano Banana/Gemini) to HTML/React mapped to Shadcn/MUI/Ant/Chakra.
5. **Chrome MCP Debug Loop** — Inspection and auto-correction via `dom_snapshot`, `cssom_dump`, `console_get_messages`, `performance_trace`.
6. **Drawbridge-style edits, MCP-native** — Annotate UI in browser and generate AST diff patches.
7. **SuperDesign Integration** — Token-enriched prompts to generate variations, mapped to components.
8. **Internal Graph** — Tokens ⇄ Components ⇄ Pages ⇄ Tests for impact analysis & journey checks.
9. **Realistic Benchmarks & Costs** — Latency & cost targets for Gemini/Nano Banana.
10. **Security/IP ("Legal-Safe Mode")** — MCP sandboxing, SynthID, style distillation.

---

## 2. PRD — AiDesigner UI Design Phase (Chrome MCP × Gemini/Nano Banana)

### Objective

Bridge the gap between idea and implementation through conversational UI design:

- Extract design tokens from user-provided inspiration URLs
- Generate visual concepts with Gemini/Nano Banana
- Lock design system for consistent implementation
- Seamlessly transition to agile development with design constraints

### Personas & Jobs-to-be-Done

- **UI Designer** — Understand visual system and iterate on-brand.
- **Frontend Developer** — Receive clean code mapped to target UI library, with tests.
- **Lead/QA** — Verify accessibility compliance, responsiveness, token adherence.

### Key Capabilities (MVP+)

1. URL → Tokens/Patterns (MVP)
2. Image/Mockup → Design-locked concepts (MVP)
3. Concept → Mapped HTML/React (MVP+)
4. Chrome MCP Debug Loop (MVP+)
5. Evidence Pack & Reports (MVP)
6. Graph Impact View (V2)

### KPIs

- Time-to-first-prototype ↓ 60%
- "Design-locked" generations ≥ 80%
- Visual drift ≤ 5% (P95)
- 0 blocking console errors after auto-correction
- UI lib adoption: ≥ 2 targets (Shadcn + MUI)

### Priority Scenarios

S1: User shares inspiration URL → Extract design tokens → Present for refinement
S2: Journey mapping → Per-screen visual prompts → Gemini/Nano Banana concepts
S3: Design selection → Lock tokens → Transition to implementation with constraints
S4: Chrome MCP validation → Drift detection → Evidence packs for QA

### Out of Scope (MVP)

No Playwright, no backend/state management, respect image usage policies.

---

## 3. Technical Specification (Development-Ready)

### Logical Architecture

- **Inspector (MCP)** — Collect DOM/CSSOM/a11y/console/perf, infer tokens, evidence pack.
- **Designer (Vision)** — Nano Banana/Gemini: concepts, descriptions, multi-image coherence.
- **Builder (Codegen)** — Canonical spec → HTML/React mapped to libs, Stories, tests, patches.
- **Orchestrator** — Deterministic sequence, artifacts, metrics.

### Contract Schemas (JSON)

- `tokens.json` — palette, typography, spacing, modes, constraints.
- `components.map.json` — detection, variants, states, a11y, mappings.
- `evidence.manifest.json` — artifacts (screenshots, CSS dumps, console, perf, diffs).

### Chrome MCP Flows (Pseudo API)

1. URL Analysis → `browser.open`, `devtools.dom_snapshot`, `devtools.cssom_dump`, `devtools.capture_screenshot`, `devtools.console_get_messages`, `devtools.performance_start_trace`/`stop_trace`, token inference, validators.
2. Constrained Generation → `vision.describe`, prompt enrichment, `vision.generate`, codegen, validation.
3. Debug/Autofix → read console, AST corrections, revalidation, before/after.

### Prompting (Nano Banana / Gemini)

- Hard constraints injected (palette, typography, spacing, grid, contrast).
- Multi-image coherence, controlled style transfer, localized edits.
- Input sanitization to prevent prompt injection (see POC Kit section 2).

### UI Library Mapping

- Registry for Shadcn/MUI/Ant/Chakra, aligned with awesome-ui-component-libraries.
- Codemods ensuring prop parity (`intent`→`variant`/`color`, inline style removal, token injection).

### Internal Graph

- Nodes: Token, Component, Page, Test, Defect, Edit.
- Edges: uses, violates, generates, fixes, impacts.
- Usage: impact analysis, journey coherence, QA gating.

### Security/Compliance

- Chrome MCP sandbox, egress control, ephemeral storage.
- Anti-prompt-injection sanitization.
- Legal-Safe Mode: style distillation, SynthID, provenance tracking.

---

## 4. Test & Quality Playbooks

1. **URL → Tokens** — Stability ≥ 90%, component coverage ≥ 85%, complete evidence pack.
2. **Image → HTML/React** — Drift ≤ 5%, contrast ≥ 4.5:1, hit area ≥ 44px, lint/TS pass, Stories/tests generated.
3. **MCP Debug Loop** — 0 console errors, no perf regression (CLS/LCP), before/after report.

---

## 5. Example Reports

- **Design Debt Report** — Token violations, spacing drift, a11y issues.
- **Evidence Pack** — Screenshots (desktop/mobile/dark), console errors (before/after), perf trace, CSS/HTML diffs.

---

## 6. Roadmap (8–12 Weeks)

1. W1-2 — MCP foundations & token inference.
2. W3-4 — Constrained vision (prompts, validators).
3. W5-7 — Codegen & library mapping.
4. W8-10 — Drawbridge-style overlay & diff.
5. W11-12 — Graph & consolidated reporting.

---

## 7. Internal Modules & APIs

- Packages: `mcp-inspector`, `inference`, `vision`, `canonical-spec`, `mappers`, `validators`, `codegen`, `apps/aidesigner`.
- TypeScript APIs: `analyzeUrl`, `describeUI`, `generateConcepts`, `buildReact`, `validateAll`, `autofixConsole`.

---

## 8. Stakeholder Summary (Deck)

- **Vision**: "Bridge idea to implementation through conversational UI design."
- **Position in Workflow**: Phase 2 of 3 (Idea → **UI Design** → Implementation)
- **Differentiators**: Conversational design + Token extraction from inspiration + Design-locked code generation
- **ROI**: −60% TTFP, −40% QA returns, +80% design/code parity, zero handoff loss
- **Risks**: IP, prompt-injection, incomplete mapping → guardrails (Legal-Safe, sandbox, validators)
- **Evidence**: Evidence packs, drift reports, Stories/tests
- **Integration**: Design decisions flow directly into PRD, architecture, and development stories

---

## 9. Key References

- Chrome DevTools MCP — blog, server repo.
- Gemini 2.5 Flash Image / Nano Banana — docs, pricing, latency.
- UX Planet — Nano Banana editing techniques.
- SuperDesign — open-source design agent.
- Drawbridge — visual annotation workflow.
- Awesome UI Component Library — library mappings.
- Dataïads — Nano Banana context.
