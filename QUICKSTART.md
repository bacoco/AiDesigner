# BMAD-Invisible Quick Start Guide

## What You Get

BMAD-Invisible provides a **natural conversational interface** that guides you through project development using the proven BMAD methodology - without you needing to learn any methodology jargon.

**You talk naturally. It generates professional deliverables.**

## Installation

### Option 1: NPX One-Command (Recommended - Zero Setup)

```bash
# Navigate to your project directory (or create a new one)
mkdir my-project && cd my-project
```

You'll be prompted to choose between Claude, Codex, or OpenCode. Or pass
`--assistant=claude`, `--assistant=codex`, or `--assistant=opencode` to skip the prompt.
Need ZhipuAI's GLM? Add `--glm` / `--llm-provider=glm` (requires `ZHIPUAI_API_KEY`
or `GLM_API_KEY`). Use `--anthropic` when you want to switch back to Claude.

```bash
# Run this ONE command - it does everything!
npx bmad-invisible@latest start
```

Done! The command automatically:

- Creates `package.json` if needed
- Sets up project structure
- Installs all dependencies
- Launches the selected chat interface

If you opt into the bundled shadcn UI helpers, the installer writes
`components.json` using the official shadcn schema so future component imports
(`npx shadcn@latest add card`, etc.) know your Tailwind paths and alias
configuration.

> **💡 Tip**: Always use `@latest` to avoid npx cache issues on either flow!

### Option 1b: NPX Step-by-Step

```bash
# Navigate to your project directory
cd your-project

# Initialize BMAD-invisible
npx bmad-invisible@latest init

# Install dependencies
npm install


# Start chatting (prompts for your choice)
npm run bmad
# Force GLM for the orchestrator (requires ZHIPUAI_API_KEY or GLM_API_KEY)
# npm run bmad -- --glm
# OR use explicit commands:
# npm run bmad:claude    # respects --glm/--anthropic flags
# npm run bmad:codex     # respects --glm/--anthropic flags
# npm run bmad:opencode  # respects --glm/--anthropic flags

```

### Option 2: Global Installation

```bash
# Install globally once
npm install -g bmad-invisible

# Use anywhere
cd your-project
bmad-invisible init
bmad-invisible build

# Add --glm / --llm-provider=glm to default to GLM
bmad-invisible start

```

### Option 3: Local Development

```bash
# Clone the repository
git clone https://github.com/bacoco/BMAD-invisible.git
cd BMAD-invisible

# Install dependencies
npm install

# Build the MCP server
npm run build:mcp


# Start conversation (prompts for choice)
npm run bmad
```

#### Choosing Your LLM Provider (GLM vs Anthropic)

- Pass `--glm` (alias `--llm-provider=glm`) with any command to run on ZhipuAI's
  GLM. Provide `ZHIPUAI_API_KEY` or `GLM_API_KEY` in your environment.
- Override the model via `--llm-model=<model>` or `LLM_MODEL`.
- Persist defaults by committing a `.env` file alongside your project:

  ```bash
  # .env
  LLM_PROVIDER=glm
  ZHIPUAI_API_KEY=sk-...
  LLM_MODEL=glm-4-plus
  ```

- Swap back to Anthropic with `--anthropic` or `LLM_PROVIDER=claude`.
- The launcher injects these overrides only into the spawned CLI so your shell
  environment stays untouched.

> **MCP Config Formats**
>
> - `.claude/mcp-config.json` powers Claude Code. Optional `chrome-devtools` and
>   `shadcn` servers are present but disabled until you install them.
> - `~/.codex/config.toml` powers Codex CLI. The same servers appear as TOML
>   tables (`[mcp_servers.chrome_devtools]`, `[mcp_servers.shadcn]`) with
>   `auto_start = false` by default.

## Prerequisites

You need at least one local chat CLI installed:

```bash
# Check if installed
codex --version

# If not installed, get it from:
# https://platform.openai.com/docs/guides/codex
```

- OpenAI Codex CLI (`codex`)
- Claude CLI (`claude`) – legacy support
- OpenCode CLI (`opencode`)

## Usage

### Quick Commands

```bash
npx bmad-invisible@latest start # 🚀 One-command setup and launch (prompts for choice)
npx bmad-invisible init         # Initialize in project
npx bmad-invisible build        # Build MCP server
npm run bmad                    # Start conversation (prompts for assistant choice)
npm run bmad:claude             # Start Claude directly
npm run bmad:codex              # Start Codex directly
npm run bmad:opencode           # Start OpenCode directly
# Append -- --glm (or -- --anthropic) to any npm script to swap providers

npx bmad-invisible test         # Run tests
npx bmad-invisible validate     # Validate config
npx bmad-invisible help         # Show all commands
```

### Example Session

Run `npm run bmad` and choose your assistant, or use direct commands (`npm run bmad:claude`, `npm run bmad:codex`, `npm run bmad:opencode`). You'll see an experience like this:

```
🎯 Starting BMAD Invisible Orchestrator...
📡 MCP Server: bmad-invisible-orchestrator
🤖 Agent: Invisible BMAD Orchestrator
💬 Type your project idea to begin!

You: Help me build a family chore management app
```
