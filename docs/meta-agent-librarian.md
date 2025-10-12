---
title: Librarian Meta-Agent Workflow
description: Automated documentation steward that regenerates architecture, API, and setup references.
slug: meta-agent-librarian
---

# Librarian Meta-Agent

The **Librarian** workflow keeps project documentation synchronized with the current state of the repository. It analyzes the file tree, interrogates Supabase for schema details, and validates onboarding instructions.

## When to use

- After a major merge into `main` or before a release.
- During onboarding to guarantee developers receive accurate architecture and API docs.
- On a schedule (nightly or weekly) to prevent documentation rot.

## Command

```bash
npx aidesigner workflow start librarian
```

Prompts collect optional overrides:

- **Scope directories** – a comma separated list of paths to scan (default `src`).
- **API entry files** – optional explicit files for route detection.
- **Development guide path** – defaults to `DEVELOPMENT_GUIDE.md`.

## Outputs

Artifacts are written inside `docs/`:

- `architecture-*.md` – Mermaid diagrams and component listings.
- `api-reference-*.md` – endpoint catalog derived from the inspected routes.
- `database-schema-*.md` – Supabase schema export (or a placeholder when unavailable).
- `setup-validation-*.md` – dry-run summary of onboarding commands.

These files are timestamped to preserve historical snapshots of the documentation refresh.

## Tips

- Provide Supabase credentials before running so the schema export succeeds.
- Pair with the Refactor workflow to attach documentation updates to technical debt reports.
- Keep `DEVELOPMENT_GUIDE.md` structured with fenced code blocks and `$`-prefixed commands for best extraction results.
