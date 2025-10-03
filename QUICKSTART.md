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

```bash
# Run this ONE command - it does everything!
npx bmad-invisible@latest start
```

Done! The command automatically:

- Creates `package.json` if needed
- Sets up project structure
- Installs all dependencies
- Launches the selected chat interface

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
# OR use explicit commands:
# npm run bmad:claude
# npm run bmad:codex
# npm run bmad:opencode

```

### Option 2: Global Installation

```bash
# Install globally once
npm install -g bmad-invisible

# Use anywhere
cd your-project
bmad-invisible init
bmad-invisible build

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
