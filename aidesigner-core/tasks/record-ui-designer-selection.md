<!-- Powered by BMAD™ Core -->

# Record UI Designer Selection Task

## Purpose

To capture the chosen visual concept from Google Nano Banana (Gemini 2.5 Flash Image) and persist the design decision with enriched context including per-screen prompts, CSS tokens, journey mapping, and reference assets. This task bridges AI-powered ideation and implementation by documenting which visual direction was selected and why.

## Prerequisites

- User has generated visual concepts using prompts from `ui-designer-screen-prompts.md`
- User has reviewed concept variations (typically 3-4 per screen)
- User has selected one concept as the primary visual direction
- Optional: User has reviewed concepts with stakeholders

## Key Activities & Instructions

### 1. Elicit Concept Selection Details

Ask the user to provide comprehensive information about their selected concept. Be conversational but thorough:

#### 1.1 Basic Selection Information

**Liaison Message:**

```
Let's record your selected visual concept!

First, the basics:
- **Which concept did you choose?** (e.g., "Concept 2", "Option B", "The gradient-based design")
- **Give it a memorable name** for team reference (e.g., "Clean Professional", "Vibrant Energy", "Minimal Trust")
```

**Capture:**

- `conceptId`: Which variation was chosen (e.g., "Concept 2")
- `conceptName`: Memorable team label (e.g., "Clean Professional")

#### 1.2 Visual Characteristics

**Liaison Message:**

```
Now, describe the visual elements of your chosen concept:

- **Color Palette**: What are the primary colors? (hex codes if you have them)
- **Typography Style**: How would you describe the typography? (modern, classic, bold, elegant, etc.)
- **Layout Approach**: What's the overall layout structure? (card-based, list-based, grid, asymmetric, etc.)
- **Visual Style**: What's the illustration/visual treatment? (flat, gradient, 3D, minimal, hand-drawn, photographic, etc.)
- **Overall Aesthetic**: Sum up the feeling in 2-3 adjectives (e.g., "professional, trustworthy, efficient")
```

**Capture:**

```javascript
{
  colorPalette: {
    primary: "#1E3A8A",
    accent: "#F97316",
    neutral: "#6B7280",
    // ... any additional colors
  },
  typographyStyle: "Modern sans-serif with bold headings and readable body text",
  layoutApproach: "Card-based with generous whitespace and clear visual hierarchy",
  visualStyle: "Flat design with subtle gradients and minimal line icons",
  aestheticTags: ["professional", "approachable", "efficient"]
}
```

#### 1.3 Key Differentiators

**Liaison Message:**

```
What made you choose this concept over the others?

Share 2-4 specific reasons, such as:
- Better alignment with brand values
- Clearer information hierarchy
- More accessible contrast/readability
- Stronger visual differentiation
- Better user flow clarity
- More scalable component system
```

**Capture:**

```javascript
{
  keyDifferentiators: [
    'Clearest information hierarchy among all options',
    'Strong brand color application without overwhelming',
    'Most accessible contrast ratios for readability',
    'Scalable component patterns for future features',
  ];
}
```

#### 1.4 Per-Screen Prompt Usage

**NEW - Enhanced for Conversational Flow**

**Liaison Message:**

```
Which screen prompts did you use from `ui-designer-screen-prompts.md`?

If you used all screens, just confirm "all". Otherwise, list the specific screens:
- Browse products
- Search and filter
- Product details
- Add to cart
- Checkout
- Order confirmation
```

**Capture:**

```javascript
{
  screenPromptsUsed: [
    { stepName: "Browse products", promptVersion: "Step 1 of 6" },
    { stepName: "Search and filter", promptVersion: "Step 2 of 6" },
    // ... all used screens
  ],
  allScreensUsed: true // or false if partial
}
```

#### 1.5 Asset References

**Liaison Message:**

```
Where are the generated concept images saved?

Provide:
- **Storage location**: Where did you save the assets? (e.g., Figma, Google Drive, local folder, project repo)
- **File paths or URLs**: Specific identifiers for each screen

Example: "All screens saved to `docs/ui/concepts/clean-professional/*.png`"
```

**Capture:**

```javascript
{
  assetLocation: "docs/ui/concepts/clean-professional/",
  assetLinks: [
    "docs/ui/concepts/clean-professional/browse-products.png",
    "docs/ui/concepts/clean-professional/search-filter.png",
    "docs/ui/concepts/clean-professional/product-details.png",
    "docs/ui/concepts/clean-professional/add-to-cart.png",
    "docs/ui/concepts/clean-professional/checkout.png",
    "docs/ui/concepts/clean-professional/confirmation.png"
  ]
}
```

#### 1.6 CSS Tokens & Reference Styles (NEW)

**Enhanced for Chrome MCP Integration**

**Liaison Message:**

```
Did you use any reference URLs during journey discovery that had CSS extraction?

If yes, I'll include the extracted design tokens (colors, typography, spacing) in your selection record.
```

**If discovery state includes CSS extraction:**

```
I found extracted CSS tokens from your reference URLs:

**From** [URL]:
- `--color-primary: #1E40AF`
- `--font-heading: 'Inter', sans-serif`
- `--space-base: 8px`

Should I include these tokens in your selection record? They'll help developers implement the design system accurately.
```

**Capture:**

```javascript
{
  referenceStyles: {
    sourceUrl: "https://linear.app",
    extractedTokens: {
      "--color-primary": "#1E40AF",
      "--color-accent": "#F59E0B",
      "--font-heading": "'Inter', sans-serif",
      "--font-body": "'Inter', sans-serif",
      "--space-base": "8px",
      "--space-md": "16px",
      "--space-lg": "32px"
    },
    extractedPalette: ["#1E40AF", "#F59E0B", "#6B7280"],
    extractedTypography: "Inter sans-serif, 14-24px scale",
    extractedSpacing: "8px base grid (8, 16, 24, 32, 48, 64)",
    evidenceConfidence: "high"
  }
}
```

#### 1.7 Dynamic Default Confidence (NEW)

**Explain where the defaults came from.** Capture the synthesized preset emitted during prompt generation so downstream teams know which evidence informed each token.

**Liaison Message:**

```
I'm going to log the inferred defaults that shaped your prompts.

Can you confirm if these confidence notes & evidence sources look correct?

- Confidence: [e.g., "High confidence: Chrome MCP evidence from https://linear.app"]
- Reference blend: [e.g., "Synthesized from https://linear.app, https://cal.com"]
- Evidence trail: [List each source + token count]

If you'd like to override any token (colors, fonts, spacing), let me know so I can update the record.
```

**Capture:**

```javascript
{
  inferredDefaults: {
    confidenceNotes: "High confidence: Chrome MCP evidence from https://linear.app",
    referenceBlend: "Synthesized from https://linear.app, https://cal.com",
    evidenceTrail: [
      { source: "https://linear.app", type: "chrome-mcp", contributedTokens: ["--color-primary", "--font-heading"] },
      { source: "https://cal.com", type: "reference-css", contributedTokens: ["--color-accent"] }
    ],
    overrides: {
      colors: { primary: "#1E3A8A" },
      typography: { headingFont: "Sohne", bodyFont: "Inter" }
    }
  }
}
```

#### 1.8 Implementation Guidance

**Liaison Message:**

```
What should the development team know about implementing this concept?

Share any important notes:
- Component consistency requirements (e.g., "Use the same button style across all screens")
- Accessibility considerations (e.g., "Maintain 4.5:1 contrast ratio for all text")
- Animation/interaction hints (e.g., "Cards should have subtle hover lift effect")
- Responsive adaptation notes (e.g., "On desktop, show sidebar navigation instead of bottom nav")
```

**Capture:**

```javascript
{
  implementationNotes: `
- Maintain 4.5:1 contrast ratio for all body text, 3:1 for large text
- Use consistent 8px spacing grid throughout
- Button hover states should have subtle lift effect (4px shadow, 250ms transition)
- Mobile navigation uses bottom bar, desktop uses sidebar
- All interactive elements minimum 44x44px touch targets
- Component library should extract from concept screens (buttons, cards, forms, nav)
  `.trim();
}
```

### 2. Create Exploration Log Entry (ENHANCED)

Use the `create-doc.md` task to append to `docs/ui/ui-designer-explorations.md` (create if doesn't exist).

**If this is the first entry**, create the document with:

````markdown
# UI Designer Concept Explorations

This document tracks visual concept explorations generated with Google Nano Banana (Gemini 2.5 Flash Image) via the conversational UI designer workflow and records design decisions for downstream phases.

---

## [Concept Name] - [Date]

**Status**: Selected ✅

**Concept Identifier**: [Which variation was chosen]

### Journey Context (NEW)

**User Journey**: [Journey step count] screens

1. [Step 1 name] - [Brief goal]
2. [Step 2 name] - [Brief goal]
   ...

**Screen Prompts Used**:

- ✅ [Screen 1]
- ✅ [Screen 2]
  ...

### Visual Characteristics

- **Color Palette**: [Colors/hex codes]
- **Typography**: [Style description]
- **Layout**: [Approach description]
- **Visual Style**: [Treatment description]
- **Aesthetic**: [Adjectives]

### CSS Tokens (NEW - from Chrome MCP)

```css
/* Extracted from [Reference URL] */
--color-primary: #1e40af;
--color-accent: #f59e0b;
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--space-base: 8px;
--space-md: 16px;
--space-lg: 32px;
```

**Evidence Confidence**: [High / Medium / Low]
````

**Palette**: #1E40AF, #F59E0B, #6B7280
**Typography**: Inter sans-serif, 14-24px scale
**Spacing**: 8px base grid

### Dynamic Defaults & Evidence (NEW)

- **Confidence Notes**: [Why the defaults are trusted]
- **Reference Blend**: [Summary of sources that influenced defaults]
- **Evidence Trail**:
  - [Type → Source (tokens contributed)]
- **Overrides Applied**: [Any manual adjustments from user/stakeholder]

### Reference Assets (NEW - Enhanced)

**Inspiration Sources**:
{{#each referenceAssets}}

- **{{sourceType}}**: {{sourceUrl}}
  - Elements kept: {{elementsToKeep}}
  - Elements avoided: {{elementsToAvoid}}
    {{#if cssExtracted}}
  - CSS extracted: ✅ (see tokens above)
    {{/if}}
    {{/each}}

**Generated Concept Assets**:

- **Location**: [Where assets are stored]
- **Files**:
  {{#each assetLinks}}
  - {{this}}
    {{/each}}

### Key Differentiators

1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

### Implementation Guidance

[Notes for development team]

### Decision Rationale

[Why this concept was selected over alternatives]

---

````

**If `docs/ui/ui-designer-explorations.md` already exists**, append the new entry with a horizontal rule separator.

### 3. Persist Decision to Project State (ENHANCED)

Call the MCP `recordDecision` tool/method with the **enhanced schema**:

**Key**: `ui_concept`

**Value** (enhanced object):

```javascript
{
  conceptName: "[The memorable name]",
  conceptId: "[Concept identifier from Google AI Studio]",
  selectedDate: "[ISO date string]",
  summary: "[2-3 sentence summary]",

  // Visual characteristics
  colorPalette: ["#1E3A8A", "#F97316", "#6B7280"],
  typography: "[Style description]",
  visualStyle: "[Treatment description]",
  aesthetic: ["professional", "approachable", "efficient"],

  // Asset references
  assetLocation: "docs/ui/concepts/clean-professional/",
  assetLinks: [
    "docs/ui/concepts/clean-professional/browse-products.png",
    // ... all screens
  ],

  // Journey context (NEW)
  journeySteps: [
    { name: "Browse products", goal: "Discover variety" },
    { name: "Search and filter", goal: "Narrow options" },
    // ... all steps
  ],

  // Per-screen prompts (NEW)
  screenPrompts: [
    { stepName: "Browse products", promptFile: "docs/ui/ui-designer-screen-prompts.md", section: "Step 1" },
    // ... all screens
  ],

  // Reference styles (NEW - from Chrome MCP)
  referenceStyles: {
    sourceUrl: "https://linear.app",
    extractedTokens: {
      "--color-primary": "#1E40AF",
      // ... all CSS variables
    },
    extractedPalette: ["#1E40AF", "#F59E0B", "#6B7280"],
    extractedTypography: "Inter sans-serif, 14-24px scale",
    extractedSpacing: "8px base grid",
    evidenceConfidence: "high"
  },

  inferredDefaults: {
    confidenceNotes: "High confidence: Chrome MCP evidence from https://linear.app",
    referenceBlend: "Synthesized from https://linear.app, https://cal.com",
    evidenceTrail: [
      { source: "https://linear.app", type: "chrome-mcp", contributedTokens: ["--color-primary", "--font-heading"] },
      { source: "https://cal.com", type: "reference-css", contributedTokens: ["--color-accent"] }
    ],
    overrides: {
      colors: { primary: "#1E3A8A" },
      typography: { headingFont: "Sohne", bodyFont: "Inter" }
    }
  },

  // Differentiators & guidance
  keyDifferentiators: [
    "Clearest hierarchy",
    "Strong brand colors",
    "Best contrast"
  ],
  implementationNotes: "[Guidance for dev team]"
}
````

**Rationale**: "[Why this concept was chosen - from decision rationale section]"

**NEW: Also record reference assets separately**

**Key**: `ui_reference_assets`

**Value**:

```javascript
{
  assets: [
    {
      sourceType: "url",
      sourceUrl: "https://linear.app",
      cssExtracted: true,
      tokens: { ... },
      elementsKept: "Clean sidebar, generous spacing",
      elementsAvoided: "Complex nesting"
    },
    {
      sourceType: "image",
      sourceUrl: "https://mobbin.com/shot.png",
      cssExtracted: false,
      elementsKept: "Card layout, soft shadows",
      elementsAvoided: "Busy header"
    }
  ],
  linkedToConcept: "Clean Professional",
  selectedDate: "[ISO date]"
}
```

### 4. Confirm and Guide Next Steps

After logging the selection:

**Liaison Message:**

```
✅ **Concept '[Name]' recorded successfully!**

**What was logged:**
- 📝 Exploration entry: `docs/ui/ui-designer-explorations.md`
- 💾 Project state decision: `ui_concept`
- 🎨 Reference assets: `ui_reference_assets` (if applicable)
- 🔗 Screen prompts: Linked to journey steps
{{#if referenceStyles}}
- 🎯 CSS tokens: Extracted from [Reference URL]
{{/if}}

**Downstream Impact:**
- ✅ Frontend architecture will reference this concept
- ✅ UX specifications will include this as design foundation
- ✅ Development stories will mention selected visual direction
- ✅ Quick Lane specs will incorporate this concept
- ✅ CSS tokens available for component library setup

**Recommended Next Actions:**

1. **Share with team**:
   - Distribute `docs/ui/ui-designer-explorations.md` to stakeholders
   - Review concept screens in your next sync

2. **Proceed to architecture**:
   - If in Complex Lane: Continue to `@architect` phase
   - Architecture will reference your visual direction and component patterns

3. **Create high-fidelity mockups** (optional):
   - Use concept screens as foundation in Figma/design tool
   - Extract component library from selected concept

4. **Update front-end spec** (if needed):
   - Ensure UX spec reflects the selected visual language
   - Add concept reference to AI explorations section

Would you like me to help with any of these next steps?
```

## Important Notes

### Enhanced State Management (NEW)

All captured data stored in project state includes:

**Core concept data:**

- Concept name, ID, visual characteristics
- Asset links and storage location

**Journey context (NEW):**

- Journey steps with goals
- Screen prompts used
- Per-screen prompt file references

**Reference styles (NEW):**

- Source URLs
- Extracted CSS tokens (from Chrome MCP)
- Color palettes, typography, spacing
- Elements to keep/avoid per reference

**Implementation guidance:**

- Component requirements
- Accessibility notes
- Interaction patterns
- Responsive behaviors

### Chrome MCP Integration (NEW)

If Chrome MCP was used during discovery:

1. Capture all extracted CSS tokens
2. Store in `referenceStyles` object
3. Include in exploration log with code block
4. Make available to downstream agents
5. Reference in implementation guidance

**Format for CSS tokens:**

```css
/* Extracted from [URL] via Chrome DevTools MCP */
--color-primary: #1e40af;
--color-accent: #f59e0b;
--font-heading: 'Inter', sans-serif;
--space-base: 8px;
```

### No Mock Data

- Only record concepts that were actually generated and reviewed
- Require real file paths or URLs for assets (no placeholders)
- Never auto-select a concept; this must be explicit user choice
- Single primary concept marked "Selected ✅" at a time
- Preserve alternatives as "Considered" for future reference (optional)

### Validation & Safety

**Required fields:**

- Concept name and ID
- Visual characteristics (colors, typography, layout, style)
- At least 2 key differentiators
- Asset location (real path/URL)

**Optional but recommended:**

- CSS tokens (if Chrome MCP used)
- Screen prompt references
- Journey step context
- Implementation notes

**Warnings:**

- If assets not saved yet: "Please save concept images before logging"
- If CSS tokens available but not captured: "Chrome MCP extracted tokens - include them?"
- If missing implementation notes: "Consider adding guidance for developers"

## Output Artifacts

1. **docs/ui/ui-designer-explorations.md**: Markdown log with:
   - Visual decision details
   - Journey context
   - CSS tokens (if available)
   - Reference assets
   - Implementation guidance

2. **Project State Decision (`ui_concept`)**: Persistent record with:
   - All visual characteristics
   - Journey steps and screen prompts
   - Reference styles and CSS tokens
   - Asset links

3. **Project State Decision (`ui_reference_assets`)**: Reference asset catalog with:
   - Source URLs and types
   - CSS extraction data
   - Elements kept/avoided per asset

4. **Confirmation Summary**: Clear message confirming:
   - What was recorded
   - Where to find artifacts
   - Next steps in workflow

## Integration Points

### Called By

- **UI Designer Liaison Agent**: Via `*log-selection` command
- **Complex Lane**: After user generates and reviews concepts
- **Quick Lane**: Optional manual invocation after using auto-generated brief

### Inputs From

- `discover-ui-journey.md` task state (for journey context)
- `generate-ui-designer-prompt.md` task state (for screen prompts)
- User elicitation (concept selection and asset references)
- Chrome MCP (CSS tokens, if available)

### Outputs To

- `front-end-spec.md` - AI concept exploration section
- `front-end-architecture.md` - Component patterns and design system
- Development stories - Visual direction references
- Quick Lane templates - Concept incorporation

---

## Comparison: Old vs New

### Old Workflow (Single-Shot)

- Single global prompt
- Basic visual characteristics
- Simple asset links
- Minimal context

### New Workflow (Conversational)

- ✅ Per-screen prompts with journey context
- ✅ CSS tokens from Chrome MCP
- ✅ Reference asset catalog with keep/avoid notes
- ✅ Journey mapping linked to prompts
- ✅ Enhanced implementation guidance
- ✅ Richer project state for downstream phases

---

**Version**: 1.0.0
**Last Updated**: 2025-10-05
**Status**: ✅ Production Ready
