# MCP Management System

The aidesigner project includes a comprehensive Model Context Protocol (MCP) management system that enables seamless integration with AI tools and services.

## Overview

The MCP management system provides:

- **Interactive CLI** for managing MCP server configurations
- **Registry Integration** with 15+ official MCP servers
- **Environment Profiles** for dev/staging/production separation
- **Secure Credential Storage** with encryption and keychain integration
- **Conversational Configuration** through the invisible orchestrator
- **Health Monitoring** and diagnostics

## Quick Start

### List Available MCP Servers

```bash
npm run mcp:list
```

Shows all configured MCP servers in your current profile with their status.

### Browse the MCP Registry

```bash
npm run mcp:browse
```

Explore 15+ official MCP servers organized by category:

- **Development Tools**: filesystem, github, git, gitlab, chrome-devtools
- **Databases**: postgres, sqlite, memory
- **Cloud Services**: aws-kb-retrieval, cloudflare
- **Search & AI**: brave-search, fetch, everything
- **Content Quality**: vibe-check
- **Communication**: slack, sentry

### Install an MCP Server

```bash
npm run mcp:install <server-name>
```

Example:

```bash
npm run mcp:install filesystem
npm run mcp:install vibe-check
```

The installer will:

1. Download the latest server configuration
2. Configure required environment variables (interactive prompts)
3. Add to your active profile
4. Verify the installation

#### Configuration Targets

By default, MCP servers are installed to the **aidesigner configuration**. You can specify a different target using the `config` parameter when using the `install_mcp_server` tool:

- **`config: "aidesigner"`** - Install to aidesigner config only (default)
- **`config: "claude"`** - Install to Claude Desktop config only
- **`config: "both"`** - Install to both aidesigner and Claude Desktop configs
- **`config: "bmad"`** - Legacy alias for "aidesigner"

**Example usage in agent tools:**

```javascript
// Default - installs to aidesigner config
install_mcp_server({ serverId: 'filesystem' });

// Install to Claude Desktop config only
install_mcp_server({ serverId: 'filesystem', config: 'claude' });

// Install to both configs (dual-write)
install_mcp_server({ serverId: 'filesystem', config: 'both' });
```

### Search for Servers

```bash
npm run mcp:search "database"
```

Search the registry by keyword or category.

### Get Smart Suggestions

```bash
npm run mcp:suggest
```

Analyzes your project and suggests relevant MCP servers based on:

- Detected technologies (package.json, requirements.txt, etc.)
- Project structure
- Existing dependencies

## Migration Guide: Browser Automation

### Moving from Puppeteer/Playwright to Chrome DevTools MCP

For browser automation and E2E testing, we now recommend **Chrome DevTools MCP** as the preferred integration. It provides native Chrome DevTools Protocol access with better performance and simpler configuration.

#### Why Chrome DevTools MCP?

- **Native Chrome integration**: Direct Chrome DevTools Protocol (CDP) access
- **Record and replay**: Capture user flows directly in Chrome for E2E testing
- **Simpler setup**: No additional browser binaries required if Chrome is already installed
- **Better performance**: Lightweight STDIO-based communication
- **Team alignment**: Tests use the same browser your team develops with

#### Migration Steps

If you're currently using Puppeteer or Playwright MCP servers:

1. **Install Chrome DevTools MCP**:

   ```bash
   npm run mcp:install chrome-devtools
   # Optional: Set BROWSER_WS_ENDPOINT if connecting to remote Chrome
   ```

2. **Optional: Configure WebSocket endpoint** (if using remote debugging):

   ```bash
   # Start Chrome with remote debugging
   google-chrome --remote-debugging-port=9222

   # Set environment variable
   export BROWSER_WS_ENDPOINT=ws://localhost:9222
   ```

3. **Update your workflows**: Chrome DevTools MCP uses the same CDP commands as Puppeteer but through the MCP protocol.

4. **Remove old servers** (optional):
   ```bash
   npm run mcp:remove puppeteer
   npm run mcp:remove playwright
   ```

#### When to Keep Puppeteer/Playwright

Chrome DevTools MCP is recommended for most cases, but you might prefer Puppeteer/Playwright if you need:

- Cross-browser testing (Firefox, Safari, WebKit)
- Headless mode in Docker/CI without Chrome installed
- Specific Puppeteer/Playwright APIs not available in CDP
- Existing test suites heavily dependent on those libraries

Both options remain available in the MCP registry - use what works best for your project.

## Server Management

### Add a Custom Server

```bash
npm run mcp:add
```

Interactive wizard to add custom MCP servers:

- Choose server type (stdio/SSE)
- Configure command and arguments
- Set up environment variables
- Test the connection

### Remove a Server

```bash
npm run mcp:remove <server-name>
```

Removes a server from your configuration (does not uninstall the package).

### Health Check

```bash
npm run mcp:doctor
```

Runs comprehensive diagnostics:

- ✓ Configuration file validity
- ✓ Server reachability
- ✓ Environment variables
- ✓ Dependencies installed
- ✓ Permission issues
- ⚠️ Warnings for outdated versions
- ❌ Errors with fix suggestions

## Environment Profiles

Manage separate MCP configurations for different environments.

### Why Use Profiles?

- **Separation**: Dev servers don't pollute production configs
- **Security**: Production credentials isolated from development
- **Team Collaboration**: Share profile exports with team members
- **Testing**: Safe experimentation without affecting stable configs

### List Profiles

```bash
npm run mcp:profile:list
```

Shows all profiles with their active status and configurations.

### Create a Profile

```bash
npm run mcp:profile:create dev --description "Development environment"
```

Options:

- `--copy-from <profile>`: Copy existing profile configuration
- `--inherit-from <profile>`: Inherit from parent (overrides allowed)

### Switch Profiles

```bash
npm run mcp:profile:switch staging
```

Changes the active profile for MCP operations.

### Auto-Detection

Profiles can be automatically selected based on:

1. **Environment Variable**: `MCP_PROFILE=prod`
2. **NODE_ENV Mapping**:
   - `development` → `dev`
   - `staging` → `staging`
   - `production` → `prod`
3. **Git Branch**:
   - `main`/`master` → `prod`
   - `feature/*` → `dev`
   - `dev/*` → `dev`

### Compare Profiles

```bash
npm run mcp:profile:diff dev prod
```

Shows differences between two profiles:

- Servers only in profile 1
- Servers only in profile 2
- Servers with different configurations

### Export/Import Profiles

Share profiles with your team:

```bash
# Export
npm run mcp:profile:export prod prod-config.json

# Import
npm run mcp:profile:import prod-config.json --name prod-backup
```

### Delete a Profile

```bash
npm run mcp:profile:delete old-dev
```

Note: Cannot delete the `default` profile.

## Security & Credentials

### Secure Credential Storage

MCP servers often require API keys, tokens, and passwords. The security system provides:

1. **System Keychain** (preferred):
   - macOS: Keychain Access
   - Windows: Credential Manager
   - Linux: Secret Service

2. **Encrypted Vault** (fallback):
   - AES-256-GCM encryption
   - Master key stored with `600` permissions
   - Located in `~/.aidesigner/secure/`

### Migrate to Secure Storage

```bash
npm run mcp:secure
```

Automatically:

1. Scans configurations for plain-text secrets
2. Extracts credentials (API keys, tokens, passwords)
3. Stores in keychain or encrypted vault
4. Replaces with `{{vault:key}}` references
5. Shows migration summary

Example:

```json
// Before
{
  "env": {
    "GITHUB_TOKEN": "ghp_abc123xyz..."
  }
}

// After
{
  "env": {
    "GITHUB_TOKEN": "{{vault:GITHUB_TOKEN}}"
  }
}
```

### Security Audit

```bash
npm run mcp:audit
```

Comprehensive security analysis:

- **Critical**: API keys in plain text
- **High**: Potential secrets (keys, tokens, passwords)
- **Medium**: File permission issues
- **Recommendations**: Environment-specific best practices

Example output:

```
🔍 Security Audit

Claude Configuration:
  ❌ 2 issue(s) found

  CRITICAL: API key detected in plain text
    Path: mcpServers.github.env.GITHUB_TOKEN
    Fix: Run 'npm run mcp:secure'

aidesigner Configuration:
  ✓ Secure

Stored Credentials:
  • GITHUB_TOKEN (keychain)
  • ANTHROPIC_API_KEY (encrypted vault)

Recommendations:
  🔒 Production should use secure credential storage
     Action: All secrets migrated to vault
```

## Conversational Configuration

The invisible orchestrator can manage MCP servers naturally through conversation.

### Natural Language Triggers

**User**: "I need database access"
**Assistant**: Suggests PostgreSQL/SQLite MCP servers and offers installation

**User**: "Help me with browser automation"
**Assistant**: Recommends enabling the Chrome DevTools MCP tooling and installs with confirmation

**User**: "Can you search the web for me?"
**Assistant**: Installs Brave Search MCP and configures API key

### Available MCP Tools (Internal)

These tools are used by the orchestrator (not direct CLI commands):

- `search_mcp_servers({ query, category })` - Find servers
- `suggest_mcp_servers()` - Context-aware suggestions
- `install_mcp_server({ serverId, envVars })` - Install and configure
- `list_mcp_servers()` - List configured servers
- `get_mcp_health()` - Health diagnostics
- `browse_mcp_registry()` - Explore registry

### Important Guidelines

The orchestrator follows these rules:

- **Never says "MCP server"** - uses "tools" or "integrations"
- **Handles environment variables transparently** - prompts for API keys when needed
- **Always confirms before installing** - clear consent from user
- **Shows clear benefit** - explains what each tool does
- **Provides troubleshooting** - helps if installation fails

## Configuration Files

### File Locations

```
.claude/
  mcp-config.json           # Claude Desktop config (default profile)
  mcp-config.dev.json       # Dev profile
  mcp-config.staging.json   # Staging profile
  .mcp-profiles.json        # Profile metadata

mcp/
  aidesigner-config.json        # aidesigner MCP config (default profile)
  aidesigner-config.dev.json    # Dev profile

~/.aidesigner/secure/
  vault.enc                 # Encrypted credentials
  .master.key               # Encryption key (chmod 600)
```

### Config Format

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"],
      "env": {
        "API_KEY": "{{vault:FILESYSTEM_API_KEY}}"
      }
    }
  }
}
```

## Common Workflows

### Setting Up a New Project

```bash
# 1. Create dev profile
npm run mcp:profile:create dev

# 2. Get suggestions
npm run mcp:suggest

# 3. Install recommended servers
npm run mcp:install filesystem
npm run mcp:install github

# 4. Verify setup
npm run mcp:doctor
```

### Production Deployment

```bash
# 1. Create production profile
npm run mcp:profile:create prod --copy-from staging

# 2. Switch to prod
npm run mcp:profile:switch prod

# 3. Secure all credentials
npm run mcp:secure

# 4. Audit security
npm run mcp:audit

# 5. Export for backup
npm run mcp:profile:export prod prod-backup.json
```

### Troubleshooting

```bash
# Check health
npm run mcp:doctor

# Common issues:
# - Missing dependencies: npm install <package>
# - Permission errors: chmod 600 ~/.aidesigner/secure/.master.key
# - Server not responding: Restart Claude Desktop or MCP server
# - Config corruption: Restore from profile export

# Get detailed logs
DEBUG=mcp:* npm run mcp:list
```

### Team Collaboration

```bash
# Team lead exports shared profile
npm run mcp:profile:export shared-dev team-config.json

# Team members import
npm run mcp:profile:import team-config.json --name dev

# Everyone switches to it
npm run mcp:profile:switch dev
```

## Advanced Features

### Profile Inheritance

Create profile hierarchies:

```bash
# Base profile with common servers
npm run mcp:profile:create base

# Dev inherits from base, adds dev-specific servers
npm run mcp:profile:create dev --inherit-from base

# Prod inherits from base, overrides with prod configs
npm run mcp:profile:create prod --inherit-from base
```

Child profiles can:

- Add new servers
- Override parent server configs
- Cannot remove parent servers (but can disable them)

### Environment Variables

Set at different levels:

```bash
# System-wide
export MCP_PROFILE=prod

# Per-command
MCP_PROFILE=dev npm run mcp:list

# Git branch-based (automatic)
git checkout feature/new-feature  # → dev profile
git checkout main                  # → prod profile
```

### Custom Registry

Add your own MCP server registry:

```javascript
// tools/mcp-registry.js
const customServers = [
  {
    id: 'my-server',
    name: 'My Custom Server',
    description: 'Internal company MCP server',
    category: 'internal',
    command: 'node',
    args: ['./servers/my-server.js'],
  },
];
```

## API Reference

### McpManager Class

```javascript
const McpManager = require('./tools/mcp-manager');

const manager = new McpManager({
  rootDir: process.cwd(),
  profile: 'dev', // optional, uses active profile by default
});

// List servers
await manager.list();

// Install from registry
await manager.install('github', { config: 'claude' });

// Health check
await manager.doctor();

// Security audit
await manager.audit();
```

### McpProfiles Class

```javascript
const McpProfiles = require('./tools/mcp-profiles');

const profiles = new McpProfiles({
  rootDir: process.cwd(),
});

// Get active profile
const active = profiles.getActiveProfile();

// Load config with inheritance
const config = profiles.loadConfig('claude', 'dev');

// Compare profiles
const diff = profiles.diffProfiles('dev', 'prod');
```

### McpSecurity Class

```javascript
const McpSecurity = require('./tools/mcp-security');

const security = new McpSecurity();
await security.initialize();

// Store credential
await security.storeCredential('API_KEY', 'secret123', 'prod');

// Retrieve credential
const secret = await security.retrieveCredential('API_KEY', 'prod');

// Audit config
const audit = security.auditConfig(config);

// Migrate to secure storage
const result = await security.migrateToSecure(config, 'prod');
```

## Best Practices

### Development

- Use `dev` profile for local development
- Keep credentials in `.env.local` during development
- Migrate to secure storage before committing

### Staging

- Use `staging` profile that mirrors production
- Test with production-like credentials (separate accounts)
- Run `npm run mcp:audit` regularly

### Production

- Use `prod` profile exclusively
- Store ALL credentials in keychain/vault
- Run security audit before deployment
- Export profile backups regularly
- Restrict profile switching (via environment variables)

### Security

- Never commit `.env` files with real credentials
- Use `npm run mcp:secure` early in development
- Run `npm run mcp:audit` in CI/CD pipeline
- Rotate credentials regularly
- Use separate credentials per environment

### Team Collaboration

- Export and share base profiles
- Document custom MCP servers in team wiki
- Use consistent naming conventions
- Review profile diffs before merging

## Troubleshooting

### Common Errors

**Error**: `Master key not found`

```bash
# Initialize security system
npm run mcp:secure
```

**Error**: `Profile "dev" does not exist`

```bash
# Create the profile
npm run mcp:profile:create dev
```

**Error**: `Server not responding`

```bash
# Check health
npm run mcp:doctor

# Restart server or Claude Desktop
```

**Error**: `Permission denied` (master key)

```bash
# Fix permissions
chmod 600 ~/.aidesigner/secure/.master.key
```

### Getting Help

- Check logs: `DEBUG=mcp:* <command>`
- Run doctor: `npm run mcp:doctor`
- Security audit: `npm run mcp:audit`
- GitHub Issues: https://github.com/bacoco/aidesigner/issues

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on:

- Adding new MCP servers to the registry
- Improving security features
- Enhancing profile management
- Writing documentation

## License

MIT License - see [LICENSE](../LICENSE) for details
