# Product Requirements Document

# Quick Designer v4 - Interactive UI Generation System

## Executive Summary

Build an AI-driven UI generation system where users can interactively design interfaces through conversation, with real-time design system editing that affects multiple distinct layout variations.

## Problem Statement

Current UI builders either use static templates or generate identical layouts with minor text changes. We need a system that:

- Generates completely different layout structures for each variation
- Allows real-time design system editing (colors, fonts, spacing)
- Uses AI to create unique layouts, not templates
- Enables conversational UI design ("I want something like Stripe")

## Core Requirements

### 1. AI-Driven Generation (NO TEMPLATES)

- **CRITICAL**: No HTML templates allowed - everything must be AI-generated
- Each variation must have a fundamentally different layout structure
- AI should understand design intent and create appropriate layouts

### 2. Variation Types Required

#### Dashboard Variations (3 minimum)

1. **Analytics Focus**
   - 60% screen dedicated to charts (line, bar, pie, area)
   - KPI cards at top
   - Real-time data indicators
   - Mini charts in sidebar

2. **Data Table Focus**
   - Large data table as central element
   - Filtering toolbar
   - Bulk actions bar
   - Row selection checkboxes
   - Pagination controls
   - Summary statistics bar

3. **Minimal Cards**
   - Grid of metric cards only
   - No charts or tables
   - Large numbers with trends
   - Clean typography focus

#### Login Variations (3 minimum)

1. **Minimal**
   - Single centered card
   - Email/password only
   - No social options

2. **Split Screen**
   - Left: Full-height branding/image area
   - Right: Login form
   - Social login options

3. **Card Floating**
   - Full-screen gradient/image background
   - Floating glass-morphism card
   - Logo prominent

#### Pricing Variations (3 minimum)

1. **Simple Cards**
   - 3 pricing tiers side-by-side
   - Feature lists
   - One tier highlighted

2. **Comparison Table**
   - Features as rows
   - Plans as columns
   - Checkmarks/crosses for features

3. **Detailed**
   - Pricing selector sidebar
   - Feature details main area
   - FAQ section below

### 3. Interactive Design System Editor

#### Real-time Controls

- **Color Palette Selector**
  - Pre-defined palettes (Ocean, Sunset, Forest, etc.)
  - Custom color picker
  - Changes apply instantly to ALL variations

- **Typography Selector**
  - Font family dropdown
  - Font scale slider
  - Google Fonts integration

- **Component Controls**
  - Border radius slider (0-24px)
  - Shadow intensity levels
  - Spacing scale adjustment

#### Critical Feature: Live Updates

- When user changes any design property, ALL variation iframes update immediately
- Use CSS variables injection into iframe documents
- No page reload required

### 4. Conversational Design Flow

#### User Inputs Supported

- URLs: "I want something like stripe.com"
- Images: Upload screenshot for design extraction
- Natural language: "Modern SaaS dashboard with dark theme"

#### Workflow States

1. INITIAL_BRIEF - Gathering requirements
2. COLLECTING_REFERENCES - Adding design sources
3. ANALYZING_DESIGN - Processing references
4. GENERATING_VARIANTS - Creating options
5. REFINING_OUTPUT - Applying feedback
6. BUILDING_PAGES - Adding screens
7. EXPORT_READY - Ready for export

### 5. Technical Architecture

```
User Input → Design Extraction → AI Prompt Building → HTML Generation
     ↓              ↓                    ↓                   ↓
   (URL)    (Extract colors,    (Build specific      (Generate unique
  (Image)    fonts, layout)      layout prompt)       HTML structure)
  (Text)
```

#### Key Modules

- **ui-generator.ts**: AI prompt builder and HTML generator
- **design-extractor.ts**: Extract design from URL/image
- **workflow-manager.ts**: Conversation state management
- **quick-designer-integration.ts**: System integration

### 6. AI Prompt Engineering

#### Example Prompt Structure

```
Generate HTML for a [SCREEN_TYPE] with [VARIATION_NAME] layout:

Specific Requirements:
- [Detailed layout instructions]
- [Component placement]
- [Visual hierarchy]

Technical Requirements:
- Use CSS variables for ALL colors: var(--primary), var(--accent), etc.
- Use var(--font-family) for fonts
- Use var(--border-radius) for corners
- Include inline styles
- Make it responsive
- No external dependencies
```

### 7. HTML Generation Requirements

#### CSS Variables (Required in ALL generated HTML)

```css
:root {
  --primary: /* from design system */ --accent: /* from design system */
    --neutral: /* from design system */ --bg: /* from design system */
    --surface: /* from design system */ --font-family: /* from design system */
    --border-radius: /* from design system */ --shadow-sm: /* from design system */
    --shadow-md: /* from design system */ --shadow-lg: /* from design system */;
}
```

#### Layout Diversity Examples

- **Analytics**: Charts take 60%+ of screen space
- **Tables**: Table is the main component, charts minimal
- **Cards**: Only metric cards, no charts or tables
- **Split**: Two distinct sections side-by-side
- **Floating**: Centered element over full-screen background
- **Stacked**: Vertical sections with clear separation

## Success Criteria

### Must Have

- [ ] Each variation has COMPLETELY different HTML structure
- [ ] Design system changes apply to ALL variations instantly
- [ ] AI generates HTML from prompts, no templates
- [ ] At least 3 distinct variations per screen type
- [ ] Live preview in iframes
- [ ] CSS variables used throughout

### Should Have

- [ ] URL design extraction (Chrome MCP integration)
- [ ] Image analysis for design extraction
- [ ] Design system fusion (60% Stripe + 40% Airbnb)
- [ ] Export to HTML/React/Tailwind

### Could Have

- [ ] Animation presets
- [ ] Accessibility scoring
- [ ] Performance optimization
- [ ] Figma export

## Implementation Notes

### DO NOT

- Use static HTML templates
- Generate similar layouts with different text
- Hardcode colors/fonts in generated HTML
- Create variations that look the same

### DO

- Generate unique layout structures via AI
- Use CSS variables for all styling
- Create visually distinct variations
- Test that design changes apply everywhere
- Focus on layout diversity

## Acceptance Tests

1. **Variation Test**: Open demo, each variation must look structurally different
2. **Design System Test**: Change color palette, ALL variations update
3. **Typography Test**: Change font, ALL variations update
4. **Border Radius Test**: Adjust slider, ALL variations update
5. **AI Generation Test**: Each variation uses different HTML structure

## References

- User requirement: "je veux un outils totalement generique c'est l'ia qui doit generer a la volee les pages html pas de template neessaire"
- Example image: Shows 4 dashboard variations with completely different layouts (Sales & Marketing, DevOps, Product Analytics, Financial Operations)

## Current Implementation FAILURES ❌

### What's Actually Wrong

1. **SAME COLORS EVERYWHERE** - All variations use identical color scheme
2. **SAME LAYOUT PHILOSOPHY** - All follow same design patterns
3. **NO REAL VARIATION** - Just moving same elements around
4. **FAKE AI** - Hardcoded HTML pretending to be AI-generated
5. **NO STYLE DIVERSITY** - All look like they're from same designer

### What Real Variations Should Look Like

#### DIFFERENT VISUAL STYLES COMPLETELY

1. **Analytics Dashboard**
   - Dark theme with neon accents (like Grafana)
   - Charts with gradient fills
   - Black background, cyan/purple data viz

2. **Table Dashboard**
   - Light minimal theme (like Linear)
   - Subtle grays, single accent color
   - Extreme minimalism, lots of whitespace

3. **Cards Dashboard**
   - Bold colorful (like Stripe)
   - Each card different bright color
   - Strong shadows, playful feel

#### DIFFERENT LAYOUT PHILOSOPHIES

1. **Dense Information** - Cramming maximum data (Bloomberg Terminal style)
2. **Spacious Luxury** - Massive whitespace (Apple style)
3. **Brutalist** - Raw, angular, harsh (like Vercel)
4. **Organic** - Rounded, soft, flowing (like Spotify)

## Real Requirements (NOT BEING MET)

### Variation Examples That Actually Work

**Dashboard 1: Financial Terminal Style**

```
- Background: #0A0E1B (almost black)
- Primary: #00FF88 (bright green)
- Text: #FFFFFF on dark
- Dense grid, tiny fonts, maximum data
- No rounded corners, harsh edges
```

**Dashboard 2: Health App Style**

```
- Background: #FFFFFF (pure white)
- Primary: #FF6B6B (coral red)
- Accent: #4ECDC4 (teal)
- Soft rounded cards (24px radius)
- Pastel colors, friendly fonts
- Lots of empty space
```

**Dashboard 3: Developer Tool Style**

```
- Background: #1E1E1E (dark gray)
- Primary: #646CFF (purple)
- Code: #97E552 (lime green)
- Monospace fonts everywhere
- Terminal aesthetic
- ASCII art elements
```

### What AI Must Generate

The AI needs to understand design movements and generate accordingly:

```javascript
// WRONG - What we have now
if (variation === 'Analytics') {
  return `<div style="color: var(--primary)">Same shit different name</div>`;
}

// RIGHT - What we need
if (variation === 'Bloomberg Terminal') {
  return `
    <!-- Dark theme, dense data, financial aesthetic -->
    <div style="background: #000; color: #0F0; font-family: monospace;">
      <!-- Actual Bloomberg-style layout with data tables -->
    </div>
  `;
} else if (variation === 'Spotify Style') {
  return `
    <!-- Organic shapes, gradients, playful -->
    <div style="background: linear-gradient(#1DB954, #191414); border-radius: 32px;">
      <!-- Spotify-inspired with album art style cards -->
    </div>
  `;
}
```

## Testing Criteria (CURRENTLY FAILING ALL)

### Visual Diversity Test

- [ ] Screenshot each variation
- [ ] They should look like from different companies
- [ ] Color schemes must be different
- [ ] Typography choices must vary
- [ ] Spacing philosophy must differ

### Style Test

- [ ] One should look corporate (IBM style)
- [ ] One should look startup (Stripe style)
- [ ] One should look brutal (Bloomberg style)
- [ ] One should look playful (Duolingo style)

### Not Just Moving Boxes Around

- [ ] Different component types (not just cards everywhere)
- [ ] Different visual metaphors
- [ ] Different interaction patterns implied

## The Real Problem

**We're generating "variations of the same theme" instead of "different themes"**

It's like asking for:

- Italian restaurant website
- Japanese restaurant website
- Mexican restaurant website

And getting three identical layouts with different food names. That's WRONG.

## Actual Implementation Needed

### AI Prompt Examples That Work

**For Financial Dashboard:**

```
Create a dashboard like Bloomberg Terminal:
- Black background (#000000)
- Green monospace text (#00FF00)
- Dense data tables with no spacing
- Multiple small charts in grid
- Stock ticker style scrolling
- No rounded corners
- Terminal/DOS aesthetic
```

**For Lifestyle Dashboard:**

```
Create a dashboard like Peloton/Apple Fitness:
- White background with subtle gradients
- Large circular progress rings
- Coral and teal accents
- Huge numbers with thin fonts
- Lots of whitespace
- Card-based with 32px border radius
- Motivational, energetic feel
```

**For Developer Dashboard:**

```
Create a dashboard like GitHub/Vercel:
- Dark mode (#0D1117 background)
- Syntax highlighting colors
- Code-style metrics display
- Git-style activity graph
- Monospace fonts for numbers
- Minimal color (mostly grayscale)
- Sharp 4px border radius
```

## Deliverables Required

1. **Working Demo** where switching variations shows COMPLETELY DIFFERENT DESIGNS
2. **No CSS variables** for colors in variations (each has own palette)
3. **Different font stacks** per variation
4. **Different spacing systems** per variation
5. **Different component styles** per variation

## Definition of Done

When someone looks at the variations, they should say:

- "Oh, this one looks like Stripe"
- "This one looks like Bloomberg"
- "This one looks like Apple"
- "This one looks like Vercel"

NOT: "These all look the same with slightly different layouts"

## Technical Debt from Current Implementation

- SimpleAIService returns same HTML with minor text changes
- Variations are not visually distinct
- AI prompts are built but not properly processed
- Need real AI service integration (Claude API, GPT, etc.)
- **All variations use same design system (WRONG)**
- **No actual style diversity (CRITICAL BUG)**
- **Fake variations - just rearranging same components**

---

**Priority: HIGH**
**Estimated Effort: 1-2 weeks**
\*\*Dependencies: AI Service API (Claude/GPT)</content>
