# lolo

Welcome to your AiDesigner project! This project follows the **BMAD-METHOD™** (Breakthrough Method of Agile AI-driven Development) - a universal AI agent framework that orchestrates specialized AI agents through structured workflows.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development

```bash
# Launch Codex CLI for interactive development
npm run aidesigner:codex

# Or use Claude chat
npm run aidesigner:claude
```

## 📁 Project Structure

```
lolo/
├── docs/                    # Generated documentation
│   ├── prd/                # Product requirements (sharded by PO agent)
│   ├── architecture/       # System architecture (sharded by PO agent)
│   ├── stories/            # User stories (created by SM agent)
│   └── qa/                 # QA assessments and gates
│       ├── assessments/
│       └── gates/
├── .aidesigner/                # AiDesigner metadata
└── .mcp.json               # MCP server configuration
```

## 🎯 BMAD Workflow

The BMAD methodology follows a structured three-phase workflow:

### Phase 1: Planning (Web UI Recommended)

Use BMAD agents in web-based AI platforms (Gemini, ChatGPT) for comprehensive planning:

1. **Analyst Agent** → Creates project brief and market research
2. **PM Agent** → Generates `docs/prd.md` (Product Requirements Document)
3. **Architect Agent** → Creates `docs/architecture.md` (System Architecture)
4. **UX Expert Agent** (optional) → Frontend specifications
5. **PO Agent** → Validates and "shards" documents into subdirectories

### Phase 2: Transition to IDE

Copy generated documents to your project:

- `docs/prd.md` → sharded into `docs/prd/epic-*.md`
- `docs/architecture.md` → sharded into `docs/architecture/`

### Phase 3: Development (IDE)

Use agents in your IDE (VS Code, Cursor, Claude Code) for implementation:

1. **Scrum Master (SM)** → Creates detailed stories in `docs/stories/`
2. **Dev Agent** → Implements features following architecture
3. **QA Agent** → Reviews and validates code quality
4. **Repeat** until epic is complete

## 🤖 Available Agents

BMAD provides specialized agents for different tasks:

- **Analyst**: Market research, requirements gathering, brainstorming
- **PM (Product Manager)**: PRD generation, epic/story breakdown
- **Architect**: Technical architecture, design decisions
- **UX Expert**: Frontend specs, UI/UX design
- **PO (Product Owner)**: Validation, document sharding, alignment
- **SM (Scrum Master)**: Story creation, sprint planning
- **Dev**: Code implementation, feature development
- **QA**: Code review, testing, quality gates

## 📝 How Documents Are Generated

**Important**: You don't manually fill out templates! BMAD agents generate all documentation using:

- **YAML Templates** (in `aidesigner-core/templates/`): Define document structure
- **Agent Intelligence**: Agents use these templates to create tailored docs
- **MCP Tools**: Model Context Protocol enables agents to create/modify files

### Example Agent Commands

```bash
# In IDE with AiDesigner agent active:
"Use PM agent to create a PRD for user authentication feature"
"Use Architect agent to design the database schema"
"Use SM agent to create stories for Epic 1"
```

## 🛠️ Available Commands

```bash
# Core Commands
npm run aidesigner          # Start AiDesigner orchestrator
npm run codex           # Launch Codex CLI
npm run aidesigner:codex    # Same as above
npm run aidesigner:claude   # Launch Claude chat
npm run aidesigner:opencode # Open code interface
npm run aidesigner:build    # Build AiDesigner bundles

# Build & Development
npm run build           # Build all agents and bundles
npm run build:agents    # Build agent bundles only
npm run build:mcp       # Build MCP server

# Quality
npm run lint            # Run linter
npm run format          # Format code
npm run test            # Run tests
```

## 🔧 Configuration

### MCP Server Configuration

Your MCP servers are configured in `.mcp.json`. To modify:

```bash
npx aidesigner init  # Re-run to update MCP configuration
```

### LLM Provider Configuration

Set your preferred LLM provider via environment variables:

```bash
# Claude (Anthropic)
export ANTHROPIC_API_KEY="your-key"

# GLM (ZhipuAI)
export GLM_API_KEY="your-key"
export GLM_BASE_URL="https://open.bigmodel.cn/api/paas/v4"

# OpenAI
export OPENAI_API_KEY="your-key"

# Gemini
export GEMINI_API_KEY="your-key"
```

## 📚 Documentation & Resources

- **BMAD Methodology**: [Core Architecture](https://github.com/bacoco/aidesigner)
- **User Guide**: Complete workflow walkthrough
- **Expansion Packs**: Domain-specific extensions (game dev, creative writing, etc.)
- **Community**: [Discord](https://discord.gg/aidesigner) for support and discussions

## 🎓 Learning Path

### New to BMAD?

1. Read the [BMAD User Guide](https://github.com/bacoco/aidesigner/blob/main/docs/user-guide.md)
2. Try the [Quick Start Tutorial](https://github.com/bacoco/aidesigner/blob/main/docs/quickstart.md)
3. Explore [Example Projects](https://github.com/bacoco/aidesigner/tree/main/examples)

### Next Steps

1. ✅ Run `npm install` to install dependencies
2. 🎯 Use **PM Agent** to create your first PRD
3. 🏗️ Use **Architect Agent** to design your system
4. 💻 Use **Dev Agent** to start building!

---

**Powered by AiDesigner** | BMAD-METHOD™ Framework
