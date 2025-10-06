---
id: refine-ui-iteration
title: Refine UI Design Iteration
phase: ui-discovery
elicit: true
---

# Refine UI Design Iteration

## Purpose

Guide iterative refinement of UI concepts based on Gemini outputs and user feedback. This task enables a conversational loop where designs are progressively improved until validated.

## Prerequisites

- Initial prompts generated (generate-ui-designer-prompt.md completed)
- User has generated concepts in Google AI Studio
- User has feedback on the concepts

## Workflow

### Step 0: Choose Automation Method (New!)

**Ask user:**

"Would you like to automate the Gemini concept generation?

**Option A: Automated (Recommended)** 🚀

- I'll use Chrome MCP to open Google AI Studio, submit the prompt, and capture results automatically
- Requires: chrome-devtools-mcp installed and Google account logged in to AI Studio
- Fast and convenient!

**Option B: Manual**

- You'll copy the prompt, go to Google AI Studio yourself, and share results back
- Works if Chrome MCP unavailable or you prefer manual control

Which would you prefer? (A/B)"

**If Option A (Automated):**

**Check Chrome MCP availability:**

1. Verify chrome-devtools-mcp is configured in .mcp.json or .claude/mcp-config.json
2. If not available, notify user and fallback to Option B

**Execute Automation:**

Call `automate_gemini_concepts` MCP tool with:

```javascript
{
  prompt: "[The complete UI designer prompt from docs/ui/ui-designer-screen-prompts.md]",
  iterationNumber: N,
  modelPreference: "auto" // or user preference
}
```

**The tool will:**

1. Open https://aistudio.google.com/ in Chrome
2. Navigate to create new chat
3. Select appropriate Gemini model (Flash)
4. Fill and submit the prompt
5. Wait for concept generation (up to 60 seconds)
6. Capture screenshot of results
7. Extract image URLs
8. Save to `docs/ui/iterations/iteration-N-gemini-output.png`

**After automation completes:**

Show user the generated concepts and proceed to Step 2 (Analyze Concepts).

**If automation fails:**

Provide manual fallback instructions (Option B).

**If Option B (Manual):**

Continue with existing manual workflow below.

---

### Step 1: Collect Gemini Outputs

**Elicit from user:**

"Please share the Gemini-generated concepts. You can:

- Paste image URLs (if hosted)
- Describe the visual concepts
- Share screenshot file paths

How many concepts did Gemini generate? (Usually 3-4 per screen)"

**Store response:**

- `imageUrls`: Array of image URLs or paths
- `conceptCount`: Number of concepts generated
- `conceptDescriptions`: User's descriptions of each concept

**Current iteration number:**
Determine current iteration (check design-iterations.json or start at 1)

### Step 2: Analyze Concepts

**If images provided:**

Execute: Call `analyze_gemini_concepts` MCP tool with:

```javascript
{
  imageUrls: [...],
  userFeedback: "Initial impressions",
  iterationNumber: N
}
```

**If descriptions only:**

Ask user to describe for each concept:

- **Color palette**: Dominant colors used
- **Layout style**: Dense, spacious, card-based, grid, etc.
- **Navigation pattern**: Top nav, sidebar, bottom nav, hamburger
- **Component style**: Rounded, sharp, shadowed, flat
- **Overall feeling**: Modern, classic, playful, professional

**Present analysis:**

"I've analyzed the concepts:

**Concept 1:**

- Colors: [palette]
- Layout: [style]
- Navigation: [type]
- Feeling: [adjectives]

**Concept 2:**
[...]

**Concept 3:**
[...]

Which concept is closest to your vision? Or would you like to mix elements from different concepts?"

**Store response:**

- `preferredConcept`: Concept ID or "mixed"
- `mixedElements`: If mixing, which elements from which concepts

### Step 3: Elicit Refinements

**Ask:**

"Based on your preferred direction, what should we:

**1. KEEP** (elements you like):
Examples:

- Generous spacing from Concept 2
- Color palette from Concept 1
- Navigation style from Concept 3

**2. AVOID** (elements to remove):
Examples:

- Dense header from Concept 1
- Too many navigation items
- Overly complex layouts

**3. ADJUST** (things to change):
Examples:

- Make green palette more subtle
- Increase all spacing by 50%
- Simplify navigation to 4 main items
- Add more visual hierarchy

Be as specific as possible! The more detail you provide, the better the next iteration will be."

**Store response:**

- `keepElements`: Array of elements to keep
- `avoidElements`: Array of elements to avoid
- `adjustments`: Detailed adjustment instructions

**Validate input:**

- Ensure at least 1 keep element
- Ensure at least 1 avoid or adjustment
- If unclear, ask for clarification

### Step 4: Refine Prompts

**Execute:**

Call `refine_design_prompts` MCP tool with:

```javascript
{
  iterationNumber: N,
  keepElements: [...],
  avoidElements: [...],
  adjustments: "..."
}
```

**Confirm to user:**

"✅ Prompts refined for Iteration [N]!

**Changes made:**

- Keep: [list keep elements]
- Avoid: [list avoid elements]
- Adjustments: [summarize adjustments]

**Updated files:**

- `docs/ui/ui-designer-screen-prompts.md` (current version)
- `docs/ui/iterations/iteration-[N]-prompts.md` (history)

**Next steps:**

**Option A (Automated):**
"Would you like me to automatically generate the next iteration concepts using Chrome MCP? (Yes/No)"

If Yes:

- Execute `automate_gemini_concepts` with refined prompts
- Capture results automatically
- Proceed to Step 6 with new concepts

**Option B (Manual):**

1. Copy the updated prompts from `ui-designer-screen-prompts.md`
2. Paste into Google AI Studio (Gemini 2.5 Flash)
3. Generate new concepts
4. Return here with results!"

### Step 5: Store Iteration

**Execute:**

Call `store_ui_iteration` MCP tool with:

```javascript
{
  iterationNumber: N,
  promptsUsed: "docs/ui/ui-designer-screen-prompts.md",
  geminiOutputs: [...] (if provided),
  userFeedback: "User's feedback summary",
  refinements: [keepElements + avoidElements + adjustments],
  status: "in_progress"
}
```

**Notify user:**

"✅ Iteration [N] saved to history.

You can view all iterations in `docs/ui/design-iterations.json`"

### Step 6: Repeat or Validate

**Ask:**

"How did the new iteration turn out?

- 👍 **Perfect!** → Lock this design and make it available to other agents
- 🔧 **Better but needs tweaks** → Continue refining (back to Step 1)
- 👎 **Not working** → Try a different direction or start over"

**If Perfect (Validated):**

Execute:

```javascript
// Update iteration status to validated
store_ui_iteration({
  ...previousIteration,
  status: 'validated',
});
```

Notify:
"✅ Design validated and locked!

**Final Design:** Iteration [N], Concept [X]

**Stored:**

- ✅ Full iteration history in `docs/ui/design-iterations.json`
- ✅ Project state decision: `visual_concept`
- ✅ Available to other agents via `get_ui_context`

**What happens next:**

- **Architect** will reference your CSS tokens when proposing tech stack
- **UX Expert** will use your journey map for frontend specs
- **PM** will include design context in PRD

Would you like to continue with another phase (e.g., architecture, PRD)?

**If Better but needs tweaks:**

"Let's continue refining! What do you want to adjust this time?"

→ Go back to Step 3 (increment iteration number)

**If Not working:**

"No problem! We have a few options:

1. **Try a different reference** - Share a new inspiration URL
2. **Adjust the journey** - Maybe we need to rethink the flow
3. **Start fresh** - Begin discovery again with new direction

What would you like to do?"

→ Offer to run `discover-ui-journey` again or try new reference

## Output Files

### Primary

- `docs/ui/ui-designer-screen-prompts.md` - Current version (updated each iteration)
- `docs/ui/design-iterations.json` - Complete history

### History (Per Iteration)

- `docs/ui/iterations/iteration-[N]-prompts.md` - Prompts used
- `docs/ui/iterations/iteration-[N]-analysis.json` - Analysis data
- `docs/ui/iterations/iteration-[N]-concept-[X].png` - Generated images (if saved)

### Project State Decisions

- `ui_iteration_[N]` - Each iteration record
- `visual_concept` - Final validated concept (when validated)

## Notes

### Iteration Best Practices

**Keep Elements:**

- Be specific: "Generous 32px padding between sections" not just "spacing"
- Reference concept IDs: "Card shadows from Concept 2"
- Visual attributes: "Soft rounded corners (8px radius)"

**Avoid Elements:**

- Explain why: "Dense header - too many nav items confuse users"
- Be constructive: "Avoid X because Y, prefer Z instead"

**Adjustments:**

- Quantify when possible: "Increase spacing by 50%" not "more spacing"
- Provide comparisons: "Make green more subtle like Concept 3 but keep saturation above 40%"
- Consider hierarchy: "Primary CTA should be most prominent, secondary actions subdued"

### Handling Mixed Preferences

If user wants to mix elements:

- Ask which concept is the base (majority of style)
- List specific elements from other concepts to incorporate
- Check for conflicts (e.g., "Concept 1 uses top nav, Concept 2 uses sidebar - which do you prefer?")

### Maximum Iterations

While there's no hard limit, typical journeys:

- **1-2 iterations**: User has clear vision, minor tweaks only
- **3-4 iterations**: Exploratory, finding the right direction
- **5+ iterations**: May indicate unclear requirements - consider re-running `discover-ui-journey`

If > 5 iterations:
"We've done [N] iterations. Would it help to step back and revisit the journey discovery? Sometimes starting fresh with clearer direction is faster than iterating."

## Integration with Other Agents

Once validated (status="validated"), the design context becomes available:

**Architect:**

```
Before designing architecture, Architect calls get_ui_context.
If hasDesignContext, references cssTokens for recommending CSS framework.
```

**UX Expert:**

```
Uses uiJourney as base for frontend spec.
References visualConcept for component design guidance.
```

**PM:**

```
Includes design context in PRD under "UI Design Reference" section.
```

All agents can call `get_ui_context` to retrieve:

- CSS tokens (colors, typography, spacing)
- UI journey steps
- Validated visual concept
- Complete iteration history

---

**Version**: 1.0.0
**Last Updated**: 2025-10-06
**Status**: ✅ Production Ready
