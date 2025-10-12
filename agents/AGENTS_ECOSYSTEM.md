# The Compriseur Agents Ecosystem

This document outlines the architecture of the AI-driven agent ecosystem used in this project. The core philosophy is a separation of concerns, managed by a hierarchy of **Meta-Agents** (Orchestrators) that dynamically generate and deploy specialized **Sub-Agents** to perform concrete tasks.

---

## 1. The Foundational Layer: Tooling (MCPs)

At the base of everything is the suite of available tools, or Model-Copilot-Platforms (MCPs). All agents operate by invoking these tools. This layer is discoverable, allowing the entire system to be extensible. The primary categories of tools are:

- **File System Tools:** `read_file`, `write_file`, `replace`, `glob`, `list_directory`
- **Execution Tools:** `run_shell_command`
- **Web & API Tools:** `web_fetch`, `google_web_search`
- **Browser Interaction Tools:** `navigate_page`, `take_snapshot`, `click`, `fill_form`, `performance.start_trace`, etc.
- **Platform-Specific Tools:** `supabase.*`, `postman.*`

### The MCP Inspector Agent

To make this layer accessible, a special meta-agent exists:

- **`meta-agent-mcp-inspector.md`**: Its only job is to report the full list of available tools and their signatures. All other meta-agents should query it first to understand their capabilities.

---

## 2. The Orchestration Layer: Meta-Agents

Meta-Agents are high-level orchestrators. They do not perform low-level tasks themselves. Instead, they analyze a high-level goal, decompose it, and generate a team of temporary sub-agents to execute the plan.

### The Core Development & QA Loop

1.  **`meta-agent-architect.md` (The Builder):**
    - **Input:** A feature request (e.g., "Add password reset").
    - **Action:** Decomposes the feature into backend, frontend, and database sub-tasks. Generates specialized "developer" sub-agents for each.
    - **Output:** A modified codebase and a `Handoff Document` detailing what was changed.

2.  **`meta-agent-orchestrator.md` (The "Quasar" QA Agent):**
    - **Input:** The `Handoff Document` from the Architect.
    - **Action:** Reads the handoff to understand what was built. Generates specialized "tester" sub-agents to validate each part of the new feature across the full stack.
    - **Output:** A `Global Quality Report` detailing successes and failures.

This `Architect -> Quasar` loop forms the primary cycle of development and validation.

### Other Lifecycle Meta-Agents

- **`meta-agent-genesis.md` (The Project Starter):**
  - **Role:** Initializes a brand new, production-ready project from scratch based on a specified tech stack.

- **`meta-agent-librarian.md` (The Documenter):**
  - **Role:** Runs periodically to scan the codebase and automatically update the project's documentation (`/docs`) to reflect the current state of the architecture, API, and database schema.

- **`meta-agent-refactor.md` (The Maintainer):**
  - **Role:** Proactively scans the code for technical debt (duplication, complexity, outdated dependencies) and orchestrates its improvement.

---

## 3. The Execution Layer: Utility Agents & Sub-Agents

This layer consists of agents that perform concrete tasks. They are either generated on-the-fly by Meta-Agents or can be invoked directly by a human for a specific purpose.

- **Dynamically Generated Sub-Agents:** These are temporary agents created by orchestrators. They have a very narrow, specific mission (e.g., "_Your only job is to add a `created_at` column to the `posts` table_" or "_Your only job is to test the `POST /login` endpoint_).

- **Pre-Defined Utility Agents:** These are the first agents we created. They represent powerful, reusable workflows that can be called by a human or whose logic can be incorporated by a meta-agent when generating a sub-agent.
  - **`validation-ui-web-page.md`**: A generic UI tester that clicks all buttons and reports errors.
  - **`visual-implementer-agent.md`**: An advanced agent that iteratively codes a UI to match a visual mockup.
