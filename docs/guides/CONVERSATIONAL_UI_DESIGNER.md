# Conversational UI Designer Workflow

**The first AI workflow that designs UIs through multi-turn conversation, just like working with a real designer.**

## Overview

Traditional UI design workflows have a fundamental problem: they're either too rigid (fill out this 50-field form) or too vague (describe what you want in one shot). Real designers don't work that way.

**Real designers have conversations.** They ask about your users, explore your journey, gather inspiration, and build understanding iteratively.

aidesigner's **UI Designer Liaison** brings this natural design conversation to AI-powered visual concept generation with Google Nano Banana (Gemini 2.5 Flash Image).

### What You Get

- **6-stage conversational discovery** that maps your entire user journey
- **Chrome DevTools MCP integration** to extract CSS tokens from reference URLs
- **Per-screen visual prompts** tailored to each step's unique context
- **Journey-aware concepts** that maintain visual consistency across screens
- **Developer-ready output** with CSS variables, design tokens, and component specs

### Why It Matters

**Traditional Workflow:**

1. Write a giant prompt describing every screen
2. Hope the AI understands the relationships
3. Get generic concepts with no journey context
4. Manually extract design tokens from images

**Conversational Workflow:**

1. Natural conversation about your journey
2. AI understands screen relationships and user flow
3. Get tailored concepts for each step with full context
4. Automatic CSS extraction + design system documentation

---

## Two Modes: Quick Lane vs Complex Lane

### Quick Lane (Auto Mode)

**Time:** Under 5 minutes
**Effort:** Zero configuration
**Best For:** Rapid prototyping, MVPs, solo developers

Quick Lane infers your user journey from the PRD and generates per-screen prompts automatically.

```bash
npx aidesigner@latest start

You: "I want to build a task management app for remote teams"

AI: "✅ Generated:
     - docs/prd.md
     - docs/architecture.md
     - docs/stories/*.md
     - docs/ui/ui-designer-screen-prompts.md ← NEW!

     I've inferred your user journey:
     1. Browse tasks
     2. Search & filter
     3. Create task
     4. Task details
     5. Assign & collaborate

     Each screen has a tailored visual concept prompt.
     Copy them to https://aistudio.google.com!"
```

**What's Generated:**

- Journey steps derived from PRD user stories
- Sensible visual defaults (modern SaaS aesthetic)
- Per-screen prompts with inferred personas and goals
- Ready-to-use in Google AI Studio

### Complex Lane (Conversational Mode)

**Time:** 10-15 minutes
**Effort:** Interactive conversation
**Best For:** Custom design systems, brand-specific visuals, team projects

Complex Lane guides you through a 6-stage conversational discovery with full control.

```bash
npx aidesigner@latest start

# Then activate the UI Designer Liaison
@ui-designer-liaison

Nana: "Hi! I'm Nana, your UI designer liaison.
       Ready to craft your visual journey?"
```

**What's Different:**

- Full conversational discovery
- Reference URL CSS extraction via Chrome MCP
- Custom visual language definition
- Deep per-screen context capture
- Brand-specific design token generation

---

## The 6-Stage Conversational Flow

### Stage 0: Warm Welcome

**What Happens:**
Nana asks how you want to approach the design: with inspiration, from scratch, or both.

```
Nana: "Ready to design your user journey?

       🎨 Existing inspiration (URLs, reference designs)
       ✨ From scratch (I'll guide you)
       🔀 Both

       Which approach works best?"
```

**Your Input:**

- Choose your approach
- Optionally share reference URLs or images

**Captured:**

- `flowMode`: inspiration | scratch | both
- `inspirationIntent`: What you want to explore

---

### Stage 1: Journey Discovery

**What Happens:**
Nana asks you to map the key steps in your user's journey.

```
Nana: "Walk me through your ideal user journey from first touch
       to success.

       Think of the major steps or screens. For example:
       - Landing → Explore → Compose → Review → Complete

       What are the key steps in YOUR product's journey?"
```

**Your Input:**
List the ordered steps (3-8 recommended)

**Example:**

```
You: "1. Browse products
      2. Search and filter
      3. Product details
      4. Add to cart
      5. Checkout
      6. Order confirmation"
```

**Captured:**

- `journeySteps[]`: Ordered array of step names

**Validation:**

- Minimum 3 steps required
- Maximum 8 steps recommended
- Nana restates the journey for confirmation

---

### Stage 2: Step Deep-Dive

**What Happens:**
For **each** journey step, Nana asks detailed questions about the user's mindset, goals, and emotional state.

```
Nana: "Let's detail **Browse products**.

       - Primary persona role & mindset: Who is using this screen?
         What's their mental state?
       - Desired outcome: What should they accomplish?
       - Critical UI elements: What components are essential?
       - Emotional tone: What should they feel?
       - Edge cases: Any errors or empty states to show?"
```

**Your Input (per step):**

```
You: "1. Persona: First-time visitor exploring catalog
      2. Outcome: Discover product variety and build interest
      3. UI elements: Product grid, category filters, featured items, search
      4. Emotional tone: Excited, curious
      5. Edge cases: Empty catalog, loading states"
```

**Captured (per step):**

- `screenPersona`: User role and mindset
- `screenGoal`: What user accomplishes
- `requiredComponents`: Essential UI elements
- `emotionTags`: Target emotional response
- `edgeCases`: Warnings, errors, empty states

**Progress:**
Nana shows progress: "Step 2 of 6 complete. Next: Search & filter"

---

### Stage 3: Inspiration Intake

**What Happens:**
If you chose inspiration mode, Nana helps you capture visual references.

#### Path A: Reference URL (with Chrome MCP)

```
Nana: "Share your reference URL - I'll extract the visual elements
       using Chrome DevTools!"

You: "https://linear.app"

Nana: "Let me extract the design tokens...

       🎨 Color Palette:
       - Primary: #5E6AD2 (purple)
       - Accent: #3D9970 (green)
       - Neutral: #6B7280 (gray)

       ✍️ Typography:
       - Headings: 'Inter', sans-serif (600 weight)
       - Body: 'Inter', sans-serif (400 weight)
       - Scale: 14px base, 24px h1

       📏 Spacing: 4px base, scale: 4, 8, 12, 16, 24, 32

       What elements should we KEEP vs AVOID?"

You: "Keep: Minimal sidebar, generous spacing
      Avoid: Complex command palette"
```

**Chrome MCP Commands Used:**

- `chrome_navigate` - Open the URL
- `chrome_get_styles` - Extract computed styles
- Automatic parsing of colors, fonts, spacing

**Captured:**

```javascript
{
  sourceType: "url",
  sourceUrl: "https://linear.app",
  cssVariables: {
    "--color-primary": "#5E6AD2",
    "--font-heading": "'Inter', sans-serif",
    "--space-base": "4px"
    // ... all extracted tokens
  },
  extractedPalette: ["#5E6AD2", "#3D9970", "#6B7280"],
  extractedTypography: "Inter sans-serif, 14-24px scale",
  extractedSpacing: "4px base grid",
  elementsToKeep: "Minimal sidebar, generous spacing",
  elementsToAvoid: "Complex command palette"
}
```

#### Path B: Image References

```
Nana: "Share image links or screenshots and tell me:
       - What you LIKE about each
       - What to AVOID"

You: "Mobbin shot: https://mobbin.com/shot.png
      Like: Card-based layout, soft shadows
      Avoid: Busy header with too many nav items"
```

**Captured:**

```javascript
{
  sourceType: "image",
  sourceUrl: "https://mobbin.com/shot.png",
  description: "E-commerce product grid",
  elementsToKeep: "Card-based layout, soft shadows",
  elementsToAvoid: "Busy header with too many nav items"
}
```

#### Path C: From Scratch

```
Nana: "No problem! We'll define your visual language from scratch
       in the next stage."
```

---

### Stage 4: Visual Language Confirmation

**What Happens:**
Nana synthesizes a visual system by first mining Chrome MCP evidence (CSS variables, palette clusters, typography pairings) gathered during discovery. When multiple references are provided, the liaison weighs recurring tokens—Chrome MCP captures carry the highest weight, CSS-extracted references next, and manual descriptions last—before falling back to any SaaS presets.

```
Nana: "Let's lock in your visual design system.

       **Color Palette:**
       - Primary: #5E6AD2 (purple from Linear.app)
       - Accent: #3D9970 (green)
       - Neutral: #6B7280 (gray)
       - Success: #10B981
       - Error: #EF4444

       **Typography:**
       - Heading: Inter Bold
       - Body: Inter Regular
       - Scale: 14px body / 18px subtitle / 24px heading

       **Layout System:**
       - Structure: Card-based with generous spacing
       - Spacing: 4px base grid (4, 8, 12, 16, 24, 32)
       - Max-width: 1200px

       **Icon & Illustration:**
       - Style: Minimal with subtle gradients

       **Motion & Interaction:**
       - Subtle hover lifts (4px)
       - Smooth transitions (250ms)

       Does this align with your vision? Any changes?"
```

**Your Input:**
Confirm or request adjustments

**Captured:**

```javascript
{
  brandPalette: {
    primary: "#5E6AD2",
    accent: "#3D9970",
    neutral: "#6B7280"
  },
  typography: {
    headingFont: "Inter Bold",
    bodyFont: "Inter Regular",
    scale: { body: "14px", subtitle: "18px", heading: "24px" }
  },
  layoutSystem: {
    structure: "Card-based with generous spacing",
    spacingBase: "4px",
    spacingScale: [4, 8, 12, 16, 24, 32],
    maxWidth: "1200px"
  },
  illustrationStyle: "Minimal with subtle gradients",
  motionNotes: "Subtle hover lifts (4px), smooth transitions (250ms)"
}
```

> 🧠 **Auto-adaptive defaults:** If Chrome MCP artifacts exist (`docs/ui/chrome-mcp/*.json` or inline evidence packs), Nana uses them to build a context-specific preset and surfaces confidence notes plus an evidence trail. You'll see exactly which URLs influenced each token. If the confidence looks off—or you want to override a color, font, or spacing scale—just state the override and Nana updates the preset before prompt generation.

---

### Stage 5: Prompt Assembly

**What Happens:**
Nana generates per-screen visual concept prompts using ALL the context gathered.

```
Nana: "I'll now generate per-screen prompts for Google Nano Banana.

       Each screen will include:
       - Journey context (position, adjacent steps)
       - Persona mindset & goals
       - Visual system (colors, typography, spacing tokens)
       - Reference inspiration (keep/avoid notes)
       - Component requirements

       Ready to generate?"

You: "Yes"

Nana: [Executes generate-ui-designer-prompt.md task]

      "✅ Visual concept prompts generated!

       📄 docs/ui/ui-designer-screen-prompts.md

       6 screens mapped with tailored prompts:
       1. Browse products
       2. Search & filter
       3. Product details
       4. Add to cart
       5. Checkout
       6. Order confirmation

       Each prompt includes CSS tokens from Linear.app!"
```

**What's Generated:**

`docs/ui/ui-designer-screen-prompts.md` containing:

1. Journey overview
2. Visual system summary
3. Per-screen prompts (one per journey step)
4. Usage instructions for Google AI Studio
5. Next steps guidance

---

### Stage 6: Output & Next Steps

**What Happens:**
Nana confirms what was created and guides you to Google AI Studio.

```
Nana: "✅ Journey mapped: 6 screens defined
       ✅ Visual system locked
       ✅ Prompts generated

       **Next Steps:**

       1. Review: Open docs/ui/ui-designer-screen-prompts.md
       2. Generate: Copy prompts to https://aistudio.google.com
       3. Select: Choose your favorite concepts
       4. Log: Run *log-selection to record your choice

       Would you like me to walk you through Google AI Studio?"
```

---

## Using the Generated Prompts

### Step 1: Open the Prompts File

```bash
cat docs/ui/ui-designer-screen-prompts.md
```

You'll see per-screen prompts like:

```markdown
### Browse Products (Step 1)

**Copy this prompt to Google AI Studio:**

\`\`\`
You are Google Nano Banana (Gemini 2.5 Flash Image).
Render 3 concept options for the **Browse Products** step of ShopFlow.

## Context

- Journey position: Step 1 of 6 (Entry point - first impression)
- Previous step: Entry point
- Next step: Search & filter
- Persona mindset: First-time visitor exploring catalog
- Screen goal: Discover product variety and build interest
- Emotional tone: Excited, curious

## Visual System

### Brand Palette

#5E6AD2, #3D9970, #6B7280

**CSS Tokens:**
--color-primary: #5E6AD2;
--color-accent: #3D9970;
--font-heading: 'Inter', sans-serif;
--space-base: 4px;
--space-md: 12px;

[... complete prompt ...]
\`\`\`
```

### Step 2: Visit Google AI Studio

1. Navigate to https://aistudio.google.com
2. Sign in with your Google account
3. Click "Create new chat"
4. Ensure model is set to **Gemini 2.5 Flash** (or latest Flash Image model)

### Step 3: Generate Concepts

1. Copy the entire prompt for **one screen**
2. Paste into the chat
3. Send and wait for generation
4. Review the 3 concept variations

**What You'll Get:**

- 3 distinct visual concepts
- 4:5 aspect ratio (mobile-first)
- Multiple states (default, loading, error)
- Consistent brand application

### Step 4: Repeat for All Screens

Work through each screen prompt sequentially to maintain visual consistency.

**Pro Tip:** Save all concepts before moving to the next screen!

### Step 5: Select Your Direction

After reviewing all screens:

1. Identify your preferred visual direction (can mix elements from different concepts)
2. Screenshot or download the selected concepts
3. Save to `docs/ui/concepts/[concept-name]/`

---

## Logging Your Selection

### Why Log?

Recording your selected concept:

- **Informs architecture** - Architect references visual direction for component design
- **Persists decisions** - Future team members understand design choices
- **Generates docs** - Automatic design system documentation
- **Enables handoff** - Developers get CSS tokens and specs

### How to Log

```bash
# Activate the UI Designer Liaison
@ui-designer-liaison

# Run the log selection command
*log-selection
```

Nana will guide you through recording:

```
Nana: "Let's record your selected visual concept!

       **Which concept did you choose?**
       (e.g., 'Concept 2', 'The minimal purple design')"

You: "Concept 2 - clean minimal with purple accents"

Nana: "Great! Give it a memorable name for team reference:"

You: "Clean Professional"

Nana: "Describe the visual characteristics:
       - Color palette (hex codes if you have them)
       - Typography style
       - Layout approach
       - Visual style
       - Overall aesthetic (2-3 adjectives)"

You: "Colors: #5E6AD2 purple, #3D9970 green, #6B7280 gray
      Typography: Inter sans-serif, bold headings
      Layout: Card-based with generous whitespace
      Style: Flat with subtle gradients
      Aesthetic: Professional, approachable, efficient"

Nana: "What made you choose this concept over others?
       (2-4 specific reasons)"

You: "1. Clearest information hierarchy
      2. Best use of brand colors
      3. Most accessible contrast ratios
      4. Scales well for future features"

Nana: "Which screen prompts did you use?"

You: "All 6 screens"

Nana: "Where are the concept images saved?"

You: "docs/ui/concepts/clean-professional/*.png"

Nana: "Any implementation notes for developers?"

You: "- Maintain 4.5:1 contrast for all text
      - Use 8px spacing grid consistently
      - Hover states: 4px lift with 250ms transition
      - Mobile: bottom nav, Desktop: sidebar"

Nana: "✅ Concept 'Clean Professional' recorded!

       📝 Logged to: docs/ui/ui-designer-explorations.md
       💾 Project state: ui_concept decision
       🎨 CSS tokens: From Linear.app
       🔗 Screen prompts: Linked to journey

       This informs:
       - Frontend architecture
       - Component library
       - Design system docs"
```

### What Gets Logged

**`docs/ui/ui-designer-explorations.md`:**

```markdown
## Clean Professional - 2025-10-05

**Status**: Selected ✅

### Journey Context

**User Journey**: 6 screens

1. Browse products - Discover variety
2. Search & filter - Narrow options
3. Product details - Evaluate choice
4. Add to cart - Commit to purchase
5. Checkout - Complete transaction
6. Order confirmation - Confirm success

**Screen Prompts Used**: All 6 screens

### Visual Characteristics

- **Color Palette**: #5E6AD2, #3D9970, #6B7280
- **Typography**: Inter sans-serif (bold headings, regular body)
- **Layout**: Card-based with generous whitespace
- **Visual Style**: Flat with subtle gradients
- **Aesthetic**: Professional, approachable, efficient

### CSS Tokens

\`\`\`css
/_ Extracted from Linear.app via Chrome DevTools MCP _/
--color-primary: #5E6AD2;
--color-accent: #3D9970;
--color-neutral: #6B7280;
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--space-base: 4px;
--space-md: 12px;
\`\`\`

### Key Differentiators

1. Clearest information hierarchy
2. Best use of brand colors
3. Most accessible contrast ratios
4. Scales well for future features

### Asset References

**Generated Concepts**: docs/ui/concepts/clean-professional/

- browse-products.png
- search-filter.png
- product-details.png
- add-to-cart.png
- checkout.png
- order-confirmation.png

### Implementation Guidance

- Maintain 4.5:1 contrast for all text
- Use 8px spacing grid consistently
- Hover states: 4px lift with 250ms transition
- Mobile: bottom nav, Desktop: sidebar
```

**Project State (`ui_concept` decision):**

```json
{
  "conceptName": "Clean Professional",
  "conceptId": "Concept 2",
  "selectedDate": "2025-10-05T...",
  "summary": "Professional e-commerce design with purple accents",
  "colorPalette": ["#5E6AD2", "#3D9970", "#6B7280"],
  "journeySteps": [
    { "name": "Browse products", "goal": "Discover variety" }
    // ... all steps
  ],
  "referenceStyles": {
    "sourceUrl": "https://linear.app",
    "extractedTokens": {
      /* CSS variables */
    },
    "extractedPalette": ["#5E6AD2", "#3D9970", "#6B7280"]
  },
  "screenPrompts": [
    { "stepName": "Browse products", "promptFile": "docs/ui/ui-designer-screen-prompts.md" }
    // ... all screens
  ]
}
```

---

## Chrome DevTools MCP Integration

### What Is Chrome MCP?

The Chrome DevTools Model Context Protocol server allows AI agents to:

- Navigate to URLs
- Extract computed CSS styles
- Capture color palettes
- Get typography specifications
- Pull spacing tokens
- Read CSS custom properties

### Setup

**Option 1: Via aidesigner Installer**

```bash
npx aidesigner@latest start
# Select to install optional MCP servers
# Choose chrome-devtools-mcp
```

**Option 2: Manual**

Add to `.mcp.json`:

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

### When It's Used

During **Stage 3: Inspiration Intake**, when you provide a reference URL:

```
You: "I want to use Linear.app as inspiration"

Nana: "I notice you have a reference URL. Chrome DevTools MCP
       can automatically extract colors, fonts, and spacing.

       Would you like to enable it?"

You: "Yes, it's already configured"

Nana: [Uses Chrome MCP tools]

      chrome_navigate({ url: "https://linear.app" })
      chrome_get_styles({ selectors: ["body", "h1", "button", ...] })

      [Parses and presents results]

      "🎨 Extracted color palette: #5E6AD2, #3D9970, #6B7280
       ✍️ Typography: Inter sans-serif
       📏 Spacing: 4px base grid"
```

### What Gets Extracted

**Colors:**

- Background colors
- Text colors
- Border colors
- Accent colors
- Converted to hex codes

**Typography:**

- Font families
- Font weights
- Font sizes
- Line heights

**Spacing:**

- Margins
- Padding values
- Common spacing patterns
- Inferred base grid

**CSS Variables:**

- Custom properties (--var-name)
- Computed values
- Theme tokens

### Fallback Without Chrome MCP

If Chrome MCP isn't available, Nana still blends whatever evidence you provide (manual descriptions, screenshots, UX specs) and will label the resulting defaults with **low confidence** so the team knows they came from inference rather than inspection.

```
Nana: "Chrome DevTools MCP isn't enabled. No problem!

       I'll weight recurring colors/typography from your references, but
       mark them as inferred so engineering can double-check.

       Please describe the visual elements from [URL]:
       - Primary colors (hex codes if you have them)
       - Font families and styles
       - Spacing patterns you like"
```

Manual input is captured in the same format and annotated as `evidenceConfidence: low`. When you later supply real Chrome MCP captures, re-run the prompt task to refresh the defaults with high-confidence tokens.

---

## Best Practices

### Journey Discovery

✅ **Do:**

- List 3-8 key steps (sweet spot: 4-6)
- Think about user flow, not feature list
- Consider both happy path and edge cases
- Use descriptive step names ("Search & Filter" vs "Step 2")

❌ **Don't:**

- List every possible micro-interaction
- Exceed 8 steps (scope creep)
- Use vague names ("Do stuff", "Main screen")
- Skip error/empty states

### Step Deep-Dive

✅ **Do:**

- Be specific about persona mindset
- Define clear, measurable outcomes
- List only critical UI elements
- Consider emotional journey

❌ **Don't:**

- Write generic descriptions
- List every possible UI component
- Ignore edge cases
- Skip emotion/tone

### Inspiration Intake

✅ **Do:**

- Choose references that match your target aesthetic
- Be specific about what to keep/avoid
- Use Chrome MCP when possible for accuracy
- Mix URL and image references

❌ **Don't:**

- Share unrelated inspiration
- Say "use everything" (be selective)
- Skip the keep/avoid questions
- Use outdated examples

### Visual Language

✅ **Do:**

- Review Nana's suggestions carefully
- Adjust colors for brand alignment
- Consider accessibility (contrast ratios)
- Think about scalability

❌ **Don't:**

- Accept defaults blindly
- Choose trendy over functional
- Ignore accessibility
- Pick too many accent colors

### Using Google AI Studio

✅ **Do:**

- Copy prompts exactly as provided
- Use Gemini 2.5 Flash (or latest Flash Image model)
- Generate one screen at a time
- Save all variations before moving on

❌ **Don't:**

- Modify prompts (context is important)
- Use wrong model (needs image generation)
- Skip screens
- Delete concepts before selection

### Logging Selection

✅ **Do:**

- Save concept images first
- Provide real file paths (not placeholders)
- Write specific implementation notes
- Include accessibility considerations

❌ **Don't:**

- Log without saving assets
- Use fake paths ("coming soon")
- Skip implementation guidance
- Forget contrast/accessibility notes

---

## Troubleshooting

### Chrome MCP Not Working

**Problem:** "Chrome DevTools MCP is not available"

**Solutions:**

1. Check `.mcp.json` configuration
2. Run `npx -y chrome-devtools-mcp` to test
3. Restart CLI environment
4. Fall back to manual input

### Prompts Not Generating Concepts

**Problem:** Google AI Studio doesn't generate images

**Solutions:**

1. Verify you're using **Gemini 2.5 Flash** (or latest Flash Image model)
2. Check prompt is complete (copy entire code block)
3. Try regenerating
4. Check Google AI Studio service status

### Journey Steps Not Captured

**Problem:** Nana skips to next stage without capturing

**Solutions:**

1. Ensure you list steps clearly (numbered or bulleted)
2. Minimum 3 steps required
3. Re-run discovery if needed
4. Check task state persistence

### CSS Extraction Failed

**Problem:** Chrome MCP doesn't extract styles

**Solutions:**

1. Verify URL is accessible (not behind auth)
2. Check MCP server is running
3. Try different selectors
4. Fall back to manual CSS input

### Selection Not Logged

**Problem:** `*log-selection` fails or doesn't persist

**Solutions:**

1. Ensure concept images are saved first
2. Provide valid file paths
3. Check MCP server connection
4. Verify project state writable

---

## Advanced Usage

### Custom Journey Patterns

**E-commerce:**

```
1. Browse catalog
2. Search & filter
3. Product details
4. Add to cart
5. Checkout
6. Order confirmation
```

**SaaS Dashboard:**

```
1. Overview/Home
2. Data table/List
3. Detail view
4. Create/Edit
5. Settings/Preferences
```

**Mobile App:**

```
1. Onboarding
2. Main feed
3. Search/Discover
4. Profile
5. Settings
```

### Mixing Inspiration Sources

```
Nana: "Share inspiration sources"

You: "1. Linear.app for sidebar navigation
      2. Notion.so for content blocks
      3. Mobbin screenshot for color palette"

Nana: [Extracts from Linear and Notion]
      [Asks about Mobbin elements]

      "Got it! I'll combine:
       - Linear's minimal sidebar
       - Notion's block-based content
       - Mobbin's color scheme"
```

### Brand Guidelines Integration

If you have existing brand guidelines:

```
Nana: "Color palette?"

You: "Use our brand colors:
      - Primary: #2D3748 (charcoal)
      - Accent: #ED8936 (tangerine)
      - From style guide: https://brand.company.com/colors"

Nana: [Uses Chrome MCP if URL provided, otherwise captures manually]

      "✅ Brand colors locked:
       - #2D3748 charcoal (primary)
       - #ED8936 tangerine (accent)

       Should I extract additional tokens from the style guide?"
```

### Multi-Screen State Variations

For complex screens with many states:

```
Nana: "Edge cases for Checkout screen?"

You: "Show all these states:
      1. Default (items in cart)
      2. Loading (processing payment)
      3. Error (payment failed with retry)
      4. Empty (cart cleared)
      5. Success (order placed)

      Each state needs different CTAs and messaging"

Nana: "I'll request 5 distinct state variations in the prompt"
```

---

## Integration with aidesigner Workflow

### Quick Lane Flow

```
User Request
    ↓
Quick Lane generates PRD, architecture, stories
    ↓
Auto-infers journey from PRD user stories
    ↓
Generates per-screen prompts with defaults
    ↓
docs/ui/ui-designer-screen-prompts.md created
    ↓
User generates concepts in Google AI Studio
    ↓
User optionally logs selection via @ui-designer-liaison
```

### Complex Lane Flow

```
Analyst → Project Brief
    ↓
PM → PRD
    ↓
UX Expert → Front-End Spec
    ↓
(Optional) @ui-designer-liaison activated
    ↓
*discover-journey (6-stage conversation)
    ↓
*assemble-prompts (generates per-screen)
    ↓
docs/ui/ui-designer-screen-prompts.md created
    ↓
User generates concepts in Google AI Studio
    ↓
*log-selection (records with full context)
    ↓
Architect → Front-End Architecture (references concept)
    ↓
... continues through development
```

### State Persistence

All discovery data persists across phases:

**Journey Steps** → Architecture references user flow
**CSS Tokens** → Component library setup
**Screen Prompts** → Developer handoff docs
**Selected Concept** → Design system foundation

---

## Comparison: Old vs New

### Single-Shot Nano Banana (Old)

- ❌ One global prompt for all screens
- ❌ No journey context
- ❌ Manual CSS extraction from images
- ❌ Generic visual suggestions
- ✅ Fast (5 min) but limited

### Conversational UI Designer (New)

- ✅ Per-screen prompts with journey context
- ✅ Automatic CSS extraction via Chrome MCP
- ✅ Multi-turn discovery captures nuance
- ✅ Reference-aware (keep/avoid per source)
- ✅ Developer-ready CSS tokens

**Migration:**

- Old workflow still works (Quick Lane auto mode)
- New workflow is opt-in (Complex Lane conversational)
- Both produce same output structure
- Gradual adoption supported

---

## FAQ

### Do I need Chrome DevTools MCP?

**No, it's optional.** Without it, you manually describe colors/fonts. With it, automatic extraction saves time and increases accuracy.

### Can I skip stages?

**No.** Each stage builds on previous answers. Skipping breaks the context chain. However, you can accept defaults quickly in each stage.

### How long does discovery take?

- **Quick Lane:** 0 min (automatic)
- **Complex Lane:** 10-15 min (conversational)
- **Worth it:** Yes, for custom design systems

### Can I redo discovery?

**Yes.** Run `*discover-journey` again to restart. Previous discovery is overwritten.

### What if I have 20 screens?

**Recommended approach:**

- Identify 5-8 **key** screens for journey
- Generate concepts for those
- Apply visual system to remaining screens
- Use generated CSS tokens for consistency

### Can I mix auto and manual?

**Yes!**

- Quick Lane generates base prompts
- Activate `@ui-designer-liaison`
- Run `*discover-journey` to enhance
- Prompts updated with rich context

### Do concepts inform architecture?

**Yes, automatically.**

- Selected concept stored in project state
- Architect agent references `ui_concept` decision
- Component patterns derived from visual direction
- CSS tokens included in tech specs

### Can I use other visual AI tools?

**Yes.** The prompts work with any image generation model. Adjust the first line to match your tool (e.g., "You are Midjourney" or "You are DALL-E").

---

## Resources

### Documentation

- [Using Google Nano Banana](USING_GOOGLE_NANO_BANANA.md) - Google AI Studio integration
- [Dual-Lane Orchestration](../DUAL_LANE_ORCHESTRATION.md) - Quick vs Complex Lane
- [User Guide](../user-guide.md) - Complete aidesigner workflows

### Related Guides

- [MCP Management](../mcp-management.md) - Installing MCP servers
- [Chrome DevTools MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/chrome-devtools) - Official docs

### Example Projects

See `examples/` directory for:

- E-commerce UI journey (Quick Lane)
- SaaS dashboard (Complex Lane with Chrome MCP)
- Mobile app (From scratch, no inspiration)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-05
**Status**: ✅ Production Ready

_Built with aidesigner • Powered by BMAD-METHOD™_
