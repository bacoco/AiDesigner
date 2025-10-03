# BMAD-Invisible Usage Guide

## Quick Start

### Fastest Way (One Command!)

```bash
# In any directory, just run:
npx bmad-invisible@latest start
```

This does everything: creates structure, installs dependencies, and launches chat!
You'll be prompted to pick Codex, Claude, or OpenCode (defaults to Codex). Use
`--assistant=<choice>` to skip the prompt. Add `--glm` / `--llm-provider=glm`
to launch the orchestrator against ZhipuAI's GLM using the
`ZHIPUAI_API_KEY`/`GLM_API_KEY` credentials, or `--anthropic` to force the
legacy Claude defaults.

> **💡 Tip**: Always use `@latest` to get the newest version!

### Alternative: Step-by-Step

```bash
# Initialize project
npx bmad-invisible@latest init

# Install dependencies
npm install

# Start chatting (pick your assistant)
# Default orchestrator launcher
npm run bmad
# Codex front-end
npm run bmad:codex
# Claude CLI front-end
npm run bmad:claude
# OpenCode front-end
npm run bmad:opencode
# Add -- --glm to any npm script invocation to switch providers
```

> **UI Toolkit Opt-in**: When you include the optional shadcn UI helpers, the
> installer generates a `components.json` at the project root following the
> shadcn schema so the `shadcn` CLI can locate your Tailwind and alias settings
> during component installs.

### For Local Development

```bash
# Clone and setup
git clone https://github.com/bacoco/BMAD-invisible.git
cd BMAD-invisible
npm install

# Build and run
npm run build:mcp
npm run bmad
```

### Selecting Your LLM Provider

- Use `--glm` (alias for `--llm-provider=glm`) with any BMAD CLI command to run
  the orchestrator on ZhipuAI's GLM. Provide credentials via `ZHIPUAI_API_KEY`
  or the fallback `GLM_API_KEY`.
- Override the model with `--llm-model=<model>` or by exporting `LLM_MODEL`.
- Persist defaults in a `.env` file so every spawn inherits them:

  ```bash
  # .env
  LLM_PROVIDER=glm
  ZHIPUAI_API_KEY=sk-...
  LLM_MODEL=glm-4-plus
  ```

- Switching back to Anthropic is as simple as passing `--anthropic` or
  re-exporting `LLM_PROVIDER=claude`.
- The launcher injects overrides only into the child process, so your shell
  environment remains untouched.

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

## Integrity Safeguards

BMAD-Invisible now records SHA-256 hashes for critical, user-modifiable resources.
When you launch any CLI entry point (`bmad-invisible`, `bmad-invisible-codex`, or
`bmad-claude`), a quick pre-flight check compares the current files against the
baseline stored in `.bmad-invisible/critical-hashes.json`.

- ✅ Matching hashes: the CLI proceeds silently.
- ⚠️ Diverging hashes: you receive a warning summarising which core files changed,
  went missing, or were newly added under tracked scopes such as:
  - `bmad-core/core-config.yaml`
  - `bmad-core/checklists/`
  - `bmad-core/templates/`
  - `expansion-packs/`
  - `codex-config.toml.example`

If you intentionally customise these resources, regenerate the baseline after
your edits:

```bash
node tools/update-critical-hashes.js
```

The baseline is committed per project, so the warning helps catch accidental
overwrites during upgrades while still allowing deliberate extensions.

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
node dist/mcp/mcp/server.js
```

### Using in IDEs

The MCP config at `.claude/mcp-config.json` works with:

- Claude Code (CLI and Desktop)
- Any MCP-compatible IDE

> Claude uses a JSON object keyed by MCP server names. Optional entries for
> `chrome-devtools` and `shadcn` are shipped disabled so you can flip them on by
> changing `"disabled": false` after installing the corresponding servers.

### Codex CLI Defaults

When you include Codex CLI during installation, the wizard now also prepares your global configuration:

- Creates `~/.codex/config.toml` if it is missing.
- Adds the `bmad_invisible` MCP server pointing to `npx bmad-invisible mcp` and
  stubs for optional `chrome-devtools` and `shadcn` integrations (with
  `auto_start = false`).
- Sets default Codex preferences (`GPT-5-Codex`, medium reasoning, automatic approvals) without overwriting existing overrides.

This step is skipped automatically in non-interactive environments. See [`codex-config.toml.example`](./codex-config.toml.example) for the full TOML structure you can tailor afterwards.

> Codex stores the MCP list in TOML tables (`[mcp_servers.<name>]`). Toggle the
> optional helpers by switching `auto_start` to `true` once the external server
> binaries are available locally.

### Automatic CLI Provisioning

The `bin/bmad-codex` and `bin/bmad-claude` launchers now validate that the Codex and Claude CLIs are installed **before** spawning the orchestrator session. If a binary is missing, the script will:

- Offer an interactive menu with installation helpers (for example `npm exec --yes @openai/codex-cli@latest -- codex --help`, Homebrew taps, and the official download docs).
- Fall back to printing the same guidance when running in non-interactive contexts (CI, redirected stdin/stdout) so automation jobs fail fast but still surface the remediation steps.
- Cache the resolved binary location in `.bmad-invisible/cli-state.json` once the CLI is detected so you are not prompted again on subsequent runs.

Ensure your environment has network access and an up-to-date Node.js runtime so that `npm exec`-based installers can complete successfully. If you prefer manual installation, pick the documentation option from the prompt and follow the upstream instructions before re-running the launcher.

### Invisible Story Context Packets

- When the orchestrator transitions into development or QA, it now assembles a just-in-time story packet inspired by V6’s `story-context` command.
- Persona reminders, acceptance criteria, definition of done, and testing notes are pulled from the active story file (or from `context.story` if you provide metadata programmatically).
- Additional enrichers can be registered at runtime via `bmadBridge.registerContextEnricher(fn)` if you need to inject architecture updates or custom quality gates.
- See [`docs/STORY_CONTEXT.md`](docs/STORY_CONTEXT.md) for a deep dive into the enrichment flow and how to extend it.

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

# Check the compiled entrypoint exists
ls -la dist/mcp/mcp/
```

### Permission denied on bin/bmad-claude

```bash
chmod +x bin/bmad-claude
```

### No deliverables generated

Check that you're confirming at checkpoints. The system needs your `y` to proceed and generate files.

## Example Workflows

### New Project from Scratch

```
1. npm run bmad
2. "Help me build [your idea]"
3. Answer discovery questions
4. Review and confirm each phase
5. Get complete docs/ folder with everything
```

### Add Feature to Existing Project

```
1. cd your-project
2. npm run bmad
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

## Provider & API Costs

✅ Claude flows ride on your Claude Code subscription – no additional API key
management required.
✅ GLM flows require a `ZHIPUAI_API_KEY` (or `GLM_API_KEY`) but the launcher
passes it through only to the spawned CLI.
✅ Use `--anthropic` or `LLM_PROVIDER=claude` whenever you want to revert to the
Anthropic defaults.

## Support

- **Issues**: https://github.com/bacoco/BMAD-invisible/issues
- **Docs**: See README.md and DUAL_LANE_ORCHESTRATION.md
- **Base BMAD**: https://github.com/bacoco/BMAD-METHOD

---

**Remember**: The magic is invisible. You get professional deliverables from natural conversation.
