# AGENTS.md

Project-specific instructions for Codex CLI when working with this repository.

## Project

**Agilai** - Universal AI agent framework orchestrating specialized AI agents through structured workflows. Natural language first approach with invisible orchestrator layer.

**Key Innovation**: Zero-knowledge interface - users interact naturally without learning methodology jargon.

## Architecture

```
agilai-core/     → Framework (agents, workflows, templates, tasks)
tools/           → Build system
dist/            → Generated bundles (web/IDE)
```

- Natural language only in core (markdown/YAML)
- Code only in tooling layer
- Dual environment: IDE + Web UI

## Essential Commands

```bash
# Build
npm run build                  # All bundles
npm run build:agents           # Agent bundles only
npm run build:mcp              # MCP server (TypeScript)

# Quality
npm run lint:fix               # Auto-fix linting
npm run format                 # Format with Prettier
npm run pre-release            # Full validation

# Version
npm run version:patch          # Bump version

# Utility
npm run validate               # Validate configs
npm test                       # Run tests
```

## Critical Files

```
agilai-core/
  agents/*.md          → Agent definitions (YAML frontmatter)
  workflows/*.yaml     → Multi-phase workflows
  templates/*.yaml     → PRD/architecture templates
  tasks/*.md           → Reusable instructions
  checklists/*.md      → QA validation
  data/bmad-kb.md      → Methodology docs

agents/
  invisible-orchestrator.md  → User interface
  phase-detector.md          → Phase inference

bin/
  agilai               → Main CLI entry
  agilai-claude        → Claude CLI wrapper
  agilai-codex         → Codex CLI wrapper

dist/mcp/
  mcp/server.js        → MCP server (must be built)
```

## Code Standards

**JavaScript**: CommonJS, ESLint (unicorn/node), Prettier (100 chars, single quotes)
**YAML**: `.yaml` extension, double quotes preferred
**Markdown**: YAML frontmatter for metadata, natural language

## MCP Server

**CRITICAL**: Build before publishing!

```bash
npm run build:mcp              # Compile TypeScript
node dist/mcp/mcp/server.js    # Test
npm pack --dry-run | grep dist/mcp  # Verify
```

Source: `.dev/mcp/server.ts` → Output: `dist/mcp/mcp/server.js`

## Agent Format

```markdown
---
agent: agent-name
role: Brief description
dependencies:
  templates: [template-name]
  tasks: [task-name]
---

# Agent Name

Instructions...
```

## Project Paths

```
docs/
  prd.md               → Product requirements
  architecture.md      → System architecture
  epics/               → Sharded epics
  stories/             → Development stories
  qa/gates/            → Quality gates
```

## CLI Selection

Three CLI options available:

- **Claude CLI**: Uses `CLAUDE.md` for instructions
- **Codex CLI**: Uses `AGENTS.md` (this file)
- **Opencode CLI**: Standard approach

Configuration in `bin/agilai`, `bin/agilai-claude`, `bin/agilai-codex`

## Publishing Checklist

```bash
npm run build:mcp      # Build MCP server
ls dist/mcp/mcp/server.js  # Verify exists
npm run pre-release    # Validate
npm run version:patch  # Bump version
npm publish            # Publish
```

## Constraints

- **Core framework**: No code, only markdown/YAML
- **Agent context**: Dev agents lean, planning agents comprehensive
- **Environment duality**: Must work in IDE and Web contexts

## Expansion Packs

Domain-specific extensions in `expansion-packs/`:

- `bmad-2d-phaser-game-dev/`
- `bmad-2d-unity-game-dev/`
- `bmad-creative-writing/`
- `bmad-godot-game-dev/`
- `bmad-infrastructure-devops/`

Each mirrors core structure, installable independently.

## Key Docs

- `docs/core-architecture.md` - System design
- `docs/user-guide.md` - Complete workflow
- `docs/GUIDING-PRINCIPLES.md` - Philosophy
- `docs/working-in-the-brownfield.md` - Existing projects
