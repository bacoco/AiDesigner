# Later TODO - V6-Alpha Migration Considerations

## V6-Alpha Overview

V6 represents a major architectural rewrite of BMAD-METHOD currently in alpha stage. This document tracks key features and considerations for potential future migration.

**Status**: Alpha (unstable, frequent changes expected)
**Branch**: `bmad-upstream/v6-alpha` (28 commits ahead of main)
**Recommendation**: Stay on stable main until v6 reaches beta/stable

---

## Key V6 Innovations

### 1. Modular Architecture

- **BMad-CORE**: Foundation collaboration engine framework
- **Module System**:
  - BMM (BMad Method) - Core development methodology
  - BMB (BMad Builder) - Agent/workflow creation tools
  - CIS (Creative/Innovation) - Brainstorming and creative workflows
- **Sub-agents**: Specialized agents organized in subfolders for better structure
- **Shared Dependencies**: Efficient cross-module resource sharing
- **Single Installation**: Everything goes to `bmad/` folder (vs multiple folders in v4/v5)

### 2. Improved Development Flow

#### Scale-Adaptive Workflows (Level 0-4)

- **Level 0**: Simple minor tasks
- **Level 4**: Massive enterprise-scale efforts
- Automatically adjusts complexity based on project scope
- Tracks project type, level, phases, and agents used

#### Tech-Spec Per Epic (vs All At Once)

- Architect generates focused specification for **one epic at a time**
- Only creates tech spec for first/next incomplete epic
- Consolidates all artifact info into concise format
- Better context management for development

#### JIT Dev Context Injection

- SM creates just-in-time developer context per story
- Auto-injects specialized expertise (e.g., "master front end developer" for UI-heavy stories)
- Replaces v4's `devAlwaysLoad` files with more powerful system
- Fresh context validation prevents context bias

#### Fresh Context Validation

- Separate validation tasks run in clean context windows
- Prevents context bias and drift
- Recommended: Use different models for dev vs review
  - Example: Non-thinking model for development (cleaner code)
  - Thinking model for senior review (better analysis)
- All validations are optional (use judgment based on criticality)

### 3. Enhanced Features

#### New Integrations

- **Qwen AI Support**: Integration with Qwen language models
- **Web Bundles for Teams**: Improved packaging for web UI deployment
- **TEA Agent**: Test/Quality workflows ported from commands to full agent

#### Developer Experience

- **Hash File Checking**: Detects file changes to prevent overwriting customizations
- **Epic Breakout for GDD**: Detailed game design document epic generation
- **Workflow Tracking Artifact**: Tracks project state, phases, agents, progress
- **Improved v4→v6 Upgrade**: Better migration path with auto-backup

### 4. V6 Workflow Phases

#### Phase 1: Analysis (Optional)

- Brainstorming → Brainstorming Analysis document
- Research → Multiple research artifact types
- Product Brief creation

#### Phase 2: Planning

- PM: `cmd plan-project` → Creates PRD.md + Epics.md
- Architect: `cmd solution-architecture` → Creates Architecture.md
- Architect: `cmd tech-spec` → Generates spec for **next epic only**
- Validation checklists at each step (optional)

#### Phase 3: Development Cycle (per Epic)

1. SM: `cmd create-story` → Draft next story
2. SM: `cmd story-context` → Generate JIT dev context
3. SM: `cmd validate-story-context` (optional)
4. DEV: `cmd develop-story` → Implement with injected context
5. DEV: `cmd review-story` → Quality review (use different model)
6. Repeat for next story
7. SM: Epic retrospective when complete (optional)

#### Phase 4: (Coming Soon)

- Enterprise deployment workflows
- Security/DevOps architecture docs

---

## Migration Challenges for BMAD-Invisible

### Breaking Changes

1. **Complete Architecture Rewrite**:
   - `bmad-core/` → `src/core/`, `src/modules/`
   - Removes old agents/workflows/templates structure
   - Changes installer architecture completely

2. **Custom Features at Risk**:
   - Invisible orchestration layer
   - Codex CLI integration
   - MCP server implementation
   - Dual-lane workflow system
   - Phase detector logic

3. **Philosophy Mismatch**:
   - V6 focuses on **explicit workflow phases** and commands
   - BMAD-Invisible aims for **zero-knowledge natural conversation**
   - V6's scale-adaptive approach vs our invisible orchestration

### Alpha Stability Concerns

- ⚠️ "Potentially unstable release that could drastically change"
- ⚠️ "Not complete - many features, polish, docs coming"
- ⚠️ "Web bundles not fully working yet - IDE required"
- ⚠️ Frequent updates require `node_modules` deletion
- ⚠️ Work in progress, roadmap still evolving

---

## When to Consider V6 Migration

### Good Reasons to Migrate

- [x] V6 reaches beta or stable release

- [ ] Scale-adaptive workflows (0-4) align with invisible orchestration
- [x] Modular plugin system benefits our expansion strategy
- [ ] JIT context injection improves invisible agent performance
- [ ] Web bundles become production-ready
- [ ] Community adoption makes it the standard

### Prerequisites Before Migration

- [ ] V6 stability confirmed (beta/stable release)
- [ ] Migration path tested for custom features
- [x] Codex CLI compatibility verified
- [ ] Dual-lane orchestration adaptable to v6 workflows _(lane selector prototype maps quick vs complex phase plans; validate against real V6 runtime when available)_
- [x] Invisible orchestrator compatible with v6 module system (prototype documented in `docs/v6-module-bridge.md`)
- [x] MCP server integration maintained

### Features Worth Cherry-Picking (Without Full Migration)

- [x] JIT context injection concept (adapt to invisible orchestrator)
- [x] Fresh context validation pattern (different models for dev/review) — documented in docs/review-checkpoints.md and wired into MCP review lanes
- [x] Hash file checking (prevent customization overwrites)
- [x] Scale-adaptive workflow logic (integrate into phase detector)
- [x] Tech-spec per epic approach (vs all-at-once)

---

## Current Decision: Stay on Main

**Rationale**:

1. ✅ BMAD-Invisible v1.3.0 is production-ready
2. ✅ Stable dual-lane orchestration working well
3. ✅ Invisible approach proven with codex/MCP integration
4. ❌ V6 alpha too unstable for production fork
5. ❌ Explicit workflow phases contradict zero-knowledge vision
6. ❌ Migration effort high with uncertain benefits

**Next Steps**:

- Monitor v6-alpha progress toward beta
- Track community feedback and adoption
- Evaluate specific features for selective integration
- Revisit migration decision when v6 reaches stable release

---

## Resources

- **V6 Branch**: `bmad-upstream/v6-alpha`
- **V6 Flow Doc**: `v6-IMPORTANT-BMM-FLOW.md`
- **Open Items**: `v6-open-items.md` (in v6 branch)
- **Discord**: https://discord.gg/gk8jAdXWmj
- **YouTube**: https://www.youtube.com/@BMadCode

---

**Last Updated**: 2025-10-02
**Decision**: Keep BMAD-Invisible on stable main, monitor v6 for future opportunities
