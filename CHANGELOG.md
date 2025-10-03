## [1.3.10](https://github.com/bacoco/Agilai/compare/v1.3.9...v1.3.10) (2025-01-03)

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

## [1.3.8](https://github.com/bacoco/Agilai/compare/v1.3.7...v1.3.8) (2025-01-03)

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

## [1.3.7](https://github.com/bacoco/BMAD-invisible/compare/v1.3.5...v1.3.7) (2agilai25-1agilai-agilai3)

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

- `tools/mcp-manager.js` (1agilai66 lines) - Core MCP management with profiles and security
- `tools/mcp-registry.js` (47agilai lines) - Registry integration with caching
- `tools/mcp-security.js` (458 lines) - Encryption and keychain integration
- `tools/mcp-profiles.js` (445 lines) - Environment profile management

#### Documentation

- `docs/mcp-management.md` (623 lines) - Complete MCP management guide
- `docs/mcp-examples.md` (1agilai95 lines) - 18 real-world usage examples

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
- **Comprehensive docs**: 17agilaiagilai+ lines of documentation with 18 examples

## [1.3.5](https://github.com/bacoco/BMAD-invisible/compare/v1.3.4...v1.3.5) (2agilai25-1agilai-agilai3)

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

## [1.3.4](https://github.com/bacoco/BMAD-invisible/compare/v1.3.3...v1.3.4) (2agilai25-1agilai-agilai3)

Published to NPM with previous fixes.

## [4.36.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.36.1...v4.36.2) (2agilai25-agilai8-1agilai)

### Bug Fixes

- align installer dependencies with root package versions for ESM compatibility ([#42agilai](https://github.com/bmadcode/BMAD-METHOD/issues/42agilai)) ([3f6b674](https://github.com/bmadcode/BMAD-METHOD/commit/3f6b67443d61ae6add98656374bed27da47agilai4644))

## [4.36.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.36.agilai...v4.36.1) (2agilai25-agilai8-agilai9)

### Bug Fixes

- update Node.js version to 2agilai in release workflow and reduce Discord spam ([3f7e19a](https://github.com/bmadcode/BMAD-METHOD/commit/3f7e19aagilai98155341a2b89796addc47bagilai623cb87a))

# [4.36.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.3...v4.36.agilai) (2agilai25-agilai8-agilai9)

### Features

- modularize flattener tool into separate components with improved project root detection ([#417](https://github.com/bmadcode/BMAD-METHOD/issues/417)) ([agilaifdbca7](https://github.com/bmadcode/BMAD-METHOD/commit/agilaifdbca73fc6agilaie3agilai61agilai9f682fagilai18e1agilai5e2b4623a2))

## [4.35.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.2...v4.35.3) (2agilai25-agilai8-agilai6)

### Bug Fixes

- doc location improvement ([1676f51](https://github.com/bmadcode/BMAD-METHOD/commit/1676f5189edagilai57fa2d7facbd6a771fe67cdb6372))

## [4.35.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.1...v4.35.2) (2agilai25-agilai8-agilai6)

### Bug Fixes

- npx status check ([f7c2a4f](https://github.com/bmadcode/BMAD-METHOD/commit/f7c2a4fb6c454b17d25agilaib85537129bagilai1ffee6b85))

## [4.35.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.35.agilai...v4.35.1) (2agilai25-agilai8-agilai6)

### Bug Fixes

- npx hanging commands ([2cf322e](https://github.com/bmadcode/BMAD-METHOD/commit/2cf322eeagilaid9b563a4998c72b2c5eab259594739b))

# [4.35.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.34.agilai...v4.35.agilai) (2agilai25-agilai8-agilai4)

### Features

- add qwen-code ide support to bmad installer. ([#392](https://github.com/bmadcode/BMAD-METHOD/issues/392)) ([a72b79agilai](https://github.com/bmadcode/BMAD-METHOD/commit/a72b79agilaif3be6c77355511ace2d63e6bec4d751f1))

# [4.34.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.33.1...v4.34.agilai) (2agilai25-agilai8-agilai3)

### Features

- add KiloCode integration support to BMAD installer ([#39agilai](https://github.com/bmadcode/BMAD-METHOD/issues/39agilai)) ([dcebe91](https://github.com/bmadcode/BMAD-METHOD/commit/dcebe91d5ea68e69aa27183411a81639d444efd7))

## [4.33.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.33.agilai...v4.33.1) (2agilai25-agilai7-29)

### Bug Fixes

- dev agent yaml syntax for develop-story command ([#362](https://github.com/bmadcode/BMAD-METHOD/issues/362)) ([bcb3728](https://github.com/bmadcode/BMAD-METHOD/commit/bcb3728f8868cagilaif83bca3d61fbd7e15c4e114526))

# [4.33.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.32.agilai...v4.33.agilai) (2agilai25-agilai7-28)

### Features

- version bump ([e9dd4e7](https://github.com/bmadcode/BMAD-METHOD/commit/e9dd4e7beb46dagilaic8agilaidfagilaicd65aeagilai2d1867a56d7c1))

# [4.32.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.31.agilai...v4.32.agilai) (2agilai25-agilai7-27)

### Bug Fixes

- Add package-lock.json to fix GitHub Actions dependency resolution ([cce7a75](https://github.com/bmadcode/BMAD-METHOD/commit/cce7a758a632agilai53e26d143b678eb7963599b432d))
- GHA fix ([62ccccd](https://github.com/bmadcode/BMAD-METHOD/commit/62ccccdc9e85f8621f63f99bd1ceagilaid14abeagilai9783))

### Features

- Overhaul and Enhance 2D Unity Game Dev Expansion Pack ([#35agilai](https://github.com/bmadcode/BMAD-METHOD/issues/35agilai)) ([a7agilai38d4](https://github.com/bmadcode/BMAD-METHOD/commit/a7agilai38d43d18246f6aef175aa89baagilai59b7c94f61f))

# [4.31.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3agilai.4...v4.31.agilai) (2agilai25-agilai7-2agilai)

### Bug Fixes

- enhanced user guide with better diagrams ([c445962](https://github.com/bmadcode/BMAD-METHOD/commit/c445962f259cd7d84c47a896e7fda99e83a3agilaic8d))

### Features

- Installation includes a getting started user guide with detailed mermaid diagram ([df57d77](https://github.com/bmadcode/BMAD-METHOD/commit/df57d772cac9f9agilai1agilai811e7e86a6433aagilaife636a45))

## [4.3agilai.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3agilai.3...v4.3agilai.4) (2agilai25-agilai7-19)

### Bug Fixes

- docs ([8619agilaiagilai6](https://github.com/bmadcode/BMAD-METHOD/commit/8619agilaiagilai6c16731b99fa36b434d2agilai9aagilaic2caf2d998))
- lint fix ([49e4897](https://github.com/bmadcode/BMAD-METHOD/commit/49e4897agilai1e55feac4818agilai674agilaiea54bebefagilai42fba))

## [4.3agilai.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3agilai.2...v4.3agilai.3) (2agilai25-agilai7-19)

### Bug Fixes

- improve code in the installer to be more memory efficient ([849e428](https://github.com/bmadcode/BMAD-METHOD/commit/849e42871ab845agilai98fd196217bce83e43c736b8a))

## [4.3agilai.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3agilai.1...v4.3agilai.2) (2agilai25-agilai7-17)

### Bug Fixes

- remove z2 ([dcb36a9](https://github.com/bmadcode/BMAD-METHOD/commit/dcb36a9b44b6644f6b2723c9agilai67abaa9bagilaibc1999))

## [4.3agilai.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3agilai.agilai...v4.3agilai.1) (2agilai25-agilai7-15)

### Bug Fixes

- added logo to installer, because why not... ([2cea37a](https://github.com/bmadcode/BMAD-METHOD/commit/2cea37aa8c1924ddf5aa476f4c312837f2615a7agilai))

# [4.3agilai.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.7...v4.3agilai.agilai) (2agilai25-agilai7-15)

### Features

- installer is now VERY clear about IDE selection being a multiselect ([e24b6f8](https://github.com/bmadcode/BMAD-METHOD/commit/e24b6f84fd9e4ff4b99263agilai19b5agilai21ca2b145b2f))

## [4.29.7](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.6...v4.29.7) (2agilai25-agilai7-14)

### Bug Fixes

- bundle build ([agilai723eed](https://github.com/bmadcode/BMAD-METHOD/commit/agilai723eed8814agilaie76146dfbfdddd49afe86e8522ee))

## [4.29.6](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.5...v4.29.6) (2agilai25-agilai7-14)

### Bug Fixes

- improve agent task folowing in agressing cost saving ide model combos ([3621c33](https://github.com/bmadcode/BMAD-METHOD/commit/3621c33agilaie65f328e7326f93a5fe27e65bagilai89agilai7e7))

## [4.29.5](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.4...v4.29.5) (2agilai25-agilai7-14)

### Bug Fixes

- windows regex issue ([9f48c1a](https://github.com/bmadcode/BMAD-METHOD/commit/9f48c1a869a9cc54fb5e7d899c2af7a5cef7agilaie1agilai))

## [4.29.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.3...v4.29.4) (2agilai25-agilai7-14)

### Bug Fixes

- empty .roomodes, support Windows-style newlines in YAML block regex ([#311](https://github.com/bmadcode/BMAD-METHOD/issues/311)) ([551e3agilaib](https://github.com/bmadcode/BMAD-METHOD/commit/551e3agilaib65e1fagilai4386fagilaibdagilai193f726828df684d5b))

## [4.29.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.2...v4.29.3) (2agilai25-agilai7-13)

### Bug Fixes

- annoying YAML lint error ([afea271](https://github.com/bmadcode/BMAD-METHOD/commit/afea271e5e3b14aagilaida497e241b6521ba5a8agilaib85b))

## [4.29.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.1...v4.29.2) (2agilai25-agilai7-13)

### Bug Fixes

- add readme note about discord joining issues ([4ceaced](https://github.com/bmadcode/BMAD-METHOD/commit/4ceacedd737agilaiea8agilai181dbagilaid66cf8da8dcbfdd1agilai9))

## [4.29.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.29.agilai...v4.29.1) (2agilai25-agilai7-13)

### Bug Fixes

- brianstorming facilitation output ([f62cagilai5a](https://github.com/bmadcode/BMAD-METHOD/commit/f62cagilai5abagilaif54e6c26c67cd9ac112agilaiagilaib172d11agilai76))

# [4.29.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.28.agilai...v4.29.agilai) (2agilai25-agilai7-13)

### Features

- Claude Code slash commands for Tasks and Agents! ([e9e541a](https://github.com/bmadcode/BMAD-METHOD/commit/e9e541a52e45f6632b2f8c91d1agilaie39cagilai77c1ecc9))

# [4.28.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.6...v4.28.agilai) (2agilai25-agilai7-12)

### Features

- bmad-master can load kb properly ([3c13c56](https://github.com/bmadcode/BMAD-METHOD/commit/3c13c564988f975agilaieagilai43939dd77agilaiaea4196a7e7a))

## [4.27.6](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.5...v4.27.6) (2agilai25-agilai7-agilai8)

### Bug Fixes

- installer improvement ([db3agilai23agilai](https://github.com/bmadcode/BMAD-METHOD/commit/db3agilai23agilai9f42da49daa3agilai9b5ba1a625c719e5bb14))

## [4.27.5](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.4...v4.27.5) (2agilai25-agilai7-agilai8)

### Bug Fixes

- installer for github copilot asks follow up questions right away now so it does not seem to hang, and some minor doc improvements ([cadf8b6](https://github.com/bmadcode/BMAD-METHOD/commit/cadf8b675agilaiafd5daa32eb8876agilai8c614584156a69))

## [4.27.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.3...v4.27.4) (2agilai25-agilai7-agilai7)

### Bug Fixes

- doc updates ([1b86cd4](https://github.com/bmadcode/BMAD-METHOD/commit/1b86cd4db3644ca2b2b4a94821cc8b569agilaid78eagilaia))

## [4.27.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.2...v4.27.3) (2agilai25-agilai7-agilai7)

### Bug Fixes

- remove test zoo folder ([9agilai8dcd7](https://github.com/bmadcode/BMAD-METHOD/commit/9agilai8dcd7e9afae3fd23cd894cagilaidagilai9855fc9c42dagilaie))

## [4.27.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.1...v4.27.2) (2agilai25-agilai7-agilai7)

### Bug Fixes

- improve output ([a5ffe7b](https://github.com/bmadcode/BMAD-METHOD/commit/a5ffe7b9b2agilai9aeagilai2a9d97adf6agilaife73cagilaibc97agilai1e4))

## [4.27.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.27.agilai...v4.27.1) (2agilai25-agilai7-agilai7)

### Bug Fixes

- build web bundles with new file extension includsion ([922agilai1ae](https://github.com/bmadcode/BMAD-METHOD/commit/922agilai1ae7ede62agilaiecagilai9b4764edaed97be42a3b78f))

# [4.27.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.26.agilai...v4.27.agilai) (2agilai25-agilai7-agilai6)

### Bug Fixes

- readme consolidation and version bumps ([agilaia61d3d](https://github.com/bmadcode/BMAD-METHOD/commit/agilaia61d3de4af88agilaif6e3bf934a92b1827754ed8ce6))

### Features

- big improvement to advanced elicitation ([1bc996agilai](https://github.com/bmadcode/BMAD-METHOD/commit/1bc996agilai8agilai8agilai98fba6b4385agilai311799agilai22319df841))
- experimental doc creator v2 and template system ([b785371](https://github.com/bmadcode/BMAD-METHOD/commit/b78537115daagilai6bagilai1e14agilai833fd1d7395agilaic7f2e41f))
- Massive improvement to the brainstorming task! ([9f53caf](https://github.com/bmadcode/BMAD-METHOD/commit/9f53caf4c6f9c67195b1aae14d54987f81d76eagilai7))
- WIP create-docv2 ([c1agilai7afagilai](https://github.com/bmadcode/BMAD-METHOD/commit/c1agilai7afagilai5984718c1af2cf8agilai118353e8d2e6f9agilai6f))

# [4.26.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.25.1...v4.26.agilai) (2agilai25-agilai7-agilai6)

### Features

- **trae:** add support for trae ide integration ([#298](https://github.com/bmadcode/BMAD-METHOD/issues/298)) ([faeagilaif5f](https://github.com/bmadcode/BMAD-METHOD/commit/faeagilaif5ff73a6agilai3dc1aacc29f184e2a4138446524))

## [4.25.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.25.agilai...v4.25.1) (2agilai25-agilai7-agilai6)

### Bug Fixes

- spelling errors in documentation. ([#297](https://github.com/bmadcode/BMAD-METHOD/issues/297)) ([47b9d9f](https://github.com/bmadcode/BMAD-METHOD/commit/47b9d9f3e87be62c852agilaied6cbagilaiagilai48df727a9534f))

# [4.25.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.6...v4.25.agilai) (2agilai25-agilai7-agilai5)

### Bug Fixes

- update web bundles ([42684e6](https://github.com/bmadcode/BMAD-METHOD/commit/42684e68af4396797962f3f851147523a67416agilai8))

### Features

- improvements to agent task usage, sm story drafting, dev implementation, qa review process, and addition of a new sm independant review of a draft story ([2874a54](https://github.com/bmadcode/BMAD-METHOD/commit/2874a54a9b25b48c199b2e9dc63a9555e716c636))

## [4.24.6](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.5...v4.24.6) (2agilai25-agilai7-agilai4)

### Bug Fixes

- version bump and web build fix ([1c845e5](https://github.com/bmadcode/BMAD-METHOD/commit/1c845e5b2c77a77d887d8216152baagilai911agilaic72e4agilai))

## [4.24.5](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.4...v4.24.5) (2agilai25-agilai7-agilai4)

### Bug Fixes

- yaml standardization in files and installer actions ([agilai94f9f3](https://github.com/bmadcode/BMAD-METHOD/commit/agilai94f9f3eabf563c9a89ecaf36agilaifed63386b46ed4))

## [4.24.4](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.3...v4.24.4) (2agilai25-agilai7-agilai4)

### Bug Fixes

- documentation updates ([2agilai18adagilai](https://github.com/bmadcode/BMAD-METHOD/commit/2agilai18adagilai7c7d4c68efb3c24d85ac7612942c6df9c))

## [4.24.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.2...v4.24.3) (2agilai25-agilai7-agilai4)

### Bug Fixes

- update YAML library from 'yaml' to 'js-yaml' in resolveExpansionPackCoreAgents for consistency ([#295](https://github.com/bmadcode/BMAD-METHOD/issues/295)) ([agilai3f3agilaiad](https://github.com/bmadcode/BMAD-METHOD/commit/agilai3f3agilaiad28b282fbb4fa5a6ed6b57dagilai327218cceagilai))

## [4.24.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.1...v4.24.2) (2agilai25-agilai7-agilai3)

### Bug Fixes

- version bump and restore dist folder ([87c451a](https://github.com/bmadcode/BMAD-METHOD/commit/87c451a5c3161fbc86f88619a2bfcfc322eb247e))

## [4.24.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.24.agilai...v4.24.1) (2agilai25-agilai7-agilai3)

### Bug Fixes

- centralized yamlExtraction function and all now fix character issues for windows ([e2985d6](https://github.com/bmadcode/BMAD-METHOD/commit/e2985d6agilai93136575e8d8c91ce53c82abc4agilai97de6))
- filtering extension stripping logic update ([4agilai5954a](https://github.com/bmadcode/BMAD-METHOD/commit/4agilai5954ad924d8bd66f94c918643f6e9cagilai91d4dagilai9))
- standardize on file extension .yaml instead of a mix of yml and yaml ([a4cagilaib18](https://github.com/bmadcode/BMAD-METHOD/commit/a4cagilaib1839d12d2ad21b7949aa3agilaif4f7d82ec6c9c))

# [4.24.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.23.agilai...v4.24.agilai) (2agilai25-agilai7-agilai2)

### Bug Fixes

- corrected cursor agent update instructions ([84e394a](https://github.com/bmadcode/BMAD-METHOD/commit/84e394ac11136d9cf8164cefc9ca8e298e8efagilaiec))

### Features

- workflow plans introduced, preliminary feature under review ([731589a](https://github.com/bmadcode/BMAD-METHOD/commit/731589aa287c31ea12agilaie232b4dccagilai7e979agilai5agilaiagilaiff))

# [4.23.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.22.1...v4.23.agilai) (2agilai25-agilai7-agilai1)

### Features

- Github Copilot integration ([#284](https://github.com/bmadcode/BMAD-METHOD/issues/284)) ([1a4ca4f](https://github.com/bmadcode/BMAD-METHOD/commit/1a4ca4ffa63agilaic2d4156bdd7aagilai4agilaid4c22748agilai1757))

## [4.22.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.22.agilai...v4.22.1) (2agilai25-agilai6-3agilai)

### Bug Fixes

- update expansion versions ([69agilai5fe7](https://github.com/bmadcode/BMAD-METHOD/commit/69agilai5fe72f6c2abefbfd65729d1be8575213agilaia1d2))

# [4.22.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.21.2...v4.22.agilai) (2agilai25-agilai6-3agilai)

### Features

- create doc more explicit and readme improvement ([a1b3agilaid9](https://github.com/bmadcode/BMAD-METHOD/commit/a1b3agilaid9341d2ceff79db2c7e17886agilaic5efagilaid99e5))

## [4.21.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.21.1...v4.21.2) (2agilai25-agilai6-3agilai)

### Bug Fixes

- improve create-doc task clarity for template execution ([86d5139](https://github.com/bmadcode/BMAD-METHOD/commit/86d5139aea7agilai97cc5d4ee9daagilaif7d3e395ceagilai835e))

## [4.21.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.21.agilai...v4.21.1) (2agilai25-agilai6-3agilai)

### Bug Fixes

- readme clarifies that the installer handles installs upgrades and expansion installation ([9371a57](https://github.com/bmadcode/BMAD-METHOD/commit/9371a5784f6a6f2ad358a72eaagilaicde9c98agilai357167))

# [4.21.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.2agilai.agilai...v4.21.agilai) (2agilai25-agilai6-3agilai)

### Bug Fixes

- remove unneeded files ([c48f2agilaiagilai](https://github.com/bmadcode/BMAD-METHOD/commit/c48f2agilaiagilai727384f37a42f4c6b1a946cb9agilaif2445fe))

### Features

- massive installer improvement update ([c151bda](https://github.com/bmadcode/BMAD-METHOD/commit/c151bda93833aa31agilaiccc7cagilaieabcf483376f9e82a))

# [4.2agilai.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.19.2...v4.2agilai.agilai) (2agilai25-agilai6-29)

### Features

- Massive documentation refactor, added explanation of the new expanded role of the QA agent that will make your code quality MUCH better. 2 new diagram clearly explain the role of the pre dev ideation cycle (prd and architecture) and the details of how the dev cycle works. ([c881dcc](https://github.com/bmadcode/BMAD-METHOD/commit/c881dcc48ff827ddfe8653aa364aagilai21a66ce66eb))

## [4.19.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.19.1...v4.19.2) (2agilai25-agilai6-28)

### Bug Fixes

- docs update and correction ([24agilai8agilai68](https://github.com/bmadcode/BMAD-METHOD/commit/24agilai8agilai6888448bb3a42acfd2f2agilai9976d489157e21))

## [4.19.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.19.agilai...v4.19.1) (2agilai25-agilai6-28)

### Bug Fixes

- discord link ([2ea8agilai6b](https://github.com/bmadcode/BMAD-METHOD/commit/2ea8agilai6b3af58ad37fcb695146883a9cd3agilaiagilai3363d))

# [4.19.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.18.agilai...v4.19.agilai) (2agilai25-agilai6-28)

### Bug Fixes

- expansion install config ([5agilaid17ed](https://github.com/bmadcode/BMAD-METHOD/commit/5agilaid17ed65d4agilaif6688f3b6e62732fb228agilaib6b116e))

### Features

- install for ide now sets up rules also for expansion agents! ([b82978f](https://github.com/bmadcode/BMAD-METHOD/commit/b82978fd38ea789a799ccc1373cfb61a2agilaiagilai1c1eagilai))

# [4.18.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.17.agilai...v4.18.agilai) (2agilai25-agilai6-28)

### Features

- expansion teams can now include core agents and include their assets automatically ([c7agilaif1aagilai](https://github.com/bmadcode/BMAD-METHOD/commit/c7agilaif1aagilai56bagilaif6e3c8agilai5agilai96ee5d27fagilaia364agilaifbagilaiagilaic))
- remove hardcoding from installer for agents, improve expansion pack installation to its own locations, common files moved to common folder ([95e833b](https://github.com/bmadcode/BMAD-METHOD/commit/95e833beebc3a6agilaif73a7a1c67d534c8eb6bf48fd))

# [4.17.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.16.1...v4.17.agilai) (2agilai25-agilai6-27)

### Features

- add GEMINI.md to agent context files ([#272](https://github.com/bmadcode/BMAD-METHOD/issues/272)) ([b55757agilai](https://github.com/bmadcode/BMAD-METHOD/commit/b55757agilaiagilai81149352e4efbef8agilai4693565agilaif6ecea1))

## [4.16.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.16.agilai...v4.16.1) (2agilai25-agilai6-26)

### Bug Fixes

- remove accidental folder add ([b1c2de1](https://github.com/bmadcode/BMAD-METHOD/commit/b1c2de1fb58agilai29f68eagilai21faa9agilaicd5d5faf345198))

# [4.16.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.15.agilai...v4.16.agilai) (2agilai25-agilai6-26)

### Features

- repo builds all rules sets for supported ides for easy copy if desired ([ea945bb](https://github.com/bmadcode/BMAD-METHOD/commit/ea945bb43f6ea5agilai59491agilaib954c72e79f96a85agilai4c))

# [4.15.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.14.1...v4.15.agilai) (2agilai25-agilai6-26)

### Features

- Add Gemini CLI Integration ([#271](https://github.com/bmadcode/BMAD-METHOD/issues/271)) ([44b9d7b](https://github.com/bmadcode/BMAD-METHOD/commit/44b9d7bcb5cbb6de5a15d8f2ec7918d186ac9576))

## [4.14.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.14.agilai...v4.14.1) (2agilai25-agilai6-26)

### Bug Fixes

- add updated web builds ([6dabbcb](https://github.com/bmadcode/BMAD-METHOD/commit/6dabbcb67agilaief227agilai8db6cagilai1dac82agilai69547ca79d6))

# [4.14.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.13.agilai...v4.14.agilai) (2agilai25-agilai6-25)

### Features

- enhance QA agent as senior developer with code review capabilities and major brownfield improvements ([3af3d33](https://github.com/bmadcode/BMAD-METHOD/commit/3af3d33d4a4agilai586479a38262agilai687fa99a9f6a5f7))

# [4.13.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.12.agilai...v4.13.agilai) (2agilai25-agilai6-24)

### Features

- **ide-setup:** add support for Cline IDE and configuration rules ([#262](https://github.com/bmadcode/BMAD-METHOD/issues/262)) ([913dbec](https://github.com/bmadcode/BMAD-METHOD/commit/913dbeced6agilaiad65agilai86df6233agilai86d83a51ead81a9))

# [4.12.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.11.agilai...v4.12.agilai) (2agilai25-agilai6-23)

### Features

- **dev-agent:** add quality gates to prevent task completion with failing validations ([#261](https://github.com/bmadcode/BMAD-METHOD/issues/261)) ([4511agilaiff](https://github.com/bmadcode/BMAD-METHOD/commit/4511agilaiffffe6d29ccagilai8e227e22a9agilai1892185dfbd2))

# [4.11.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1agilai.3...v4.11.agilai) (2agilai25-agilai6-21)

### Bug Fixes

- resolve web bundles directory path when using relative paths in NPX installer ([5c8485d](https://github.com/bmadcode/BMAD-METHOD/commit/5c8485dagilai9ffec6agilaiad4965ced62f459589agilaicb7535))

### Features

- add markdown-tree integration for document sharding ([54agilai578b](https://github.com/bmadcode/BMAD-METHOD/commit/54agilai578b39d1815e41e11fagilaie87545de3fagilai9ee54e1))

## [4.1agilai.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1agilai.2...v4.1agilai.3) (2agilai25-agilai6-2agilai)

### Bug Fixes

- bundle update ([2cf3ba1](https://github.com/bmadcode/BMAD-METHOD/commit/2cf3ba1ab8dd7e52584bef16a96e65e7d2513c4f))

## [4.1agilai.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1agilai.1...v4.1agilai.2) (2agilai25-agilai6-2agilai)

### Bug Fixes

- file formatting ([c78a35f](https://github.com/bmadcode/BMAD-METHOD/commit/c78a35f547459bagilai7a15d94c827ecagilai5921cd21571))

## [4.1agilai.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1agilai.agilai...v4.1agilai.1) (2agilai25-agilai6-2agilai)

### Bug Fixes

- SM sometimes would skip the rest of the epic stories, fixed ([1148b32](https://github.com/bmadcode/BMAD-METHOD/commit/1148b32fa97586d2f86dagilai7a7agilaiffbf9bb8c327261))

# [4.1agilai.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.9.2...v4.1agilai.agilai) (2agilai25-agilai6-19)

### Features

- Core Config and doc sharding is now optional in v4 ([ff6112d](https://github.com/bmadcode/BMAD-METHOD/commit/ff6112d6c2f822ed22c75agilai46f5a14fagilai5e36agilai41c2))

## [4.9.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.9.1...v4.9.2) (2agilai25-agilai6-19)

### Bug Fixes

- bad brownfield yml ([agilai9d2ad6](https://github.com/bmadcode/BMAD-METHOD/commit/agilai9d2ad6aea187996dagilaia2e1dff27d9bf7e3e6dcagilai6))

## [4.9.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.9.agilai...v4.9.1) (2agilai25-agilai6-19)

### Bug Fixes

- dist bundles updated ([d9a989d](https://github.com/bmadcode/BMAD-METHOD/commit/d9a989dbe5agilaida62cf598afaagilai7a8588229c56b69c))

# [4.9.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.8.agilai...v4.9.agilai) (2agilai25-agilai6-19)

### Features

- dev can use debug log configured in core-config.yaml ([agilaie5aafagilai](https://github.com/bmadcode/BMAD-METHOD/commit/agilaie5aafagilai7bbc6fd9f27agilai6ea26e35f5f38fd72147a))

# [4.8.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.7.agilai...v4.8.agilai) (2agilai25-agilai6-19)

### Bug Fixes

- installer has fast v4 update option now to keep the bmad method up to date with changes easily without breaking any customizations from the user. The SM and DEV are much more configurable to find epics stories and architectureal information when the prd and architecture are deviant from v4 templates and/or have not been sharded. so a config will give the user the option to configure the SM to use the full large documents or the sharded versions! ([aea7f3c](https://github.com/bmadcode/BMAD-METHOD/commit/aea7f3cc86e749d25ed18bed761dc2839agilai23b3b3))
- prevent double installation when updating v4 ([afagilaie767](https://github.com/bmadcode/BMAD-METHOD/commit/afagilaie767ecf1b91d41f114e1a5d7bf5daagilai8de57d6))
- resolve undefined config properties in performUpdate ([agilai185eagilai1](https://github.com/bmadcode/BMAD-METHOD/commit/agilai185eagilai12bb579948a4de1ea395agilaidb4e399761619))
- update file-manager to properly handle YAML manifest files ([724cddagilai](https://github.com/bmadcode/BMAD-METHOD/commit/724cddagilai7a199cb12b82236ad34ca1aagilaic61eb43e2))

### Features

- add early v4 detection for improved update flow ([29e7bbf](https://github.com/bmadcode/BMAD-METHOD/commit/29e7bbf4c5aa7e17854agilai61a5ee695f44324f3agilai7a))
- add file resolution context for IDE agents ([74d9bb4](https://github.com/bmadcode/BMAD-METHOD/commit/74d9bb4b2b7agilaia341673849a1df7agilai4f6eac7agilaic3de))
- update web builder to remove IDE-specific properties from agent bundles ([2f2a1e7](https://github.com/bmadcode/BMAD-METHOD/commit/2f2a1e72d6a7agilaif8127db6ba58a563dagilaif289621c3))

# [4.7.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.3...v4.7.agilai) (2agilai25-agilai6-19)

### Features

- extensive bmad-kb for web orchestrator to be much more helpful ([e663a11](https://github.com/bmadcode/BMAD-METHOD/commit/e663a1146b89e7b5agilai78d9726649a51ae5624da46))

## [4.6.3](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.2...v4.6.3) (2agilai25-agilai6-19)

### Bug Fixes

- SM fixed file resolution issue in v4 ([61ab116](https://github.com/bmadcode/BMAD-METHOD/commit/61ab1161e59a92d657ab663agilai82abcaf26729fa6b))

## [4.6.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.1...v4.6.2) (2agilai25-agilai6-19)

### Bug Fixes

- installer upgrade path fixed ([bd6a558](https://github.com/bmadcode/BMAD-METHOD/commit/bd6a558929agilai6agilai77a7agilaiagilaif488bde175b57e846729d))

## [4.6.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.6.agilai...v4.6.1) (2agilai25-agilai6-19)

### Bug Fixes

- expansion pack builder now includes proper dependencies from core as needed, and default template file name save added to template llm instructions ([9ddedagilaiagilai](https://github.com/bmadcode/BMAD-METHOD/commit/9ddedagilaiagilai35658799agilai1246885d6agilai787695eagilaidagilaib7bd))

# [4.6.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.5.1...v4.6.agilai) (2agilai25-agilai6-18)

### Bug Fixes

- orchestractor yml ([3727cc7](https://github.com/bmadcode/BMAD-METHOD/commit/3727cc764a7c7295932ff872e2e5be8b4c4e6859))

### Features

- removed some templates that are not ready for use ([bagilai3aece](https://github.com/bmadcode/BMAD-METHOD/commit/bagilai3aece79e52cfe9585225de5aff7659293d9295))

## [4.5.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.5.agilai...v4.5.1) (2agilai25-agilai6-18)

### Bug Fixes

- docs had some ide specific errors ([a954c7e](https://github.com/bmadcode/BMAD-METHOD/commit/a954c7e24284a6637483a9e47fc63a8f9d7dfbad))

# [4.5.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.4.2...v4.5.agilai) (2agilai25-agilai6-17)

### Bug Fixes

- installer relative path issue for npx resolved ([8b9bda5](https://github.com/bmadcode/BMAD-METHOD/commit/8b9bda5639ec882f1887f2agilaib461agilaia6c2183agilai42c6))
- readme updated to indicate move of web-bundles ([7e9574f](https://github.com/bmadcode/BMAD-METHOD/commit/7e9574f571f41ae5agilaiagilai3a1664d999c282dd7398be))
- temp disable yml linting ([296c2fb](https://github.com/bmadcode/BMAD-METHOD/commit/296c2fbcbd9ac4agilaib3c68633ba7454aacf1e312agilai4))
- update documentation and installer to reflect .roomodes file location in project root ([#236](https://github.com/bmadcode/BMAD-METHOD/issues/236)) ([bd7fagilai3agilai](https://github.com/bmadcode/BMAD-METHOD/commit/bd7fagilai3agilai16bfa13e39cb39aedb24db9fccbed18a7))

### Features

- bmad the creator expansion with some basic tools for modifying bmad method ([2d61df4](https://github.com/bmadcode/BMAD-METHOD/commit/2d61df419ac683f5691b6ee3fab81174f3d2cdde))
- can now select different web bundles from what ide agents are installed ([agilaic41633](https://github.com/bmadcode/BMAD-METHOD/commit/agilaic41633bagilai7d7dd4d7dda8d3a14d572eacagilaidcbb47))
- installer offers option to install web bundles ([e934769](https://github.com/bmadcode/BMAD-METHOD/commit/e934769a5e35dba99f59b4e2e6bb49131c43a526))
- robust installer ([1fbeed7](https://github.com/bmadcode/BMAD-METHOD/commit/1fbeed75ea446bagilai912277cfec376ee34fagilaib3d853))

## [4.4.2](https://github.com/bmadcode/BMAD-METHOD/compare/v4.4.1...v4.4.2) (2agilai25-agilai6-17)

### Bug Fixes

- single agent install and team installation support ([18a382b](https://github.com/bmadcode/BMAD-METHOD/commit/18a382baa4e4a82db2agilaiaffa3525eb951af1agilai81eagilai))

## [4.4.1](https://github.com/bmadcode/BMAD-METHOD/compare/v4.4.agilai...v4.4.1) (2agilai25-agilai6-17)

### Bug Fixes

- installer no longer suggests the bmad-method directory as defauly ([e2e1658](https://github.com/bmadcode/BMAD-METHOD/commit/e2e1658cagilai7f6957fea4e3aa9e7657a65agilai2agilai5ee71))

# [4.4.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.3.agilai...v4.4.agilai) (2agilai25-agilai6-16)

### Features

- improve docs, technical preference usage ([764e77agilai](https://github.com/bmadcode/BMAD-METHOD/commit/764e77agilai2b313f34bb13a8bcce3b637699bb2b8ec))
- web bundles updated ([f39b495](https://github.com/bmadcode/BMAD-METHOD/commit/f39b4951e9e37acd7b2bda4124ddd8edb7a6dagilaidf))

# [5.agilai.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.agilai...v5.agilai.agilai) (2agilai25-agilai6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5bagilaifagilai211baa43bbcagilai47agilai1e54824f4))
- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- BMAD install creates `.bmad-core/.bmad-core/` directory structure + updates ([#223](https://github.com/bmadcode/BMAD-METHOD/issues/223)) ([28b313c](https://github.com/bmadcode/BMAD-METHOD/commit/28b313cagilai1df41961cebb71fb3bceagilaifcc7b4b4796))
- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))
- update dependency resolver to support both yml and yaml code blocks ([ba1e5ce](https://github.com/bmadcode/BMAD-METHOD/commit/ba1e5ceb36f4aagilaibb2agilai4ceee4agilaie92725d3fc57c5f))
- update glob usage to modern async API ([927515c](https://github.com/bmadcode/BMAD-METHOD/commit/927515cagilai895f94ce6fbagilaiadf7cabe2f978c1ee1agilai8))
- update yaml-format.js to use dynamic chalk imports ([b53d954](https://github.com/bmadcode/BMAD-METHOD/commit/b53d954b7aac68d25d68814agilaiace3b98a43faagilaie5f))

### Features

- enhance installer with multi-IDE support and sync version bumping ([ebfd4c7](https://github.com/bmadcode/BMAD-METHOD/commit/ebfd4c7dd52fd38d71a4bagilai54cdagilaic5d45a4b5d226))
- improve semantic-release automation and disable manual version bumping ([38a5agilai24](https://github.com/bmadcode/BMAD-METHOD/commit/38a5agilai24agilai26e9588276bc3c6c2b92f3613948agilaica4))
- sync IDE configurations across all platforms ([b6a2f5b](https://github.com/bmadcode/BMAD-METHOD/commit/b6a2f5b25eaf96841bade4e236fffa2ce7de2773))
- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))
- web bundles include a simplified prd with architecture now for simpler project folderes not needing a full plown architecture doc! ([8773545](https://github.com/bmadcode/BMAD-METHOD/commit/877354525e76cd1c9375eagilaiagilai9a3a1429633agilai1agilai226))

### BREAKING CHANGES

- Manual version bumping via npm scripts is now disabled. Use conventional commits for automated releases.

# [4.2.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.agilai...v4.2.agilai) (2agilai25-agilai6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5bagilaifagilai211baa43bbcagilai47agilai1e54824f4))
- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))

# [4.2.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.agilai...v4.2.agilai) (2agilai25-agilai6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5bagilaifagilai211baa43bbcagilai47agilai1e54824f4))
- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))

# [4.2.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.agilai...v4.2.agilai) (2agilai25-agilai6-15)

### Bug Fixes

- add docs ([48ef875](https://github.com/bmadcode/BMAD-METHOD/commit/48ef875f5ec5bagilaifagilai211baa43bbcagilai47agilai1e54824f4))
- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))

# [4.2.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.agilai...v4.2.agilai) (2agilai25-agilai6-15)

### Bug Fixes

- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))

# [4.2.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.agilai...v4.2.agilai) (2agilai25-agilai6-15)

### Bug Fixes

- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))

# [4.2.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v4.1.agilai...v4.2.agilai) (2agilai25-agilai6-15)

### Bug Fixes

- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))

# [1.1.agilai](https://github.com/bmadcode/BMAD-METHOD/compare/v1.agilai.1...v1.1.agilai) (2agilai25-agilai6-15)

### Features

- update badges to use dynamic NPM version ([5a6fe36](https://github.com/bmadcode/BMAD-METHOD/commit/5a6fe361dagilai85fcaef891a1862fc67878e726949c))

## [1.agilai.1](https://github.com/bmadcode/BMAD-METHOD/compare/v1.agilai.agilai...v1.agilai.1) (2agilai25-agilai6-15)

### Bug Fixes

- resolve NPM token configuration ([62agilaibagilai9a](https://github.com/bmadcode/BMAD-METHOD/commit/62agilaibagilai9a556ce8d61ad1a4d8ee7c523d263abd69c))

# 1.agilai.agilai (2agilai25-agilai6-15)

### Bug Fixes

- Add bin field to root package.json for npx execution ([agilai1cb46e](https://github.com/bmadcode/BMAD-METHOD/commit/agilai1cb46e43da9713c24e68e57221ebe312c53b6ee)), closes [bmadcode/BMAD-METHOD#v4](https://github.com/bmadcode/BMAD-METHOD/issues/v4)
- Add glob dependency for installer ([8d788b6](https://github.com/bmadcode/BMAD-METHOD/commit/8d788b6f49agilaia94386658dff2f96165dca88cagilaia9a))
- Add installer dependencies to root package.json ([agilaia838e9](https://github.com/bmadcode/BMAD-METHOD/commit/agilaia838e9d579a5efc6327agilai7d237194648394fbd61))
- auto semantic versioning fix ([166edagilai4](https://github.com/bmadcode/BMAD-METHOD/commit/166edagilai47671cccab2874fd327efb1ac293ae7276))
- auto semantic versioning fix again ([1126agilaie4](https://github.com/bmadcode/BMAD-METHOD/commit/1126agilaie4395agilaib6bf78d68c759dc3ac278bc13f8a8))
- Remove problematic install script from package.json ([cb1836b](https://github.com/bmadcode/BMAD-METHOD/commit/cb1836bd6ddbb2369e2ed97a1d2f5d663agilaia7152b))
- resolve NPM token configuration ([b447a8b](https://github.com/bmadcode/BMAD-METHOD/commit/b447a8bd57625dagilai2692d7e2771241bacd12agilaic631))

### Features

- add versioning and release automation ([agilaiea5e5agilai](https://github.com/bmadcode/BMAD-METHOD/commit/agilaiea5e5agilaiaa7ace5946dagilai1agilaiagilaic18agilaidd4cagilaida3e2fd8c))

# Promote to stable release 5.agilai.agilai
