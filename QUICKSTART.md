# BMAD-Invisible Quick Start Guide

## What You Get

BMAD-Invisible provides a **natural conversational interface** that guides you through project development using the proven BMAD methodology - without you needing to learn any methodology jargon.

**You talk naturally. It generates professional deliverables.**

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/bacoco/BMAD-invisible.git
cd BMAD-invisible

# 2. Install dependencies
npm install

# 3. Build the MCP server
npm run build:mcp
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

### Start a Conversation

```bash
npm run chat
```

That's it! Just type your project idea and have a natural conversation.

### Example Session

```
🎯 Starting BMAD Invisible Orchestrator...
📡 MCP Server: bmad-invisible-orchestrator
🤖 Agent: Invisible BMAD Orchestrator
💬 Type your project idea to begin!

You: Help me build a family chore management app
```
