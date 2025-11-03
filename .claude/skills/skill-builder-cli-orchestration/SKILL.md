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

- You need to create a fresh Skill scaffold aligned with the Anthropic Skills roadmap.
- You want to validate or publish updates to an existing Skill bundle.
- You are wiring a Skill into local MCP or Claude CLI workflows and need consistent setup steps.

# Workflow

1. **Initialize environment**
   - Run `npm install` at the repository root.
   - Export any provider credentials (e.g., `export ANTHROPIC_API_KEY=...`) required by local scripts.
2. **Create or update the Skill**
   - Execute `bin/aidesigner skills init <slug>` to generate a new Skill folder scaffold.
   - Use `bin/aidesigner skills generate --from workflows/discovery` to transform existing assets into Skill instructions.
   - Apply linting with `npm run skills:validate` once scaffolding is complete.
3. **Preview in Claude**
   - Start the Claude orchestrator via `bin/aidesigner-claude start`.
   - Load the generated Skill folder into `~/.claude/skills` or pass `--skill-path` when launching the orchestrator.
   - Confirm entrypoint descriptions render correctly and linked assets resolve.
4. **Publish or share** _(optional)_
   - Package the Skill with `bin/aidesigner skills package --output dist/skills`.
   - Share the archive internally or publish through future Anthropic API tooling once enabled.

# Checklists

- [ ] CLI dependencies installed and authenticated.
- [ ] Skill scaffold regenerated after any schema changes.
- [ ] Validation passes without warnings.
- [ ] Entry point instructions tested within Claude Code or Claude desktop.

# Tips

- Pair this Skill with the **Expansion Creator Enablement Skill** when mentoring new maintainers.
- Reference the integration roadmap at `docs/plans/anthropic-skills-integration.md` to track upcoming CLI surface changes.
- Keep generated Skill folders under version control to preserve institutional knowledge.

# Next Steps

After completing the orchestration flow, consider chaining into the **Architecture QA & Tech Stack Governance Skill** to ensure technical deliverables stay aligned with the validated Skill output.
