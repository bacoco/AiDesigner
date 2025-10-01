# BMAD-Invisible

**Zero-Knowledge Onboarding for BMAD-METHOD™**

An invisible orchestrator layer that allows users to benefit from BMAD's proven agile methodology through natural conversation, without learning any framework terminology.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

## 🎯 What is BMAD-Invisible?

BMAD-Invisible wraps BMAD-METHOD™'s powerful agile AI framework in a conversational interface. Users chat naturally about their project, and the system automatically:
- Gathers requirements (Analyst phase)
- Creates development plans (PM phase)
- Designs architecture (Architect phase)
- Breaks work into stories (Scrum Master phase)
- Guides implementation (Developer phase)
- Ensures quality (QA phase)

**All while keeping the methodology completely invisible.**

## 🔥 Quick Start

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 9.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/bacoco/BMAD-invisible.git
cd BMAD-invisible

# Install dependencies
npm install

# Start a project conversation
npx bmad-invisible chat
```

## 📖 How It Works

### The Invisible Flow

```
User: "I want to build an app"
  ↓
[Analyst Phase - Hidden]
  ↓
Assistant: "What problem are you trying to solve?"
  ↓
[Gathers requirements through conversation]
  ↓
Assistant: "Here's what I understand... [shows summary]"
  ↓
User: validates or iterates
  ↓
[PM Phase - Hidden]
  ↓
Assistant: "Here's the development plan..."
  ↓
[Architecture Phase - Hidden]
  ↓
Assistant: "Here's the technical approach..."
  ↓
[Continues through all phases invisibly]
```

## 💡 Usage Examples

### Example 1: Simple App Project

```bash
$ npx bmad-invisible chat

Welcome! I'm here to help you build your project.
What would you like to create?

> I need an app for tracking family chores

Great! Let's figure this out together.
Who will be using this app?

> Parents and kids, ages 8 and up

Perfect. What does success look like?

> Everyone knows their tasks and chores actually get done

Makes sense. Any constraints I should know about?
(Budget, timeline, technical preferences?)

> Need it in 3 months, prefer mobile-first

📋 Let me summarize what I understand:

**Project**: Family Chore Tracking App
**Users**: Parents & children (8+)
**Goal**: Clear task visibility and completion
**Timeline**: 3 months
**Platform**: Mobile-first

Is this correct? (y/n/edit)

> y

Perfect! Based on this, here's a 12-week development plan:

**Phase 1 (Weeks 1-4): Core Features**
- Task creation and assignment
- User profiles (parent/child roles)
- Basic completion tracking

**Phase 2 (Weeks 5-8): Engagement**
- Reward points system
- Notifications
- Progress visualization

**Phase 3 (Weeks 9-12): Polish**
- Testing and refinement
- Performance optimization
- User onboarding flow

Does this approach work for you? (y/n/modify)

> y

Excellent! Now for the technical approach.

**Recommended Stack**:
- Mobile: React Native (iOS + Android from one codebase)
- Backend: Firebase (real-time sync, authentication)
- Database: Firestore (flexible, scalable)
- Hosting: Firebase Hosting

**Why this stack?**
- Faster development (built-in features)
- Real-time updates (perfect for family coordination)
- Lower cost to start
- Easy to scale later

Sound good, or prefer something else? (y/n/modify)

> Sounds perfect

Great! Let me break this into specific tasks.

**Epic 1: Task Management** (3-4 weeks)
Story 1.1: Create and edit tasks ← Let's start here
Story 1.2: Assign tasks to family members
Story 1.3: Mark tasks complete

**Epic 2: User System** (2-3 weeks)
Story 2.1: Family member profiles
Story 2.2: Parent/child permissions

**Epic 3: Rewards** (2 weeks)
Story 3.1: Point tracking
Story 3.2: Rewards redemption

Ready to start with Story 1.1? (y/n)

> y

Perfect! Here's your first feature to build:

**Story 1.1: Create and Edit Tasks**

**What users can do**:
- Tap "+" to create new task
- Enter: task name, description, points (1-5)
- Optionally set due date
- Save and see task in list immediately

**Technical Implementation**:

1. **Component**: `TaskForm.jsx`
   ```javascript
   // Key fields
   - taskName (required)
   - description (optional)
   - points (1-5, default: 3)
   - dueDate (optional)
   ```

2. **Firestore Structure**:
   ```javascript
   tasks/{taskId}
   {
     name: string,
     description: string,
     points: number,
     dueDate: timestamp,
     createdBy: userId,
     assignedTo: userId,
     status: 'pending' | 'in-progress' | 'complete',
     createdAt: timestamp
   }
   ```

3. **Implementation Steps**:
   - [ ] Create TaskForm component
   - [ ] Add form validation
   - [ ] Implement Firestore write
   - [ ] Add real-time listener
   - [ ] Show success/error feedback

**Acceptance Criteria**:
- ✓ Can create task with all fields
- ✓ Task appears instantly in list
- ✓ Empty names are prevented
- ✓ Handles offline gracefully

**Testing**:
- Create task with all fields → appears in list
- Try empty name → shows validation error
- Create while offline → syncs when back online

Want the complete code examples or ready to implement? (code/ready)

> ready

Awesome! When you're done, let me know and I'll help you:
- Review the implementation
- Add tests
- Move to the next story

Type 'done' when ready for review, or 'help' if you get stuck.
```

### Example 2: Adding a Feature to Existing Project

```bash
$ npx bmad-invisible chat --project ./my-app

I see you have an existing project. What would you like to add?

> I need to add push notifications

Perfect! Let me understand what you need.

What should trigger these notifications?

> When a task is assigned or due soon

Great. Who should receive them?

> The person assigned to the task

Makes sense. Any preferences on implementation?

> Use Firebase Cloud Messaging

📋 Here's what I'll help you build:

**Feature**: Push Notifications
**Triggers**:
  - Task assigned to user
  - Task due in 24 hours
**Recipients**: Assigned user only
**Technology**: Firebase Cloud Messaging (FCM)

Correct? (y/n)

> y

Perfect! This will integrate with your existing Firebase setup.

**Story: Push Notifications for Tasks**

**Implementation Plan**:

1. **FCM Setup** (30 minutes)
   - Add FCM to React Native
   - Request notification permissions
   - Store device tokens in Firestore

2. **Cloud Function Triggers** (1 hour)
   - Trigger on task assignment
   - Trigger on approaching due date
   - Send to user's registered devices

3. **In-App Handling** (30 minutes)
   - Handle notification tap
   - Navigate to task details
   - Update UI accordingly

**Files to Modify**:
- `src/services/notifications.js` (new)
- `functions/index.js` (add triggers)
- `src/screens/TaskList.jsx` (handle taps)
- `app.json` (FCM config)

Want detailed code for each step? (y/n)

> y

[Provides step-by-step implementation with code examples]

Once you're done, I'll help you test it thoroughly!
```

## 🛠️ Current Implementation Status

### ⚠️ Important Notice

**This is currently a PROTOTYPE** that demonstrates the invisible orchestrator concept. To make it production-ready, see [IMPLEMENTATION_ANALYSIS.md](IMPLEMENTATION_ANALYSIS.md) for:

- Required integration with BMAD core
- Missing components
- Implementation roadmap
- Best practices

### What Works Now

- ✅ Conceptual design and agent definitions
- ✅ Phase detection logic
- ✅ Context preservation patterns
- ✅ Auto-command structure

### What Needs Implementation

- ❌ CLI chat interface
- ❌ Integration with BMAD core agents
- ❌ LLM client (Claude/GPT/Gemini)
- ❌ Actual deliverable generation (PRD, architecture docs)
- ❌ File output to `docs/` folder
- ❌ User validation checkpoints

## 🏗️ Architecture

### Components

```
bmad-invisible/
├── agents/                    # Agent definitions
│   ├── invisible-orchestrator.md  # Main conversational interface
│   └── phase-detector.md          # Phase classification engine
├── commands/                  # Phase-specific commands
│   ├── auto-analyze.md        # Analyst phase execution
│   ├── auto-plan.md           # PM phase execution
│   ├── auto-architect.md      # Architecture phase execution
│   ├── auto-stories.md        # Story breakdown phase
│   ├── auto-dev.md            # Development guidance phase
│   ├── auto-qa.md             # Quality assurance phase
│   ├── auto-ux.md             # UX refinement phase
│   └── auto-po.md             # Product owner review phase
├── hooks/                     # Phase management
│   ├── phase-transition.js    # Handles phase transitions
│   └── context-preservation.js # Maintains context across phases
├── mcp/                       # Model Context Protocol server
│   └── server.ts              # State persistence
└── test/                      # Test suite
    ├── phase-detector.contract.test.js
    └── phase-transition.safety.test.js
```

### Phase Flow

1. **Analyst**: Understand problem, users, goals
2. **PM**: Create plan, timeline, milestones
3. **Architect**: Design technical approach
4. **SM**: Break into epics and stories
5. **Dev**: Implementation guidance
6. **QA**: Testing and validation
7. **UX**: Usability refinement
8. **PO**: Final review and launch

All phases execute invisibly based on conversation context.

## 🔧 Development Setup

```bash
# Install dependencies
npm install

# Fix MCP SDK version
npm install --save-dev @modelcontextprotocol/sdk@^1.18.2

# Build MCP server
npm run build:mcp

# Run tests
npm test

# Start MCP server
npm run mcp
```

## 📚 Documentation

- **[IMPLEMENTATION_ANALYSIS.md](IMPLEMENTATION_ANALYSIS.md)** - Detailed implementation analysis and roadmap
- **[CLAUDE.md](CLAUDE.md)** - Guide for Claude Code development
- **[docs/INVISIBLE_ORCHESTRATOR_README.md](docs/INVISIBLE_ORCHESTRATOR_README.md)** - Original concept documentation
- **[BMAD-METHOD™ Docs](https://github.com/bmadcode/bmad-method)** - Core framework documentation

## 🎯 Vision: How It Should Work

### Ideal User Experience

```bash
# Start any time, from anywhere
npx bmad-invisible chat

# Or within a project
cd my-project
npx bmad-invisible chat

# Natural conversation
> I want to add user authentication

# System understands context, generates artifacts
# No need to know about PRDs, architectures, stories, etc.
```

### Generated Artifacts (Behind the Scenes)

```
my-project/
├── docs/
│   ├── brief.md               # From analyst phase
│   ├── prd.md                 # From PM phase
│   ├── architecture.md        # From architect phase
│   ├── epics/
│   │   └── epic-1-auth.md     # From SM phase
│   └── stories/
│       ├── story-1-1-login.md # From SM phase
│       └── story-1-2-signup.md
└── .bmad-invisible/
    ├── state.json             # Current phase, context
    └── conversation.log       # Full conversation history
```

### User Validation Points

After each major phase:
```
Assistant: "Here's what I've created... [summary]"
           "Does this look good?"

Options:
- y: Continue to next phase
- n: Let me refine this
- edit: Make specific changes
- back: Go to previous phase
```

## 🚀 Roadmap to Production

See [IMPLEMENTATION_ANALYSIS.md](IMPLEMENTATION_ANALYSIS.md) for the complete roadmap.

**Week 1-2**: Core Infrastructure
- CLI chat interface
- LLM integration
- BMAD bridge

**Week 3-4**: Phase Integration
- Connect to real BMAD agents
- Deliverable generation
- File I/O

**Week 5-6**: User Experience
- Validation checkpoints
- Iterative refinement
- Error handling

**Week 7-8**: Polish & Release
- Comprehensive examples
- Documentation
- Community feedback

## 🤝 Contributing

We welcome contributions! This is an experimental feature that could greatly improve BMAD accessibility.

Key areas needing help:
- CLI chat interface implementation
- LLM client integrations (Claude, GPT, Gemini)
- BMAD core integration bridge
- Conversation flow optimization
- Documentation and examples

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🔗 Related Projects

- **[BMAD-METHOD™](https://github.com/bmadcode/bmad-method)** - The core framework
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - State persistence layer

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built on [BMAD-METHOD™](https://github.com/bmadcode/bmad-method) by Brian (BMad) Madison.

BMAD™ and BMAD-METHOD™ are trademarks of BMad Code, LLC.

---

**Current Status**: 🚧 Prototype - Needs implementation to be fully functional

**Next Steps**: See [IMPLEMENTATION_ANALYSIS.md](IMPLEMENTATION_ANALYSIS.md) for the path to production.

**Questions?** Open an issue or check the main [BMAD repository](https://github.com/bmadcode/bmad-method).

<sub>Making AI-assisted development accessible to everyone</sub>
