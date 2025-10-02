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

Pick the assistant CLI you want and run the matching command:

```bash
# Claude Code CLI flow - one command does everything
npx bmad-invisible@latest start

# Codex CLI flow - same experience via Codex CLI
npx bmad-invisible-codex@latest start
```

Done! Either command automatically:

- Creates `package.json` if needed
- Sets up project structure
- Installs all dependencies
- Launches the chat interface

> **💡 Tip**: Always use `@latest` to avoid npx cache issues on either flow!

### Option 1b: NPX Step-by-Step

```bash
# Navigate to your project directory
cd your-project

# Initialize BMAD-invisible
npx bmad-invisible@latest init

# Install dependencies
npm install

# Start chatting with Claude CLI
npm run bmad:chat

# ...or chat via Codex CLI
npm run bmad:codex
```

### Option 2: Global Installation

```bash
# Install globally once
npm install -g bmad-invisible

# Use anywhere
cd your-project
bmad-invisible init
bmad-invisible build
bmad-invisible chat             # Claude CLI flow
bmad-invisible-codex chat       # Codex CLI flow
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

# Start conversation (Claude CLI)
npm run chat

# ...or Codex CLI flow
npm run codex
```

## Prerequisites

You need one of the supported conversational CLIs installed:

### Claude Code CLI

```bash
# Check if installed
claude --version

# If not installed, get it from:
# https://claude.ai/code
```

### Codex CLI

```bash
# Check if installed
codex --version

# If not installed, follow the setup instructions in your Codex workspace
```

## Usage

### Quick Commands

```bash
npx bmad-invisible init        # Initialize in project
npx bmad-invisible build       # Build MCP server
npx bmad-invisible chat        # Start conversation (Claude CLI)
npx bmad-invisible-codex chat  # Start conversation (Codex CLI)
npx bmad-invisible test        # Run tests
npx bmad-invisible validate    # Validate config
npx bmad-invisible help        # Show all commands
```

### Example Session

Start the CLI you prefer (`npm run chat` for Claude, `npm run codex` for Codex) and you'll see an experience like this:

```
🎯 Starting BMAD Invisible Orchestrator...
📡 MCP Server: bmad-invisible-orchestrator
🤖 Agent: Invisible BMAD Orchestrator
💬 Type your project idea to begin!

You: Help me build a family chore management app
```
