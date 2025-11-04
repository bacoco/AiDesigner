---
title: Discovery Journey & Visual Inspiration
tagline: Drive deep discovery, persona validation, and inspiration capture for new products.
slug: discovery-journey-visual-inspiration
version: 0.1.0
authors:
  - AiDesigner Experience Lab
tags:
  - discovery
  - research
  - ux
visibility: private
estimated_duration_minutes: 45
required_tools:
  - aidesigner-cli
  - browser
  - whiteboard-or-miro
related_artifacts:
  - aidesigner-core/workflows/greenfield-fullstack.yaml
  - aidesigner-core/templates/project-brief-tmpl.yaml
  - aidesigner-core/templates/market-research-tmpl.yaml
---

# Overview

This Skill operationalizes AiDesigner’s discovery journey playbooks. It walks teams through persona alignment, journey mapping, inspiration scraping, and insight distillation so they can kick off new initiatives with confidence.

# When to Use

- Beginning a new product or feature where customer understanding is limited.
- Refreshing personas or journeys for an existing product pivot.
- Preparing research artifacts for the Nano Banana storytelling workflow.

# Workflow

1. **Frame the opportunity**
   - Clarify goals, success metrics, and constraints using `aidesigner-core/templates/project-brief-tmpl.yaml`.
   - Document target personas and user research in your project's discovery documentation.
2. **Run the journey session**
   - Facilitate the guided workshop agenda, capturing `moments`, `pain points`, and `opportunities`.
   - Document journey mapping artifacts in your project's research documentation.
3. **Collect visual inspiration**
   - Use the built-in inspiration prompt list to gather references.
   - Optionally trigger MCP-powered Chrome scraping tools to import screenshots or color palettes.
   - Normalize findings into moodboards or inspiration grids.
4. **Synthesize insights**
   - Summarize key observations, tensions, and design guardrails.
   - Extract tokens for handoff to the UI Design System Adherence Skill.
5. **Publish discovery bundle**
   - _(Note: `bin/aidesigner discovery export` is planned but not yet implemented)_
   - Package the session outputs into your project's documentation directory.
   - Attach relevant inspiration boards and persona updates for downstream workflows.

# Checklists

- [ ] Stakeholders and facilitators aligned on goals.
- [ ] Personas validated with latest qualitative/quantitative data.
- [ ] Journey map covers end-to-end lifecycle.
- [ ] Inspiration assets tagged with rationale.
- [ ] Insights and opportunities logged for the next sprint planning cycle.

# Tips

- Pair with the [**UI Design System Adherence Skill**](../ui-design-system-adherence/SKILL.md) to translate insights into component-level guidance.
- Capture audio or transcript summaries during workshops for richer story extraction.
- Revisit this Skill quarterly to keep research assets evergreen.

# Next Steps

Feed synthesized insights into the **Architecture QA & Tech Stack Governance Skill** to ensure technical decisions honor user truths uncovered during discovery.
