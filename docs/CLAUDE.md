# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BMAD-METHOD™ (Breakthrough Method of Agile AI-driven Development) is a universal AI agent framework that orchestrates specialized AI agents through structured workflows. The project enables domain-specific AI expertise for software development, creative writing, game development, and more through natural language prompts and templates.

**Core Innovation**: Invisible Orchestrator layer that allows users to interact naturally without learning methodology jargon, while maintaining BMAD's structured multi-phase approach behind the scenes.

## Key Architecture Principles

### Three-Layer System
1. **aidesigner-core/**: Foundation framework with agents, workflows, templates, tasks, checklists, and knowledge base
2. **tools/**: Build system that packages aidesigner-core for different environments (IDE vs Web UI)
3. **dist/**: Generated bundles ready for web-based AI platforms (Gemini, ChatGPT)

### Agent Dependencies
- Agents (`.md` files in `aidesigner-core/agents/`) define persona, role, and dependencies via YAML frontmatter
- Dependencies reference templates, tasks, checklists, and data files that agents need
- The build system resolves these dependencies and bundles them for web deployment

### Environment Duality
- **IDE Mode**: Direct interaction with agent `.md` files (Cursor, VS Code, Claude Code)
- **Web Mode**: Pre-built `.txt` bundles uploaded to Gemini Gems or CustomGPTs

### Natural Language First
Everything is markdown/YAML - no code in core framework. Code exists only in tooling layer.

## Essential Commands

### Build & Packaging
```bash
npm run build                  # Build all agents, teams, and expansion packs
npm run build:agents           # Build only agent bundles
npm run build:teams            # Build only team bundles
npm run build:mcp              # Build MCP server (TypeScript → dist/mcp/)
npm run flatten                # Create XML codebase snapshot for AI analysis
```

### Installation & Setup
```bash
npm run install:aidesigner         # Install/upgrade aidesigner in target project
npx aidesigner install             # Same as above (npx wrapper)
npm run setup:hooks            # Setup git hooks for validation
```

### Code Quality
```bash
npm run lint                   # Run ESLint on JS/YAML files
npm run lint:fix               # Auto-fix linting issues
npm run format                 # Format code with Prettier
npm run format:check           # Check formatting without changes
npm run fix                    # Run format + lint:fix together
npm run pre-release            # Full validation before PR (validate + format:check + lint)
```

### Testing
```bash
npm test                       # Run Jest tests (phase safety, schemas)
```

### Version Management
```bash
npm run version:patch          # Bump patch version
npm run version:minor          # Bump minor version
npm run version:major          # Bump major version
npm run version:expansion      # Bump specific expansion pack version
```

### Utility Commands
```bash
npm run list:agents            # List all available agents
npm run validate               # Validate agent/team configurations
```

## Critical File Locations

### Core Framework
- **Agents**: `aidesigner-core/agents/*.md` - Agent persona definitions with YAML frontmatter
- **Workflows**: `aidesigner-core/workflows/*.yaml` - Multi-phase orchestration sequences
- **Templates**: `aidesigner-core/templates/*.yaml` - Document generation templates (PRD, architecture, stories)
- **Tasks**: `aidesigner-core/tasks/*.md` - Reusable task instructions for agents
- **Checklists**: `aidesigner-core/checklists/*.md` - Quality assurance and validation checklists
- **Knowledge Base**: `aidesigner-core/data/bmad-kb.md` - Core BMAD methodology documentation
- **Technical Preferences**: `aidesigner-core/data/technical-preferences.md` - User's tech stack preferences

### Invisible Orchestrator (New Feature)
- **Orchestrator Agent**: `agents/invisible-orchestrator.md` - User-facing conversational interface
- **Phase Detector**: `agents/phase-detector.md` - Internal phase inference engine
- **Auto-Commands**: `commands/auto-*.md` - Phase-specific automation (analyze, plan, architect, dev, qa, ux, po, stories)
- **MCP Server**: `mcp/server.ts` - Model Context Protocol server for state persistence
- **Hooks**: `hooks/phase-transition.js`, `hooks/context-preservation.js` - Phase management logic

### Build System
- **Web Builder**: `tools/builders/web-builder.js` - Creates .txt bundles for web UIs
- **CLI**: `tools/cli.js` - Main CLI orchestrator
- **Installer**: `tools/installer/bin/aidesigner.js` - Installation/upgrade system
- **Flattener**: `tools/flattener/main.js` - XML codebase aggregator for AI consumption

### Configuration
- **Core Config**: `aidesigner-core/core-config.yaml` - Project structure and path conventions
- **Agent Config**: `tools/installer/config/ide-agent-config.yaml` - IDE integration settings
- **Install Config**: `tools/installer/config/install.config.yaml` - Installation behavior

## Development Workflow

### Planning Phase (Web UI recommended)
1. **Analyst** → Market research, brainstorming, project brief
2. **PM** → Product Requirements Document (PRD) with epics/stories
3. **Architect** → Technical architecture document
4. **UX Expert** (optional) → Frontend specifications and UI prompts
5. **PO** → Validates alignment with master checklist

### Transition to IDE
6. Copy `docs/prd.md` and `docs/architecture.md` to project
7. **PO** → Shard documents into `docs/epics/` and `docs/stories/`

### Development Cycle (IDE)
8. **Scrum Master** → Draft detailed story from sharded epic
9. **Dev** → Implement story with full context
10. **QA** → Review and validate (optional but recommended)
11. **Repeat** until epic complete

## File Structure Best Practices

### Agent Definition Format
```markdown
---
agent: agent-name
role: Brief description
persona: Personality traits
dependencies:
  templates:
    - template-name
  tasks:
    - task-name
  checklists:
    - checklist-name
  data:
    - data-file-name
startup: |
  Optional instructions shown when agent activates
---

# Agent Name
Main agent prompt and instructions...
```

### Standard Project Paths (used by agents)
```
docs/
  prd.md                      # Product Requirements Document
  architecture.md             # System Architecture
  epics/                      # Sharded epic documents
    epic-1-*.md
  stories/                    # Development stories
    story-1-1-*.md
  architecture/               # Sharded architecture docs
    coding-standards.md
    tech-stack.md
    source-tree.md
  qa/
    assessments/              # Risk and test strategy
    gates/                    # Quality gate results
```

## Code Style & Standards

### JavaScript/Node.js
- CommonJS for tooling (CLI scripts under `tools/`)
- ESLint with modern best practices (unicorn, node plugins)
- Prettier with 100 char line width, single quotes, trailing commas
- Console.log allowed (CLI tool context)

### YAML
- Use `.yaml` extension (not .yml)
- Double quotes preferred, single quotes to avoid escapes
- Validated with yml ESLint plugin

### Markdown
- Preserve prose wrap (no auto-formatting of line breaks)
- Natural language, clear instructions for AI agents
- YAML frontmatter for agent metadata

## Testing Strategy

- Jest for unit/integration tests
- Focus on schema validation and safety rails
- Test files: `test/*.test.js`
- Phase transition safety validation
- Phase detector contract verification

## Git Workflow

### Branch Strategy
- `main`: Stable releases
- `develop`: Integration branch
- Feature branches from appropriate base

### Commit Standards
- Semantic commit messages encouraged
- Husky pre-commit hooks for validation (optional setup)
- Lint-staged runs prettier + eslint on changed files

### CI/CD
- **Format Check**: Prettier validation on all supported files
- **PR Validation**: Linting and format checks on pull requests
- **Manual Release**: Version bumping and changelog generation
- **Discord**: Release notifications

### Before Submitting PRs
```bash
npm run pre-release  # Runs validate + format:check + lint
```

## Expansion Packs

BMAD supports domain-specific extensions in `expansion-packs/`:
- `bmad-2d-phaser-game-dev/` - Phaser game development
- `bmad-2d-unity-game-dev/` - Unity 2D game development
- `bmad-creative-writing/` - Novel and screenplay writing
- `bmad-godot-game-dev/` - Godot game development
- `bmad-infrastructure-devops/` - Infrastructure and DevOps

Each expansion pack mirrors the core structure (agents/, workflows/, templates/, etc.) and can be installed independently.

## Important Constraints

### Natural Language Only
- Core framework (`aidesigner-core/`, `expansion-packs/`) contains NO code - only markdown/YAML
- All logic, persona, and instructions are natural language prompts
- Code exists only in `tools/` for build/install automation

### Agent Context Management
- **Dev agents**: Keep lean, focused on coding context
- **Planning agents**: Can be larger with complex templates and workflows
- Dependencies explicitly declared in agent frontmatter

### Environment Awareness
- Agents must work in both IDE (file-based) and Web (single bundle) contexts
- Web bundles include all dependencies inline
- IDE mode loads dependencies dynamically

## Invisible Orchestrator Architecture

### Zero-Knowledge Onboarding
- User interacts naturally without learning BMAD terminology
- `invisible-orchestrator.md` provides conversational interface
- `phase-detector.md` infers appropriate project phase from context
- Auto-commands execute phase-specific workflows transparently

### Phase Management
- **Confidence threshold**: Phase transitions require high confidence
- **Safety rails**: Validation before destructive operations
- **Context preservation**: Requirements and decisions persist across phases
- **State persistence**: MCP server maintains project state

### MCP Integration

**CRITICAL**: The MCP server must be built BEFORE publishing to npm.

```bash
npm run build:mcp   # Build TypeScript MCP server (MUST run before publish)
npm run mcp         # Run MCP server locally for testing
```

**MCP Server Architecture**:
- **Source**: `.dev/mcp/server.ts` (TypeScript entry point)
- **Compiled Output**: `dist/mcp/mcp/server.js` (published to npm)
- **Runtime**: `.dev/src/mcp-server/runtime.ts` → `dist/mcp/src/mcp-server/runtime.js`
- **Build Config**: `.dev/mcp/tsconfig.json` (outputs to `dist/mcp/`)

**Publishing Checklist**:
1. Run `npm run build:mcp` to compile TypeScript
2. Verify `dist/mcp/mcp/server.js` exists
3. Test with `node dist/mcp/mcp/server.js`
4. Check package contents: `npm pack --dry-run | grep "dist/mcp"`
5. Only then run `npm publish`

**Known Issue**: The MCP server `.js` files were missing from published packages in versions 1.3.17-1.3.21. The postinstall script builds them, but this creates timing issues with Claude Code CLI trying to connect before build completes. The `dist/mcp/mcp/server.js` file MUST be pre-built and included in the published package.

## Flattener Tool

Creates AI-optimized XML snapshots of codebases:

```bash
npx aidesigner flatten -i /path/to/source -o output.xml
```

- Respects `.gitignore` and `.bmad-flattenignore`
- Excludes binaries, focuses on source code
- XML format with CDATA sections for safe content embedding
- Token estimation and comprehensive statistics

## Publishing & Release

### Pre-Publish Checklist
```bash
# 1. Build everything
npm run build        # Builds agents, teams, expansion packs
npm run build:mcp    # CRITICAL: Builds MCP server TypeScript

# 2. Verify MCP server exists
ls dist/mcp/mcp/server.js  # Must exist!

# 3. Test MCP server
node dist/mcp/mcp/server.js  # Should start without errors

# 4. Validate package contents
npm pack --dry-run | grep "dist/mcp/mcp/server.js"  # Must appear in list

# 5. Run pre-release checks
npm run pre-release  # validate + format:check + lint

# 6. Version bump (if needed)
npm run version:patch   # or minor/major

# 7. Publish
npm publish
```

### MCP Server Integration (.mcp.json)
```json
{
  "mcpServers": {
    "aidesigner": {
      "command": "node",
      "args": ["node_modules/aidesigner/dist/mcp/mcp/server.js"],
      "disabled": false
    }
  }
}
```

## Contributing Guidelines

1. **Read first**: `CONTRIBUTING.md` and `docs/GUIDING-PRINCIPLES.md`
2. **Discuss features**: Use Discord (#general-dev) before implementing
3. **Small PRs**: Granular, focused changes
4. **Validation**: Run `npm run pre-release` before submitting
5. **Alignment**: Ensure changes match guiding principles
6. **Natural language**: Core framework changes must be markdown/YAML only
7. **MCP changes**: Always test MCP server build before committing

## Key Architectural Documents

- `docs/core-architecture.md` - System design and component relationships
- `docs/user-guide.md` - Complete workflow walkthrough
- `docs/expansion-packs.md` - Creating domain-specific extensions
- `docs/GUIDING-PRINCIPLES.md` - Philosophy and design decisions
- `docs/INVISIBLE_ORCHESTRATOR_README.md` - Zero-knowledge onboarding feature
- `docs/flattener.md` - XML codebase aggregation tool
- `docs/working-in-the-brownfield.md` - Integrating with existing projects

## Common Patterns

### Adding a New Agent
1. Create `aidesigner-core/agents/agent-name.md` with YAML frontmatter
2. Define dependencies (templates, tasks, checklists, data)
3. Write natural language persona and instructions
4. Run `npm run build:agents` to generate web bundle
5. Validate with `npm run validate`

### Creating an Expansion Pack
1. Create `expansion-packs/pack-name/` directory
2. Mirror core structure (agents/, workflows/, templates/, config.yaml)
3. Define `config.yaml` with pack metadata
4. Build with `npm run build`
5. Reference `docs/expansion-packs.md` for complete guide

### Modifying Build System
- Edit `tools/builders/web-builder.js` for bundle generation
- Update `tools/cli.js` for command-line interface changes
- Test with `npm run build` before committing
- Respect dependency resolution logic
