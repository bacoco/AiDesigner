# Compounding Engineering Integration

The Architect orchestration loop now ships with a **built-in copy** of the
Compounding Engineering planner. AiDesigner vendors the manifest and CLI under
`packages/compounding-engineering/`, removing the need to clone the companion
repository from [`everymarketplace/compounding-engineering`](https://github.com/everymarketplace/compounding-engineering).
This guide explains how to verify the assets, supply credentials, and
understand how the planner feeds the Architect task graph.

## Built-in layout

The planner assets live inside the monorepo:

```
packages/compounding-engineering/
  cli.mjs
  manifest.json
```

`packages/meta-agents/config/compounding-engineering.json` points the
orchestrator at these files and runs the CLI from the repository root. Set
`COMPOUNDING_ENGINEERING_ROOT` only if you need to override the execution
directory (for example, during testing with fixtures).

## Verifying the integration

Use the CLI helper to confirm everything is wired correctly:

```bash
npx aidesigner companion-sync
```

The command now validates that the manifest and CLI entry point exist inside
the repository and reports their locations. No git operations are required.

## Authentication

Two environment variables remain available for deployments that require
authenticated planner behavior:

| Variable                               | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `COMPOUNDING_ENGINEERING_API_KEY`      | Auth token passed to the plugin process |
| `COMPOUNDING_ENGINEERING_WORKSPACE_ID` | Optional workspace or tenant selector   |

Populate these variables in your shell, `.env`, or CI secrets store. The CLI
passes them through when invoking the plugin commands.

## Architect planning flow

During **Step 1 – Task Decomposition**, the Architect orchestrator calls the
`CompoundingEngineeringPlanningAdapter`, which performs the following actions:

1. Load the vendored manifest.
2. Execute the `/create-tasks` command with the feature brief as JSON input.
3. Normalize the returned missions into the Architect dependency graph format.
4. Merge the generated developer sub-agent missions with the existing plan.

The normalized task graph is exposed to downstream tooling, ensuring that
missions, dependency edges, and metadata remain traceable back to the planner.

## Troubleshooting

- **Missing files** – Run `npx aidesigner companion-sync` to confirm the
  manifest and CLI exist. Reinstall AiDesigner if either file is missing.
- **Manifest errors** – If you customize the manifest path, update
  `packages/meta-agents/config/compounding-engineering.json` to match.
- **Authentication failures** – Ensure `COMPOUNDING_ENGINEERING_API_KEY` and
  related variables are exported in the shell that launches the orchestrator.
