# MCP Management Examples

Real-world examples and workflows for the BMAD-invisible MCP management system.

## Table of Contents

- [Quick Start Examples](#quick-start-examples)
- [Environment Setup](#environment-setup)
- [Security Workflows](#security-workflows)
- [Team Collaboration](#team-collaboration)
- [Common Integrations](#common-integrations)
- [Troubleshooting Scenarios](#troubleshooting-scenarios)

## Quick Start Examples

### Example 1: First-Time Setup

Setting up MCP servers for a new React project:

```bash
# Initialize project with BMAD
npx bmad-invisible@latest start

# Browse available servers
npm run mcp:browse

# Output:
# 📦 MCP Server Registry
#
# Development Tools (6 servers):
#   • filesystem - File system operations
#   • github - GitHub API integration
#   • git - Git repository operations
#   • puppeteer - Browser automation
#   ...

# Install essential development tools
npm run mcp:install filesystem
# ✓ Configuring filesystem server...
# ? What directory should be accessible? /Users/me/projects/my-app
# ✓ Installed successfully!

npm run mcp:install github
# ✓ Configuring github server...
# ? GitHub personal access token: ghp_***
# ✓ Installed successfully!

# Verify setup
npm run mcp:list
# Output:
# 📋 Configured MCP Servers
#
# ✓ filesystem
#   Command: npx @modelcontextprotocol/server-filesystem
#   Status: Ready
#
# ✓ github
#   Command: npx @modelcontextprotocol/server-github
#   Status: Ready
```

### Example 2: Get Smart Suggestions

Let the system recommend servers based on your project:

```bash
cd my-react-app

npm run mcp:suggest

# Output:
# 🔍 Analyzing project...
#
# Detected Technologies:
#   • React (package.json)
#   • PostgreSQL (dependencies)
#   • GitHub repository
#
# 💡 Recommended MCP Servers:
#
# Essential:
#   • filesystem - Access project files
#   • github - GitHub integration
#
# Recommended:
#   • postgres - Database operations
#   • puppeteer - E2E testing
#
# Optional:
#   • slack - Team notifications
#
# Install all recommended? (y/n)
```

### Example 3: Quick Health Check

Verify all servers are working:

```bash
npm run mcp:doctor

# Output:
# 🏥 MCP Health Check
#
# Configuration Files:
#   ✓ .claude/mcp-config.json is valid
#   ✓ mcp/bmad-config.json is valid
#
# Servers:
#   ✓ filesystem - Responding (42ms)
#   ✓ github - Responding (156ms)
#   ⚠ postgres - Slow response (3240ms)
#     Recommendation: Check database connection
#   ❌ slack - Not responding
#     Error: SLACK_TOKEN environment variable not set
#     Fix: Run 'npm run mcp:secure' to configure credentials
#
# Environment:
#   ✓ Node.js v20.10.0
#   ✓ npm v10.2.3
#
# Summary: 2 OK, 1 Warning, 1 Error
```

## Environment Setup

### Example 4: Multi-Environment Configuration

Setting up dev, staging, and production profiles:

```bash
# Create development profile
npm run mcp:profile:create dev --description "Development environment"

# Switch to dev profile
npm run mcp:profile:switch dev

# Install dev-specific servers
npm run mcp:install filesystem
npm run mcp:install github

# Add development tools
npm run mcp:add local-api
# ? Server name: local-api
# ? Command: node
# ? Arguments: ./dev/mock-api.js
# ? Environment variables: PORT=3001,DEBUG=true
# ✓ Added successfully!

# Create staging profile (inherits from dev)
npm run mcp:profile:create staging --inherit-from dev

# Switch to staging and add staging-specific config
npm run mcp:profile:switch staging
npm run mcp:install postgres  # Real database for staging

# Create production profile
npm run mcp:profile:create prod --copy-from staging

# Switch to production and secure credentials
npm run mcp:profile:switch prod
npm run mcp:secure

# List all profiles
npm run mcp:profile:list

# Output:
# 📋 MCP Profiles
#
# ● prod (active)
#   Production environment
#   Inherits from: staging
#   Configs: Claude ✓, BMAD ✓
#
# ○ staging
#   Staging environment
#   Inherits from: dev
#   Configs: Claude ✓, BMAD ✓
#
# ○ dev
#   Development environment
#   Configs: Claude ✓, BMAD ✓
#
# ○ default
#   Default configuration
#   Configs: Claude ✓, BMAD ✓
```

### Example 5: Git Branch-Based Profile Switching

Automatic profile detection based on git branches:

```bash
# On main branch → auto-detects 'prod' profile
git checkout main
npm run mcp:list
# Using profile: prod (auto-detected from git branch)

# On feature branch → auto-detects 'dev' profile
git checkout feature/new-feature
npm run mcp:list
# Using profile: dev (auto-detected from git branch)

# Override with environment variable
MCP_PROFILE=staging npm run mcp:list
# Using profile: staging (from environment)

# Make it permanent in your shell
export MCP_PROFILE=dev
npm run mcp:list
# Using profile: dev (from environment)
```

## Security Workflows

### Example 6: Migrating to Secure Storage

Moving plain-text credentials to encrypted storage:

```bash
# Before: Config has plain-text secrets
cat .claude/mcp-config.json
# {
#   "mcpServers": {
#     "github": {
#       "env": {
#         "GITHUB_TOKEN": "ghp_abc123xyz456..."
#       }
#     }
#   }
# }

# Run security migration
npm run mcp:secure

# Output:
# 🔒 Migrating credentials to secure storage...
#
# Scanning configurations...
# Found 3 credentials to secure:
#   • GITHUB_TOKEN (github server)
#   • DATABASE_URL (postgres server)
#   • SLACK_TOKEN (slack server)
#
# Storing in system keychain...
#   ✓ GITHUB_TOKEN → macOS Keychain
#   ✓ DATABASE_URL → macOS Keychain
#   ⚠ SLACK_TOKEN → Encrypted vault (keychain unavailable)
#
# Updating config files...
#   ✓ .claude/mcp-config.json
#   ✓ mcp/bmad-config.json
#
# ✓ Migration complete! 3 credentials secured.

# After: Config uses vault references
cat .claude/mcp-config.json
# {
#   "mcpServers": {
#     "github": {
#       "env": {
#         "GITHUB_TOKEN": "{{vault:GITHUB_TOKEN}}"
#       }
#     }
#   }
# }
```

### Example 7: Security Audit

Running a comprehensive security check:

```bash
npm run mcp:audit

# Output:
# 🔍 Security Audit
#
# Profile: prod
#
# Claude Configuration:
#   ❌ 2 issue(s) found
#
#   CRITICAL: API key detected in plain text
#     Path: mcpServers.github.env.GITHUB_TOKEN
#     Value: ghp_abc123... (truncated)
#     Risk: Credentials exposed in config file
#     Fix: Run 'npm run mcp:secure'
#
#   HIGH: Potential secret in plain text
#     Path: mcpServers.aws.env.AWS_SECRET_KEY
#     Risk: AWS credentials not encrypted
#     Fix: Run 'npm run mcp:secure'
#
# BMAD Configuration:
#   ✓ Secure
#
# Stored Credentials:
#   • DATABASE_URL (keychain) - Stored 2 days ago
#   • SLACK_TOKEN (encrypted vault) - Stored 5 hours ago
#
# File Permissions:
#   ⚠ Warning: Master key file has permissions 644
#     Expected: 600
#     Fix: chmod 600 ~/.bmad-invisible/secure/.master.key
#
# Recommendations for 'prod' profile:
#   🔒 Production should use secure credential storage
#      Action: Run 'npm run mcp:secure'
#   📊 Enable monitoring for production MCP servers
#      Action: Configure health checks and alerts
#
# Summary: 2 critical, 0 high, 1 warning
#
# Run 'npm run mcp:secure' to fix these issues.
```

## Team Collaboration

### Example 8: Sharing Team Configuration

Exporting and importing profiles for team consistency:

```bash
# Team lead: Export shared development profile
npm run mcp:profile:export dev team-dev-config.json

# Output:
# 📦 Exporting profile 'dev'...
# ✓ Profile exported to team-dev-config.json
#
# File includes:
#   • Profile metadata
#   • Server configurations
#   • Environment structure (secrets excluded)
#
# Share this file with your team!

# Inspect the export
cat team-dev-config.json
# {
#   "version": "1.0.0",
#   "exported": "2025-01-15T10:30:00.000Z",
#   "profile": {
#     "name": "dev",
#     "description": "Team development environment",
#     "created": "2025-01-10T09:00:00.000Z"
#   },
#   "claudeConfig": {
#     "mcpServers": {
#       "filesystem": { ... },
#       "github": {
#         "env": {
#           "GITHUB_TOKEN": "{{vault:GITHUB_TOKEN}}"
#         }
#       }
#     }
#   },
#   "bmadConfig": { ... }
# }

# Team member: Import the profile
npm run mcp:profile:import team-dev-config.json

# Output:
# 📥 Importing profile from team-dev-config.json...
# ✓ Profile 'dev' imported successfully
#
# Next steps:
#   1. Switch to the profile: npm run mcp:profile:switch dev
#   2. Configure your personal credentials: npm run mcp:secure
#   3. Verify setup: npm run mcp:doctor

# Switch and configure
npm run mcp:profile:switch dev
# ✓ Switched to profile 'dev'

# The team member needs to add their own credentials
npm run mcp:add github
# ? GitHub personal access token: ghp_[their_token]
# ✓ Configured!

npm run mcp:secure
# ✓ Credentials secured
```

### Example 9: Comparing Profiles

Checking differences between environments:

```bash
npm run mcp:profile:diff dev prod

# Output:
# 📊 Comparing profiles: dev ↔ prod
#
# Servers only in 'dev':
#   • mock-api (Local development server)
#   • debug-tools (Development utilities)
#
# Servers only in 'prod':
#   • cloudflare (CDN management)
#   • sentry (Error monitoring)
#
# Servers with different configurations:
#   • postgres
#     dev:  DATABASE_URL=localhost:5432/myapp_dev
#     prod: DATABASE_URL={{vault:DATABASE_URL}}
#
#   • slack
#     dev:  Channel: #dev-alerts
#     prod: Channel: #prod-alerts
#
# Identical servers:
#   • filesystem
#   • github
#   • git
```

## Common Integrations

### Example 10: Full-Stack Development Setup

Complete MCP setup for a full-stack app:

```bash
# Create project profile
npm run mcp:profile:create fullstack-dev

# Install frontend tools
npm run mcp:install filesystem
# ? Directory: /Users/me/projects/myapp
# ✓ Installed

npm run mcp:install puppeteer
# ? Chromium path: (default)
# ✓ Installed for E2E testing

# Install backend tools
npm run mcp:install postgres
# ? Connection string: postgres://localhost:5432/myapp_dev
# ✓ Installed

npm run mcp:install github
# ? Personal access token: ghp_***
# ✓ Installed

# Install collaboration tools
npm run mcp:install slack
# ? Bot token: xoxb-***
# ? Channel: #dev-alerts
# ✓ Installed

# Verify everything
npm run mcp:doctor

# Output:
# 🏥 MCP Health Check
#
# ✓ filesystem - Ready (12ms)
# ✓ puppeteer - Ready (234ms)
# ✓ postgres - Ready (45ms)
# ✓ github - Ready (123ms)
# ✓ slack - Ready (89ms)
#
# ✓ All systems operational!

# Secure all credentials
npm run mcp:secure

# ✓ 3 credentials migrated to secure storage
```

### Example 11: Data Science Project

MCP setup for ML/data science work:

```bash
# Search for data science tools
npm run mcp:search "database"

# Output:
# 🔍 Search results for "database"
#
# 📦 postgres
#   Category: Databases
#   PostgreSQL database integration
#   Install: npm run mcp:install postgres
#
# 📦 sqlite
#   Category: Databases
#   SQLite database operations
#   Install: npm run mcp:install sqlite

# Install database tools
npm run mcp:install postgres
npm run mcp:install sqlite

# Add custom Python environment
npm run mcp:add jupyter
# ? Command: jupyter
# ? Arguments: lab, --port=8888
# ? Environment: PYTHONPATH=/Users/me/projects/ml
# ✓ Added

# Add cloud storage
npm run mcp:install aws-kb-retrieval
# ? AWS Region: us-east-1
# ? Access Key: {{vault:AWS_ACCESS_KEY}}
# ✓ Installed

# List final setup
npm run mcp:list

# Output:
# 📋 Configured MCP Servers
#
# ✓ postgres - Database queries and management
# ✓ sqlite - Local database operations
# ✓ jupyter - Interactive Python notebooks
# ✓ aws-kb-retrieval - AWS S3 and knowledge base
```

### Example 12: DevOps/Infrastructure Setup

MCP for infrastructure management:

```bash
# Create infrastructure profile
npm run mcp:profile:create infra

# Install cloud tools
npm run mcp:install cloudflare
# ? API token: {{vault:CLOUDFLARE_API_TOKEN}}
# ? Account ID: abc123...
# ✓ Installed

npm run mcp:install aws-kb-retrieval
# ? AWS credentials: {{vault:AWS_ACCESS_KEY}}
# ✓ Installed

# Add monitoring
npm run mcp:install sentry
# ? DSN: {{vault:SENTRY_DSN}}
# ? Environment: production
# ✓ Installed

# Add repository management
npm run mcp:install github
npm run mcp:install gitlab
# ✓ Both installed

# Secure everything immediately
npm run mcp:secure

# Run audit
npm run mcp:audit
# ✓ All configurations secure
```

## Troubleshooting Scenarios

### Example 13: Server Not Responding

Debugging a non-responsive server:

```bash
# Run health check
npm run mcp:doctor

# Output:
# ❌ postgres - Not responding
#    Error: Connection timeout
#    Last seen: 3 hours ago

# Check detailed status
DEBUG=mcp:* npm run mcp:list

# Output:
# [mcp:manager] Loading config from .claude/mcp-config.json
# [mcp:postgres] Attempting connection...
# [mcp:postgres] Error: ECONNREFUSED 127.0.0.1:5432
# [mcp:postgres] Server is not running

# Fix: Start PostgreSQL
brew services start postgresql@14

# Verify
npm run mcp:doctor
# ✓ postgres - Ready (32ms)
```

### Example 14: Missing Credentials

Recovering from missing credentials:

```bash
# Run health check
npm run mcp:doctor

# Output:
# ❌ github - Authentication failed
#    Error: GITHUB_TOKEN environment variable not set
#
# Recommendations:
#   1. Check if credential exists: npm run mcp:audit
#   2. Re-add credential: npm run mcp:secure
#   3. Reconfigure server: npm run mcp:add github

# Check audit
npm run mcp:audit

# Output:
# Stored Credentials:
#   (none)
#
# Issue: Credentials were cleared or vault is corrupted

# Reconfigure
npm run mcp:add github
# ? GitHub personal access token: ghp_new_token
# ✓ Configured

npm run mcp:secure
# ✓ Credential secured
```

### Example 15: Profile Restoration

Restoring from a backup:

```bash
# Scenario: Accidentally deleted prod profile
npm run mcp:profile:list
# ○ default
# ○ dev
# ✗ prod (missing)

# Restore from backup
npm run mcp:profile:import prod-backup.json --name prod

# Output:
# 📥 Importing profile from prod-backup.json...
# ✓ Profile 'prod' restored successfully

# Switch to restored profile
npm run mcp:profile:switch prod

# Re-add credentials (not stored in export)
npm run mcp:secure

# Verify
npm run mcp:doctor
# ✓ All servers operational
```

### Example 16: Slow Server Performance

Investigating performance issues:

```bash
# Run health check
npm run mcp:doctor

# Output:
# ⚠ puppeteer - Slow response (4823ms)
#    Warning: Response time exceeded 1000ms
#    Recommendation: Check system resources

# Check detailed logs
DEBUG=mcp:puppeteer npm run mcp:list

# Output:
# [mcp:puppeteer] Starting Chromium...
# [mcp:puppeteer] Warning: Low memory (234MB available)
# [mcp:puppeteer] Chromium startup took 4234ms

# Fix: Configure with lighter settings
npm run mcp:add puppeteer --reconfigure
# ? Headless mode: true
# ? Disable GPU: true
# ? No sandbox: true
# ✓ Reconfigured for better performance

# Verify improvement
npm run mcp:doctor
# ✓ puppeteer - Ready (823ms)
```

## Advanced Workflows

### Example 17: Automated Profile Setup

Scripting profile creation for CI/CD:

```bash
#!/bin/bash
# setup-ci-profile.sh

# Create CI profile
npm run mcp:profile:create ci --description "CI/CD environment"

# Switch to CI profile
npm run mcp:profile:switch ci

# Install required servers
npm run mcp:install filesystem
npm run mcp:install github
npm run mcp:install postgres

# Configure from environment variables
export GITHUB_TOKEN=$CI_GITHUB_TOKEN
export DATABASE_URL=$CI_DATABASE_URL

# Secure credentials
npm run mcp:secure

# Verify setup
npm run mcp:audit

# Export for caching
npm run mcp:profile:export ci ci-profile.json

echo "✓ CI profile configured and cached"
```

### Example 18: Profile Inheritance Chain

Complex multi-tier profile setup:

```bash
# Create base profile with common tools
npm run mcp:profile:create base
npm run mcp:profile:switch base
npm run mcp:install filesystem
npm run mcp:install github

# Create dev profile inheriting from base
npm run mcp:profile:create dev --inherit-from base
npm run mcp:profile:switch dev
npm run mcp:install puppeteer  # Dev-specific testing

# Create staging inheriting from dev
npm run mcp:profile:create staging --inherit-from dev
npm run mcp:profile:switch staging
npm run mcp:install postgres  # Real database for staging

# Create prod inheriting from base (not dev)
npm run mcp:profile:create prod --inherit-from base
npm run mcp:profile:switch prod
npm run mcp:install postgres  # Prod database
npm run mcp:install sentry     # Prod monitoring

# View inheritance tree
npm run mcp:profile:list

# Output:
# 📋 MCP Profiles
#
# ○ base
#   Common development tools
#   Servers: filesystem, github
#
# ○ dev (inherits from base)
#   Development environment
#   Additional: puppeteer
#
# ○ staging (inherits from dev)
#   Staging environment
#   Additional: postgres
#
# ● prod (inherits from base)
#   Production environment
#   Additional: postgres, sentry
```

## Best Practices

### Tips from Real Usage

1. **Always use profiles** - Even for solo projects, separate dev/prod
2. **Run `mcp:doctor` regularly** - Catch issues early
3. **Secure credentials immediately** - Don't commit plain-text tokens
4. **Export profiles as backups** - Before major changes
5. **Use `mcp:suggest`** - Discover relevant tools automatically
6. **Audit before deployment** - Run `mcp:audit` in CI/CD
7. **Document custom servers** - Add descriptions when using `mcp:add`

### Common Patterns

```bash
# Daily development workflow
npm run mcp:doctor              # Morning health check
npm run bmad                    # Start development
npm run mcp:doctor              # End-of-day verification

# Before deployment
npm run mcp:profile:switch prod
npm run mcp:audit               # Check security
npm run mcp:doctor              # Verify health
# ... deploy ...

# Onboarding new team member
npm run mcp:profile:export dev team-dev.json
# Share team-dev.json
# New member: npm run mcp:profile:import team-dev.json

# Troubleshooting
DEBUG=mcp:* npm run mcp:doctor  # Detailed diagnostics
npm run mcp:audit               # Security check
npm run mcp:profile:diff dev prod  # Compare configs
```

## Additional Resources

- **[mcp-management.md](mcp-management.md)** - Complete command reference
- **[README.md](../README.md)** - Project overview and quick start
- **GitHub Issues** - Report problems and get help

## Contributing Examples

Have a great MCP workflow to share? Contribute it!

1. Fork the repository
2. Add your example to this file
3. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
