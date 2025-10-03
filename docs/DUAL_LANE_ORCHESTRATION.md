# Dual-Lane Orchestration Guide

## Overview

BMAD-invisible features **intelligent dual-lane routing** that automatically selects between two development approaches based on task complexity:

- **Quick Lane**: Template-based generation for small, focused tasks
- **Complex Lane**: Full BMAD multi-agent workflow for substantial features

**Key Innovation**: Both lanes write to the same `docs/` folder structure. The only difference is _how_ artifacts are generated - users never need to know which lane was used.

## Architecture

```
User Request
     ↓
[Lane Selector]
     ↓
  ┌──┴───┐
  ↓      ↓
Quick  Complex
Lane    Lane
  ↓      ↓
  └──┬───┘
     ↓
  docs/
```

### How It Works

1. **Lane Selection** - Analyzes user request for keywords, scope, length, and context
2. **Automatic Routing** - Routes to Quick or Complex lane based on confidence score
3. **Unified Output** - Both lanes generate `docs/prd.md`, `docs/architecture.md`, `docs/stories/*.md`
4. **Invisible Process** - User only sees results, not methodology

## Lane Comparison

| Aspect           | Quick Lane                                             | Complex Lane                         |
| ---------------- | ------------------------------------------------------ | ------------------------------------ |
| **Generation**   | Template-based prompts                                 | Multi-agent BMAD workflow            |
| **Speed**        | ~2-3 minutes                                           | ~10-15 minutes                       |
| **Best For**     | Typos, config changes, small fixes                     | Features, architecture, integrations |
| **Artifacts**    | `docs/prd.md`, `docs/architecture.md`, `docs/stories/` | Same - `docs/` folder                |
| **Dependencies** | None (built-in templates)                              | BMAD core agents                     |

## Lane Selection Logic

### Automatic Classification Factors

The lane selector (`lib/lane-selector.js`) analyzes:

1. **Quick Lane Keywords** (score +3 each)
   - typo, fix typo, spelling
   - add flag, add option, add config
   - toggle, enable, disable
   - remove console, comment
   - rename variable, fix import
   - quick fix, minor fix, small bugfix

2. **Complex Lane Keywords** (score +3 each)
   - new feature, add feature, implement
   - build, create system
   - architecture, refactor, redesign
   - integrate, authentication, authorization
   - database, api, security
   - multi-component, cross-cutting
   - performance, scalability

3. **Scope Indicators**
   - Single file mention (+2 quick)
   - Multiple files / "across" / "throughout" (+3 complex)

4. **Message Characteristics**
   - Short message (<100 chars) + action words (+2 quick)
   - Long message (>200 chars) (+1 complex)
   - Question marks (+1 complex)

5. **Context Factors**
   - Already in complex workflow (+3 complex)
   - Existing PRD exists (+3 complex)
   - High project complexity (+3 complex)

### V6 Scale Level Translation

BMAD V6 introduces scale-adaptive levels (0-4). The invisible lane selector mirrors that logic by
deriving a **scale score** for every request:

| Level | Description                              | Typical Signals                                                                 | Lane Bias      |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------- | -------------- |
| 0     | Micro fixes / localized edits            | Quick-fix keywords, single-file scope, short requests                           | Strong Quick   |
| 1     | Small enhancements                       | Default baseline when no strong signals exist                                   | Mild Quick     |
| 2     | Medium features / integrations           | Integration keywords, cross-service work, moderate complex indicators           | Lean Complex   |
| 3     | Platform work / multi-component programs | Architecture or platform overhaul language, multi-file scope, long requirements | Strong Complex |
| 4     | Enterprise-wide transformations          | Enterprise/multi-region/compliance terminology, enterprise context flags        | Force Complex  |

The scale score is included in the decision output (`result.scale`) along with rationale signals.
Each level provides an additive bonus to either the quick or complex lane scores, ensuring routing
aligns with V6 expectations while preserving invisible orchestration.

### Decision Examples

| User Request                     | Lane    | Confidence | Rationale                          |
| -------------------------------- | ------- | ---------- | ---------------------------------- |
| "Fix typo in README"             | Quick   | 0.92       | Quick fix keywords, short message  |
| "Add verbose flag to CLI"        | Quick   | 0.85       | Small change, single concern       |
| "Build OAuth2 authentication"    | Complex | 0.95       | Complex feature, security-critical |
| "Redesign database architecture" | Complex | 0.90       | Cross-cutting, architectural       |
| "Remove console logs"            | Quick   | 0.88       | Simple cleanup task                |
| "How should we implement auth?"  | Complex | 0.85       | Question requiring analysis        |

### Manual Override

Users can force a specific lane via context:

```javascript
selectLane(userMessage, {
  forceLane: 'complex', // or 'quick'
});
```

## Quick Lane Implementation

### Template-Based Generation

The Quick lane uses three templates derived from GitHub's Spec Kit methodology:

#### 1. Spec Template (`lib/spec-kit-templates/spec-template.md`)

Generates the product requirements document with:

- Overview and goals
- User stories
- Requirements
- Acceptance criteria
- Dependencies

**Input**: User request
**Output**: `docs/prd.md`

#### 2. Plan Template (`lib/spec-kit-templates/plan-template.md`)

Generates technical implementation plan with:

- Technical approach
- Architecture decisions
- File changes required
- Implementation phases
- Risk assessment

**Input**: Generated spec
**Output**: `docs/architecture.md`

#### 3. Tasks Template (`lib/spec-kit-templates/tasks-template.md`)

Breaks down plan into actionable stories:

- Story breakdown
- Task checklists
- Acceptance criteria per story
- Estimated effort

**Input**: Generated plan
**Output**: `docs/stories/*.md`

### Quick Lane Workflow

```javascript
// lib/quick-lane.js execution flow

1. Load spec template
2. Insert user request into template
3. Send to LLM → receive spec
4. Write to docs/prd.md

5. Load plan template
6. Insert spec into template
7. Send to LLM → receive plan
8. Write to docs/architecture.md

9. Load tasks template
10. Insert plan into template
11. Send to LLM → receive tasks
12. Write to docs/stories/story-*.md
```

**No external dependencies** - uses BMAD's existing LLM client.

## Complex Lane Implementation

### Multi-Agent Workflow

The Complex lane runs full BMAD methodology:

1. **Analyst** → Requirements gathering
2. **PM** → PRD generation
3. **Architect** → Technical design
4. **Scrum Master** → Story breakdown
5. **Developer** → Implementation guidance
6. **QA** → Testing and validation

### Complex Lane Workflow

```javascript
// Full BMAD workflow execution

1. Phase: Analyst
   - Gather requirements through conversation
   - Output: docs/brief.md

2. Phase: PM
   - Create comprehensive PRD
   - Output: docs/prd.md

3. Phase: Architect
   - Design technical architecture
   - Output: docs/architecture.md

4. Phase: Scrum Master
   - Break into epics and stories
   - Output: docs/epics/*, docs/stories/*

// Continues through all phases...
```

## MCP Integration

### Single Unified Tool

The MCP server exposes one primary orchestration tool:

#### `execute_workflow`

Intelligently routes user requests through appropriate lane.

**Input:**

```json
{
  "userRequest": "Add authentication to the app",
  "context": {
    "projectPath": "/path/to/project",
    "forceLane": null // Optional: "quick" or "complex"
  }
}
```

**Process:**

```javascript
1. Call lane selector
2. If quick lane:
   - Execute template-based generation
   - Write to docs/
3. If complex lane:
   - Execute BMAD workflow
   - Write to docs/
4. Return summary of generated artifacts
```

**Output:**

```json
{
  "success": true,
  "lane": "complex",
  "confidence": 0.95,
  "artifacts": [
    "docs/prd.md",
    "docs/architecture.md",
    "docs/stories/story-1-auth-login.md",
    "docs/stories/story-2-auth-signup.md"
  ],
  "message": "Generated PRD, architecture, and 2 stories using Complex lane"
}
```

## File Structure

### Unified Output

Both lanes create identical file structures:

```
my-project/
├── docs/
│   ├── prd.md                  # Product requirements
│   ├── architecture.md         # Technical design
│   ├── epics/                  # (Complex lane may add this)
│   │   └── epic-1-auth.md
│   └── stories/                # Development stories
│       ├── story-1-login.md
│       └── story-2-signup.md
└── .bmad-invisible/
    ├── state.json              # Project state
    ├── conversation.json       # Chat history
    ├── deliverables.json       # Generated artifacts
    └── decisions.jsonl         # Lane routing log
```

### Decision Logging

Every lane decision is logged in `.bmad-invisible/decisions.jsonl`:

```jsonl
{"timestamp":"2025-10-01T20:00:00Z","userMessage":"Fix typo in README","lane":"quick","confidence":0.92,"rationale":"Quick lane: quick fix keywords, short message","scores":{"quick":7,"complex":1}}
{"timestamp":"2025-10-01T20:15:00Z","userMessage":"Build authentication system","lane":"complex","confidence":0.95,"rationale":"Complex lane: complex feature indicators","scores":{"quick":1,"complex":12}}
```

## Usage Patterns

### Pattern 1: Quick Fix

**User:** "Fix typo in error message"

**System:**

1. Lane selector → Quick lane (0.92 confidence)
2. Generate spec from template
3. Generate plan from spec
4. Generate tasks from plan
5. Write all to `docs/`

**Result:**

- `docs/prd.md` - Brief spec for the fix
- `docs/architecture.md` - File to modify, approach
- `docs/stories/story-1-fix-typo.md` - Checklist

**Time:** ~2 minutes

---

### Pattern 2: Complex Feature

**User:** "Add OAuth2 authentication with role-based access control"

**System:**

1. Lane selector → Complex lane (0.95 confidence)
2. Analyst phase - gather requirements
3. PM phase - comprehensive PRD
4. Architect phase - design auth system
5. SM phase - break into stories
6. Write all to `docs/`

**Result:**

- `docs/prd.md` - Full product requirements
- `docs/architecture.md` - Complete system design
- `docs/stories/` - Multiple detailed stories

**Time:** ~15 minutes

---

### Pattern 3: Ambiguous Request

**User:** "Improve the login flow"

**System:**

1. Lane selector analyzes
2. Moderate confidence (0.65)
3. Defaults to Complex lane for safety
4. Can ask user for clarification if needed

---

## Best Practices

### When Quick Lane Is Ideal

✅ **Use Quick Lane for:**

- Typo corrections
- Configuration changes
- Flag/option additions
- Small bug fixes
- Single-file modifications
- Cosmetic improvements
- Documentation updates

### When Complex Lane Is Ideal

✅ **Use Complex Lane for:**

- New feature development
- Architectural changes
- Multi-component work
- Security-critical features
- Database schema design
- API integrations
- Performance optimization

### Trust the Selector

The lane selector has been tuned with 36+ test cases covering edge cases, mixed signals, and real-world scenarios. Trust its decision unless you have specific reason to override.

## Troubleshooting

### Issue: Lane selection seems wrong

**Check decision log:**

```bash
cat .bmad-invisible/decisions.jsonl | tail -1 | jq
```

**Manual override in code:**

```javascript
const decision = selectLane(userMessage, {
  forceLane: 'complex',
});
```

### Issue: Quick lane artifacts too basic

**Solution:** Quick lane is optimized for speed. For detailed artifacts, use Complex lane or manually enhance the templates in `lib/spec-kit-templates/`.

### Issue: Complex lane too slow for simple tasks

**Solution:** Add keywords to `QUICK_FIX_KEYWORDS` in `lib/lane-selector.js` to improve future routing.

## Testing

Lane selector is thoroughly tested in `test/lane-selector.test.js`:

```bash
npm test
```

**Test coverage:**

- Quick fix keyword detection
- Complex feature detection
- Scope analysis (single vs multi-file)
- Message length heuristics
- Context-based factors
- Manual overrides
- Edge cases and mixed signals
- Confidence scoring

All 36 tests passing ensures reliable routing.

## Technical Details

### No External Dependencies

Unlike CLI-based approaches, this implementation:

- ✅ No spec-kit CLI required
- ✅ No Python/uv dependencies
- ✅ Pure Node.js implementation
- ✅ Uses BMAD's existing LLM client
- ✅ Self-contained templates

### Performance Characteristics

**Quick Lane:**

- Template loading: ~10ms
- LLM calls: 3 (spec, plan, tasks)
- Total time: ~2-3 minutes
- Token usage: ~2,000-5,000 tokens

**Complex Lane:**

- Agent initialization: ~50ms
- LLM calls: 8-12 (depending on phases)
- Total time: ~10-15 minutes
- Token usage: ~10,000-30,000 tokens

### Confidence Thresholds

```javascript
// lib/lane-selector.js

if (quickScore > complexScore * 1.5) {
  // Strong quick lane signal
  confidence = min(quickScore / total, 0.95);
  lane = 'quick';
} else if (complexScore > quickScore) {
  // Complex lane signal
  confidence = min(complexScore / total, 0.95);
  lane = 'complex';
} else {
  // Unclear - default to quick for efficiency
  confidence = 0.6;
  lane = 'quick';
}
```

Maximum confidence capped at 0.95 to acknowledge uncertainty.

## Future Enhancements

Potential improvements:

1. **Machine Learning** - Train on historical decisions for improved accuracy
2. **User Feedback Loop** - Learn from user corrections/overrides
3. **Project Context** - Factor in codebase size, language, team preferences
4. **Custom Templates** - Allow project-specific quick lane templates
5. **Hybrid Mode** - Start with quick lane, escalate to complex if needed

## FAQ

**Q: Does this replace BMAD?**
A: No, it enhances BMAD by adding a fast track for simple tasks while keeping the full framework for complex work.

**Q: Are quick lane artifacts inferior?**
A: They're optimized for speed and simplicity. For comprehensive documentation, complex lane is better.

**Q: Can I customize the lane selector?**
A: Yes, modify `lib/lane-selector.js` to adjust keywords, scores, or thresholds.

**Q: What if I disagree with lane selection?**
A: Use manual override or adjust lane selector rules. Decision log helps identify patterns.

**Q: Do both lanes cost the same in LLM tokens?**
A: No. Quick lane uses ~60% fewer tokens due to simpler prompts and fewer iterations.

## References

- **BMAD Method**: https://github.com/bmadcode/bmad-method
- **GitHub Spec Kit** (inspiration): https://github.com/github/spec-kit
- **Lane Selector Tests**: `test/lane-selector.test.js`
- **Quick Lane Implementation**: `lib/quick-lane.js`
- **Templates**: `lib/spec-kit-templates/*.md`

---

**Version:** 1.2.0
**Last Updated:** 2025-10-01
**Status:** ✅ Fully Implemented
