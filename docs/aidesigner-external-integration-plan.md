---
title: "AiDesigner External Integration Plan"
description: "Assessment of current integrations with Every Marketplace, Awesome UI, SuperDesign, and Vibe Check plus roadmap for combining their strengths."
---

# Integration Assessment and Roadmap

## Current Integration Status

### Every Marketplace — Compounding Engineering

- **Status:** Partially integrated. The repo is declared as an optional dependency and the orchestrator includes a planning adapter that loads the plugin manifest and executes the `/create-tasks` command when available.
- **Evidence:**
  - `package.json` lists `@everymarketplace/compounding-engineering` as an optional dependency, signaling the intended linkage.
  - `docs/compounding-engineering-integration.md` documents how to clone the companion repository, configure environment variables, and invoke the planner through the AiDesigner CLI.  
  - `packages/meta-agents/src/planning/compounding-engineering.ts` implements the adapter that normalizes the returned task graph for the Architect orchestrator.

### Awesome UI Component Library

- **Status:** Referenced conceptually but not yet wired into code. The strategy document calls for aligning the component registry with the awesome-ui listings, yet there is no fetch, schema, or configuration that consumes the upstream catalog.
- **Evidence:**
  - `docs/aidesigner-strategy.md` outlines the goal of mapping Shadcn, MUI, Ant, and Chakra components to the curated library but no implementation assets exist elsewhere in the repository.

### SuperDesign

- **Status:** Not integrated. SuperDesign appears only in strategy materials; no adapters, API clients, or configuration files are present.
- **Evidence:**
  - `docs/aidesigner-strategy.md` references SuperDesign for token-enriched prompt generation, and repository searches reveal no additional code paths or configuration hooks.

### Vibe Check MCP Server

- **Status:** Config-ready. Dedicated documentation explains how to configure the MCP server, but enforcement logic inside planners or generators is not yet present.
- **Evidence:**
  - `docs/mcp/vibe-check.md` provides installation and configuration steps for the Vibe Check server, indicating the orchestration layer is expected to launch it when configured.

## Combined Best-Idea Roadmap

### Guiding Principles

1. **Compounding Workflow:** Adopt the "Systematic Plan → Delegate → Assess → Codify" loop so each project iteration enriches the reusable knowledge base.
2. **Curated Component Intelligence:** Treat the Awesome UI catalog as the authoritative source for framework-specific component availability and best-practice usage patterns.
3. **Generative UI Bootstrap:** Use SuperDesign to translate natural-language briefs into scaffolded UI code and previews that can be post-processed into production-grade components.
4. **Metacognitive Guardrails:** Run all autonomous plans and code generations through the Vibe Check safety layer to intercept risky instructions and log learnings for future runs.

### Phase 0 – Foundations

- Finalize the compounding-engineering adapter by adding automated tests that validate manifest parsing and command invocation fallbacks.
- Wire the MCP inspector agent to flag when the companion repository is missing or stale, surfacing actionable sync instructions.

### Phase 1 – Knowledge Ingestion

- Build a scheduled job that ingests the Awesome UI library index (framework, component type, maturity signals) into a normalized `ui-components.registry.json` artifact.
- Extend the Architect planner to annotate tasks with suggested component families based on the ingested registry.

### Phase 2 – SuperDesign Orchestration

- Implement a SuperDesign client module that can:
  - Submit token-enriched prompts produced from the compounding plan context.
  - Receive multi-variant UI outputs and map them onto the normalized component registry.
- Add a "Concept Synthesis" workflow step where the Architect requests SuperDesign drafts before dispatching developer sub-agents.

### Phase 3 – Safety Oversight and Feedback

- Integrate the Vibe Check MCP server as a required gate in the mission lifecycle: briefs → concepts → copy.
- Capture Vibe Check scores alongside compounding task metadata so regressions can halt automation.
- Feed Vibe Check interventions back into the compounding knowledge store to reinforce safer prompt templates over time.

### Phase 4 – Self-Improving Loop

- Record each completed mission (plan, generated UI, implemented code, Vibe Check report) in a structured knowledge base.
- Teach the Architect to reuse prior missions: when a new request overlaps with past work, retrieve relevant artifacts before planning.
- Publish quarterly playbooks describing what improved (planning accuracy, UI component reuse, fewer Vibe Check escalations) and codify updates into templates and tasks.

## Immediate Next Steps (2-Week Sprint)

1. Enable CI to run a smoke test verifying the compounding-engineering companion repository is reachable and the adapter can parse the manifest.
2. Prototype an Awesome UI ingestion script that creates a lightweight JSON registry for React libraries, proving out metadata fields.
3. Draft the SuperDesign API client interface (types, expected responses) and capture configuration needs (.env, API keys) for future implementation.
4. Add a checklist item to the MCP inspector agent to confirm Vibe Check credentials are set before orchestration begins.

Delivering this sprint establishes the structural runway for deeper integration work across the four ecosystems.
