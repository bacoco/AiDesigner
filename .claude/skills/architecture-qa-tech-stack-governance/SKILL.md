---
title: Architecture QA & Tech Stack Governance
tagline: Align implementation plans with approved architecture and platform standards.
slug: architecture-qa-tech-stack-governance
version: 0.1.0
authors:
  - AiDesigner Architecture Council
tags:
  - architecture
  - backend
  - qa
visibility: private
estimated_duration_minutes: 40
required_tools:
  - aidesigner-cli
  - diagramming-tool
related_artifacts:
  - aidesigner-core/templates/architecture
  - packages/meta-agents/architecture
  - docs/plans/anthropic-skills-integration.md
---

# Overview

Ensure the delivery team adheres to vetted architecture decisions and tech stack governance. This Skill streamlines architecture reviews, diagram validation, and readiness checks before development sprints begin.

# When to Use

- Translating UI/UX outputs into technical implementation plans.
- Conducting pre-sprint readiness or design reviews.
- Vetting expansions or Skills that introduce new services or infrastructure.

# Workflow

1. **Assemble architecture baseline**
   - Load the latest architecture template from `aidesigner-core/templates/architecture/blueprint.md`.
   - Import system context, deployment, and sequence diagrams.
   - Identify any deviations from the approved reference architecture.
2. **Tech stack governance**
   - Validate service language/framework choices against the approved stack table.
   - Document dependencies, data stores, and integration patterns.
   - Flag risks for security, scalability, or compliance review.
3. **Cross-functional review**
   - Schedule an architecture QA session with engineering, security, and product.
   - Use `packages/meta-agents/architecture/checklists` to drive the conversation.
   - Capture decisions and follow-ups in the architecture log.
4. **Readiness certification**
   - Run `bin/aidesigner architecture validate` to ensure diagrams and specs meet completeness criteria.
   - Confirm observability, deployment, and rollback strategies are documented.
   - Approve or gate entry into sprint planning based on readiness.
5. **Feedback loop**
   - Feed approved decisions back into the UI and discovery Skills for traceability.
   - Update Skill artifacts to keep the governance model synchronized.

# Checklists

- [ ] Architecture diagrams updated and versioned.
- [ ] Tech stack selections reviewed against governance matrix.
- [ ] Non-functional requirements captured (performance, security, privacy).
- [ ] Validation tooling run with zero blocking issues.
- [ ] Decisions recorded with clear owners and due dates.

# Tips

- Leverage MCP automation to fetch infrastructure inventories or cost baselines.
- Pair this Skill with **Expansion Creator Enablement** when packaging domain-specific architecture patterns.
- Maintain a shared architecture decision register for audit readiness.

# Next Steps

Once architecture is approved, transition into implementation planning or activate **Expansion Creator Enablement** to share the blueprint with partner teams.
