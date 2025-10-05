# Using Google Nano Banana for Visual Concept Exploration

## Overview

Google Nano Banana (Gemini 2.5 Flash Image) is a multimodal AI model optimized for visual content generation. aidesigner integrates Nano Banana into both Quick Lane and Complex Lane workflows to help teams explore multiple visual directions before committing to implementation.

### Why Visual Concept Exploration Matters

- **Accelerates Alignment**: See 3-4 visual directions in minutes instead of days
- **Reduces Rework**: Identify design direction misalignment early
- **Captures Intent**: Documents visual decisions for architecture and development
- **Empowers Choice**: Stakeholders pick from real options, not abstract descriptions

### How aidesigner Integrates Nano Banana

**Quick Lane**: Automatically generates `docs/ui/nano-banana-brief.md` with ready-to-use prompt
**Complex Lane**: Optional Nano Banana Liaison agent (`@nano-banana-liaison`) orchestrates prompt creation and selection logging

Both lanes treat Nano Banana artifacts as **first-class shared outputs** alongside PRD, architecture, and stories.

---

## Quick Lane Workflow

### Step 1: Generate Quick Lane Specs

Run Quick Lane as normal:

```bash
npx aidesigner@latest start
# Or in your aidesigner chat session
"I want to build a task management app for remote teams"
```

Quick Lane generates:

- `docs/prd.md`
- `docs/architecture.md`
- `docs/stories/*.md`
- **`docs/ui/nano-banana-brief.md`** ← New!

### Step 2: Open the Nano Banana Brief

```bash
cat docs/ui/nano-banana-brief.md
```

The brief contains:

1. Project context summary
2. Complete ready-to-copy prompt for Google Nano Banana
3. Usage instructions for Google AI Studio
4. Expected outputs description

### Step 3: Run the Prompt in Google AI Studio

1. Visit https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Create new chat"
4. Ensure model is set to **Gemini 2.5 Flash** (or latest Flash Image model)
5. **Copy the entire prompt** from the brief's code block
6. **Paste into chat** and send

### Step 4: Review Generated Concepts

Nano Banana will generate:

- **3 distinct visual concepts** (each representing a different design direction)
- **4 screens per concept**: Search, Write/Compose, Sign Up, Sign In
- **Differentiator summaries** for each concept

Review for:

- Visual appeal and brand alignment
- Information hierarchy clarity
- Component consistency across screens
- Accessibility (contrast, readability)
- Scalability for future features

### Step 5: Save Your Selected Concept

1. **Screenshot or download** the concept images
2. Save to `docs/ui/concepts/` (create folder if needed)
3. Note which concept you chose and why

### Step 6 (Optional): Log Your Selection

Use the Nano Banana Liaison agent to formally record your decision:

```bash
# In aidesigner chat
@nano-banana-liaison
*log-nano-selection
```

This creates `docs/ui/nano-banana-explorations.md` and records the decision in project state for downstream phases.

---

## Complex Lane Workflow

### Step 1: Run Complex Lane to UX Spec Phase

Start a Complex Lane workflow:

```bash
# In aidesigner chat
"I need a comprehensive specification for a collaborative design tool"
```

The workflow progresses through:

1. Analyst → Project Brief
2. PM → PRD
3. UX Expert → Front-End Spec

### Step 2: Activate Nano Banana Liaison (Optional)

After the UX spec is complete, optionally activate the Nano Banana Liaison:

```bash
@nano-banana-liaison
```

The agent greets you and shows available commands:

```
🍌 Nano Banana Liaison (Nana)
I help create Google Nano Banana visual concept prompts and log your design decisions!

Commands:
*help - Show this help
*generate-nano-brief - Create Nano Banana prompt brief
*log-nano-selection - Record chosen visual concept
*exit - Exit this agent
```

### Step 3: Generate the Prompt Brief

```bash
*generate-nano-brief
```

The agent will:

1. Gather context from your PRD and UX spec
2. Walk you through prompt customization (if needed)
3. Create `docs/ui/nano-banana-brief.md` with the prompt

### Step 4: Run the Prompt in Google AI Studio

Same as Quick Lane steps 3-4 above:

1. Visit https://aistudio.google.com/
2. Copy prompt from `docs/ui/nano-banana-brief.md`
3. Paste into Gemini 2.5 Flash chat
4. Review generated concepts

### Step 5: Log Your Selected Concept

Return to the Nano Banana Liaison:

```bash
*log-nano-selection
```

The agent will ask for:

- **Concept identifier**: Which one did you choose? (e.g., "Concept 2")
- **Concept name**: Give it a memorable name (e.g., "Clean Professional")
- **Visual characteristics**: Colors, typography, layout, style
- **Key differentiators**: Why this concept over others?
- **Asset references**: Where did you save the images?
- **Implementation guidance**: Notes for developers

### Step 6: Selection Logged and Persisted

The agent creates:

- `docs/ui/nano-banana-explorations.md` - Full exploration log with your selection
- Project state decision: `ui_concept` with all visual characteristics

### Step 7: Continue Complex Lane

Exit the Nano Banana Liaison and continue the workflow:

```bash
*exit
```

The next phase (Architect) will reference your selected concept when designing the frontend architecture.

---

## Understanding the Nano Banana Prompt

### Prompt Structure

The canonical Nano Banana prompt includes:

1. **Product Context**: Name, description, primary users
2. **Screen Scenarios**: 4 key user flows (search, write, signup, signin)
3. **Creative Constraints**: Brand palette, typography, illustration style, experience tone
4. **Layout Guidance**: Principles for hierarchy, whitespace, component consistency
5. **Output Instructions**: 4-frame grid per concept, clean backgrounds, differentiator summaries

### Why Four Specific Screens?

The prompt requests these 4 screens for every concept:

1. **Search/Browse**: Tests information density, filtering UI, empty states
2. **Write/Compose**: Tests input patterns, form design, creation flows
3. **Sign Up**: Tests value proposition communication, onboarding UX
4. **Sign In**: Tests trust signals, security emphasis, returning user experience

These four screens provide enough variety to validate:

- Component consistency
- Visual hierarchy
- Brand application
- Responsive layout principles

### Customizing the Prompt

**Quick Lane**: Auto-generated with sensible defaults (modern SaaS aesthetic)
**Complex Lane**: Interactive customization during `*generate-nano-brief`

To customize:

- **Brand colors**: Provide hex codes from your brand guidelines
- **Typography**: Describe font style (modern sans-serif, classic serif, etc.)
- **Illustration style**: Flat, gradient, 3D, minimal, hand-drawn, photographic
- **Experience tone**: Professional, friendly, energetic, calming, trustworthy
- **Layout principles**: Card-based, list-based, grid, asymmetric

---

## Expected Outputs

### What You'll Get from Nano Banana

Each concept includes:

- **4 mobile-first screens** (aspect ratio 4:5 per frame)
- **Consistent visual style** across all screens
- **Labeled screens** (Search, Write, Sign Up, Sign In)
- **Realistic placeholder copy** (not lorem ipsum)
- **Clean backgrounds** (no watermarks)

After generating all concepts, Nano Banana provides:

- **Differentiator summary** for each concept explaining what makes it unique

### Quality Expectations

✅ **Expect**:

- Cohesive color palettes
- Consistent component patterns
- Clear visual hierarchy
- Realistic UI elements (buttons, forms, navigation)
- Distinct aesthetic differences between concepts

❌ **Don't Expect**:

- Pixel-perfect production mockups
- Interactive prototypes
- Fully designed component systems
- Comprehensive design documentation

Nano Banana concepts are **starting points for design discussion**, not final deliverables.

---

## Logging Concept Selections

### Why Log Your Selection?

Recording your chosen concept ensures:

- **Downstream Alignment**: Architecture references visual direction
- **Design Continuity**: Development stories mention selected style
- **Decision History**: Future team members understand why choices were made
- **State Persistence**: Quick Lane and Complex Lane share the same design intent

### What Gets Logged?

The `docs/ui/nano-banana-explorations.md` file includes:

```markdown
## [Concept Name] - [Date]

**Status**: Selected ✅

**Concept Identifier**: Concept 2

### Visual Characteristics

- **Color Palette**: Deep blue #1E3A8A, vibrant orange #F97316, neutral grays
- **Typography**: Modern sans-serif with bold headings
- **Layout**: Card-based with generous whitespace
- **Visual Style**: Flat design with subtle gradients
- **Aesthetic**: Professional, approachable, efficient

### Key Differentiators

1. Clearest information hierarchy among all options
2. Strong brand color application without overwhelming
3. Most accessible contrast ratios for readability

### Asset References

- **Location**: docs/ui/concepts/clean-professional/
- **Files**: search.png, compose.png, signup.png, signin.png

### Implementation Guidance

- Maintain 4.5:1 contrast ratio for all text
- Use consistent 8px spacing grid
- Button hover states should have subtle lift effect
- Mobile navigation uses bottom bar, desktop uses sidebar

### Decision Rationale

Chosen for strongest alignment with brand values (professional yet approachable)
and clearest path to accessible implementation.
```

### Project State Decision

Additionally, the `ui_concept` decision is recorded in `.aidesigner/state.json`:

```json
{
  "decisions": {
    "ui_concept": {
      "value": {
        "conceptName": "Clean Professional",
        "conceptId": "Concept 2",
        "summary": "Modern, accessible design with strong brand alignment",
        "colorPalette": ["#1E3A8A", "#F97316", "#6B7280"],
        "visualStyle": "Flat design with subtle gradients",
        "assetLinks": ["docs/ui/concepts/clean-professional/search.png", ...],
        "keyDifferentiators": ["Clearest hierarchy", "Strong brand colors", "Best contrast"]
      },
      "rationale": "Chosen for brand alignment and accessibility",
      "timestamp": "2025-10-05T...",
      "phase": "ux"
    }
  }
}
```

This allows all downstream agents and Quick Lane templates to reference the selection.

---

## Best Practices

### Do's

✅ **Review with stakeholders** before logging selection
✅ **Save all concepts** (not just the chosen one) for future reference
✅ **Document why** you chose one concept over others
✅ **Provide real asset paths** when logging (not placeholders)
✅ **Include implementation notes** for developers
✅ **Use concepts as conversation starters**, not final designs

### Don'ts

❌ **Don't skip the logging step** - downstream phases benefit from captured intent
❌ **Don't expect production-ready mockups** - these are explorations
❌ **Don't log a concept you haven't reviewed** - always inspect outputs first
❌ **Don't use placeholder/fake asset paths** - only log what actually exists
❌ **Don't treat concepts as requirements** - they inform, not dictate, implementation

### Troubleshooting

**Problem**: Nano Banana doesn't generate all 4 screens

- **Solution**: Re-run the prompt, emphasizing "4-frame grid" requirement

**Problem**: Concepts look too similar

- **Solution**: Modify prompt to request more extreme variations (e.g., "One minimal, one vibrant, one classic")

**Problem**: Visual style doesn't match brand

- **Solution**: Update brand palette, typography, and tone in the prompt before re-running

**Problem**: Can't access Google AI Studio

- **Solution**: Ensure you're signed in with a Google account; try different browser if needed

**Problem**: Logging fails without saved assets

- **Solution**: Screenshot or download concepts first, save to `docs/ui/concepts/`, then log with real paths

---

## Integration with aidesigner Workflows

### Quick Lane

```
User Request
    ↓
Quick Lane generates PRD, architecture, stories
    ↓
Quick Lane generates Nano Banana brief
    ↓
User runs prompt in Google AI Studio
    ↓
User reviews concepts
    ↓
(Optional) User logs selection via @nano-banana-liaison
```

### Complex Lane (Greenfield UI)

```
Analyst → Project Brief
    ↓
PM → PRD
    ↓
UX Expert → Front-End Spec
    ↓
(Optional) UX Expert → v0/Lovable Prompt
    ↓
(Optional) Nano Banana Liaison → Generate Brief
    ↓
User runs prompt in Google AI Studio
    ↓
Nano Banana Liaison → Log Selection
    ↓
Architect → Front-End Architecture (references logged concept)
    ↓
... continues through development
```

### UX Spec Template Integration

The `front-end-spec-tmpl.yaml` includes an **AI Concept Explorations** section:

```yaml
- id: ai-concept-explorations
  title: AI Concept Explorations
  sections:
    - id: concept-summary
      title: Selected Concept
      template: |
        **Concept Name:** {{concept_name}}
        **Visual Direction:** {{visual_direction}}
        **Key Differentiators:**
        - {{differentiator_1}}
        - {{differentiator_2}}
        **Asset References:** [See docs/ui/nano-banana-explorations.md]
        **Implementation Guidance:** {{implementation_guidance}}
```

When the UX Expert generates a spec after Nano Banana logging, this section auto-populates with the selected concept details.

---

## Frequently Asked Questions

### Do I have to use Nano Banana?

No, it's optional in both lanes. Quick Lane generates the brief automatically, but you can ignore it. Complex Lane only runs Nano Banana if you invoke `@nano-banana-liaison`.

### Can I use other visual AI tools instead?

Yes! The Nano Banana prompt can be adapted for other image generation models. The logging workflow is agnostic to how you generate concepts.

### What if I want more than 3-4 concepts?

Modify the prompt's `{{concept_variations}}` placeholder to request more (e.g., 5-6). Be aware this may slow generation.

### Can I regenerate concepts after seeing the first batch?

Absolutely. Re-run the prompt with modified constraints (colors, tone, style) to explore different directions. Log whichever concept you ultimately choose.

### Does logging a concept lock me into that design?

No. Logged concepts inform architecture and development but aren't binding. You can update the logged concept or override it during implementation.

### Can I log multiple concepts for A/B testing?

The current workflow logs one "selected" concept, but you can manually add additional concepts to `docs/ui/nano-banana-explorations.md` with "Status: Alternative" for comparison.

### What if Google AI Studio is unavailable?

You can run Gemini 2.5 Flash via API using the prompt text. Adjust the workflow to fit your access method.

### How does this relate to v0/Lovable prompts?

Nano Banana generates **visual concepts** (images), while v0/Lovable generate **code**. Use Nano Banana first to align on visual direction, then use v0/Lovable to scaffold implementation.

---

## Advanced Usage

### Iteration Workflow

1. Run initial Nano Banana prompt
2. Review concepts with team
3. Identify aspects you like from multiple concepts
4. Modify prompt to blend preferred aspects
5. Re-run and compare new concepts
6. Log final selected concept

### Brand Alignment Workflow

1. Extract exact hex codes from brand guidelines
2. Provide specific font families (or close equivalents)
3. Include brand illustration examples or style keywords
4. Reference existing brand assets in prompt
5. Generate concepts
6. Validate against brand standards before logging

### Stakeholder Review Workflow

1. Generate concepts
2. Share `docs/ui/nano-banana-brief.md` and concept images
3. Collect feedback via comments/annotations
4. Synthesize feedback into differentiator rationale
5. Log selected concept with stakeholder consensus

---

## Conclusion

Google Nano Banana integration in aidesigner brings visual exploration into your standard workflow without additional tooling or methodology overhead. Both Quick Lane and Complex Lane emit the same Nano Banana artifacts, ensuring design intent is captured early and propagated through architecture and development.

**Key Takeaways**:

- Visual concepts accelerate alignment and reduce rework
- Both lanes generate `docs/ui/nano-banana-brief.md` automatically
- Logging selections persists design intent across phases
- Concepts inform, not replace, detailed design work
- Optional workflow - use when visual exploration adds value

For more information:

- [Dual-Lane Orchestration Guide](../DUAL_LANE_ORCHESTRATION.md)
- [Greenfield UI Workflow](../../aidesigner-core/workflows/greenfield-ui.yaml)
- [Nano Banana Liaison Agent](../../aidesigner-core/agents/nano-banana-liaison.md)
- [Google AI Studio](https://aistudio.google.com)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-05
**Status**: ✅ Fully Documented
