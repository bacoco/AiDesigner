# BMAD-Invisible Quick Start Guide

## What You Get

BMAD-Invisible provides a **natural conversational interface** that guides you through project development using the proven BMAD methodology - without you needing to learn any methodology jargon.

**You talk naturally. It generates professional deliverables.**

## Installation

### Option 1: NPX One-Command (Recommended - Zero Setup)

```bash
# Navigate to your project directory (or create a new one)
mkdir my-project && cd my-project

# Run this ONE command - it does everything!
npx bmad-invisible start
```

Done! This automatically:

- Creates `package.json` if needed
- Sets up project structure
- Installs all dependencies
- Launches the chat interface

### Option 1b: NPX Step-by-Step

```bash
# Navigate to your project directory
cd your-project

# Initialize BMAD-invisible
npx bmad-invisible init

# Install dependencies
npm install

# Start chatting!
npm run bmad:chat
```

### Option 2: Global Installation

```bash
# Install globally once
npm install -g bmad-invisible

# Use anywhere
cd your-project
bmad-invisible init
bmad-invisible build
bmad-invisible chat
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

# Start conversation
npm run chat
```

## Prerequisites

You need **Claude Code CLI** installed (uses your Claude Pro subscription):

```bash
# Check if installed
claude --version

# If not installed, get it from:
# https://claude.ai/code
```

## Usage

### Quick Commands

```bash
npx bmad-invisible init        # Initialize in project
npx bmad-invisible build       # Build MCP server
npx bmad-invisible chat        # Start conversation
npx bmad-invisible test        # Run tests
npx bmad-invisible validate    # Validate config
npx bmad-invisible help        # Show all commands
```

### Example Session

```
🎯 Starting BMAD Invisible Orchestrator...
📡 MCP Server: bmad-invisible-orchestrator
🤖 Agent: Invisible BMAD Orchestrator
💬 Type your project idea to begin!

You: Help me build a family chore management app
```
