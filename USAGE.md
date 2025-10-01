# BMAD-Invisible Usage Guide

## Quick Start

```bash
# Build and run
npm run build:mcp
npm run chat
```

## How It Works

### MCP-Powered Architecture

```
User → Claude CLI → MCP Server → BMAD Agents → Deliverables
                     ↓
              Project State
              Phase Detection
              Context Preservation
```

### The Invisible Flow

1. **Discovery** - Asks about problem, users, goals
2. **Planning** - Creates roadmap and milestones
3. **Architecture** - Designs technical approach
4. **Stories** - Breaks into development tasks
5. **Development** - Provides implementation guidance
6. **Testing** - Defines test strategy
7. **Review** - Final validation and next steps

**You never see phase names - just natural conversation!**

## What Gets Generated

All files are automatically created in `docs/`:

- `brief.md` - Project overview from discovery
- `prd.md` - Product Requirements Document
- `architecture.md` - Technical design
- `architecture/` - Coding standards, tech stack, source tree
- `epics/` - Feature groupings
- `stories/` - Detailed development tasks
- `qa/assessments/` - Test strategy

Plus state tracking in `.bmad-invisible/`:

- `state.json` - Current phase and project metadata
- `conversation.json` - Full conversation history
- `deliverables.json` - Generated content references

## MCP Tools Available

The invisible orchestrator uses these MCP tools:

1. **get_project_context** - Current state
2. **detect_phase** - Analyze for phase transitions
3. **load_agent_persona** - Get phase-specific expertise
4. **transition_phase** - Move between phases
5. **generate_deliverable** - Create documents
6. **record_decision** - Save key decisions
7. **add_conversation_message** - Track conversation
8. **get_project_summary** - Project overview
9. **list_bmad_agents** - Available agents
10. **execute_bmad_workflow** - Run phase workflows

## Validation Checkpoints

The system asks for your confirmation:

✅ **After Discovery**: "Does this capture your needs?"
✅ **After Planning**: "Shall I proceed with architecture?"
✅ **After Architecture**: "Does this technical approach work?"
✅ **After Stories**: "Ready to start building?"

Always respond: `y` (yes), `n` (no), or `edit`/`modify`

## Tips for Best Results

### Be Specific

```
❌ "Build an app"
✅ "Build a family chore management app for parents and kids aged 8-16"
```

### Answer Discovery Questions

The better the discovery phase, the better the deliverables:

- What problem are you solving?
- Who are your users?
- What does success look like?
- Any technical constraints?

### Review Before Proceeding

When asked "Does this look correct?", actually read the summary. It's your project!

### Iterate if Needed

```
You: This looks good but I want Firebase instead of PostgreSQL
Assistant: Absolutely! Let me update the architecture...
```

## Advanced Usage

### Using Other LLMs

#### Gemini (via MCP when supported)

```bash
# When Gemini adds MCP support, configure similarly
# For now, use web bundles (see README.md)
```

#### ChatGPT (via agents or bundles)

```bash
# Option 1: If ChatGPT adds MCP support
# Option 2: Upload pre-built agent bundles
npm run build
# Upload dist/agents/*.txt to Custom GPTs
```

### Direct MCP Server Usage

```bash
# Run MCP server standalone
npm run mcp

# Or with custom path
node dist/mcp/server.js
```

### Using in IDEs

The MCP config at `.claude/mcp-config.json` works with:

- Claude Code (CLI and Desktop)
- Any MCP-compatible IDE

## Troubleshooting

### Claude CLI not found

```bash
# Install Claude Code CLI
# Visit: https://claude.ai/code
```

### MCP server not starting

```bash
# Rebuild
npm run build:mcp

# Check dist/mcp/server.js exists
ls -la dist/mcp/
```

### Permission denied on bin/bmad-chat

```bash
chmod +x bin/bmad-chat
```

### No deliverables generated

Check that you're confirming at checkpoints. The system needs your `y` to proceed and generate files.

## Example Workflows

### New Project from Scratch

```
1. npm run chat
2. "Help me build [your idea]"
3. Answer discovery questions
4. Review and confirm each phase
5. Get complete docs/ folder with everything
```

### Add Feature to Existing Project

```
1. cd your-project
2. npm run chat
3. "I need to add [feature]"
4. System detects context, suggests approach
5. Get stories and implementation guidance
```

## Project State

Check anytime:

```
docs/                  # Your deliverables
.bmad-invisible/       # Project state
  state.json          # Current phase, decisions
  conversation.json   # Full history
  deliverables.json   # Generated content
```

Resume later - state persists!

## No API Costs

✅ Uses your Claude Pro subscription
✅ Works with Claude Code CLI
✅ No Anthropic API key needed
✅ No usage limits beyond your plan

## Support

- **Issues**: https://github.com/bacoco/BMAD-invisible/issues
- **Docs**: See README.md and IMPLEMENTATION_ANALYSIS.md
- **Base BMAD**: https://github.com/bacoco/BMAD-METHOD

---

**Remember**: The magic is invisible. You get professional deliverables from natural conversation.
