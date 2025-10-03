---

# commands/auto-dev.md

command:
name: auto-dev
description: Provide implementation guidance, scaffolding plan, and coding conventions without exposing internal phases
usage: Triggered when stories are ready or the user requests build/implementation help

execution:

- Map stories → tasks and subtasks
- Propose scaffolding (repo layout, core modules, interfaces)
- Recommend coding conventions and Definition of Done
- Note integration contracts (APIs, events, schemas)
- Suggest incremental delivery plan (feature flags, toggles)

output_to_user:

- Friendly build plan with actionable steps
- Optional code snippets or pseudo-code illustrating the approach
