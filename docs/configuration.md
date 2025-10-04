# Configuration Guide

Complete configuration reference for Agilai.

## Table of Contents

- [Environment Variables](#environment-variables)
- [LLM Provider Configuration](#llm-provider-configuration)
- [MCP Server Configuration](#mcp-server-configuration)
- [Codex CLI Configuration](#codex-cli-configuration)
- [Observability & Logging](#observability--logging)
- [Advanced Settings](#advanced-settings)

## Environment Variables

Agilai can be configured via environment variables in a `.env` file at your project root:

```bash
# .env

# LLM Provider (claude or glm)
LLM_PROVIDER=glm

# API Keys
AGILAI_GLM_API_KEY=sk-...       # For GLM (preferred)
ANTHROPIC_API_KEY=sk-ant-...    # For Claude

# Optional: Override model
LLM_MODEL=glm-4-plus            # Custom GLM model
```

Legacy names (`BMAD_*`, `GLM_*`, `ZHIPUAI_*`) continue to work, but new projects should prefer the `AGILAI_*` convention.

## LLM Provider Configuration

### ZhipuAI GLM Provider

Enable GLM (ZhipuAI) for the orchestrator:

#### CLI Flags

```bash
# Use GLM via flag
npm run bmad -- --glm
npx agilai start --glm

# Explicit provider specification
npm run bmad -- --llm-provider=glm
npx agilai start --llm-provider=glm
```

#### Environment Variables

Create a `.env` file:

```bash
# .env - GLM Configuration

# Set provider
LLM_PROVIDER=glm

# API Key (choose one format)
AGILAI_GLM_API_KEY=sk-...       # Preferred
GLM_API_KEY=sk-...               # Legacy alias
ZHIPUAI_API_KEY=sk-...          # Legacy alias (Codex CLI)

# Optional: Custom model
LLM_MODEL=glm-4-plus            # Default: glm-4

# Optional: Custom endpoint
AGILAI_GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
```

#### Variable Priority

When GLM mode is active, variables are resolved in this order:

| Variable                | Priority | Description                                   |
| ----------------------- | -------- | --------------------------------------------- |
| `AGILAI_GLM_BASE_URL`   | 1        | GLM API base URL (preferred)                  |
| `BMAD_GLM_BASE_URL`     | 2        | GLM API base URL (legacy support)             |
| `GLM_BASE_URL`          | 3        | GLM API base URL (standard alias)             |
| `ANTHROPIC_BASE_URL`    | 4        | Anthropic base URL (fallback)                 |
| `AGILAI_GLM_AUTH_TOKEN` | 1        | GLM authentication token (preferred)          |
| `BMAD_GLM_AUTH_TOKEN`   | 2        | GLM authentication token (legacy support)     |
| `GLM_AUTH_TOKEN`        | 3        | GLM authentication token (standard alias)     |
| `ANTHROPIC_AUTH_TOKEN`  | 4        | Anthropic auth token (fallback)               |
| `AGILAI_GLM_API_KEY`    | 1        | GLM API key (preferred)                       |
| `BMAD_GLM_API_KEY`      | 2        | GLM API key (legacy support)                  |
| `GLM_API_KEY`           | 3        | GLM API key (standard alias)                  |
| `ZHIPUAI_API_KEY`       | 4        | GLM API key (legacy Codex alias)              |
| `ANTHROPIC_API_KEY`     | 5        | Anthropic API key (fallback when nothing set) |

**Note:** At least one of `*_BASE_URL` or `*_API_KEY` must be set when using GLM mode. Legacy `BMAD_*`, `GLM_*`, and `ZHIPUAI_*` values continue to work, but `AGILAI_*` is now the canonical naming.

#### Custom Endpoints

GLM base URLs can include schemes, ports, and paths:

```bash
# Full custom endpoint (preferred)
AGILAI_GLM_BASE_URL=https://example.com:7443/custom/base
# Legacy fallback names such as BMAD_GLM_BASE_URL or GLM_BASE_URL remain supported.
# Agilai appends: /api/paas/v4/chat/completions

# Default (if no base URL provided)
# https://open.bigmodel.cn/api/paas/v4/chat/completions
```

#### Example Usage

```bash
# Set GLM provider and credentials (preferred names)
export AGILAI_ASSISTANT_PROVIDER=glm
export AGILAI_GLM_BASE_URL=https://your-glm-endpoint.com
export AGILAI_GLM_API_KEY=your-api-key
# Legacy BMAD_* and GLM_* variables are still honored for backward compatibility.

# Start Agilai with GLM routing
npm run bmad:claude
# Output: 🌐 GLM mode active: routing Claude CLI through configured GLM endpoint.
```

GLM routing works with all three assistant CLIs:

- `npm run bmad:claude` - Routes Claude CLI through GLM
- `npm run bmad:codex` - Routes Codex CLI through GLM
- `npm run bmad:opencode` - Routes OpenCode CLI through GLM

### Anthropic Provider (Default)

Using Anthropic's Claude (default behavior):

#### CLI Flags

```bash
# Use Anthropic (default)
npm run bmad
npm run bmad -- --anthropic

# Explicit provider
npm run bmad -- --llm-provider=claude
```

#### Environment Variables

```bash
# .env - Anthropic Configuration

# Set provider (optional, this is default)
LLM_PROVIDER=claude

# API Key (only needed for direct API access)
ANTHROPIC_API_KEY=sk-ant-...

# When using Claude CLI, OpenCode CLI, or Codex CLI,
# the CLI handles authentication automatically
```

### Switching Providers

Switch providers anytime:

```bash
# Start with GLM
npm run bmad -- --glm

# Later, switch to Anthropic
npm run bmad -- --anthropic

# Or change .env file
echo "LLM_PROVIDER=claude" >> .env
npm run bmad
```

**Priority order:**

1. CLI flags (highest priority)
2. Environment variables from `.env`
3. Default behavior (Anthropic)

## MCP Server Configuration

### Assistant-Specific Configuration

#### Claude CLI Configuration

**Location:** `.claude/mcp-config.json`

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
  },
  "shadcn": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-shadcn"],
    "disabled": true
  }
}
```

#### Codex CLI Configuration

**Location:** `~/.codex/config.toml`

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

[[mcp]]
id = "shadcn"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-shadcn"]
auto_start = false
```

### MCP Environment Configuration

Add environment variables to MCP server configuration:

**Claude CLI** (`.claude/mcp-config.json`):

```json
{
  "agilai": {
    "command": "npx",
    "args": ["agilai-codex"],
    "env": {
      "CODEX_APPROVAL_MODE": "true",
      "CODEX_LOG_CONTEXT": "{\"environment\":\"production\"}"
    }
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

  [mcp.env]
  CODEX_APPROVAL_MODE = "true"
  CODEX_LOG_CONTEXT = '{"environment":"production"}'
```

## Codex CLI Configuration

### Approval Mode

Control which operations require manual approval:

```bash
# Enable approval mode
CODEX_APPROVAL_MODE=true

# Specify approved operations (bypass approval)
CODEX_APPROVED_OPERATIONS=generate_deliverable:prd,execute_quick_lane
```

**Available operations:**

- `generate_deliverable:prd` - Generate Product Requirements Document
- `generate_deliverable:architecture` - Generate architecture document
- `generate_deliverable:story` - Generate user stories
- `execute_quick_lane` - Run Quick Lane workflow
- `execute_complex_lane` - Run Complex Lane workflow
- `transition_phase` - Move to next BMAD phase

### Model Overrides

Override LLM routing per development lane:

```bash
# Quick lane: Fast model for simple tasks
CODEX_QUICK_MODEL=gpt-4.1-mini

# Complex lane: Powerful model for complex features
CODEX_COMPLEX_MODEL=claude-3-5-sonnet-20241022

# Governance lane: Specialized model for reviews
CODEX_GOVERNANCE_MODEL=claude-3-5-sonnet-20241022
```

### Complete Codex Configuration Example

`~/.codex/config.toml`:

```toml
[[mcp]]
id = "agilai-codex"
command = "npx"
args = ["agilai-codex"]
autostart = true

  [mcp.env]
  # Approval settings
  CODEX_APPROVAL_MODE = "true"
  CODEX_APPROVED_OPERATIONS = "generate_deliverable:prd,execute_quick_lane"

  # Model routing per lane
  CODEX_QUICK_MODEL = "gpt-4.1-mini"
  CODEX_COMPLEX_MODEL = "claude-3-5-sonnet-20241022"
  CODEX_GOVERNANCE_MODEL = "claude-3-5-sonnet-20241022"

  # Observability
  CODEX_LOG_CONTEXT = '{"environment":"local","team":"engineering"}'
  CODEX_METRICS_STDOUT = "true"

  # Provider overrides
  CODEX_DEFAULT_PROVIDER = "anthropic"
  CODEX_FAST_PROVIDER = "openai"
```

See [`codex-config.toml.example`](../codex-config.toml.example) for a ready-to-copy configuration.

## Observability & Logging

### Structured Logging

Agilai emits structured JSON logs to `stderr`:

```json
{
  "ts": "2024-07-16T12:34:56.789Z",
  "level": "info",
  "msg": "lane_selection_completed",
  "service": "bmad-codex",
  "component": "mcp-orchestrator",
  "operation": "execute_workflow",
  "lane": "quick",
  "confidence": 0.88,
  "durationMs": 142.3,
  "environment": "local"
}
```

### Log Context Enrichment

Add custom fields to all log entries:

```bash
# Environment variable
CODEX_LOG_CONTEXT='{"environment":"production","cluster":"us-west-2","team":"backend"}'
```

All log entries will include these fields automatically.

### Metrics

Enable metrics output to `stdout`:

```bash
# Enable metrics
CODEX_METRICS_STDOUT=true
```

**Metric events include:**

- Lane selection timing
- Workflow duration
- Tool execution time
- Operation success/failure rates

Example metric:

```json
{
  "name": "lane_selection_duration",
  "value": 142.3,
  "type": "timing",
  "unit": "ms",
  "attributes": {
    "lane": "quick",
    "confidence": 0.88,
    "environment": "local"
  }
}
```

### Log Levels

Control logging verbosity:

```bash
# Set log level (debug, info, warn, error)
LOG_LEVEL=info

# Disable logging
LOG_LEVEL=error
```

## Advanced Settings

### Development Mode

Enable development features:

```bash
# Enable debug mode
DEBUG=agilai:*

# Verbose logging
VERBOSE=true

# Disable auto-approval (prompt for everything)
AUTO_APPROVE=false
```

### Performance Tuning

Adjust performance-related settings:

```bash
# Quick lane timeout (milliseconds)
QUICK_LANE_TIMEOUT=180000    # 3 minutes

# Complex lane timeout (milliseconds)
COMPLEX_LANE_TIMEOUT=900000  # 15 minutes

# Lane selection confidence threshold (0.0 - 1.0)
LANE_CONFIDENCE_THRESHOLD=0.7
```

### State Management

Configure project state persistence:

```bash
# State file location (relative to project root)
AGILAI_STATE_DIR=.agilai

# Conversation log location
AGILAI_LOG_FILE=.agilai/conversation.log

# Auto-save state after each interaction
AUTO_SAVE_STATE=true
```

### MCP Server Lifecycle

Control MCP server behavior:

```bash
# Server startup timeout (milliseconds)
MCP_STARTUP_TIMEOUT=5000

# Retry failed operations
MCP_RETRY_COUNT=3

# Retry delay (milliseconds)
MCP_RETRY_DELAY=1000
```

## Configuration Validation

Validate your configuration:

```bash
# Test MCP server connection
npm run mcp:doctor

# Test LLM provider connection
npm run bmad -- --test

# Audit security settings
npm run mcp:audit
```

## Example Configurations

### Local Development

```bash
# .env
LLM_PROVIDER=anthropic
LOG_LEVEL=debug
VERBOSE=true
AUTO_APPROVE=true
CODEX_METRICS_STDOUT=true
CODEX_LOG_CONTEXT='{"environment":"local"}'
```

### Production

```bash
# .env
LLM_PROVIDER=glm
ZHIPUAI_API_KEY=sk-...
LOG_LEVEL=info
AUTO_APPROVE=false
CODEX_APPROVAL_MODE=true
CODEX_LOG_CONTEXT='{"environment":"production","team":"engineering"}'
CODEX_METRICS_STDOUT=true
```

### CI/CD

```bash
# .env
LLM_PROVIDER=glm
ZHIPUAI_API_KEY=${CI_GLM_API_KEY}
LOG_LEVEL=warn
AUTO_APPROVE=true
CODEX_APPROVAL_MODE=false
CODEX_LOG_CONTEXT='{"environment":"ci","pipeline":"${CI_PIPELINE_ID}"}'
```

## Troubleshooting

### Configuration Not Loading

If environment variables aren't being read:

1. Verify `.env` file is in project root
2. Check file permissions: `chmod 600 .env`
3. Ensure no syntax errors in `.env`
4. Try explicit export: `export $(cat .env | xargs)`

### Wrong LLM Provider

If using the wrong provider:

1. Check CLI flag: `npm run bmad -- --glm`
2. Verify `.env` contents: `cat .env | grep LLM_PROVIDER`
3. Check priority: CLI flags override environment variables

### MCP Server Connection Issues

If MCP servers fail to connect:

1. Validate configuration: `npm run mcp:doctor`
2. Check server paths in config files
3. Test standalone: `npm run mcp`
4. Review logs for errors

## Next Steps

- **[Installation Guide](installation-methods.md)** - Installation options
- **[MCP Management](mcp-management.md)** - Extend with MCP servers
- **[Examples](examples.md)** - Usage examples
- **[Architecture](../docs/core-architecture.md)** - System design
