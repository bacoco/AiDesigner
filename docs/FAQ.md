# Agilai FAQ

## How It Works

### Where are documents generated?

All project deliverables are automatically generated in your project's `docs/` folder:

```
your-project/
├── docs/
│   ├── brief.md                    # Project overview (from Discovery)
│   ├── prd.md                      # Product Requirements Document (from Planning)
│   ├── architecture.md             # System Architecture (from Architecture phase)
│   ├── architecture/
│   │   ├── coding-standards.md     # Coding guidelines
│   │   ├── tech-stack.md           # Technology choices
│   │   └── source-tree.md          # Project structure
│   ├── epics/
│   │   └── epic-1-*.md             # Feature groupings
│   ├── stories/
│   │   ├── story-1-1-*.md          # Development tasks
│   │   └── story-1-2-*.md
│   └── qa/
│       └── assessments/
│           └── risk-assessment.md   # Test strategy
└── .agilai/
    ├── state.json                   # Current phase and project state
    ├── conversation.json            # Full conversation history
    └── deliverables.json            # Generated content references
```

**When are they created?**

- Automatically after each phase, following user validation
- You'll see a summary first, then confirm with `y/n/edit`
- Only after confirmation does the orchestrator generate the actual files

**How to access them?**

- Just open `docs/` folder in your project
- All files are plain markdown - readable in any editor
- Can be committed to git, shared with team, etc.

---

## Validation & Quality Control

### Will the orchestrator validate with me like BMAD method?

**YES!** The orchestrator includes all BMAD validation checkpoints, but presents them naturally:

#### After Discovery (Analyst Phase):

```
Orchestrator: "Here's what I understand:

Problem: [your problem summary]
Users: [target users]
Goals: [project objectives]
Timeline: [constraints]

Does this capture your needs? (y/n/edit)"
```

**Your options:**

- `y` → Proceed to planning
- `n` → Refine the understanding
- `edit` → Make specific changes

#### After Planning (PM Phase):

```
Orchestrator: "Here's the development plan:

Timeline: 12 weeks
Phase 1 (Weeks 1-4): [features]
Phase 2 (Weeks 5-8): [features]
Phase 3 (Weeks 9-12): [polish]

Does this plan work for you? (y/n)"
```

#### After Architecture (Architect Phase):

```
Orchestrator: "Recommended technical approach:

Stack: React Native + Firebase
Architecture: [overview]
Why: [rationale]

Does this technical approach work? (y/n/modify)"
```

#### After Stories (Scrum Master Phase):

```
Orchestrator: "I've broken this into tasks:

Epic 1: Task Management (4 stories)
Epic 2: User System (3 stories)
Epic 3: Notifications (2 stories)

Ready to start building? (y/n)"
```

### What if I disagree?

Just say so! Examples:

- `"No, I prefer PostgreSQL over Firebase"`
- `"Can we do this in 8 weeks instead of 12?"`
- `"I want feature X before feature Y"`

The orchestrator will adjust and re-validate with you.

### Can I skip validation?

No - validation is a **safety checkpoint**. The orchestrator will not proceed to the next phase without your explicit confirmation. This prevents:

- Building the wrong thing
- Committing to unsuitable architecture
- Missing critical requirements

---

## Working with Existing Projects

### Will it work for projects NOT started with Agilai?

**YES!** The orchestrator handles both:

- **Greenfield** (new projects from scratch)
- **Brownfield** (existing codebases)

### How to use with existing projects:

#### 1. Initialize in existing project

```bash
cd your-existing-project
npx agilai@latest init
npm install
```

#### 2. Start conversation

```bash
npm run agilai
```

#### 3. Tell the orchestrator about existing work

```
You: "I have an existing iOS todo app built with Swift/SwiftUI.
      It uses Core Data for local storage.
      I want to add Firebase sync and team sharing."

Orchestrator: "Great! Let me understand your current setup.
               [Scans codebase automatically]

               I see you have:
               - TodoItem model with Core Data
               - Local-only storage
               - Single-user design

               To add team sharing, we'll need:
               - Firebase backend
               - User authentication
               - Real-time sync layer

               Does this match your current architecture?"
```

The orchestrator will:

- ✅ **Scan existing codebase** automatically
- ✅ **Detect existing docs** if present and resume from there
- ✅ **Preserve existing architecture** and build on it
- ✅ **Generate incremental docs** that complement existing work
- ✅ **Resume from any phase** if you have prior state

### What about existing documentation?

The orchestrator intelligently handles existing docs:

**If you have existing docs:**

- Reads and understands them
- Proposes updates/additions
- Creates new sections rather than overwriting
- Asks: `"I see you have docs/architecture.md. Should I update it or create a new section?"`

**If you have docs from previous sessions:**

- Detects them automatically
- Loads prior state from `.agilai/state.json`
- Asks: `"I see we left off at the Architecture phase. Want to continue from there?"`

### Can I resume after stopping?

**YES!** Project state persists:

```
.agilai/
├── state.json              # Current phase, context, decisions
├── conversation.json       # Full conversation history
└── deliverables.json       # Generated files tracking
```

**Resume workflow:**

```bash
# Come back days/weeks later
cd your-project
npm run agilai

# Orchestrator automatically loads state
Orchestrator: "Welcome back! We were working on the team todo app.
               Last session, we completed the architecture phase.
               Ready to break this into development tasks?"
```

**What's preserved:**

- ✅ Current phase
- ✅ All requirements and decisions
- ✅ Conversation history
- ✅ Generated deliverables
- ✅ User validations

**What's NOT preserved:**

- ❌ Claude's working memory (that's per-session)
- ❌ Uncommitted code changes
- ❌ Terminal/IDE state

### Examples of Brownfield Usage

#### Example 1: Add feature to existing app

```
You: "I have a Swift/SwiftUI app. Want to add push notifications."

Orchestrator: [Scans codebase]
              "I see you're using:
               - SwiftUI for UI
               - Core Data for storage
               - No backend currently

               For push notifications, I recommend:
               - Firebase Cloud Messaging (FCM)
               - APNs (Apple Push Notification service)
               - Cloud Functions for triggers

               Does this approach work?"
```

#### Example 2: Document undocumented project

```
You: "Inherited this codebase, need docs."

Orchestrator: [Scans codebase]
              "I've analyzed your project:

               Tech Stack:
               - React Native
               - Redux for state
               - Firebase backend

               Architecture:
               - 3 main screens
               - Offline-first sync
               - Real-time listeners

               Shall I generate full documentation?"
```

#### Example 3: Refactor existing code

```
You: "Need to split monolithic app into microservices."

Orchestrator: [Scans codebase]
              "Current architecture:
               - Single Node.js server
               - Monolithic Express app
               - PostgreSQL database

               Proposed microservices:
               1. User Service (auth, profiles)
               2. Task Service (CRUD, assignments)
               3. Notification Service (emails, push)

               Sound good?"
```

---

## Project State & Continuity

### How does state tracking work?

The orchestrator maintains complete project state in `.agilai/`:

#### `state.json` - Current Project State

```json
{
  "phase": "architect",
  "project": {
    "name": "Family Todo App",
    "type": "mobile",
    "platform": "iOS"
  },
  "context": {
    "problemStatement": "...",
    "targetUsers": "...",
    "goals": "...",
    "techStack": "..."
  },
  "decisions": [
    {
      "phase": "pm",
      "decision": "Use React Native for cross-platform",
      "rationale": "Faster development, single codebase",
      "timestamp": "2025-10-01T10:30:00Z"
    }
  ],
  "lastUpdated": "2025-10-01T10:35:00Z"
}
```

#### `conversation.json` - Full History

```json
{
  "messages": [
    {
      "role": "user",
      "content": "I want to build a todo app",
      "timestamp": "2025-10-01T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Great! What problem are you trying to solve?",
      "timestamp": "2025-10-01T10:00:15Z"
    }
  ]
}
```

#### `deliverables.json` - Generated Files

```json
{
  "brief": {
    "path": "docs/brief.md",
    "generated": "2025-10-01T10:15:00Z",
    "phase": "analyst"
  },
  "prd": {
    "path": "docs/prd.md",
    "generated": "2025-10-01T10:25:00Z",
    "phase": "pm"
  }
}
```

### Can I edit state manually?

**Yes, but not recommended.** The orchestrator manages state automatically. However, if needed:

```bash
# View current state
cat .agilai/state.json

# Edit (use carefully!)
# The orchestrator will detect changes on next run
```

Better approach: Just tell the orchestrator in conversation:

```
You: "Actually, I want to change the tech stack to Vue instead of React"
Orchestrator: "Got it! Let me update the architecture..."
```

---

## Technical Details

### What LLM powers the conversation?

The orchestrator uses **Claude Sonnet 4.5** via Claude Code CLI:

- Runs locally on your machine
- Uses your Claude Pro subscription (no API costs!)
- Accesses MCP tools for state management
- Loads BMAD agent personas dynamically

### Is the conversation static or generated?

**Generated in real-time** by Claude based on:

1. **Orchestrator prompt** (`agents/invisible-orchestrator.md`) - Instructions on how to behave
2. **Your responses** - Adapts to what you say
3. **Project state** - Loads context from `.agilai/`
4. **Phase context** - Internally loads appropriate agent expertise
5. **Proven methodology** - Follows proven workflow behind the scenes

Each response is uniquely generated - not pre-written templates.

### How does codebase scanning work?

The orchestrator uses MCP tools to:

1. **`scan_codebase`** - Analyzes file structure, imports, patterns
2. **`read_files`** - Reads key files (package.json, main entry points, models)
3. **`detect_tech_stack`** - Identifies frameworks, libraries, languages
4. **`analyze_architecture`** - Understands component structure, data flow

This happens automatically when you mention "existing project" or "current codebase".

### Can I use it offline?

**Partially:**

- ❌ Claude Code CLI requires internet (it's cloud-based)
- ✅ MCP server runs locally
- ✅ State persistence works offline
- ✅ Generated docs are local files

### What if Claude Code is down?

You can still:

- ✅ Access all generated docs in `docs/`
- ✅ View project state in `.agilai/`
- ✅ Continue development using existing docs
- ❌ Can't start new conversations until service is back

---

## Comparison with Traditional BMAD

### How is this different from regular BMAD?

| Feature               | Traditional BMAD                         | Agilai                                  |
| --------------------- | ---------------------------------------- | --------------------------------------- |
| **User Experience**   | Must learn agent names, phases, commands | Natural conversation, no learning curve |
| **Agent Interaction** | Explicitly invoke agents                 | Agents loaded invisibly behind scenes   |
| **Phase Transitions** | Manual phase switching                   | Automatic detection + validation        |
| **Documentation**     | User must request each doc               | Auto-generated after validation         |
| **Interface**         | IDE-based, file-driven                   | Conversational CLI                      |
| **Learning Curve**    | Moderate (understand methodology)        | Zero (just chat naturally)              |
| **Flexibility**       | Full control, explicit                   | Guided, automatic                       |
| **Best For**          | Power users, teams familiar with agile   | New users, quick onboarding             |

### Can I still use traditional BMAD?

**YES!** Agilai is a wrapper, not a replacement:

```bash
# Traditional BMAD (IDE-based)
npx bmad-method install
# Use agents directly in VS Code/Cursor/Claude Code

# Agilai (conversational)
npx agilai@latest start
# Chat naturally, get same deliverables
```

Both produce the same `docs/` structure, so you can switch between them!

---

## Troubleshooting

### "MCP server not found"

```bash
# Rebuild MCP server
npm run build:mcp

# Verify it exists
ls -la dist/mcp/mcp/server.js
```

### "Command not found: claude"

```bash
# Install Claude Code CLI
# Visit: https://claude.ai/code
```

### "State file corrupted"

```bash
# Reset state (backs up old state)
rm .agilai/state.json
npm run agilai
# Orchestrator will start fresh
```

### "Deliverables not generated"

Check that you confirmed at validation checkpoints:

- Orchestrator needs your `y` to proceed
- If you said `n` or `edit`, deliverables won't generate until approved

### "Can't resume previous session"

Check if `.agilai/state.json` exists:

```bash
# View state
cat .agilai/state.json

# If missing, state was cleared
# Start new session - orchestrator will ask context questions
```

---

## Best Practices

### Getting the Most from Agilai

#### 1. Be Specific During Discovery

❌ **Vague**: "Build an app"
✅ **Specific**: "Build a family chore management app for parents and kids aged 8-16"

#### 2. Answer Discovery Questions Thoroughly

The better the discovery phase, the better the deliverables:

- What problem are you solving?
- Who are your users?
- What does success look like?
- Any technical constraints?

#### 3. Review Before Confirming

When asked "Does this look correct?", actually read the summary. It's your project!

#### 4. Iterate When Needed

```
You: "This looks good but I want Firebase instead of PostgreSQL"
Orchestrator: "Absolutely! Let me update the architecture..."
```

#### 5. Use for Both New and Existing Projects

Don't assume it's only for greenfield - brownfield works great!

#### 6. Commit State Files

```bash
git add .agilai/ docs/
git commit -m "Add project state and docs"
```

This lets your team resume from the same point.

---

## Future Enhancements

### Planned Features

- 🚧 Web UI for conversation (in addition to CLI)
- 🚧 Team collaboration (multiple users, shared state)
- 🚧 Integration with project management tools (Jira, Linear)
- 🚧 Export deliverables to other formats (PDF, Notion, Confluence)
- 🚧 Voice interface for discovery sessions
- 🚧 IDE extensions (VS Code, Cursor)

### Community Contributions

See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to help!

---

## Support

- **Issues**: https://github.com/bacoco/agilai/issues
- **Docs**: See [README.md](../README.md) and [USAGE.md](../USAGE.md)
- **Base BMAD**: https://github.com/bacoco/BMAD-METHOD

---

_Making AI-assisted development accessible to everyone through natural conversation._
