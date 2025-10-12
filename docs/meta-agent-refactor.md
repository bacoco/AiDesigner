---
title: Refactor Meta-Agent Workflow
description: Technical-debt reconnaissance that highlights duplication, complexity, and risky dependencies.
slug: meta-agent-refactor
---

# Refactor Meta-Agent

The **Refactor** workflow performs a lightweight technical-debt assessment of the codebase. It combines duplication detection, complexity heuristics, and dependency risk analysis into a single actionable report.

## When to use

- Before refactoring sprints to select high-impact targets.
- Ahead of architectural reviews or stability audits.
- After large feature merges to surface regression risks.

## Command

```bash
npx aidesigner workflow start refactor
```

CLI prompts gather:

- **Scope directories** – the folders to scan (default `src`).
- **Dependency files** – manifests such as `package.json` or `requirements.txt`.

## Outputs

All reports are stored under `reports/refactor/`:

- `duplication-*.md` – repeated block candidates with file locations.
- `complexity-*.md` – files exceeding heuristic thresholds.
- `dependencies-*.md` – flagged packages or requirements.
- `technical-debt-*.md` – summary roll-up referencing each detailed report.

## Tips

- Provide both JavaScript/TypeScript and Python paths when auditing hybrid repositories.
- Adjust dependency manifests before rerunning to confirm remediation.
- Combine the output with Genesis plans to prioritize future scaffolding or clean-up tasks.
