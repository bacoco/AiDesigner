---
title: Expansion Creator Enablement
tagline: Package domain expertise into reusable AiDesigner expansions and Skills.
slug: expansion-creator-enablement
version: 0.1.0
authors:
  - AiDesigner Creator Collective
tags:
  - expansion-packs
  - enablement
  - knowledge-management
visibility: private
estimated_duration_minutes: 50
required_tools:
  - aidesigner-cli
  - git
  - documentation-suite
related_artifacts:
  - expansion-packs/
  - docs/creators
  - packages/meta-agents
---

# Overview

Empower subject-matter experts to author, test, and share AiDesigner expansions. This Skill combines creator onboarding material, packaging templates, and validation routines to help teams distribute specialized knowledge confidently.

# When to Use

- Spinning up a new expansion focused on a domain or industry vertical.
- Capturing institutional expertise from partner teams.
- Preparing contributions for the public AiDesigner expansion library.

# Workflow

1. **Define the domain**
   - Document audience, problem space, and differentiators in an expansion brief.
   - Capture exemplar prompts, workflows, and guardrails specific to the domain.
2. **Assemble assets**
   - Populate the expansion folder structure under `expansion-packs/` with agents, prompts, and templates.
   - Ensure MCP tool integrations are listed with configuration guidance.
   - Link supporting artifacts (datasets, references, diagrams) in the `docs/creators` section.
3. **Author Skill bundle**
   - Use `bin/aidesigner skills generate --from expansion <path>` to convert assets into a Skill-compatible folder.
   - Draft progressive disclosure instructions outlining setup, usage, and maintenance tips.
   - Add executable helpers only when deterministic automation is required.
4. **Validate & iterate**
   - Run `npm run validate` with expansion-specific checks enabled.
   - Dogfood the expansion in Claude Code or the orchestrator, logging feedback in the creator journal.
   - Iterate on instructions until workflows feel intuitive to first-time users.
5. **Share and sustain**
   - Package the expansion and Skill bundle for internal review.
   - Document contribution guidelines, support channels, and update cadence.
   - Optionally submit to the community catalog once legal approvals are in place.

# Checklists

- [ ] Domain brief approved with clear audience and outcomes.
- [ ] Expansion assets organized with consistent naming and metadata.
- [ ] Skill bundle generated and validated with no blocking issues.
- [ ] Usage guidance tested with at least one new collaborator.
- [ ] Support and maintenance plan documented.

# Tips

- Pair with **Skill Builder & CLI Orchestration** to streamline publishing workflows.
- Capture video walkthroughs or annotated screenshots for faster onboarding.
- Maintain a changelog to track updates across both expansion and Skill assets.

# Next Steps

Loop back into the **Discovery Journey & Visual Inspiration Skill** periodically to refresh domain insights and keep the expansion aligned with evolving user needs.
