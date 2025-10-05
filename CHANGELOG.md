## [Unreleased]

### Breaking Changes

**⚠️ MCP Server Installation Default Changed** - Default configuration target updated

- **New default**: MCP servers now install to aidesigner configuration by default (previously defaulted to Claude Desktop configuration)
- **Migration**: Existing code that relied on the implicit default will now target aidesigner config instead of Claude config
- **Workaround**: Explicitly specify `config: "claude"` to install to Claude Desktop configuration
- **Options**: Use `config: "both"` to install to both configurations simultaneously
- **Legacy alias**: `config: "bmad"` continues to work as an alias for `"aidesigner"`

### Features

**🚀 Enhanced Project Initialization** - Complete BMAD-aligned project setup

- **Interactive project creation**: `npx aidesigner init` now prompts for project name and creates a new directory
- **BMAD-compliant structure**: Auto-creates full directory hierarchy (`docs/prd/`, `docs/architecture/`, `docs/stories/`, `docs/qa/`)
- **Comprehensive README**: Generated README.md includes complete BMAD workflow guide, agent descriptions, and commands
- **Project metadata**: New `.aidesigner/project.json` file tracks project info and configuration
- **Enhanced onboarding**: Updated success message with BMAD workflow quick reference and next steps

**🎯 Improved LLM Provider Selection** - Streamlined provider configuration

- **Interactive selection**: Arrow-key navigation for choosing LLM providers (Claude, GLM, OpenAI, Gemini)
- **MCP multi-select**: Checkbox-based selection for optional MCP servers during init
- **Better UX**: Clearer prompts and visual feedback during installation

### Improvements

**✨ Simplified Interactive Selection** - Single combined list for CLI and provider selection

- **One-step selection**: Replaced two-step selection (assistant → provider) with single combined list
- **Only valid combinations**: Shows 7 valid CLI-provider combinations in one prompt
  - Claude CLI → Anthropic
  - Claude CLI → GLM
  - Codex CLI → OpenAI
  - OpenCode CLI → Anthropic/GLM/OpenAI/Gemini
- **Eliminated confusion**: Users can no longer select incompatible combinations
- **Better UX**: Clear format shows both CLI and provider in each option
- **No validation errors**: Impossible to pick invalid combinations

This completely eliminates the confusing two-step flow where users could see incompatible providers.

### Bug Fixes

**🔧 CLI-Provider Compatibility Enforcement** - Fixed invalid assistant-provider combinations

- **Claude CLI**: Now correctly restricted to `anthropic` and `glm` providers only (removed invalid `openai`, `gemini` options)
- **Codex CLI**: Now correctly restricted to `openai` provider only (removed invalid `anthropic`, `glm`, `gemini` options)
- **OpenCode CLI**: Continues to support all providers (`anthropic`, `glm`, `openai`, `gemini`)
- **Validation errors**: Improved messages now show which providers are supported for each CLI
- **Help text**: Updated examples to show only valid CLI-provider combinations

This prevents errors from attempting to use incompatible API formats (e.g., Claude CLI cannot speak OpenAI's API protocol).

### Documentation

- Updated installation-methods.md with detailed `init` command documentation
- Updated QUICKSTART.md to reflect new project creation workflow
- Added "What init Creates" section explaining generated structure
- Updated CLI-provider compatibility documentation with accurate supported combinations

## [1.5.0](https://github.com/bacoco/aidesigner/compare/v1.4.0...v1.5.0) (2025-10-05)

### Features

**🎨 Conversational UI Designer Workflow** - Multi-turn visual concept exploration with Google Nano Banana

- **6-stage conversational discovery**: Warm Welcome → Journey Discovery → Step Deep-Dive → Inspiration Intake → Visual Language → Prompt Assembly
- **Chrome DevTools MCP integration**: Automatic CSS token extraction from reference URLs (palette, typography, spacing, layout)
- **Per-screen prompt generation**: Individual prompts for each journey step with full context (persona, emotions, goals, visual system)
- **Dual-lane support**: Quick Lane (auto-inference from PRD) and Complex Lane (6-stage conversational flow)
- **Google Nano Banana integration**: Generate 3 visual concept variations per screen using Gemini 2.5 Flash Image
- **Enhanced selection logging**: Capture chosen concept with journey context, CSS tokens, asset locations, and implementation guidance
- **UI Designer Liaison agent (Nana)**: Conversational agent with commands `*discover-journey`, `*assemble-prompts`, `*log-selection`

### New Files

**Tasks:**

- `aidesigner-core/tasks/discover-ui-journey.md` - 6-stage conversational discovery workflow with Chrome MCP integration
- `aidesigner-core/tasks/generate-ui-designer-prompt.md` - Assembles per-screen prompts from discovery state
- `aidesigner-core/tasks/record-ui-designer-selection.md` - Enhanced selection logging with CSS tokens and journey context

**Templates:**

- `aidesigner-core/templates/ui-designer-screen-prompt.md` - Canonical per-screen prompt template with placeholders
- `dist/mcp/lib/spec-kit-templates/ui-designer-screen-prompts-template.md` - Quick Lane output template

**Agent:**

- `aidesigner-core/agents/ui-designer-liaison.md` - Conversational designer agent (Nana)

**Documentation:**

- `docs/guides/CONVERSATIONAL_UI_DESIGNER.md` - Comprehensive 500+ line workflow guide with examples

### Improvements

**✨ Quick Lane Journey Inference** - Automatic UI journey extraction from PRD

- **User story parsing**: Regex-based extraction of "As a..., I want to..." patterns
- **Intelligent screen naming**: Maps actions to UI screen names (browse → "Browse / Explore", search → "Search & Filter")
- **Component inference**: Derives likely UI components from user actions
- **Emotion mapping**: Infers persona emotions for each journey step
- **Auto-generated prompts**: Creates per-screen visual concept prompts without conversation

**🔧 Enhanced Quick Lane Engine** - `.dev/lib/quick-lane.js` improvements

- New method: `generateUIDesignerScreenPrompts()` for per-screen prompt generation
- Helper methods: `inferJourneySteps()`, `deriveStepName()`, `inferComponents()`, `inferEmotion()`
- Journey inference from PRD user stories with persona and goal extraction

### Workflow Updates

**Updated greenfield-ui.yaml:**

- Agent reference updated: `nano-banana-liaison` → `ui-designer-liaison`
- Added optional steps: `discover_ui_journey`, `assemble_prompts`, `log_selection`
- Documentation: Two modes (Quick auto-inference vs Full conversational discovery)

### Documentation

- **README.md**: Added "Conversational UI Designer Workflow" section with marketing-focused copy
- **DUAL_LANE_ORCHESTRATION.md**:
  - Added "Conversational UI Designer (Quick Lane)" section with journey inference examples
  - Added "Conversational UI Designer (Complex Lane)" section with 6-stage flow details
  - Chrome MCP integration code examples
  - Comparison table: Quick vs Complex lane capabilities
- **CONVERSATIONAL_UI_DESIGNER.md**: Complete workflow guide with troubleshooting, FAQs, and examples

### Key Benefits

- **Zero-setup visual concepts**: Quick Lane auto-generates prompts from PRD in seconds
- **Deep customization**: Complex Lane provides 6-stage conversational flow for custom visual languages
- **CSS token extraction**: Chrome MCP automatically captures design tokens from reference sites
- **Developer handoff**: Selection logging includes CSS tokens and implementation notes for seamless dev transition
- **Gemini 2.5 Flash Image**: Generate 3 concept variations per screen for design exploration

## [1.3.24](https://github.com/bacoco/aidesigner/compare/v1.3.23...v1.3.24) (2025-10-04)

### Maintenance

- Bump package version to 1.3.24 to prepare the next release.

## [1.3.11](https://github.com/bacoco/aidesigner/compare/v1.3.10...v1.3.11) (2025-01-03)

### Improvements

**📊 Enhanced npm Discoverability**

- **Better package description**: Highlights MCP integration and natural language approach
- **Expanded keywords**: Added mcp, model-context-protocol, ai-agents, workflow, automation, claude, gemini, chatgpt
- **README badges**: Added npm version and package size (2.6MB) badges
- **Searchability**: Improved discovery on npm registry for MCP-related searches

## [1.3.10](https://github.com/bacoco/aidesigner/compare/v1.3.9...v1.3.10) (2025-01-03)

### Improvements

**📦 Package Optimization** - 76% size reduction for faster npx execution

- **Created .npmignore**: Exclude dev files (test/, src/, tools/, .github/, etc.)
- **Package size**: Reduced from ~11MB to 2.6MB (76% smaller)
- **File count**: Down from ~1000+ to 492 files in published package
- **Root cleanup**: Moved documentation to docs/ subdirectories
- **Better organization**: Only README.md and CHANGELOG.md remain in root
- **Zero risk**: No code changes, all builds passing

**⚡ Enhanced MCP Marketing** - Better visibility for MCP integration features

- **Prominent showcase**: Added "Supercharge Your AI in 30 Seconds" section to README
- **Concrete examples**: GitHub, PostgreSQL, Filesystem integration examples with before/after
- **Popular integrations**: Listed 15+ available MCP servers by category
- **QUICKSTART update**: Added MCP setup section with quick patterns
- **Common workflows**: Full-stack, DevOps, and Data Science integration examples

### Documentation

- Moved QUICKSTART.md → docs/guides/QUICKSTART.md
- Moved USAGE.md → docs/guides/USAGE.md
- Moved CONTRIBUTING.md → docs/guides/CONTRIBUTING.md
- Archived development TODOs and old PRs to docs/archive/
- Updated all README links to new documentation paths

## [1.3.8](https://github.com/bacoco/aidesigner/compare/v1.3.7...v1.3.8) (2025-01-03)

### Features

**🎨 Marketing-Focused README** - Rewritten introduction with problem-solution narrative

- **Clear problem statement**: Articulates developer pain points with AI development complexity
- **Solution-focused messaging**: Emphasizes natural conversation and zero learning curve
- **Professional positioning**: Highlights proven methodology and professional output
- **Evidence-based claims**: All messaging truthful and substantiated
- **Better conversion**: More compelling value proposition without exaggeration

**🛡️ Quick Lane Graceful Fallback** - Enhanced reliability and robustness

- **Automatic failover**: Quick lane gracefully disables and defers to complex lane when unavailable
- **Improved error handling**: Better detection and recovery from quick lane failures
- **Enhanced testing**: New integration tests for orchestrator server runtime
- **Assistant environment improvements**: Better GLM provider detection and configuration
- **Runtime stability**: More robust error handling in orchestrator runtime

### Improvements

- **Documentation**: Problem-solution focused README introduction
- **Reliability**: Quick lane fallback mechanism prevents workflow interruptions
- **Testing**: Added `run-orchestrator-server.integration.test.js` for runtime validation
- **Assistant support**: Enhanced assistant environment utilities with better provider detection

### Bug Fixes

- Fix quick lane failures by implementing graceful fallback to complex lane
- Improve GLM provider environment variable handling
- Enhanced error messaging in assistant environment utilities

## [1.3.7](https://github.com/bacoco/BMAD-invisible/compare/v1.3.5...v1.3.7) (2aidesigner25-1aidesigner-aidesigner3)

### Features

**🎉 Complete MCP Management System** - Four-phase implementation of comprehensive Model Context Protocol management:

#### Phase 1: Interactive MCP CLI

- **Interactive server management**: `mcp:list`, `mcp:doctor`, `mcp:add`, `mcp:remove` commands
- **Health diagnostics**: Comprehensive health checks with error detection and fix suggestions
- **Configuration validation**: Automatic validation of MCP server configurations
- **Interactive wizards**: Guided setup for adding custom MCP servers

#### Phase 2: MCP Registry Integration

- **Built-in server catalog**: 15+ official MCP servers (filesystem, github, postgres, puppeteer, etc.)
- **Smart search**: `mcp:search` with category filtering
- **One-command installation**: `mcp:install` with automatic environment setup
- **Context-aware suggestions**: `mcp:suggest` analyzes project and recommends servers
- **Registry browser**: `mcp:browse` to explore all available servers
- **24-hour caching**: Efficient registry data caching with GitHub fallback

#### Phase 3: Conversational Configuration

- **Natural language installation**: Install MCP servers through conversation with invisible orchestrator
- **6 new MCP tools** integrated into runtime:
  - `search_mcp_servers` - Find servers by keyword/category
  - `suggest_mcp_servers` - Context-aware project recommendations
  - `install_mcp_server` - Automated installation and configuration
  - `list_mcp_servers` - List configured servers
  - `get_mcp_health` - Health diagnostics
  - `browse_mcp_registry` - Explore registry
- **Transparent integration**: Users can request tools naturally without MCP terminology
- **Updated orchestrator**: Enhanced invisible-orchestrator.md with MCP management capabilities

#### Phase 4: Environment Profiles & Security

- **Environment profiles**: Separate dev/staging/prod configurations
- **Profile inheritance**: Parent-child profile relationships to reduce duplication
- **Auto-detection**: Smart profile selection based on MCP_PROFILE env, NODE_ENV, or git branch
- **Profile management**: Create, switch, delete, compare, export, import profiles
- **AES-256-GCM encryption**: Secure credential storage with military-grade encryption
- **Cross-platform keychain**: Integration with macOS Keychain, Windows Credential Manager, Linux Secret Service
- **Automatic migration**: `mcp:secure` converts plain-text credentials to encrypted vault
- **Security audit**: `mcp:audit` scans for exposed secrets and security issues
- **Vault references**: `{{vault:key}}` pattern for secure credential resolution

### New Files

#### Tools

- `tools/mcp-manager.js` (1aidesigner66 lines) - Core MCP management with profiles and security
- `tools/mcp-registry.js` (47aidesigner lines) - Registry integration with caching
- `tools/mcp-security.js` (458 lines) - Encryption and keychain integration
- `tools/mcp-profiles.js` (445 lines) - Environment profile management

#### Documentation

- `docs/mcp-management.md` (623 lines) - Complete MCP management guide
- `docs/mcp-examples.md` (1aidesigner95 lines) - 18 real-world usage examples

### Documentation Updates

- **README.md**: Added comprehensive "MCP Management System" section with quick start
- **Updated examples**: All MCP workflows documented with complete command references

### CLI Commands Added

**Profile Management:**

```bash
npm run mcp:profile:list      # List all profiles
npm run mcp:profile:create    # Create new profile
npm run mcp:profile:switch    # Switch active profile
npm run mcp:profile:delete    # Delete profile
npm run mcp:profile:diff      # Compare profiles
npm run mcp:profile:export    # Export profile
npm run mcp:profile:import    # Import profile
```

**Security:**

```bash
npm run mcp:secure            # Migrate to encrypted storage
npm run mcp:audit             # Run security audit
```

**Server Management:**

```bash
npm run mcp:browse            # Browse registry
npm run mcp:search            # Search servers
npm run mcp:install           # Install server
npm run mcp:suggest           # Get suggestions
npm run mcp:add               # Add custom server
npm run mcp:remove            # Remove server
npm run mcp:list              # List configured servers
npm run mcp:doctor            # Health check
```

### Key Benefits

- **Zero-config for common tools**: Popular servers install with one command
- **Enterprise-ready security**: Production credentials safely encrypted
- **Team collaboration**: Export/import profiles for consistent team setups
- **Multi-environment**: Separate configs for dev/staging/prod
- **Automatic suggestions**: System recommends relevant tools based on project
- **Conversational setup**: Install tools through natural language
- **Comprehensive docs**: 17aidesigneraidesigner+ lines of documentation with 18 examples

## [1.3.5](https://github.com/bacoco/BMAD-invisible/compare/v1.3.4...v1.3.5) (2aidesigner25-1aidesigner-aidesigner3)

### Bug Fixes

- Resolve TypeScript compilation errors in MCP server files
  - Add missing imports for `loadModelRoutingConfig` and observability modules
  - Add logger infrastructure to CodexClient class
  - Add `describe()` method to ModelRouter class
  - Fix undefined variables in error handling code
  - Fix incorrect log function call in runtime.ts

- Update file references from bmad-chat to bmad-claude
  - Update bin/bmad-invisible chat command
  - Update documentation references in IMPLEMENTATION_COMPLETE.md and USAGE.md

- Fix test compatibility issues
  - Add early return statements after process.exit() calls for mocked tests
  - Add guard to handle undefined assistant when exit is mocked

### Test Results

- Test pass rate improved from 87.5% (77/88) to 95.9% (94/98)
- TypeScript compilation: ✅ Success
- All critical bugs resolved

## [1.3.4](https://github.com/bacoco/BMAD-invisible/compare/v1.3.3...v1.3.4) (2aidesigner25-1aidesigner-aidesigner3)

Published to NPM with previous fixes.

## [4.36.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.36.1...v4.36.2) (2aidesigner25-aidesigner8-1aidesigner)

### Bug Fixes

- align installer dependencies with root package versions for ESM compatibility ([#42aidesigner](https://github.com/bmadcode/BMAD-METHOD/issues/42aidesigner)) ([3f6b674](https://github.com/bmadcode/BMAD-METHOD/commit/3f6b67443d61ae6add98656374bed27da47aidesigner4644))

## [4.36.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.36.aidesigner...v4.36.1) (2aidesigner25-aidesigner8-aidesigner9)

### Bug Fixes

- update Node.js version to 2aidesigner in release workflow and reduce Discord spam ([3f7e19a](https://github.com/bmadcode/BMAD-METHOD/commit/3f7e19aaidesigner98155341a2b89796addc47baidesigner623cb87a))

# [4.36.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.3...v4.36.aidesigner) (2aidesigner25-aidesigner8-aidesigner9)

### Features

- modularize flattener tool into separate components with improved project root detection ([#417](https://github.com/bmadcode/BMAD-METHOD/issues/417)) ([aidesignerfdbca7](https://github.com/bmadcode/BMAD-METHOD/commit/aidesignerfdbca73fc6aidesignere3aidesigner61aidesigner9f682faidesigner18e1aidesigner5e2b4623a2))

## [4.35.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.2...v4.35.3) (2aidesigner25-aidesigner8-aidesigner6)

### Bug Fixes

- doc location improvement ([1676f51](https://github.com/bmadcode/BMAD-METHOD/commit/1676f5189edaidesigner57fa2d7facbd6a771fe67cdb6372))

## [4.35.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.1...v4.35.2) (2aidesigner25-aidesigner8-aidesigner6)

### Bug Fixes

- npx status check ([f7c2a4f](https://github.com/bmadcode/BMAD-METHOD/commit/f7c2a4fb6c454b17d25aidesignerb85537129baidesigner1ffee6b85))

## [4.35.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.aidesigner...v4.35.1) (2aidesigner25-aidesigner8-aidesigner6)

### Bug Fixes

- npx hanging commands ([2cf322e](https://github.com/bmadcode/BMAD-METHOD/commit/2cf322eeaidesignerd9b563a4998c72b2c5eab259594739b))

# [4.35.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.34.aidesigner...v4.35.aidesigner) (2aidesigner25-aidesigner8-aidesigner4)

### Features

- add qwen-code ide support to bmad installer. ([#392](https://github.com/bmadcode/BMAD-METHOD/issues/392)) ([a72b79aidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/a72b79aidesignerf3be6c77355511ace2d63e6bec4d751f1))

# [4.34.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.33.1...v4.34.aidesigner) (2aidesigner25-aidesigner8-aidesigner3)

### Features

- add KiloCode integration support to BMAD installer ([#39aidesigner](https://github.com/bmadcode/BMAD-METHOD/issues/39aidesigner)) ([dcebe91](https://github.com/bmadcode/BMAD-METHOD/commit/dcebe91d5ea68e69aa27183411a81639d444efd7))

## [4.33.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.33.aidesigner...v4.33.1) (2aidesigner25-aidesigner7-29)

### Bug Fixes

- dev agent yaml syntax for develop-story command ([#362](https://github.com/bmadcode/BMAD-METHOD/issues/362)) ([bcb3728](https://github.com/bmadcode/BMAD-METHOD/commit/bcb3728f8868caidesignerf83bca3d61fbd7e15c4e114526))

# [4.33.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.32.aidesigner...v4.33.aidesigner) (2aidesigner25-aidesigner7-28)

### Features

- version bump ([e9dd4e7](https://github.com/bmadcode/BMAD-METHOD/commit/e9dd4e7beb46daidesignerc8aidesignerdfaidesignercd65aeaidesigner2d1867a56d7c1))

# [4.32.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.31.aidesigner...v4.32.aidesigner) (2aidesigner25-aidesigner7-27)

### Bug Fixes

- Add package-lock.json to fix GitHub Actions dependency resolution ([cce7a75](https://github.com/bmadcode/BMAD-METHOD/commit/cce7a758a632aidesigner53e26d143b678eb7963599b432d))
- GHA fix ([62ccccd](https://github.com/bmadcode/BMAD-METHOD/commit/62ccccdc9e85f8621f63f99bd1ceaidesignerd14abeaidesigner9783))

### Features

- Overhaul and Enhance 2D Unity Game Dev Expansion Pack ([#35aidesigner](https://github.com/bmadcode/BMAD-METHOD/issues/35aidesigner)) ([a7aidesigner38d4](https://github.com/bmadcode/BMAD-METHOD/commit/a7aidesigner38d43d18246f6aef175aa89baaidesigner59b7c94f61f))

# [4.31.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3aidesigner.4...v4.31.aidesigner) (2aidesigner25-aidesigner7-2aidesigner)

### Bug Fixes

- enhanced user guide with better diagrams ([c445962](https://github.com/bmadcode/BMAD-METHOD/commit/c445962f259cd7d84c47a896e7fda99e83a3aidesignerc8d))

### Features

- Installation includes a getting started user guide with detailed mermaid diagram ([df57d77](https://github.com/bmadcode/BMAD-METHOD/commit/df57d772cac9f9aidesigner1aidesigner811e7e86a6433aaidesignerfe636a45))

## [4.3aidesigner.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3aidesigner.3...v4.3aidesigner.4) (2aidesigner25-aidesigner7-19)

### Bug Fixes

- docs ([8619aidesigneraidesigner6](https://github.com/bmadcode/BMAD-METHOD/commit/8619aidesigneraidesigner6c16731b99fa36b434d2aidesigner9aaidesignerc2caf2d998))
- lint fix ([49e4897](https://github.com/bmadcode/BMAD-METHOD/commit/49e4897aidesigner1e55feac4818aidesigner674aidesignerea54bebefaidesigner42fba))

## [4.3aidesigner.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3aidesigner.2...v4.3aidesigner.3) (2aidesigner25-aidesigner7-19)

### Bug Fixes

- improve code in the installer to be more memory efficient ([849e428](https://github.com/bmadcode/BMAD-METHOD/commit/849e42871ab845aidesigner98fd196217bce83e43c736b8a))

## [4.3aidesigner.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3aidesigner.1...v4.3aidesigner.2) (2aidesigner25-aidesigner7-17)

### Bug Fixes

- remove z2 ([dcb36a9](https://github.com/bmadcode/BMAD-METHOD/commit/dcb36a9b44b6644f6b2723c9aidesigner67abaa9baidesignerbc1999))

## [4.3aidesigner.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3aidesigner.aidesigner...v4.3aidesigner.1) (2aidesigner25-aidesigner7-15)

### Bug Fixes

- added logo to installer, because why not... ([2cea37a](https://github.com/bmadcode/BMAD-METHOD/commit/2cea37aa8c1924ddf5aa476f4c312837f2615a7aidesigner))

# [4.3aidesigner.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.7...v4.3aidesigner.aidesigner) (2aidesigner25-aidesigner7-15)

### Features

- installer is now VERY clear about IDE selection being a multiselect ([e24b6f8](https://github.com/bmadcode/BMAD-METHOD/commit/e24b6f84fd9e4ff4b99263aidesigner19b5aidesigner21ca2b145b2f))

## [4.29.7](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.6...v4.29.7) (2aidesigner25-aidesigner7-14)

### Bug Fixes

- bundle build ([aidesigner723eed](https://github.com/bmadcode/BMAD-METHOD/commit/aidesigner723eed8814aidesignere76146dfbfdddd49afe86e8522ee))

## [4.29.6](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.5...v4.29.6) (2aidesigner25-aidesigner7-14)

### Bug Fixes

- improve agent task folowing in agressing cost saving ide model combos ([3621c33](https://github.com/bmadcode/BMAD-METHOD/commit/3621c33aidesignere65f328e7326f93a5fe27e65baidesigner89aidesigner7e7))

## [4.29.5](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.4...v4.29.5) (2aidesigner25-aidesigner7-14)

### Bug Fixes

- windows regex issue ([9f48c1a](https://github.com/bmadcode/BMAD-METHOD/commit/9f48c1a869a9cc54fb5e7d899c2af7a5cef7aidesignere1aidesigner))

## [4.29.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.3...v4.29.4) (2aidesigner25-aidesigner7-14)

### Bug Fixes

- empty .roomodes, support Windows-style newlines in YAML block regex ([#311](https://github.com/bmadcode/BMAD-METHOD/issues/311)) ([551e3aidesignerb](https://github.com/bmadcode/BMAD-METHOD/commit/551e3aidesignerb65e1faidesigner4386faidesignerbdaidesigner193f726828df684d5b))

## [4.29.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.2...v4.29.3) (2aidesigner25-aidesigner7-13)

### Bug Fixes

- annoying YAML lint error ([afea271](https://github.com/bmadcode/BMAD-METHOD/commit/afea271e5e3b14aaidesignerda497e241b6521ba5a8aidesignerb85b))

## [4.29.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.1...v4.29.2) (2aidesigner25-aidesigner7-13)

### Bug Fixes

- add readme note about discord joining issues ([4ceaced](https://github.com/bmadcode/BMAD-METHOD/commit/4ceacedd737aidesignerea8aidesigner181dbaidesignerd66cf8da8dcbfdd1aidesigner9))

## [4.29.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.aidesigner...v4.29.1) (2aidesigner25-aidesigner7-13)

### Bug Fixes

- brianstorming facilitation output ([f62caidesigner5a](https://github.com/bmadcode/BMAD-METHOD/commit/f62caidesigner5abaidesignerf54e6c26c67cd9ac112aidesigneraidesignerb172d11aidesigner76))

# [4.29.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.28.aidesigner...v4.29.aidesigner) (2aidesigner25-aidesigner7-13)

### Features

- Claude Code slash commands for Tasks and Agents! ([e9e541a](https://github.com/bmadcode/BMAD-METHOD/commit/e9e541a52e45f6632b2f8c91d1aidesignere39caidesigner77c1ecc9))

# [4.28.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.6...v4.28.aidesigner) (2aidesigner25-aidesigner7-12)

### Features

- bmad-master can load kb properly ([3c13c56](https://github.com/bmadcode/BMAD-METHOD/commit/3c13c564988f975aidesignereaidesigner43939dd77aidesigneraea4196a7e7a))

## [4.27.6](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.5...v4.27.6) (2aidesigner25-aidesigner7-aidesigner8)

### Bug Fixes

- installer improvement ([db3aidesigner23aidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/db3aidesigner23aidesigner9f42da49daa3aidesigner9b5ba1a625c719e5bb14))

## [4.27.5](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.4...v4.27.5) (2aidesigner25-aidesigner7-aidesigner8)

### Bug Fixes

- installer for github copilot asks follow up questions right away now so it does not seem to hang, and some minor doc improvements ([cadf8b6](https://github.com/bmadcode/BMAD-METHOD/commit/cadf8b675aidesignerafd5daa32eb8876aidesigner8c614584156a69))

## [4.27.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.3...v4.27.4) (2aidesigner25-aidesigner7-aidesigner7)

### Bug Fixes

- doc updates ([1b86cd4](https://github.com/bmadcode/BMAD-METHOD/commit/1b86cd4db3644ca2b2b4a94821cc8b569aidesignerd78eaidesignera))

## [4.27.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.2...v4.27.3) (2aidesigner25-aidesigner7-aidesigner7)

### Bug Fixes

- remove test zoo folder ([9aidesigner8dcd7](https://github.com/bmadcode/BMAD-METHOD/commit/9aidesigner8dcd7e9afae3fd23cd894caidesignerdaidesigner9855fc9c42daidesignere))

## [4.27.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.1...v4.27.2) (2aidesigner25-aidesigner7-aidesigner7)

### Bug Fixes

- improve output ([a5ffe7b](https://github.com/bmadcode/BMAD-METHOD/commit/a5ffe7b9b2aidesigner9aeaidesigner2a9d97adf6aidesignerfe73caidesignerbc97aidesigner1e4))

## [4.27.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.aidesigner...v4.27.1) (2aidesigner25-aidesigner7-aidesigner7)

### Bug Fixes

- build web bundles with new file extension includsion ([922aidesigner1ae](https://github.com/bmadcode/BMAD-METHOD/commit/922aidesigner1ae7ede62aidesignerecaidesigner9b4764edaed97be42a3b78f))

# [4.27.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.26.aidesigner...v4.27.aidesigner) (2aidesigner25-aidesigner7-aidesigner6)

### Bug Fixes

- readme consolidation and version bumps ([aidesignera61d3d](https://github.com/bmadcode/BMAD-METHOD/commit/aidesignera61d3de4af88aidesignerf6e3bf934a92b1827754ed8ce6))

### Features

- big improvement to advanced elicitation ([1bc996aidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/1bc996aidesigner8aidesigner8aidesigner98fba6b4385aidesigner311799aidesigner22319df841))
- experimental doc creator v2 and template system ([b785371](https://github.com/bmadcode/BMAD-METHOD/commit/b78537115daaidesigner6baidesigner1e14aidesigner833fd1d7395aidesignerc7f2e41f))
- Massive improvement to the brainstorming task! ([9f53caf](https://github.com/bmadcode/BMAD-METHOD/commit/9f53caf4c6f9c67195b1aae14d54987f81d76eaidesigner7))
- WIP create-docv2 ([c1aidesigner7afaidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/c1aidesigner7afaidesigner5984718c1af2cf8aidesigner118353e8d2e6f9aidesigner6f))

# [4.26.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.25.1...v4.26.aidesigner) (2aidesigner25-aidesigner7-aidesigner6)

### Features

- **trae:** add support for trae ide integration ([#298](https://github.com/bmadcode/BMAD-METHOD/issues/298)) ([faeaidesignerf5f](https://github.com/bmadcode/BMAD-METHOD/commit/faeaidesignerf5ff73a6aidesigner3dc1aacc29f184e2a4138446524))

## [4.25.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.25.aidesigner...v4.25.1) (2aidesigner25-aidesigner7-aidesigner6)

### Bug Fixes

- spelling errors in documentation. ([#297](https://github.com/bmadcode/BMAD-METHOD/issues/297)) ([47b9d9f](https://github.com/bmadcode/BMAD-METHOD/commit/47b9d9f3e87be62c852aidesignered6cbaidesigneraidesigner48df727a9534f))

# [4.25.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.6...v4.25.aidesigner) (2aidesigner25-aidesigner7-aidesigner5)

### Bug Fixes

- update web bundles ([42684e6](https://github.com/bmadcode/BMAD-METHOD/commit/42684e68af4396797962f3f851147523a67416aidesigner8))

### Features

- improvements to agent task usage, sm story drafting, dev implementation, qa review process, and addition of a new sm independant review of a draft story ([2874a54](https://github.com/bmadcode/BMAD-METHOD/commit/2874a54a9b25b48c199b2e9dc63a9555e716c636))

## [4.24.6](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.5...v4.24.6) (2aidesigner25-aidesigner7-aidesigner4)

### Bug Fixes

- version bump and web build fix ([1c845e5](https://github.com/bmadcode/BMAD-METHOD/commit/1c845e5b2c77a77d887d8216152baaidesigner911aidesignerc72e4aidesigner))

## [4.24.5](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.4...v4.24.5) (2aidesigner25-aidesigner7-aidesigner4)

### Bug Fixes

- yaml standardization in files and installer actions ([aidesigner94f9f3](https://github.com/bmadcode/BMAD-METHOD/commit/aidesigner94f9f3eabf563c9a89ecaf36aidesignerfed63386b46ed4))

## [4.24.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.3...v4.24.4) (2aidesigner25-aidesigner7-aidesigner4)

### Bug Fixes

- documentation updates ([2aidesigner18adaidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/2aidesigner18adaidesigner7c7d4c68efb3c24d85ac7612942c6df9c))

## [4.24.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.2...v4.24.3) (2aidesigner25-aidesigner7-aidesigner4)

### Bug Fixes

- update YAML library from 'yaml' to 'js-yaml' in resolveExpansionPackCoreAgents for consistency ([#295](https://github.com/bmadcode/BMAD-METHOD/issues/295)) ([aidesigner3f3aidesignerad](https://github.com/bmadcode/BMAD-METHOD/commit/aidesigner3f3aidesignerad28b282fbb4fa5a6ed6b57daidesigner327218cceaidesigner))

## [4.24.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.1...v4.24.2) (2aidesigner25-aidesigner7-aidesigner3)

### Bug Fixes

- version bump and restore dist folder ([87c451a](https://github.com/bmadcode/BMAD-METHOD/commit/87c451a5c3161fbc86f88619a2bfcfc322eb247e))

## [4.24.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.aidesigner...v4.24.1) (2aidesigner25-aidesigner7-aidesigner3)

### Bug Fixes

- centralized yamlExtraction function and all now fix character issues for windows ([e2985d6](https://github.com/bmadcode/BMAD-METHOD/commit/e2985d6aidesigner93136575e8d8c91ce53c82abc4aidesigner97de6))
- filtering extension stripping logic update ([4aidesigner5954a](https://github.com/bmadcode/BMAD-METHOD/commit/4aidesigner5954ad924d8bd66f94c918643f6e9caidesigner91d4daidesigner9))
- standardize on file extension .yaml instead of a mix of yml and yaml ([a4caidesignerb18](https://github.com/bmadcode/BMAD-METHOD/commit/a4caidesignerb1839d12d2ad21b7949aa3aidesignerf4f7d82ec6c9c))

# [4.24.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.23.aidesigner...v4.24.aidesigner) (2aidesigner25-aidesigner7-aidesigner2)

### Bug Fixes

- corrected cursor agent update instructions ([84e394a](https://github.com/bmadcode/BMAD-METHOD/commit/84e394ac11136d9cf8164cefc9ca8e298e8efaidesignerec))

### Features

- workflow plans introduced, preliminary feature under review ([731589a](https://github.com/bmadcode/BMAD-METHOD/commit/731589aa287c31ea12aidesignere232b4dccaidesigner7e979aidesigner5aidesigneraidesignerff))

# [4.23.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.22.1...v4.23.aidesigner) (2aidesigner25-aidesigner7-aidesigner1)

### Features

- Github Copilot integration ([#284](https://github.com/bmadcode/BMAD-METHOD/issues/284)) ([1a4ca4f](https://github.com/bmadcode/BMAD-METHOD/commit/1a4ca4ffa63aidesignerc2d4156bdd7aaidesigner4aidesignerd4c22748aidesigner1757))

## [4.22.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.22.aidesigner...v4.22.1) (2aidesigner25-aidesigner6-3aidesigner)

### Bug Fixes

- update expansion versions ([69aidesigner5fe7](https://github.com/bmadcode/BMAD-METHOD/commit/69aidesigner5fe72f6c2abefbfd65729d1be8575213aidesignera1d2))

# [4.22.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.21.2...v4.22.aidesigner) (2aidesigner25-aidesigner6-3aidesigner)

### Features

- create doc more explicit and readme improvement ([a1b3aidesignerd9](https://github.com/bmadcode/BMAD-METHOD/commit/a1b3aidesignerd9341d2ceff79db2c7e17886aidesignerc5efaidesignerd99e5))

## [4.21.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.21.1...v4.21.2) (2aidesigner25-aidesigner6-3aidesigner)

### Bug Fixes

- improve create-doc task clarity for template execution ([86d5139](https://github.com/bmadcode/BMAD-METHOD/commit/86d5139aea7aidesigner97cc5d4ee9daaidesignerf7d3e395ceaidesigner835e))

## [4.21.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.21.aidesigner...v4.21.1) (2aidesigner25-aidesigner6-3aidesigner)

### Bug Fixes

- readme clarifies that the installer handles installs upgrades and expansion installation ([9371a57](https://github.com/bmadcode/BMAD-METHOD/commit/9371a5784f6a6f2ad358a72eaaidesignercde9c98aidesigner357167))

# [4.21.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.2aidesigner.aidesigner...v4.21.aidesigner) (2aidesigner25-aidesigner6-3aidesigner)

### Bug Fixes

- remove unneeded files ([c48f2aidesigneraidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/c48f2aidesigneraidesigner727384f37a42f4c6b1a946cb9aidesignerf2445fe))

### Features

- massive installer improvement update ([c151bda](https://github.com/bmadcode/BMAD-METHOD/commit/c151bda93833aa31aidesignerccc7caidesignereabcf483376f9e82a))

# [4.2aidesigner.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.19.2...v4.2aidesigner.aidesigner) (2aidesigner25-aidesigner6-29)

### Features

- Massive documentation refactor, added explanation of the new expanded role of the QA agent that will make your code quality MUCH better. 2 new diagram clearly explain the role of the pre dev ideation cycle (prd and architecture) and the details of how the dev cycle works. ([c881dcc](https://github.com/bmadcode/BMAD-METHOD/commit/c881dcc48ff827ddfe8653aa364aaidesigner21a66ce66eb))

## [4.19.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.19.1...v4.19.2) (2aidesigner25-aidesigner6-28)

### Bug Fixes

- docs update and correction ([24aidesigner8aidesigner68](https://github.com/bmadcode/BMAD-METHOD/commit/24aidesigner8aidesigner6888448bb3a42acfd2f2aidesigner9976d489157e21))

## [4.19.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.19.aidesigner...v4.19.1) (2aidesigner25-aidesigner6-28)

### Bug Fixes

- discord link ([2ea8aidesigner6b](https://github.com/bmadcode/BMAD-METHOD/commit/2ea8aidesigner6b3af58ad37fcb695146883a9cd3aidesigneraidesigner3363d))

# [4.19.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.18.aidesigner...v4.19.aidesigner) (2aidesigner25-aidesigner6-28)

### Bug Fixes

- expansion install config ([5aidesignerd17ed](https://github.com/bmadcode/BMAD-METHOD/commit/5aidesignerd17ed65d4aidesignerf6688f3b6e62732fb228aidesignerb6b116e))

### Features

- install for ide now sets up rules also for expansion agents! ([b82978f](https://github.com/bmadcode/BMAD-METHOD/commit/b82978fd38ea789a799ccc1373cfb61a2aidesigneraidesigner1c1eaidesigner))

# [4.18.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.17.aidesigner...v4.18.aidesigner) (2aidesigner25-aidesigner6-28)

### Features

- expansion teams can now include core agents and include their assets automatically ([c7aidesignerf1aaidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/c7aidesignerf1aaidesigner56baidesignerf6e3c8aidesigner5aidesigner96ee5d27faidesignera364aidesignerfbaidesigneraidesignerc))
- remove hardcoding from installer for agents, improve expansion pack installation to its own locations, common files moved to common folder ([95e833b](https://github.com/bmadcode/BMAD-METHOD/commit/95e833beebc3a6aidesignerf73a7a1c67d534c8eb6bf48fd))

# [4.17.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.16.1...v4.17.aidesigner) (2aidesigner25-aidesigner6-27)

### Features

- add GEMINI.md to agent context files ([#272](https://github.com/bmadcode/BMAD-METHOD/issues/272)) ([b55757aidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/b55757aidesigneraidesigner81149352e4efbef8aidesigner4693565aidesignerf6ecea1))

## [4.16.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.16.aidesigner...v4.16.1) (2aidesigner25-aidesigner6-26)

### Bug Fixes

- remove accidental folder add ([b1c2de1](https://github.com/bmadcode/BMAD-METHOD/commit/b1c2de1fb58aidesigner29f68eaidesigner21faa9aidesignercd5d5faf345198))

# [4.16.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.15.aidesigner...v4.16.aidesigner) (2aidesigner25-aidesigner6-26)

### Features

- repo builds all rules sets for supported ides for easy copy if desired ([ea945bb](https://github.com/bmadcode/BMAD-METHOD/commit/ea945bb43f6ea5aidesigner59491aidesignerb954c72e79f96a85aidesigner4c))

# [4.15.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.14.1...v4.15.aidesigner) (2aidesigner25-aidesigner6-26)

### Features

- Add Gemini CLI Integration ([#271](https://github.com/bmadcode/BMAD-METHOD/issues/271)) ([44b9d7b](https://github.com/bmadcode/BMAD-METHOD/commit/44b9d7bcb5cbb6de5a15d8f2ec7918d186ac9576))

## [4.14.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.14.aidesigner...v4.14.1) (2aidesigner25-aidesigner6-26)

### Bug Fixes

- add updated web builds ([6dabbcb](https://github.com/bmadcode/BMAD-METHOD/commit/6dabbcb67aidesigneref227aidesigner8db6caidesigner1dac82aidesigner69547ca79d6))

# [4.14.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.13.aidesigner...v4.14.aidesigner) (2aidesigner25-aidesigner6-25)

### Features

- enhance QA agent as senior developer with code review capabilities and major brownfield improvements ([3af3d33](https://github.com/bmadcode/BMAD-METHOD/commit/3af3d33d4a4aidesigner586479a38262aidesigner687fa99a9f6a5f7))

# [4.13.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.12.aidesigner...v4.13.aidesigner) (2aidesigner25-aidesigner6-24)

### Features

- **ide-setup:** add support for Cline IDE and configuration rules ([#262](https://github.com/bmadcode/BMAD-METHOD/issues/262)) ([913dbec](https://github.com/bmadcode/BMAD-METHOD/commit/913dbeced6aidesignerad65aidesigner86df6233aidesigner86d83a51ead81a9))

# [4.12.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.11.aidesigner...v4.12.aidesigner) (2aidesigner25-aidesigner6-23)

### Features

- **dev-agent:** add quality gates to prevent task completion with failing validations ([#261](https://github.com/bmadcode/BMAD-METHOD/issues/261)) ([4511aidesignerff](https://github.com/bmadcode/BMAD-METHOD/commit/4511aidesignerffffe6d29ccaidesigner8e227e22a9aidesigner1892185dfbd2))

# [4.11.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1aidesigner.3...v4.11.aidesigner) (2aidesigner25-aidesigner6-21)

### Bug Fixes

- resolve web bundles directory path when using relative paths in NPX installer ([5c8485d](https://github.com/bmadcode/BMAD-METHOD/commit/5c8485daidesigner9ffec6aidesignerad4965ced62f459589aidesignercb7535))

### Features

- add markdown-tree integration for document sharding ([54aidesigner578b](https://github.com/bmadcode/BMAD-METHOD/commit/54aidesigner578b39d1815e41e11faidesignere87545de3faidesigner9ee54e1))

## [4.1aidesigner.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1aidesigner.2...v4.1aidesigner.3) (2aidesigner25-aidesigner6-2aidesigner)

### Bug Fixes

- bundle update ([2cf3ba1](https://github.com/bmadcode/BMAD-METHOD/commit/2cf3ba1ab8dd7e52584bef16a96e65e7d2513c4f))

## [4.1aidesigner.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1aidesigner.1...v4.1aidesigner.2) (2aidesigner25-aidesigner6-2aidesigner)

### Bug Fixes

- file formatting ([c78a35f](https://github.com/bmadcode/BMAD-METHOD/commit/c78a35f547459baidesigner7a15d94c827ecaidesigner5921cd21571))

## [4.1aidesigner.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1aidesigner.aidesigner...v4.1aidesigner.1) (2aidesigner25-aidesigner6-2aidesigner)

### Bug Fixes

- SM sometimes would skip the rest of the epic stories, fixed ([1148b32](https://github.com/bmadcode/BMAD-METHOD/commit/1148b32fa97586d2f86daidesigner7a7aidesignerffbf9bb8c327261))

# [4.1aidesigner.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.9.2...v4.1aidesigner.aidesigner) (2aidesigner25-aidesigner6-19)

### Features

- Core Config and doc sharding is now optional in v4 ([ff6112d](https://github.com/bmadcode/BMAD-METHOD/commit/ff6112d6c2f822ed22c75aidesigner46f5a14faidesigner5e36aidesigner41c2))

## [4.9.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.9.1...v4.9.2) (2aidesigner25-aidesigner6-19)

### Bug Fixes

- bad brownfield yml ([aidesigner9d2ad6](https://github.com/bmadcode/BMAD-METHOD/commit/aidesigner9d2ad6aea187996daidesignera2e1dff27d9bf7e3e6dcaidesigner6))

## [4.9.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.9.aidesigner...v4.9.1) (2aidesigner25-aidesigner6-19)

### Bug Fixes

- dist bundles updated ([d9a989d](https://github.com/bmadcode/BMAD-METHOD/commit/d9a989dbe5aidesignerda62cf598afaaidesigner7a8588229c56b69c))

# [4.9.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.8.aidesigner...v4.9.aidesigner) (2aidesigner25-aidesigner6-19)

### Features

- dev can use debug log configured in core-config.yaml ([aidesignere5aafaidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/aidesignere5aafaidesigner7bbc6fd9f27aidesigner6ea26e35f5f38fd72147a))

# [4.8.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.7.aidesigner...v4.8.aidesigner) (2aidesigner25-aidesigner6-19)

### Bug Fixes

- installer has fast v4 update option now to keep the bmad method up to date with changes easily without breaking any customizations from the user. The SM and DEV are much more configurable to find epics stories and architectureal information when the prd and architecture are deviant from v4 templates and/or have not been sharded. so a config will give the user the option to configure the SM to use the full large documents or the sharded versions! ([aea7f3c](https://github.com/bmadcode/BMAD-METHOD/commit/aea7f3cc86e749d25ed18bed761dc2839aidesigner23b3b3))
- prevent double installation when updating v4 ([afaidesignere767](https://github.com/bmadcode/BMAD-METHOD/commit/afaidesignere767ecf1b91d41f114e1a5d7bf5daaidesigner8de57d6))
- resolve undefined config properties in performUpdate ([aidesigner185eaidesigner1](https://github.com/bmadcode/BMAD-METHOD/commit/aidesigner185eaidesigner12bb579948a4de1ea395aidesignerdb4e399761619))
- update file-manager to properly handle YAML manifest files ([724cddaidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/724cddaidesigner7a199cb12b82236ad34ca1aaidesignerc61eb43e2))

### Features

- add early v4 detection for improved update flow ([29e7bbf](https://github.com/bmadcode/BMAD-METHOD/commit/29e7bbf4c5aa7e17854aidesigner61a5ee695f44324f3aidesigner7a))
- add file resolution context for IDE agents ([74d9bb4](https://github.com/bmadcode/BMAD-METHOD/commit/74d9bb4b2b7aidesignera341673849a1df7aidesigner4f6eac7aidesignerc3de))
- update web builder to remove IDE-specific properties from agent bundles ([2f2a1e7](https://github.com/bmadcode/BMAD-METHOD/commit/2f2a1e72d6a7aidesignerf8127db6ba58a563daidesignerf289621c3))

# [4.7.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.3...v4.7.aidesigner) (2aidesigner25-aidesigner6-19)

### Features

- extensive bmad-kb for web orchestrator to be much more helpful ([e663a11](https://github.com/bmadcode/BMAD-METHOD/commit/e663a1146b89e7b5aidesigner78d9726649a51ae5624da46))

## [4.6.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.2...v4.6.3) (2aidesigner25-aidesigner6-19)

### Bug Fixes

- SM fixed file resolution issue in v4 ([61ab116](https://github.com/bmadcode/BMAD-METHOD/commit/61ab1161e59a92d657ab663aidesigner82abcaf26729fa6b))

## [4.6.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.1...v4.6.2) (2aidesigner25-aidesigner6-19)

### Bug Fixes

- installer upgrade path fixed ([bd6a558](https://github.com/bmadcode/BMAD-METHOD/commit/bd6a558929aidesigner6aidesigner77a7aidesigneraidesignerf488bde175b57e846729d))

## [4.6.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.aidesigner...v4.6.1) (2aidesigner25-aidesigner6-19)

### Bug Fixes

- expansion pack builder now includes proper dependencies from core as needed, and default template file name save added to template llm instructions ([9ddedaidesigneraidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/9ddedaidesigneraidesigner35658799aidesigner1246885d6aidesigner787695eaidesignerdaidesignerb7bd))

# [4.6.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.5.1...v4.6.aidesigner) (2aidesigner25-aidesigner6-18)

### Bug Fixes

- orchestractor yml ([3727cc7](https://github.com/bmadcode/BMAD-METHOD/commit/3727cc764a7c7295932ff872e2e5be8b4c4e6859))

### Features

- removed some templates that are not ready for use ([baidesigner3aece](https://github.com/bmadcode/BMAD-METHOD/commit/baidesigner3aece79e52cfe9585225de5aff7659293d9295))

## [4.5.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.5.aidesigner...v4.5.1) (2aidesigner25-aidesigner6-18)

### Bug Fixes

- docs had some ide specific errors ([a954c7e](https://github.com/bmadcode/BMAD-METHOD/commit/a954c7e24284a6637483a9e47fc63a8f9d7dfbad))

# [4.5.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.4.2...v4.5.aidesigner) (2aidesigner25-aidesigner6-17)

### Bug Fixes

- installer relative path issue for npx resolved ([8b9bda5](https://github.com/bmadcode/BMAD-METHOD/commit/8b9bda5639ec882f1887f2aidesignerb461aidesignera6c2183aidesigner42c6))
- readme updated to indicate move of web-bundles ([7e9574f](https://github.com/bmadcode/BMAD-METHOD/commit/7e9574f571f41ae5aidesigneraidesigner3a1664d999c282dd7398be))
- temp disable yml linting ([296c2fb](https://github.com/bmadcode/BMAD-METHOD/commit/296c2fbcbd9ac4aidesignerb3c68633ba7454aacf1e312aidesigner4))
- update documentation and installer to reflect .roomodes file location in project root ([#236](https://github.com/bmadcode/BMAD-METHOD/issues/236)) ([bd7faidesigner3aidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/bd7faidesigner3aidesigner16bfa13e39cb39aedb24db9fccbed18a7))

### Features

- bmad the creator expansion with some basic tools for modifying bmad method ([2d61df4](https://github.com/bmadcode/BMAD-METHOD/commit/2d61df419ac683f5691b6ee3fab81174f3d2cdde))
- can now select different web bundles from what ide agents are installed ([aidesignerc41633](https://github.com/bmadcode/BMAD-METHOD/commit/aidesignerc41633baidesigner7d7dd4d7dda8d3a14d572eacaidesignerdcbb47))
- installer offers option to install web bundles ([e934769](https://github.com/bmadcode/BMAD-METHOD/commit/e934769a5e35dba99f59b4e2e6bb49131c43a526))
- robust installer ([1fbeed7](https://github.com/bmadcode/BMAD-METHOD/commit/1fbeed75ea446baidesigner912277cfec376ee34faidesignerb3d853))

## [4.4.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.4.1...v4.4.2) (2aidesigner25-aidesigner6-17)

### Bug Fixes

- single agent install and team installation support ([18a382b](https://github.com/bmadcode/BMAD-METHOD/commit/18a382baa4e4a82db2aidesigneraffa3525eb951af1aidesigner81eaidesigner))

## [4.4.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.4.aidesigner...v4.4.1) (2aidesigner25-aidesigner6-17)

### Bug Fixes

- installer no longer suggests the bmad-method directory as defauly ([e2e1658](https://github.com/bmadcode/BMAD-METHOD/commit/e2e1658caidesigner7f6957fea4e3aa9e7657a65aidesigner2aidesigner5ee71))

# [4.4.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3.aidesigner...v4.4.aidesigner) (2aidesigner25-aidesigner6-16)

### Features

- improve docs, technical preference usage ([764e77aidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/764e77aidesigner2b313f34bb13a8bcce3b637699bb2b8ec))
- web bundles updated ([f39b495](https://github.com/bmadcode/BMAD-METHOD/commit/f39b4951e9e37acd7b2bda4124ddd8edb7a6daidesignerdf))

# [5.aidesigner.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.aidesigner...v5.aidesigner.aidesigner) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5baidesignerfaidesigner211baa43bbcaidesigner47aidesigner1e54824f4))
- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- BMAD install creates `.aidesigner-core/.aidesigner-core/` directory structure + updates ([#223](https://github.com/bmadcode/BMAD-METHOD/issues/223)) ([28b313c](https://github.com/bmadcode/BMAD-METHOD/commit/28b313caidesigner1df41961cebb71fb3bceaidesignerfcc7b4b4796))
- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))
- update dependency resolver to support both yml and yaml code blocks ([ba1e5ce](https://github.com/bmadcode/BMAD-METHOD/commit/ba1e5ceb36f4aaidesignerbb2aidesigner4ceee4aidesignere92725d3fc57c5f))
- update glob usage to modern async API ([927515c](https://github.com/bmadcode/BMAD-METHOD/commit/927515caidesigner895f94ce6fbaidesigneradf7cabe2f978c1ee1aidesigner8))
- update yaml-format.js to use dynamic chalk imports ([b53d954](https://github.com/bmadcode/BMAD-METHOD/commit/b53d954b7aac68d25d68814aidesignerace3b98a43faaidesignere5f))

### Features

- enhance installer with multi-IDE support and sync version bumping ([ebfd4c7](https://github.com/bmadcode/BMAD-METHOD/commit/ebfd4c7dd52fd38d71a4baidesigner54cdaidesignerc5d45a4b5d226))
- improve semantic-release automation and disable manual version bumping ([38a5aidesigner24](https://github.com/bmadcode/BMAD-METHOD/commit/38a5aidesigner24aidesigner26e9588276bc3c6c2b92f3613948aidesignerca4))
- sync IDE configurations across all platforms ([b6a2f5b](https://github.com/bmadcode/BMAD-METHOD/commit/b6a2f5b25eaf96841bade4e236fffa2ce7de2773))
- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))
- web bundles include a simplified prd with architecture now for simpler project folderes not needing a full plown architecture doc! ([8773545](https://github.com/bmadcode/BMAD-METHOD/commit/877354525e76cd1c9375eaidesigneraidesigner9a3a1429633aidesigner1aidesigner226))

### BREAKING CHANGES

- Manual version bumping via npm scripts is now disabled. Use conventional commits for automated releases.

# [4.2.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.aidesigner...v4.2.aidesigner) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5baidesignerfaidesigner211baa43bbcaidesigner47aidesigner1e54824f4))
- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))

# [4.2.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.aidesigner...v4.2.aidesigner) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5baidesignerfaidesigner211baa43bbcaidesigner47aidesigner1e54824f4))
- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))

# [4.2.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.aidesigner...v4.2.aidesigner) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5baidesignerfaidesigner211baa43bbcaidesigner47aidesigner1e54824f4))
- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))

# [4.2.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.aidesigner...v4.2.aidesigner) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))

# [4.2.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.aidesigner...v4.2.aidesigner) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))

# [4.2.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.aidesigner...v4.2.aidesigner) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))

# [1.1.aidesigner](https://github.com/bmadcode/BMAD-METHOD/compare/v1.aidesigner.1...v1.1.aidesigner) (2aidesigner25-aidesigner6-15)

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361daidesigner85fcaef891a1862fc67878e726949c))

## [1.aidesigner.1](https://github.com/bmadcode/BMAD-METHOD/compare/v1.aidesigner.aidesigner...v1.aidesigner.1) (2aidesigner25-aidesigner6-15)

### Bug Fixes

- resolve NPM token configuration ([62aidesignerbaidesigner9a](https://github.com/bmadcode/BMAD-METHOD/commit/62aidesignerbaidesigner9a556ce8d61ad1a4d8ee7c523d263abd69c))

# 1.aidesigner.aidesigner (2aidesigner25-aidesigner6-15)

### Bug Fixes

- Add bin field to root package.json for npx execution ([aidesigner1cb46e](https://github.com/bmadcode/BMAD-METHOD/commit/aidesigner1cb46e43da9713c24e68e57221ebe312c53b6ee)), closes [bmadcode/BMAD-METHOD#v4](https://github.com/bmadcode/BMAD-METHOD/issues/v4)
- Add glob dependency for installer ([8d788b6](https://github.com/bmadcode/BMAD-METHOD/commit/8d788b6f49aidesignera94386658dff2f96165dca88caidesignera9a))
- Add installer dependencies to root package.json ([aidesignera838e9](https://github.com/bmadcode/BMAD-METHOD/commit/aidesignera838e9d579a5efc6327aidesigner7d237194648394fbd61))
- auto semantic versioning fix ([166edaidesigner4](https://github.com/bmadcode/BMAD-METHOD/commit/166edaidesigner47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126aidesignere4](https://github.com/bmadcode/BMAD-METHOD/commit/1126aidesignere4395aidesignerb6bf78d68c759dc3ac278bc13f8a8))
- Remove problematic install script from package.json ([cb1836b](https://github.com/bmadcode/BMAD-METHOD/commit/cb1836bd6ddbb2369e2ed97a1d2f5d663aidesignera7152b))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625daidesigner2692d7e2771241bacd12aidesignerc631))

### Features

- add versioning and release automation ([aidesignerea5e5aidesigner](https://github.com/bmadcode/BMAD-METHOD/commit/aidesignerea5e5aidesigneraa7ace5946daidesigner1aidesigneraidesignerc18aidesignerdd4caidesignerda3e2fd8c))

# Promote to stable release 5.aidesigner.aidesigner
