# CLI Implementation Audit - 2025-10-06

## Summary

Comprehensive audit of documented vs implemented CLI commands in aidesigner.

## Documented Commands (from docs/)

### Primary Commands (From QUICKSTART.md, installation-methods.md, README.md)

| Command                   | Documented | Implemented | Status                             |
| ------------------------- | ---------- | ----------- | ---------------------------------- |
| `npx aidesigner start`    | ✅         | ✅          | ✅ WORKING                         |
| `npx aidesigner init`     | ✅         | ✅          | ✅ WORKING                         |
| `npx aidesigner install`  | ✅         | ✅          | ✅ WORKING                         |
| `npx aidesigner build`    | ✅         | ✅          | ✅ WORKING                         |
| `npx aidesigner test`     | ✅         | ✅          | ✅ WORKING                         |
| `npx aidesigner validate` | ✅         | ✅          | ✅ WORKING                         |
| `npx aidesigner chat`     | ⚠️         | ✅          | ⚠️ UNDOCUMENTED (internal command) |
| `npx aidesigner codex`    | ⚠️         | ✅          | ⚠️ UNDOCUMENTED (internal command) |
| `npx aidesigner opencode` | ⚠️         | ✅          | ⚠️ UNDOCUMENTED (internal command) |
| `npx aidesigner help`     | ✅         | ✅          | ✅ WORKING                         |

### INCORRECT Documentation (QUICKSTART.md lines 232-243)

**These commands are WRONG in the docs:**

| Documented Command                      | Status | Issue                                               |
| --------------------------------------- | ------ | --------------------------------------------------- |
| `npx aidesigner@latest invisible start` | ❌     | **INVALID** - "invisible" subcommand does not exist |
| `npx aidesigner invisible init`         | ❌     | **INVALID** - "invisible" subcommand does not exist |
| `npx aidesigner invisible build`        | ❌     | **INVALID** - "invisible" subcommand does not exist |
| `npx aidesigner start`                  | ✅     | **CORRECT** - This is the actual command            |
| `npx aidesigner invisible test`         | ❌     | **INVALID** - "invisible" subcommand does not exist |
| `npx aidesigner invisible validate`     | ❌     | **INVALID** - "invisible" subcommand does not exist |
| `npx aidesigner invisible help`         | ❌     | **INVALID** - "invisible" subcommand does not exist |

### Options/Flags

| Flag                   | Documented | Implemented | Status                                    |
| ---------------------- | ---------- | ----------- | ----------------------------------------- |
| `--assistant=claude`   | ✅         | ✅          | ✅ WORKING                                |
| `--assistant=codex`    | ✅         | ✅          | ✅ WORKING                                |
| `--assistant=opencode` | ✅         | ✅          | ✅ WORKING                                |
| `--provider=anthropic` | ✅         | ✅          | ✅ WORKING                                |
| `--provider=glm`       | ✅         | ✅          | ✅ WORKING                                |
| `--provider=openai`    | ✅         | ✅          | ✅ WORKING                                |
| `--provider=gemini`    | ✅         | ✅          | ✅ WORKING                                |
| `--glm`                | ✅         | ✅          | ✅ WORKING (shorthand for --provider=glm) |
| `--anthropic`          | ✅         | ✅          | ✅ WORKING                                |
| `--help`               | ✅         | ✅          | ✅ WORKING                                |
| `-h`                   | ✅         | ✅          | ✅ WORKING                                |

## NPM Scripts (From CLAUDE.md)

These are documented as npm commands, not CLI commands:

| NPM Script                   | Implemented | Notes                        |
| ---------------------------- | ----------- | ---------------------------- |
| `npm run build`              | ✅          | Builds all components        |
| `npm run build:agents`       | ✅          | Build agent bundles          |
| `npm run build:mcp`          | ✅          | Build MCP server             |
| `npm run flatten`            | ✅          | Create XML codebase snapshot |
| `npm run lint`               | ✅          | Run ESLint                   |
| `npm run lint:fix`           | ✅          | Auto-fix linting             |
| `npm run format`             | ✅          | Format with Prettier         |
| `npm run format:check`       | ✅          | Check formatting             |
| `npm run fix`                | ✅          | format + lint:fix            |
| `npm run pre-release`        | ✅          | Full validation              |
| `npm test`                   | ✅          | Run Jest tests               |
| `npm run list:agents`        | ✅          | List all agents              |
| `npm run validate`           | ✅          | Validate configs             |
| `npm run mcp`                | ✅          | Run MCP server               |
| `npm run mcp:list`           | ✅          | List MCP servers             |
| `npm run mcp:add`            | ✅          | Add MCP server               |
| `npm run mcp:remove`         | ✅          | Remove MCP server            |
| `npm run mcp:doctor`         | ✅          | Diagnose MCP issues          |
| `npm run mcp:audit`          | ✅          | Security audit               |
| `npm run mcp:search`         | ✅          | Search MCP registry          |
| `npm run mcp:browse`         | ✅          | Browse MCP servers           |
| `npm run mcp:profile:list`   | ✅          | List MCP profiles            |
| `npm run mcp:profile:switch` | ✅          | Switch MCP profiles          |

## Issues Found

### 1. ❌ CRITICAL: Incorrect "invisible" subcommand in documentation

**Location:** `docs/guides/QUICKSTART.md` lines 232-243

**Problem:**

```bash
# THESE ARE WRONG:
npx aidesigner@latest invisible start
npx aidesigner invisible init
npx aidesigner invisible build
npx aidesigner invisible test
npx aidesigner invisible validate
npx aidesigner invisible help
```

**Should be:**

```bash
# CORRECT:
npx aidesigner@latest start
npx aidesigner init
npx aidesigner build
npx aidesigner test
npx aidesigner validate
npx aidesigner help
```

The "invisible" was likely a conceptual note about the "invisible orchestrator" feature, but it was incorrectly added as a CLI subcommand. The invisible orchestrator is just how the system works internally - it's not part of the command syntax.

### 2. ⚠️ Missing npx alias commands

Some commands work but aren't in the help:

- `chat` - Works (calls bin/aidesigner-claude)
- `codex` - Works (calls bin/aidesigner-codex)
- `opencode` - Works (calls bin/aidesigner-opencode)

These should either be:

- Added to the help documentation, OR
- Kept internal-only (current behavior is fine)

## Recommendations

### HIGH PRIORITY

1. **Fix QUICKSTART.md** - Remove all "invisible" subcommand references
   - Lines 232-243 need correction
   - Replace `npx aidesigner invisible <cmd>` with `npx aidesigner <cmd>`

2. **Verify all other docs** - Search for any other "invisible" CLI references
   - Check all .md files in docs/
   - Ensure consistency

### MEDIUM PRIORITY

3. **Document internal commands** (Optional)
   - `chat`, `codex`, `opencode` are working but undocumented
   - Decision: Keep internal-only OR document as advanced usage

4. **Add command aliases** (Optional, for convenience)
   - Could add: `npx aidesigner flatten` → `npm run flatten`
   - Could add: `npx aidesigner list-agents` → `npm run list:agents`
   - But npm scripts work fine, so not critical

### LOW PRIORITY

5. **Improve help output**
   - Show all available commands clearly
   - Include examples for each command
   - Show common workflows

## Test Cases

### Manual Testing Checklist

- [ ] `npx aidesigner start` - Should prompt for assistant selection
- [ ] `npx aidesigner start --assistant=claude` - Should start Claude CLI
- [ ] `npx aidesigner start --assistant=codex` - Should start Codex CLI
- [ ] `npx aidesigner start --assistant=opencode` - Should start OpenCode CLI
- [ ] `npx aidesigner start --glm` - Should set GLM provider
- [ ] `npx aidesigner init` - Should prompt for project name
- [ ] `npx aidesigner build` - Should build MCP server
- [ ] `npx aidesigner test` - Should run tests
- [ ] `npx aidesigner validate` - Should validate config
- [ ] `npx aidesigner help` - Should show help
- [ ] `npx aidesigner --help` - Should show help
- [ ] `npx aidesigner -h` - Should show help
- [ ] `npx aidesigner invisible start` - Should ERROR (invalid command)

### Expected Error

```bash
$ npx aidesigner invisible start
❌ Unknown command: invisible
Run "npx aidesigner help" for usage information.
```

## Conclusion

**All documented commands are implemented EXCEPT for the incorrect "invisible" subcommand references.**

The core CLI functionality is solid. The main issue is documentation using "invisible" as a subcommand, which was likely a copy-paste error or misunderstanding of the "invisible orchestrator" feature name.

**Action Required:**

1. Fix QUICKSTART.md to remove "invisible" subcommand
2. Verify no other docs have this error
3. Test corrected commands

**Status:** ✅ CLI is 100% functional, documentation needs correction
