---
title: Skill Builder & CLI Orchestration
tagline: Scaffold, validate, and publish AiDesigner Skills directly from the CLI.
slug: skill-builder-cli-orchestration
version: 0.1.0
authors:
  - AiDesigner Core Team
tags:
  - aidesigner
  - claude-skill
  - cli
visibility: private
estimated_duration_minutes: 15
required_tools:
  - node>=18
  - npm
  - aidesigner-cli
related_artifacts:
  - bin/aidesigner
  - bin/aidesigner-claude
  - docs/plans/anthropic-skills-integration.md
---

# Overview

This Skill packages the end-to-end flow for bootstrapping new AiDesigner Skills from the command line. It guides maintainers through environment setup, project linking, and the planned `aidesigner skills` commands so they can iterate quickly without leaving the terminal.

# When to Use

- Creating a fresh Skill scaffold aligned with the Anthropic Skills roadmap.
- Validating or publishing updates to an existing Skill bundle.
- Wiring a Skill into local MCP or Claude CLI workflows and need consistent setup steps.

# Workflow

1. **Initialize environment**
   - Run `npm install` at the repository root.
   - Export any provider credentials (e.g., `export ANTHROPIC_API_KEY=...`) required by local scripts.
2. **Create or update the Skill**
   - _(Note: `bin/aidesigner skills` commands are planned but not yet implemented)_
   - Manually create a new Skill folder following the pattern in `.claude/skills/`.
   - Use existing workflow documentation as a basis for Skill instructions.
   - Validate the Skill structure and metadata manually.
3. **Preview in Claude**
   - Start the Claude orchestrator via `bin/aidesigner-claude start`.
   - Load the generated Skill folder into `~/.claude/skills` or pass `--skill-path` when launching the orchestrator.
   - Confirm entrypoint descriptions render correctly and linked assets resolve.
4. **Publish or share** _(optional)_
   - _(Note: `bin/aidesigner skills package` is planned but not yet implemented)_
   - Share the Skill folder directly or create a git branch for review.
   - Publish through future Anthropic API tooling once enabled.

# Checklists

- [ ] CLI dependencies installed and authenticated.
- [ ] Skill scaffold regenerated after any schema changes.
- [ ] Validation passes without warnings.
- [ ] Entry point instructions tested within Claude Code or Claude desktop.

# Tips

- Pair this Skill with the [**Expansion Creator Enablement Skill**](../expansion-creator-enablement/SKILL.md) when mentoring new maintainers.
- Reference the integration roadmap at `docs/plans/anthropic-skills-integration.md` to track upcoming CLI surface changes.
- Keep generated Skill folders under version control to preserve institutional knowledge.

# Next Steps

After completing the orchestration flow, consider chaining into the **Architecture QA & Tech Stack Governance Skill** to ensure technical deliverables stay aligned with the validated Skill output.
