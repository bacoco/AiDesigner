# AiDesigner Troubleshooting Guide

## Common Issues and Solutions

### "Cannot call chat methods without an API key" Error

**Problem:** You're seeing this error when using aidesigner.

**Cause:** You're on an older version (pre-2.0) that incorrectly tried to make independent API calls.

**Solution:**

```bash
npm install aidesigner@latest  # Update to 2.0.0 or later
```

**Why this happened:**

- Versions before 2.0.0 had an architectural flaw where the MCP server tried to make its own LLM API calls
- This required `ANTHROPIC_API_KEY` environment variable
- Version 2.0.0+ correctly uses Claude CLI's existing authentication
- No additional API keys are needed

---

### Empty `docs/` Directories

**This is normal!** Directories are created empty and filled during your conversation with the AI.

**Expected flow:**

1. **Start:** All `docs/` subdirectories are empty
2. **After discovery:** `docs/brief.md` created
3. **After PM phase:** `docs/prd.md` created
4. **After architecture:** `docs/architecture.md` created
5. **After UI design:** `docs/ui/nano-banana-brief.md` created (if frontend project)
6. **After SM phase:** `docs/stories/*.md` created

**Why it works this way:**

- Documents are generated through conversation, not pre-filled templates
- You control what gets created by talking naturally with the AI
- Empty directories show you what's possible, not what's required

---

### "Unknown tool: detect_phase" Error

**Problem:** MCP server crashes with unknown tool error.

**Cause:** You're using an old MCP server build with deprecated tools.

**Solution:**

```bash
# In your aidesigner installation directory
npm run build:mcp  # Rebuild the MCP server
```

Or reinstall fresh:

```bash
npx aidesigner@latest start
```

---

### UI Designer Phase Never Activates

**Problem:** You're building a frontend app but never see visual concept prompts.

**Possible causes:**

1. **Architecture doesn't mention frontend**
   - The AI detects frontend projects by checking `docs/architecture.md` for keywords like "React", "web app", "mobile", "UI"
   - **Solution:** Mention your frontend stack explicitly during the architecture phase

2. **You haven't reached architecture phase yet**
   - UI Designer activates **after** architecture is complete
   - **Solution:** Complete PRD and architecture phases first

3. **You skipped asking for it**
   - The AI asks: "Would you like to explore visual concepts?"
   - **Solution:** Answer "yes" when prompted, or explicitly request: "Let's design the UI screens"

**Manual activation:**

```
You: "Let's explore visual concepts for my screens"
```

Or directly:

```
You: "Generate Nano Banana prompts for my UI"
```

---

### No Nano Banana Prompts Generated

**Problem:** You expected `docs/ui/nano-banana-brief.md` but it's not there.

**Solution:**

1. **Check if UI Designer phase activated:**

   ```bash
   cat docs/architecture.md | grep -i "react\|vue\|angular\|web\|mobile\|frontend"
   ```

   If no match, your project wasn't detected as frontend.

2. **Manually request prompt generation:**

   ```
   You: "Generate Nano Banana visual concept prompts for my app"
   ```

3. **Check file was created:**
   ```bash
   ls docs/ui/
   ```
   Should show `nano-banana-brief.md`

---

### Chrome MCP Not Extracting Design Tokens

**Problem:** AI offers to extract design tokens but it fails.

**Possible causes:**

1. **Chrome DevTools MCP not installed**

   ```bash
   # Check installed MCP servers
   cat .mcp.json
   ```

   Should include `chrome-devtools` server.

   **Solution:**

   ```bash
   npm install -D chrome-devtools-mcp
   # Or let the AI install it
   You: "Install Chrome DevTools MCP integration"
   ```

2. **Chrome not running**
   - Chrome DevTools MCP requires Chrome to be running
   - **Solution:** Launch Chrome before requesting token extraction

3. **URL unreachable**
   - Some sites block automated access
   - **Solution:** Use a different reference URL or extract tokens manually

---

### MCP Server Fails to Start

**Problem:** Error when running `npx aidesigner@latest start`

**Common causes:**

1. **Node version too old**

   ```bash
   node --version  # Must be >= 20.10.0
   ```

   **Solution:** Update Node.js

2. **npm not installed**

   ```bash
   npm --version  # Must be >= 9.0.0
   ```

   **Solution:** Install/update npm

3. **Claude CLI not installed**

   ```bash
   claude --version
   ```

   **Solution:** Install Claude CLI from https://claude.ai/code

4. **Corrupted build**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build:mcp
   ```

---

### "Phase Transition Failed" Errors

**Problem:** AI seems stuck in one phase or transitions incorrectly.

**Cause:** Heuristic phase detection may not recognize your intent.

**Solution:**

1. **Be explicit about what you want:**

   ```
   Instead of: "What next?"
   Say: "Let's create the technical architecture now"
   ```

2. **Use phase-specific keywords:**
   - "requirements", "features" → PM phase
   - "technical", "architecture" → Architect phase
   - "design", "screens", "UI" → UX/UI phase
   - "stories", "tasks" → SM phase
   - "implement", "code" → Dev phase

3. **Force a specific phase:**
   ```
   You: "I want to work on the architecture now"
   ```

---

### Files Created in Wrong Directory

**Problem:** Documents appear in unexpected locations.

**Check project root:**

```bash
# Aidesigner uses current working directory as project root
pwd  # Should show your intended project directory
```

**Solution:**

```bash
cd /path/to/your/project
npx aidesigner@latest start
```

---

### Performance Issues / Slow Responses

**Common causes:**

1. **Large conversation history**
   - Phase detection processes full conversation
   - **Solution:** Start fresh sessions for new features

2. **Complex file operations**
   - Reading many large files
   - **Solution:** Keep `docs/` organized and avoid huge files

3. **Network latency (Claude CLI)**
   - Claude CLI API calls
   - **Solution:** Check internet connection

---

### Need More Help?

**Check documentation:**

- [Quick Start Guide](guides/QUICKSTART.md)
- [Examples](examples.md)
- [Configuration](configuration.md)
- [MCP Management](mcp-management.md)

**Community:**

- GitHub Issues: https://github.com/bacoco/aidesigner/issues
- Discord: https://discord.gg/aidesigner

**Report a bug:**

```bash
# Include this information:
node --version
npm --version
claude --version
cat package.json | grep aidesigner
# Plus error message and steps to reproduce
```

---

## Version-Specific Notes

### Upgrading from 1.x to 2.x

**Breaking changes:**

- `detect_phase` tool removed (replaced with heuristic detection)
- `runAgent()` API calls removed (no more `ANTHROPIC_API_KEY` needed)
- Phase detection now happens client-side in invisible-orchestrator

**Migration:**

1. Update to 2.x: `npm install aidesigner@latest`
2. Rebuild MCP: `npm run build:mcp`
3. No configuration changes needed
4. Existing projects continue to work

**Benefits:**

- ✅ No API keys required
- ✅ Faster phase detection
- ✅ Better privacy (no extra API calls)
- ✅ Simpler architecture

---

_Last updated: Version 2.0.0_
