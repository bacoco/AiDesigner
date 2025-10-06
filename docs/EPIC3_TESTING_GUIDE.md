# Epic 3: Chrome MCP Integration - Testing Guide

## Quick Test

To verify the implementation works:

### 1. Start aidesigner with CLI

```bash
npx aidesigner start --assistant=claude
# or
npx aidesigner start --assistant=codex
```

### 2. Test Chrome MCP Availability Check

In your chat:

```
Can you check if Chrome DevTools MCP is available?
```

Expected: The orchestrator will call `check_chrome_mcp_available()` and report status.

### 3. Test Token Extraction (if Chrome MCP installed)

```
Extract design tokens from https://linear.app
```

Expected flow:

1. Calls `check_chrome_mcp_available()` - confirms available
2. Calls `extract_design_tokens_from_url({ url: "https://linear.app" })`
3. LLM receives instructions to use Chrome MCP tools
4. Navigates to URL, extracts styles, parses tokens
5. Calls `store_design_evidence({ sourceUrl: "...", evidence: {...} })`
6. Confirms storage: `docs/ui/chrome-mcp/linear-app-[date].json`

### 4. Verify Evidence Storage

```bash
ls -la docs/ui/chrome-mcp/
cat docs/ui/chrome-mcp/evidence-manifest.json
```

Should show:

- Individual evidence pack JSON files
- Manifest tracking all extractions

### 5. Test UI Prompt Generation with Tokens

```
Generate visual concept prompts for my dashboard screens
```

Expected: Generated prompts in `docs/ui/ui-designer-screen-prompts.md` should include extracted tokens.

## Manual Testing Scenarios

### Scenario 1: Chrome MCP Not Installed

**Setup:** Ensure Chrome MCP is NOT in `.mcp.json`

**Test:**

```
User: "Extract tokens from https://stripe.com"
```

**Expected:**

```
AI: "Chrome DevTools MCP is not installed. You can:
    1. Install it: npm run mcp:install chrome-devtools (then restart chat)
    2. Manually provide color palette and font preferences
    3. I'll use sensible SaaS defaults for now"
```

### Scenario 2: Chrome MCP Installed

**Setup:**

```bash
npm run mcp:install chrome-devtools
# Restart chat session
```

**Test:**

```
User: "Extract design tokens from https://linear.app"
```

**Expected:**

1. Confirms Chrome MCP available
2. Navigates to URL
3. Extracts colors, typography, spacing
4. Stores in `docs/ui/chrome-mcp/linear-app-[date].json`
5. Reports success with token summary

### Scenario 3: Multiple URL Extraction

**Test:**

```
User: "Extract tokens from linear.app and stripe.com"
```

**Expected:**

- Two evidence packs created
- Manifest shows both URLs
- Each with unique filename and timestamp

### Scenario 4: Token Usage in Prompts

**Test:**

1. Extract tokens from a URL
2. Generate UI designer prompts
3. Check `docs/ui/ui-designer-screen-prompts.md`

**Expected:**

- Prompts include CSS variables from evidence
- Color palette matches extracted values
- Typography references extracted fonts

## Automated Test (Future)

Create `.dev/test/chrome-mcp-integration.test.js`:

```javascript
describe('Chrome MCP Integration', () => {
  it('should check Chrome MCP availability', async () => {
    // Test check_chrome_mcp_available tool
  });

  it('should extract tokens from URL', async () => {
    // Test extract_design_tokens_from_url tool
  });

  it('should store evidence correctly', async () => {
    // Test store_design_evidence tool
    // Verify file creation and manifest update
  });

  it('should include tokens in prompts', async () => {
    // Generate prompts after extraction
    // Verify tokens are embedded
  });
});
```

## Known Limitations

1. **Chrome MCP must be installed separately** - Not bundled with aidesigner
2. **LLM must interpret extraction instructions** - Not direct API call
3. **Manual Google AI Studio step** - Prompts copied manually (by design)
4. **No real-time drift detection** - Evidence stored but not auto-compared

## Success Indicators

✅ `check_chrome_mcp_available` returns correct status
✅ `extract_design_tokens_from_url` provides clear instructions
✅ Evidence stored in `docs/ui/chrome-mcp/` with proper structure
✅ Manifest updated correctly
✅ Tokens flow into generated prompts
✅ Graceful fallback when Chrome MCP unavailable

## Troubleshooting

### Issue: Chrome MCP not detected

**Check:**

```bash
cat .mcp.json
# or
cat .claude/mcp-config.json
```

Look for:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"],
      "disabled": false
    }
  }
}
```

**Fix:**

```bash
npm run mcp:install chrome-devtools
# Restart chat
```

### Issue: Tokens not extracted

**Check:**

1. Is Chrome running?
2. Is URL accessible?
3. Did Chrome MCP tools run successfully?

**Debug:**

- Check chat session for Chrome MCP error messages
- Verify Chrome MCP server logs
- Test Chrome MCP directly (outside aidesigner)

### Issue: Evidence not stored

**Check:**

```bash
ls -la docs/ui/chrome-mcp/
```

**Verify:**

- Write permissions on docs/ directory
- No disk space issues
- Evidence object has required fields (sourceUrl, evidence)

### Issue: Tokens not in prompts

**Check:**

- Evidence manifest: `docs/ui/chrome-mcp/evidence-manifest.json`
- Prompt generation reads from correct directory
- Evidence loaded before prompt generation

## Performance Benchmarks

Expected timing (with Chrome MCP installed):

- `check_chrome_mcp_available`: <100ms
- `extract_design_tokens_from_url`: 2-5s (includes navigation)
- `store_design_evidence`: <200ms
- Total token extraction flow: 3-6s

## Security Considerations

✅ Path traversal protection in evidence storage
✅ URL sanitization for filename generation
✅ No arbitrary code execution
✅ Chrome MCP runs in sandbox

⚠️ URL validation needed - add URL allowlist for production
⚠️ Rate limiting needed - prevent abuse of Chrome MCP

## Next Steps After Testing

1. If tests pass: Mark Epic 3 as 100% complete ✅
2. If issues found: Document and create fix tickets
3. Add automated tests to CI pipeline
4. Create user documentation with examples
5. Consider adding `audit_design_consistency` tool (Story 3.3)
