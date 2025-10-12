# Repository Directory Overview

This summary explains how the major top-level folders in the AiDesigner monorepo are used and what role they play in the end-to-end workflow.

## Runtime-critical directories

- **`aidesigner-core/`** – Markdown/YAML knowledge base that provides the canonical agents, workflows, templates, tasks, and QA checklists that the orchestrator loads at runtime.【F:docs/AGENTS.md†L13-L53】
- **`agents/`** – Additional orchestrator personas (e.g., invisible orchestrator, phase detector) that the CLI wrappers read to stage conversations and workflow transitions.【F:docs/AGENTS.md†L55-L58】【F:docs/deployment/deployment-footprint.md†L13-L14】
- **`bin/`** – Node.js entrypoints exposed through the npm `bin` field so `npx aidesigner` (and Claude/Codex variants) can launch the runtime.【F:docs/AGENTS.md†L59-L62】【F:docs/deployment/deployment-footprint.md†L9-L11】
- **`common/`** – Shared runtime utilities (environment parsing, integrity safeguards, helper tasks) imported by the binaries during normal execution.【F:docs/deployment/deployment-footprint.md†L9-L11】
- **`dist/`** – Compiled output (agent bundles, MCP server) produced by the build scripts and required whenever the CLI registers MCP servers or serves prebuilt agents.【F:docs/AGENTS.md†L16-L84】【F:docs/deployment/deployment-footprint.md†L9-L13】
- **`mcp/`** – Default Model Context Protocol configurations that ship with the CLI; launchers expect these JSON files when starting the local MCP server or the Quick Designer pathway.【F:docs/deployment/deployment-footprint.md†L17-L18】【F:docs/QUICK-DESIGNER-V4.md†L111-L119】

## Development content and tooling

- **`apps/`** – Experimental and proof-of-concept applications (such as `apps/aidesigner-poc`) used to demonstrate token extraction, component detection, and Shadcn code generation outside the core CLI shipping footprint.【F:docs/deployment/deployment-footprint.md†L29-L31】【F:docs/COMPLETE-WORKFLOW.md†L239-L267】
- **`packages/`** – TypeScript packages that implement inference, code generation, shared schema/types, validators, and MCP helpers which back the prototypes and future runtime evolution.【F:docs/code-review-summary.md†L4-L29】
- **`prompts/`** – Library of LLM prompt templates (e.g., Gemini or Nano Banana design briefs) that support experimentation and documentation outside of the published npm bundle.【F:docs/deployment/deployment-footprint.md†L29-L31】【F:docs/aidesigner-poc-kit.md†L60-L70】

## Documentation and guidance

- **`docs/`** – Comprehensive documentation set for methodology, workflows, deployment, QA gates, epics, and stories that the agents generate and reference during engagements.【F:docs/AGENTS.md†L102-L110】【F:docs/DUAL_LANE_ORCHESTRATION.md†L188-L355】

Together, these directories cover both the runtime assets that must ship with the CLI and the supporting experiments, packages, and documentation that guide development and future enhancements. None of the folders are vestigial—the deployment audit tracks which ones are bundled versus kept for local development so maintainers know exactly how each piece fits into the AiDesigner workflow.【F:docs/deployment/deployment-footprint.md†L3-L31】
