<!-- Powered by BMAD™ Core -->

# Discover UI Journey Task

## Purpose

To guide users through a multi-turn conversational journey discovery process that maps the end-to-end user experience, ingests visual inspiration (URLs or images), extracts design tokens, and captures all context needed to generate per-screen visual concept prompts for Google Nano Banana (Gemini 2.5 Flash Image).

## Prerequisites

- Completed Product Requirements Document (`docs/prd.md`)
- Completed UI/UX Specification (`docs/front-end-spec.md`) - if available
- Optional: Chrome DevTools MCP server enabled for URL scraping

## Key Activities & Instructions

### Chrome MCP Integration

**IMPORTANT**: If the user provides a reference URL during this task, immediately recommend enabling the Chrome DevTools MCP server:

```
I notice you want to use a reference URL for inspiration. To extract colors, typography, and CSS tokens automatically, I recommend enabling the Chrome DevTools MCP server.

Would you like me to guide you through activating it? (It's optional - you can also describe the visual elements manually)
```

If user agrees, provide instructions:

1. Ensure `chrome-devtools-mcp` is installed: `npx -y chrome-devtools-mcp`
2. Add to `.mcp.json` (or confirm it's already configured)
3. Once enabled, you can use these MCP tools:
   - `chrome_navigate` - Navigate to the reference URL
   - `chrome_get_styles` - Extract computed styles, colors, typography
   - `chrome_get_dom` - Get DOM structure for layout analysis

### Conversational Flow Structure

This task implements a **6-stage discovery flow**. Each stage builds on previous answers, with explicit confirmation before moving forward.

---

## Stage 0: Warm Welcome

**Liaison Message:**

```
Hi, I'm Nana, your UI designer liaison. I help craft visual concept explorations using Google Nano Banana (Gemini 2.5 Flash Image).

Ready to design your user journey? We can start with:
- 🎨 Existing inspiration (URLs, Mobbin shots, reference designs)
- ✨ From scratch (I'll guide you through the journey)
- 🔀 Both (inspiration + custom exploration)

Which approach works best for you?
```

**Capture:**

- `flowMode`: "inspiration", "scratch", or "both"
- `inspirationIntent`: What they want to explore

**Before Stage 1:** Summarize choice and set expectations:

```
Great! We'll [approach]. I'll walk you through:
1. Mapping your user journey (key screens/steps)
2. Deep-diving each step (personas, goals, emotions)
3. Gathering inspiration (if applicable)
4. Defining visual language (colors, typography, layout)
5. Assembling per-screen prompts

Let's start with the journey...
```

---

## Stage 1: Journey Discovery

**Liaison Message:**

```
Walk me through your ideal user journey from first touch to success.

Think of the major steps or screens a user encounters. For example:
- Landing → Explore → Compose → Review → Complete
- Browse → Filter → Compare → Purchase → Confirm

What are the key steps in YOUR product's journey? List them in order.
```

**Capture:**

- `journeySteps[]`: Ordered array of step names

**Example User Response:**

```
1. Browse products
2. Search and filter
3. View product details
4. Add to cart
5. Checkout
6. Order confirmation
```

**Validation:**

- Minimum 3 steps required
- Maximum 8 steps recommended (focus on core journey)

**Before Stage 2:** Restate journey and confirm:

```
Perfect! Your journey is:
1. Browse products
2. Search and filter
3. View product details
4. Add to cart
5. Checkout
6. Order confirmation

We'll design visual concepts for each of these steps. Ready to deep-dive into each one?
```

---

## Stage 2: Step Deep-Dive

For **EACH journey step**, ask these questions:

**Liaison Message Template:**

```
Let's detail **[Step Name]**.

- **Primary persona role & mindset**: Who is using this screen? What's their mental state?
- **Desired outcome**: What should the user accomplish on this screen?
- **Critical UI elements**: What components are essential? (e.g., search bar, filters, product cards, CTA buttons)
- **Emotional tone**: What should the user feel? (e.g., confident, excited, reassured, empowered)
- **Edge cases**: Any warnings, errors, or empty states to show?

Respond in this format:
1. Persona & mindset: [answer]
2. Outcome: [answer]
3. UI elements: [answer]
4. Emotional tone: [answer]
5. Edge cases: [answer]
```

**Capture per step:**

```javascript
{
  stepName: "Browse products",
  screenPersona: "First-time visitor exploring catalog",
  screenGoal: "Discover product variety and build interest",
  requiredComponents: "Product grid, category filters, featured items, search bar",
  emotionTags: "Excited, curious, overwhelmed (need clear organization)",
  edgeCases: "Empty catalog, loading states, no search results"
}
```

**Iteration:**

- Repeat for ALL journey steps
- After each step, show progress: "Step 2 of 6 complete. Next: [step name]"

**Before Stage 3:** Summarize all steps:

```
Excellent! Here's your full journey map:

1. **Browse products**
   - Persona: First-time visitor exploring catalog
   - Goal: Discover variety and build interest
   - Emotion: Excited, curious

2. **Search and filter**
   - Persona: User with specific needs
   - Goal: Narrow down options efficiently
   - Emotion: Focused, goal-oriented

[... all steps ...]

Now let's gather visual inspiration...
```

---

## Stage 3: Inspiration Intake

### If `flowMode` is "inspiration" or "both":

**Liaison Message:**

```
Time to gather visual inspiration! You can share:

📎 **Reference URLs**: I'll extract colors, typography, and layout tokens using Chrome DevTools
🖼️ **Images/Screenshots**: Mobbin shots, competitor designs, mood boards (share links or describe)

What inspiration sources do you have? Share URLs or describe your references.
```

#### Path A: URL Provided

**When user shares URL:**

1. **Check Chrome MCP availability**:

```
I see you have a reference URL. Let me extract the visual elements using Chrome DevTools...
```

2. **Execute Chrome MCP sequence**:

```javascript
// Use MCP tools (if available)
await chrome_navigate({ url: userProvidedUrl });
const styles = await chrome_get_styles({
  selectors: ['body', 'h1', 'button', '.primary', '.accent'],
});
const colors = extractColorPalette(styles); // Parse computed styles
const fonts = extractTypography(styles);
const spacing = extractSpacingTokens(styles);
```

3. **Present extracted data**:

```
Extracted from [URL]:

🎨 **Color Palette:**
- Primary: #1E40AF (deep blue)
- Accent: #F59E0B (amber)
- Neutral: #6B7280 (gray)
- Background: #FFFFFF

✍️ **Typography:**
- Headings: 'Inter', sans-serif (700 weight)
- Body: 'Inter', sans-serif (400 weight)
- Scale: 14px body, 24px h1, 18px h2

📏 **Spacing System:**
- Base unit: 8px
- Common values: 8px, 16px, 24px, 32px, 48px

What elements should we **keep** vs **avoid** from this reference?
```

**Capture:**

```javascript
{
  referenceAssets: [
    {
      sourceType: 'url',
      sourceUrl: 'https://example.com',
      cssVariables: {
        '--color-primary': '#1E40AF',
        '--color-accent': '#F59E0B',
        '--font-heading': "'Inter', sans-serif",
        '--space-base': '8px',
      },
      extractedPalette: ['#1E40AF', '#F59E0B', '#6B7280'],
      extractedTypography: 'Inter sans-serif, 14-24px scale',
      extractedSpacing: '8px base grid',
      elementsToKeep: 'Clean color hierarchy, generous spacing',
      elementsToAvoid: 'Overly dense information',
    },
  ];
}
```

#### Path B: Images/Screenshots Provided

**When user shares image references:**

```
Got it! For each image or screenshot, tell me:
1. What you **like** about it (colors, layout, components, style)
2. What to **avoid** (clutter, complexity, specific elements)

Example:
- Image 1 (Mobbin/Instagram): Like the card-based layout and soft shadows. Avoid the busy header.
```

**Capture:**

```javascript
{
  referenceAssets: [
    {
      sourceType: 'image',
      sourceUrl: 'https://mobbin.com/screenshot.png',
      description: 'E-commerce product grid',
      elementsToKeep: 'Card-based layout, soft shadows, clear product imagery',
      elementsToAvoid: 'Busy header with too many nav items',
    },
  ];
}
```

#### Path C: No Inspiration (Scratch)

**If `flowMode` is "scratch":**

```
No problem! We'll define your visual language from scratch in the next stage.
```

---

## Stage 4: Visual Language Confirmation

**Liaison Message:**

```
Let's lock in your visual design system. I'll suggest defaults based on [your inspiration/modern SaaS best practices], but you can adjust anything.

**Color Palette:**
[If from URL: Show extracted colors]
[If scratch: Suggest modern palette]
- Primary: #1E40AF (deep blue)
- Accent: #F59E0B (amber)
- Neutral: #6B7280 (gray)
- Success: #10B981
- Error: #EF4444

**Typography:**
[If from URL: Show extracted fonts]
[If scratch: Suggest modern fonts]
- Heading font: Inter (bold, modern sans-serif)
- Body font: Inter (regular)
- Scale: 14px body / 18px subtitle / 24px heading

**Layout System:**
- Structure: [Card-based / List-based / Grid / Asymmetric]
- Spacing: 8px base grid (8, 16, 24, 32, 48, 64)
- Containers: Max-width 1200px, responsive breakpoints

**Icon & Illustration Style:**
[Flat / Gradient / 3D / Minimal / Hand-drawn / None]

**Motion & Interaction:**
[Subtle / Energetic / Minimal / None]
- Example: Soft hover lifts, smooth transitions (200-300ms)

Does this visual language align with your vision? Any changes?
```

**Capture:**

```javascript
{
  brandPalette: {
    primary: "#1E40AF",
    accent: "#F59E0B",
    neutral: "#6B7280",
    success: "#10B981",
    error: "#EF4444"
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    scale: { body: "14px", subtitle: "18px", heading: "24px" }
  },
  layoutSystem: {
    structure: "Card-based with grid",
    spacingBase: "8px",
    spacingScale: [8, 16, 24, 32, 48, 64],
    maxWidth: "1200px"
  },
  illustrationStyle: "Minimal with subtle gradients",
  motionNotes: "Subtle hover lifts (4px), smooth transitions (250ms)"
}
```

**Before Stage 5:** Confirm readiness:

```
Perfect! Your visual system is locked in:
✅ Color palette defined
✅ Typography system set
✅ Layout principles established
✅ Motion & interaction cues noted

Ready to generate per-screen prompts?
```

---

## Stage 5: Prompt Assembly Readiness

**Liaison Message:**

```
I'll now generate **per-screen visual concept prompts** for Google Nano Banana. Each screen will get a tailored prompt that includes:

- Journey context (where it fits in the flow)
- Persona mindset and screen goals
- Visual system (colors, typography, spacing tokens)
- Reference inspiration (with keep/avoid notes)
- Component requirements and edge cases

These prompts will be optimized for Gemini 2.5 Flash Image generation.

Ready to generate?
```

**User confirms** → Proceed to execute `generate-ui-designer-prompt.md` task with all captured state

---

## Stage 6: Output & Next Steps

After prompts are generated (by `generate-ui-designer-prompt.md`):

**Liaison Message:**

```
✅ **Journey mapped**: [N] screens defined
✅ **Visual system locked**: Colors, typography, layout principles
✅ **Prompts generated**: Per-screen prompts ready

**Generated Files:**
- `docs/ui/ui-designer-screen-prompts.md` - All screen prompts
- `docs/ui/ui-designer-brief.md` - Journey summary and usage guide

**Next Steps:**

1. **Review prompts**: Open `docs/ui/ui-designer-screen-prompts.md`
2. **Use in Google AI Studio**:
   - Visit https://aistudio.google.com
   - Select Gemini 2.5 Flash (or latest Flash Image model)
   - Copy each screen prompt and generate concepts
3. **Log your selection**: When you pick a concept, run `*log-selection` to record it

Would you like me to walk you through using the prompts in Google AI Studio?
```

---

## Important Notes

### State Management

All captured data must be stored in task state for reuse:

```javascript
taskState = {
  flowMode: "inspiration",
  inspirationIntent: "Modern e-commerce with clean design",
  journeySteps: [
    { name: "Browse products", ... },
    { name: "Search and filter", ... }
  ],
  referenceAssets: [
    { sourceType: "url", sourceUrl: "...", cssVariables: {...}, ... }
  ],
  brandPalette: { ... },
  typography: { ... },
  layoutSystem: { ... },
  illustrationStyle: "...",
  motionNotes: "..."
}
```

### Chrome MCP Fallback

If Chrome MCP is not available:

1. Gracefully inform user: "Chrome DevTools MCP is not enabled. I'll guide you through manual entry."
2. Ask user to describe colors, fonts, spacing manually
3. Capture in same format as MCP extraction

### Validation & Safety

- **Minimum journey steps**: 3 (to ensure meaningful exploration)
- **Maximum journey steps**: 8 (to keep scope manageable)
- **Required fields per step**: Persona, goal, UI elements, emotion
- **Visual system required**: At minimum, color palette and typography

### No Mock Data

- Never invent placeholder journey steps
- Always elicit real user input
- If user is unsure, provide examples from their PRD/spec

## Output Artifacts

This task produces **task state** consumed by:

- `generate-ui-designer-prompt.md` - Assembles per-screen prompts
- `record-ui-designer-selection.md` - Records chosen concepts with journey context

## Integration Points

Called by:

- **Nano Banana Liaison Agent**: Via `*discover-journey` command
- **Complex Lane UX Expert**: Optional step after front-end spec
- **Quick Lane**: Automated journey inference from PRD (simplified flow)
