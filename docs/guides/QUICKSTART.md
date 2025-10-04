# Agilai Quick Start Guide

## What You Get

Agilai provides a **natural conversational interface** that guides you through project development using the proven BMAD methodology - without you needing to learn any methodology jargon.

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
npx agilai@latest start
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

# Initialize Agilai
npx agilai@latest init

# Install dependencies
npm install


# Start chatting (prompts for your choice)
npx agilai start
# Force GLM for the orchestrator (requires ZHIPUAI_API_KEY or GLM_API_KEY)
# npx agilai start --glm
# OR use explicit commands:
# npx agilai start --assistant=claude    # respects --glm/--anthropic flags
# npx agilai start --assistant=codex     # respects --glm/--anthropic flags
# npx agilai start --assistant=opencode  # respects --glm/--anthropic flags

```

### Option 2: Global Installation

```bash
# Install globally once
npm install -g agilai

# Use anywhere
cd your-project
agilai init
agilai build

# Add --glm / --llm-provider=glm to default to GLM
agilai start

```

### Option 3: Local Development

```bash
# Clone the repository
git clone https://github.com/bacoco/Agilai.git
cd Agilai

# Install dependencies
npm install

# Build the MCP server
npm run build:mcp


# Start conversation (prompts for choice)
npx agilai start
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

## ⚡ Supercharge with MCP (Optional but Recommended)

Extend your AI with powerful tools in 30 seconds! Add GitHub integration, database access, filesystem tools, and more.

### Quick Setup

```bash
# Get smart suggestions based on your project
npm run mcp:suggest
# 🔍 Analyzing project...
# 💡 Recommended: github, filesystem, postgres
# Install all? (y/n)

# Or install specific tools
npm run mcp:install github      # GitHub integration
npm run mcp:install filesystem  # File operations
npm run mcp:install postgres    # Database access
```

### Popular Integrations

**For Full-Stack Projects:**

```bash
npm run mcp:install filesystem github postgres puppeteer
# ✓ Complete development environment ready!
```

**For API Development:**

```bash
npm run mcp:install filesystem postgres brave-search
# ✓ Backend tools configured!
```

**For Frontend Projects:**

```bash
npm run mcp:install filesystem github puppeteer
# ✓ Frontend tools ready!
```

### What You Get

After installing MCP servers, your AI can:

- 🐙 **GitHub**: Create issues, manage PRs, review code
- 📁 **Filesystem**: Read/write files, search codebase
- 🗄️ **PostgreSQL**: Query databases, analyze schemas
- 🌐 **Puppeteer**: Browser automation, E2E testing
- 🔍 **Brave Search**: Web search integration
- 💬 **Slack**: Team notifications

### Example Usage

```
You: "Create a GitHub issue for the login bug"
AI: ✓ Created issue #42: "Fix login authentication error"

You: "Show me all users who signed up this week"
AI: [Queries database] Found 47 users. Top day was Tuesday.

You: "Find all TODO comments in the codebase"
AI: Found 23 TODOs across 8 files. Oldest is 3 months old.
```

**📖 See [MCP Management Guide](docs/mcp-management.md) for complete documentation**

## Usage

### Quick Commands

```bash
npx agilai@latest invisible start # 🚀 One-command setup and launch (prompts for choice)
npx agilai invisible init         # Initialize in project
npx agilai invisible build        # Build MCP server
npx agilai start                    # Start conversation (prompts for assistant choice)
npx agilai start --assistant=claude             # Start Claude directly
npx agilai start --assistant=codex              # Start Codex directly
npx agilai start --assistant=opencode           # Start OpenCode directly
# Append --glm (or --anthropic) to any Agilai command to swap providers

npx agilai invisible test         # Run tests
npx agilai invisible validate     # Validate config
npx agilai invisible help         # Show all commands
```

### Example Session

Run `npx agilai start` and choose your assistant, or use direct commands (`npx agilai start --assistant=claude`, `npx agilai start --assistant=codex`, `npx agilai start --assistant=opencode`). You'll see an experience like this:

```
🎯 Starting Agilai Orchestrator...
📡 MCP Server: agilai-orchestrator
🤖 Agent: Agilai Orchestrator
💬 Type your project idea to begin!

You: Help me build a family chore management app
```
