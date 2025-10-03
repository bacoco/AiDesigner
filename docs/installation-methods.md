# Installation Methods

This guide covers all installation options for Agilai. For quick setup, see the [Quick Start Guide](guides/QUICKSTART.md).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: NPX One-Command Setup](#option-1-npx-one-command-setup-recommended)
- [Option 2: NPX Step-by-Step](#option-2-npx-step-by-step)
- [Option 3: Global Installation](#option-3-global-installation)
- [Option 4: Local Development](#option-4-local-development)
- [LLM Provider Selection](#llm-provider-selection)
- [Codex CLI Integration](#codex-cli-integration)
- [MCP Configuration](#mcp-configuration)

## Prerequisites

- Node.js ≥ 20.10.0
- npm ≥ 9.0.0
- At least one chat CLI installed locally:
  - **OpenAI Codex CLI**
  - **Claude CLI**
  - **OpenCode CLI**

## Option 1: NPX One-Command Setup (Recommended)

The fastest way to get started - one command does everything:

```bash
npx agilai@latest start
```

### Customization Flags

```bash
# Choose specific assistant (skip prompt)
npx agilai@latest start --assistant=claude
npx agilai@latest start --assistant=codex
npx agilai@latest start --assistant=opencode

# Use ZhipuAI GLM instead of Anthropic
npx agilai@latest start --glm
npx agilai@latest start --llm-provider=glm

# Switch back to Anthropic
npx agilai@latest start --anthropic
npx agilai@latest start --llm-provider=claude
```

### What It Does

1. Creates project structure
2. Installs all dependencies
3. Builds MCP server
4. Prompts for assistant choice (if not specified)
5. Launches selected chat interface

### shadcn UI Integration

During setup, you can opt-in to shadcn UI helpers. If enabled, the installer creates a `components.json` file following the [shadcn/ui schema](https://ui.shadcn.com/docs/installation), allowing commands like `npx shadcn@latest add button` to work without additional configuration.

> **💡 Tip**: Always use `@latest` to ensure you get the newest version!

## Option 2: NPX Step-by-Step

For more control over the installation process:

```bash
# Initialize project structure
npx agilai@latest init

# Install dependencies
npm install

# Start chatting
npm run bmad              # Prompts for assistant choice
npm run bmad:claude       # Claude front-end
npm run bmad:codex        # Codex front-end
npm run bmad:opencode     # OpenCode front-end

# Use GLM provider
npm run bmad -- --glm
npm run bmad:claude -- --glm
```

## Option 3: Global Installation

Install globally for use across multiple projects:

```bash
# Install globally
npm install -g agilai

# Navigate to any project
cd my-project

# Initialize
agilai init

# Build
agilai build

# Start (prompts for assistant)
agilai start

# Or specify assistant
agilai start --assistant=claude
agilai start --glm
```

## Option 4: Local Development

For contributors and advanced users:

```bash
# Clone repository
git clone https://github.com/bacoco/Agilai.git
cd Agilai

# Install dependencies
npm install

# Build MCP server
npm run build:mcp

# Start conversational interface
npm run bmad                # Prompts for choice
npm run bmad:claude         # Claude CLI
npm run bmad:codex          # Codex CLI
npm run bmad:opencode       # OpenCode CLI
```

### Development Commands

```bash
# Build all components
npm run build

# Build only agents
npm run build:agents

# Build only MCP
npm run build:mcp

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

> **Note**: MCP assets are prebuilt in the published package. The optional postinstall step only rebuilds TypeScript when the `typescript` package is available (development environments).

## LLM Provider Selection

Agilai supports multiple LLM providers for the orchestrator:

### ZhipuAI GLM

Use ZhipuAI's GLM models with the `--glm` flag:

```bash
# CLI flag
npm run bmad -- --glm
npx agilai@latest start --glm

# Or explicit provider
npm run bmad -- --llm-provider=glm
```

**Required environment variables:**

```bash
# .env file
LLM_PROVIDER=glm
ZHIPUAI_API_KEY=sk-...              # Preferred
# OR
GLM_API_KEY=sk-...                   # Also supported

# Optional model override
LLM_MODEL=glm-4-plus
```

See [Configuration Guide](configuration.md) for complete GLM setup details.

### Anthropic (Default)

Use Anthropic's Claude models (default behavior):

```bash
# CLI flag
npm run bmad -- --anthropic
npx agilai@latest start --anthropic

# Or explicit provider
npm run bmad -- --llm-provider=claude
```

**Environment variables:**

```bash
# .env file
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...        # For direct API access
```

> **Note**: When using Claude CLI, OpenCode CLI, or Codex CLI, the CLI handles authentication. API keys are only needed for direct GLM or Anthropic API access.

### Switching Providers

Switch providers anytime with CLI flags:

```bash
# Start with GLM
npm run bmad -- --glm

# Later, switch to Anthropic
npm run bmad -- --anthropic
```

Environment variable changes take effect on next launch. CLI flags override environment variables.

## Codex CLI Integration

Interactive installs automatically configure Codex CLI for immediate use:

### What Gets Configured

1. **`AGENTS.md`**: Generated/updated with BMAD agent context for Codex memory
2. **`~/.codex/config.toml`**: Updated with:
   - `agilai` MCP server entry
   - Optional helper entries for `chrome-devtools` and `shadcn` (disabled by default)
   - Sensible defaults (GPT-5-Codex model, medium reasoning, automatic approvals)

### Example Configuration

```toml
# ~/.codex/config.toml
[[mcp]]
id = "agilai-codex"
command = "npx"
args = ["agilai-codex"]
autostart = true

  [mcp.env]
  # Optional: enforce guarded writes
  CODEX_APPROVAL_MODE = "true"
  CODEX_APPROVED_OPERATIONS = "generate_deliverable:prd,execute_quick_lane"

  # Optional: override LLM routing per lane
  CODEX_QUICK_MODEL = "gpt-4.1-mini"
  CODEX_COMPLEX_MODEL = "claude-3-5-sonnet-20241022"

  # Observability
  CODEX_LOG_CONTEXT = '{"environment":"local"}'
  CODEX_METRICS_STDOUT = "true"
```

See the full example in [`codex-config.toml.example`](../codex-config.toml.example).

### Non-Interactive Environments

CI environments skip the global config step. Review and customize [`codex-config.toml.example`](../codex-config.toml.example) for your use case.

## MCP Configuration

### Configuration File Formats

Different CLIs use different MCP configuration formats:

**Claude / Claude Code** (`.claude/mcp-config.json`):

```json
{
  "agilai": {
    "command": "npx",
    "args": ["agilai-codex"],
    "disabled": false
  },
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"],
    "disabled": true
  }
}
```

**Codex CLI** (`~/.codex/config.toml`):

```toml
[[mcp]]
id = "agilai"
command = "npx"
args = ["agilai-codex"]
auto_start = true

[[mcp]]
id = "chrome-devtools"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-chrome-devtools"]
auto_start = false
```

### Adding MCP Servers

After installation, add more MCP servers:

```bash
# Browse available servers
npm run mcp:browse

# Install specific server
npm run mcp:install github

# Get suggestions for your project
npm run mcp:suggest
```

See the [MCP Management Guide](mcp-management.md) for complete details.

## Troubleshooting

### Build Failures

If `npm run build:mcp` fails:

1. Ensure TypeScript is installed: `npm install typescript --save-dev`
2. Check Node.js version: `node --version` (must be ≥ 20.10.0)
3. Clear caches: `rm -rf node_modules dist && npm install`

### MCP Server Not Starting

If the MCP server doesn't connect:

1. Verify build succeeded: Check for `dist/mcp/` directory
2. Test standalone: `npm run mcp` (should start without errors)
3. Check CLI config: `cat ~/.codex/config.toml` or `cat .claude/mcp-config.json`

### Wrong LLM Provider

If using the wrong LLM provider:

1. Check environment variables: `echo $LLM_PROVIDER`
2. Verify `.env` file contents
3. Use explicit CLI flag: `npm run bmad -- --glm` or `--anthropic`

### Permission Errors

If encountering permission errors:

```bash
# Linux/macOS
sudo npm install -g agilai

# Or use npx (no global install needed)
npx agilai@latest start
```

## Next Steps

- **[Quick Start Guide](guides/QUICKSTART.md)** - First-time usage walkthrough
- **[Configuration Guide](configuration.md)** - Advanced configuration options
- **[MCP Management Guide](mcp-management.md)** - Extending with MCP servers
- **[Usage Guide](guides/USAGE.md)** - Complete feature documentation
