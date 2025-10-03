---

# commands/auto-qa.md

command:
name: auto-qa
description: Create a lightweight test plan, cases, and CI gates invisibly
usage: Triggered when features have implementation details or when the user asks how to validate quality

execution:

- Draft a concise test plan:
  - Scope and non-goals
  - Test types (unit, integration, e2e, accessibility, performance)
  - Environments and data strategy
- Propose representative test cases tied to acceptance criteria
- Define CI checks and quality gates (coverage thresholds, lint, typecheck)
- Risk-based prioritization of tests

output_to_user:

- Clear guidance on how to verify “it works”
- Optional list of tools/frameworks (kept short and pragmatic)
