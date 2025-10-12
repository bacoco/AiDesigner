# Compounding Engineering Integration

The Architect orchestration loop can delegate task decomposition to the
[`everymarketplace/compounding-engineering`](https://github.com/everymarketplace/compounding-engineering)
plugin. This guide explains how to install the companion repository, provide
credentials, and understand how the planner consumes the resulting task graph.

## Repository layout

AiDesigner expects the companion repository to live at:

```
external/compounding-engineering/
```

You can override the location by setting the `COMPOUNDING_ENGINEERING_ROOT`
environment variable. The adapter reads
`packages/meta-agents/config/compounding-engineering.json` to resolve the
manifest and CLI invocation metadata.

## Cloning and updating the companion repo

Use the CLI helper to fetch or update the integration:

```bash
npx aidesigner companion-sync
```

If the repository is missing, the command prints the `git clone` invocation,
which defaults to:

```bash
git clone https://github.com/everymarketplace/compounding-engineering.git external/compounding-engineering
```

Run the command again whenever you want to pull upstream changes. Set
`COMPOUNDING_ENGINEERING_ROOT` if you want to maintain the checkout elsewhere
(e.g., inside a monorepo workspace).

## Authentication

Two environment variables are available for API-based deployments:

| Variable                               | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `COMPOUNDING_ENGINEERING_API_KEY`      | Auth token passed to the plugin process |
| `COMPOUNDING_ENGINEERING_WORKSPACE_ID` | Optional workspace or tenant selector   |

Populate these variables in your shell, `.env`, or CI secrets store. The CLI
passes them through when invoking the plugin commands.

## Architect planning flow

During **Step 1 – Task Decomposition**, the Architect orchestrator calls the
`CompoundingEngineeringPlanningAdapter`, which performs the following actions:

1. Load the plugin manifest from the companion repository.
2. Execute the `/create-tasks` command with the feature brief as JSON input.
3. Normalize the returned missions into the Architect dependency graph format.
4. Merge the generated developer sub-agent missions with the existing plan.

The normalized task graph is exposed to downstream tooling, ensuring that
missions, dependency edges, and metadata remain traceable back to the plugin.

## Troubleshooting

- **Missing repository** – Run `npx aidesigner companion-sync` to see cloning
  instructions or set `COMPOUNDING_ENGINEERING_ROOT` to the correct path.
- **Manifest errors** – Verify that `packages/compounding-engineering/manifest.json`
  exists within the companion checkout. Update the config file if the manifest
  moves in a future release.
- **Authentication failures** – Ensure `COMPOUNDING_ENGINEERING_API_KEY` and
  related variables are exported in the shell that launches the orchestrator.
