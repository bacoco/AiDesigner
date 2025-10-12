---
title: Genesis Meta-Agent Workflow
description: Orchestrated scaffolding workflow that decomposes new projects into coordinated sub-agents.
slug: meta-agent-genesis
---

# Genesis Meta-Agent

The **Genesis** workflow decomposes a project idea into dedicated scaffolding domains and generates sub-agent missions for each layer of the stack.

## When to use

- Starting a new product or proof-of-concept from a high-level brief.
- Capturing the initial repository structure before any code is written.
- Coordinating frontend, backend, database, and CI/CD scaffolding tasks.

## Command

```bash
npx aidesigner workflow start genesis
```

The CLI prompts for:

- **Project name** – used inside generated artifacts.
- **Project type** – contextual notes for the orchestration report.
- **Technology stack** – comma separated list of frameworks or services.

## Outputs

Genesis saves artifacts in two predictable locations:

- `reports/genesis/` – blueprint, sub-agent roster, and the orchestration plan.
- `migrations/genesis/` – an initial SQL draft ready to evolve into the first migration.

Each artifact captures the meta-agent’s reasoning, expected sequencing, and the work delegated to downstream agents.

## Tips

- Provide specific stack items (for example `Next.js, Supabase, Playwright`) so the generated missions include the right tooling.
- You can re-run the workflow as requirements evolve; each run is timestamped to avoid overwriting earlier plans.
- Pair Genesis with the Librarian workflow to document the repository once the scaffolding is complete.
