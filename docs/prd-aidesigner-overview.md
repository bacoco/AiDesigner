# AiDesigner Product Requirements Overview

## 1. Product Summary

AiDesigner delivers an end-to-end, conversation-driven workflow that takes a product idea through discovery, UI design, and agile implementation without handoffs or context loss.【F:README.md†L17-L83】 The platform fuses ideation, token extraction, visual concept generation, architecture, and code delivery into one orchestrated experience, allowing teams to move from inspiration URLs to production-ready implementation in a single flow.【F:README.md†L41-L120】

## 2. Objectives and Success Criteria

- **Reduce cross-discipline friction** by replacing traditional multi-team handoffs with a unified conversational journey.【F:README.md†L47-L120】
- **Guarantee design-to-development fidelity** by locking design tokens and component mappings before code generation.【F:README.md†L67-L120】
- **Enable private, local execution** so sensitive product IP never leaves the developer environment.【F:README.md†L121-L141】
- **Success metrics**: shortened concept-to-code cycle time, higher consistency between intended and delivered UI, and reduced need for manual restatements of requirements.

## 3. Target Users and Personas

- **Product Creators** seeking to rapidly validate and ship new product ideas with minimal overhead.【F:README.md†L25-L40】
- **Designers** who need structured, conversational guidance to produce consistent screen designs and tokens.【F:README.md†L57-L94】
- **Developers** requiring contextualized stories, architecture decisions, and code generation aligned with locked design constraints.【F:README.md†L93-L120】
- **AI Workflow Orchestrators** deploying agent teams across IDE and web chat environments for specialized delivery lanes.【F:docs/AGENTS.md†L14-L47】

## 4. In-Scope vs. Out-of-Scope

| In Scope                                                                       | Out of Scope                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Conversational requirement elicitation, UI journey mapping, and PRD generation | Manual design tooling or pixel-perfect Figma replacements    |
| Automated design token extraction from inspiration URLs                        | Hosting third-party design assets or external CDN management |
| Architecture, story drafting, and code generation based on locked tokens       | Cloud-based multi-tenant runtime services                    |
| Packaging agents and workflows for IDE or web upload contexts                  | Non-BMad methodologies or external agent frameworks          |

## 5. Experience Flow

1. **Idea & Discovery** – capture concept, users, and success criteria via natural conversation.【F:README.md†L41-L66】
2. **UI Design Innovation** – conversational UI designer walks each screen, extracts tokens via Chrome MCP, and generates per-screen visual prompts.【F:README.md†L67-L95】
3. **Agile Implementation** – auto-build PRDs, architecture plans, user stories, and code with design-locked constraints for delivery-ready output.【F:README.md†L95-L120】

## 6. Functional Requirements

- Provide a guided CLI journey (`npx aidesigner@latest start`) that orchestrates the three-phase flow end-to-end.【F:README.md†L104-L149】
- Extract colors, typography, and spacing tokens from inspiration URLs using Chrome MCP integration and surface them in the conversation.【F:README.md†L78-L95】
- Generate visual concept prompts per screen that downstream model integrations (Gemini, Nano Banana) can consume.【F:README.md†L78-L95】
- Lock design tokens and component mappings (Shadcn/MUI) prior to development planning to ensure fidelity.【F:README.md†L95-L120】
- Produce PRDs, architecture specs, development stories, and implementation-ready code using the captured design context.【F:README.md†L95-L120】
- Support packaged agent bundles for both IDE (local markdown) and web UI (dist bundles) environments.【F:docs/core-architecture.md†L1-L86】【F:docs/AGENTS.md†L25-L63】

## 7. Non-Functional Requirements

- **Local-first privacy**: All workflows operate without external API calls, preserving confidentiality.【F:README.md†L121-L141】
- **Extensibility**: Architecture must allow new agent teams, workflows, and expansion packs to be added without modifying the core engine.【F:docs/core-architecture.md†L1-L124】【F:docs/AGENTS.md†L139-L149】
- **Dual-environment delivery**: Tooling must bundle agent resources for both IDE and web chat contexts via the web builder pipeline.【F:docs/core-architecture.md†L132-L147】
- **Template-driven consistency**: Documents and prompts rely on reusable templates with embedded processing logic to maintain quality across domains.【F:docs/core-architecture.md†L92-L105】

## 8. System Architecture Overview

- **Core Framework (`aidesigner-core/`)** supplies agents, workflows, templates, tasks, checklists, and knowledge base data that define behavior and outputs.【F:docs/core-architecture.md†L17-L111】
- **Tooling Layer (`tools/`)** bundles dependencies (e.g., `web-builder.js`) into distributable artifacts placed in `dist/` for upload or IDE consumption.【F:docs/core-architecture.md†L132-L142】
- **Dual Deployment Paths** allow agents to run via CLI within IDEs or as packaged `.txt` bundles for web interfaces.【F:docs/core-architecture.md†L143-L147】
- **Template Processing System** (template format spec, `create-doc`, `advanced-elicitation`) ensures consistent document generation and refinement workflows.【F:docs/core-architecture.md†L92-L105】

## 9. Integrations and Dependencies

- **Chrome MCP** for design token extraction within the conversational UI design phase.【F:README.md†L67-L95】
- **Shadcn/MUI component libraries** used during component mapping and implementation planning.【F:README.md†L95-L120】
- **BMAD Methodology Knowledge Base** sourced from `aidesigner-core/data/` to inform planning and execution.【F:docs/core-architecture.md†L84-L91】
- **CLI Variants** (Claude, Codex, OpenCode) configured via scripts in `bin/` to suit different local environments.【F:docs/AGENTS.md†L107-L142】

## 10. Release Plan & Milestones

1. **Environment Setup** – install Node.js ≥20.10, clone repository, and run `npm install`.
2. **Validation** – execute `npm run build`, `npm run build:agents`, and `npm run build:mcp` to ensure bundles compile; run `npm run validate` and `npm test` for quality gates.【F:docs/AGENTS.md†L25-L56】
3. **Workflow Verification** – run the conversational flow end-to-end via CLI, confirming token extraction, template outputs, and generated artifacts.
4. **Packaging** – produce IDE and web bundles; confirm `dist/mcp/mcp/server.js` exists before release.【F:docs/AGENTS.md†L71-L120】
5. **Publish** – follow `npm run pre-release`, `npm run version:patch`, and `npm publish` checklist once validation passes.【F:docs/AGENTS.md†L121-L152】

## 11. Success Metrics & Analytics

- Measure average duration from idea capture to code generation completion.
- Track design-token reuse rate across generated screens to ensure consistency.
- Monitor defect rate or manual rework required after code generation to validate fidelity.
- Capture user satisfaction via post-session surveys or CLI feedback prompts.

## 12. Risks and Mitigations

- **Token extraction failures** → Provide fallback manual token entry prompts and log errors for troubleshooting.
- **Template drift** → Enforce regression checks by running `npm run validate` and aligning template updates with QA checklists.【F:docs/AGENTS.md†L25-L56】【F:docs/core-architecture.md†L92-L105】
- **Environment fragmentation** → Maintain parity across CLI variants with shared configuration and release scripts.【F:docs/AGENTS.md†L107-L142】

## 13. Handoff Checklist for New Developers

- Review `README.md` for workflow orientation and CLI usage.【F:README.md†L1-L149】
- Study `docs/core-architecture.md` and `docs/AGENTS.md` for structural conventions, build commands, and release processes.【F:docs/core-architecture.md†L1-L160】【F:docs/AGENTS.md†L1-L152】
- Explore `aidesigner-core/` to understand agent, workflow, template, and task dependencies before contributing.
- Execute build and validation scripts locally to confirm environment readiness.【F:docs/AGENTS.md†L25-L56】
- Document learnings or updates in relevant templates or knowledge base files to keep agent behavior aligned across teams.【F:docs/core-architecture.md†L84-L105】
