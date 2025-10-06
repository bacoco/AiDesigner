# AiDesigner Complete Workflow Guide

## Overview

AiDesigner provides an integrated workflow that takes you from initial idea to production-ready code in one continuous conversation. This guide walks you through the complete journey across three phases.

## The Three Phases

```
💡 Idea & Discovery
    ↓
🎨 UI Design (The Innovation)
    ↓
🚀 Agile Implementation
```

---

## Phase 1: Idea & Discovery

### What Happens

Natural conversation about your concept, target users, and success criteria.

### Your Role

Answer questions naturally. No need to structure your thoughts formally.

### Example Dialogue

```
AI: "What are you building?"

You: "A task management app for remote teams"

AI: "Great! Who are the main users?"

You: "Team leads who assign work, and team members who complete tasks"

AI: "What's the main problem you're solving?"

You: "Teams lose track of who's working on what, especially across time zones"

AI: "Perfect. What does success look like for this product?"

You: "When team leads can see real-time status without asking, and team
     members can update progress without meetings"
```

### Outputs

- Clear understanding of problem space
- User personas identified
- Success criteria defined
- Foundation for UI design phase

---

## Phase 2: UI Design (The Innovation)

### What Happens

Conversational UI Designer walks you through each screen of your application, extracts design tokens from inspiration, and generates visual concepts.

### The Process

#### Step 1: Inspiration Gathering

```
AI: "Do you have any design inspiration? URLs of apps with the vibe you want?"

You: "Linear.app has the clean, minimal feel I'm going for"

AI: "Perfect! Let me extract their design tokens using Chrome DevTools MCP..."
```

**What Gets Extracted:**

- Color palette (hex codes)
- Typography (font families, weights, sizes)
- Spacing system (margins, padding in px)
- Border radius patterns
- Shadow styles

#### Step 2: Design Token Refinement

```
AI: "Here's what I extracted from Linear.app:

    🎨 Colors:
    - Primary: #5E6AD2 (purple-blue)
    - Accent: #3D9970 (green)
    - Neutral: #6B7280 (gray)
    - Background: #FAFAFA

    ✍️ Typography:
    - Font: 'Inter', sans-serif
    - Heading weights: 600
    - Body weight: 400
    - Scale: 12px, 14px, 16px, 20px, 24px

    📏 Spacing:
    - System: 4px, 8px, 12px, 16px, 24px, 32px, 48px

    What should we KEEP vs CHANGE?"

You: "Keep the purple and spacing system. Change the green to orange for
      our brand. Make typography slightly larger overall."

AI: "Got it! Updated design system:
    - Primary: #5E6AD2 (kept)
    - Accent: #FF6B35 (orange)
    - Spacing: 4px system (kept)
    - Typography: Scale increased by 2px

    These tokens will be locked in for all screens."
```

#### Step 3: Journey Mapping

```
AI: "Walk me through the user journey. What's the first screen users see?"

You: "Dashboard showing all active tasks"

AI: "Great! What's the user's mindset when they land here?"

You: "They want a quick overview of what needs attention today"

AI: "What actions can they take from the dashboard?"

You: "Filter by person, status, or due date. Click into a task for details."

AI: "Perfect. What's the next step in their journey?"

You: "Drilling into a specific task to see full details and comments"

[... continues for each screen ...]
```

#### Step 4: Visual Concept Generation

```
AI: "✅ Journey mapped! 5 screens identified:
    1. Dashboard (overview)
    2. Task details
    3. Create new task
    4. Team members
    5. Settings

    Generating visual concept prompts for each screen..."
```

**What You Get:**

For each screen, a detailed prompt for Gemini/Nano Banana that includes:

- Journey context (what screen comes before/after)
- User mindset and goals
- Locked design tokens (colors, fonts, spacing)
- Component requirements
- Emotional tone
- Accessibility requirements

#### Step 5: Design Decision Logging

```
AI: "Visual prompts generated!
    📄 Saved to: docs/ui/ui-designer-screen-prompts.md

    Ready to generate concepts in Google AI Studio?

    Once you've selected your favorite concepts, use *log-selection
    to record which designs you chose. This informs the development phase."
```

### Outputs

- `docs/ui/ui-designer-screen-prompts.md` - Per-screen visual prompts
- `docs/ui/design-tokens.json` - Extracted and refined design system
- `docs/ui/ui-designer-explorations.md` - Design decisions log
- Chrome MCP evidence pack (colors, typography, CSS from inspiration)

---

## Phase 3: Agile Implementation

### What Happens

Design decisions automatically flow into PRD, architecture, and development stories with design-locked constraints.

### The Process

#### Step 1: Automatic PRD Generation

```
AI: "Based on your design decisions, I'm generating the PRD...

    ✅ Product Requirements Document created
    📄 docs/prd.md

    Includes:
    - User stories from journey mapping
    - Visual requirements from design tokens
    - Component specifications (Shadcn/MUI)
    - Acceptance criteria with design constraints"
```

#### Step 2: Technical Architecture

```
AI: "Generating technical architecture with component mappings...

    ✅ Architecture Document created
    📄 docs/architecture.md

    Key decisions:
    - UI Framework: React with TypeScript
    - Component Library: Shadcn (matches design system)
    - Design Tokens: CSS custom properties from design phase
    - State Management: Based on your interaction requirements"
```

#### Step 3: Development Stories with Design Context

```
AI: "Creating development-ready stories...

    ✅ Stories generated
    📁 docs/stories/

    Each story includes:
    - Functional requirements
    - Design specifications (tokens, components)
    - Visual mockup reference
    - Acceptance criteria with design validation"
```

#### Step 4: Code Generation

The POC implementation (apps/aidesigner-poc) demonstrates code generation:

```bash
# Extract tokens from your inspiration URL
cd apps/aidesigner-poc
npm run dev https://linear.app

# Outputs:
out/<timestamp>/
├── data/
│   ├── tokens.json          # Design system from extraction
│   └── components.map.json  # Detected components
├── generated/
│   └── shadcn-app/
│       ├── page.tsx         # React components
│       └── globals.css      # Token-based styles
└── reports/
    └── drift.json          # Design validation
```

### Outputs

- `docs/prd.md` - Product requirements with visual specs
- `docs/architecture.md` - Technical architecture with component mappings
- `docs/stories/*.md` - Development stories with design context
- `apps/aidesigner-poc/out/` - Generated code (if using POC)

---

## The Key Innovation: Design-to-Development Continuity

### Traditional Workflow

```
Designer creates mockups
    ↓
Handoff to developers
    ↓
Developers interpret designs
    ↓
❌ Inconsistencies emerge
    ↓
Back-and-forth fixes
    ↓
Delayed shipping
```

### AiDesigner Workflow

```
Conversational design with token extraction
    ↓
Design system locked
    ↓
Automatic PRD/architecture generation
    ↓
✅ Code generated with design constraints
    ↓
What you designed is what gets built
    ↓
Ship with confidence
```

---

## Example: Complete Journey in Action

### Input: Your Idea

"I want to build a task management app for remote teams"

### Phase 1 Output: Discovery

- **Problem**: Teams lose track of work across time zones
- **Users**: Team leads (assign) and members (complete)
- **Success**: Real-time status without meetings

### Phase 2 Output: UI Design

**Inspiration**: Linear.app

**Extracted Tokens**:

```json
{
  "colors": {
    "primary": "#5E6AD2",
    "accent": "#FF6B35",
    "neutral": "#6B7280"
  },
  "typography": {
    "family": "Inter",
    "scale": [14, 16, 18, 22, 26]
  },
  "spacing": [4, 8, 12, 16, 24, 32]
}
```

**Screens Mapped**:

1. Dashboard (overview)
2. Task details
3. Create task
4. Team members
5. Settings

**Visual Prompts**: 5 detailed prompts ready for Gemini/Nano Banana

### Phase 3 Output: Implementation

**Generated**:

- PRD with 15 user stories
- Architecture for React + Shadcn
- 25 development stories
- Starter code with locked design tokens

**Development Ready**:

```tsx
// Generated with design-locked tokens
import { Button } from '@/components/ui/button';

const TaskCard = () => (
  <Card className="p-4">
    <Button
      variant="default"
      className="bg-[#5E6AD2]" // Primary from design tokens
    >
      Assign Task
    </Button>
  </Card>
);
```

---

## Best Practices

### During Discovery (Phase 1)

✅ **Do**: Answer naturally, share your vision
❌ **Don't**: Try to structure responses formally

### During UI Design (Phase 2)

✅ **Do**:

- Share inspiration URLs for token extraction
- Be specific about what to keep/change
- Describe user mindset for each screen

❌ **Don't**:

- Skip the design phase (it prevents rework later)
- Use inspiration from too many different sources (inconsistency)

### During Implementation (Phase 3)

✅ **Do**:

- Review generated PRD/architecture
- Validate design tokens match your vision
- Use generated stories as development guide

❌ **Don't**:

- Manually override design tokens (breaks consistency)
- Skip validation reports (they catch design drift)

---

## Integration with Chrome MCP

### Setup

```bash
# Install Chrome DevTools MCP
npm install chrome-devtools-mcp

# Configure in .mcp.json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "node",
      "args": ["node_modules/chrome-devtools-mcp/dist/index.js"]
    }
  }
}
```

### Usage During Design Phase

When you share an inspiration URL:

1. Chrome MCP opens the URL
2. Extracts DOM, CSSOM, accessibility tree
3. Infers design tokens (colors, fonts, spacing)
4. AI presents extracted tokens for your refinement
5. Refined tokens lock into all generated outputs

### Evidence-Driven Defaults

- **Weighted blending:** Chrome MCP captures contribute the highest weight when synthesizing palettes and typography. CSS-only references provide medium weight, and manual descriptions provide baseline weight. The resulting preset includes confidence notes and a full evidence trail.
- **Fallback transparency:** If no Chrome MCP artifacts are found, the workflow still blends provided inspiration but marks the defaults as low confidence so engineering knows they were inferred. Once real evidence is available, rerun the prompt task to refresh the defaults.
- **Override anytime:** Provide overrides (e.g., "Use brand primary #0052CC") and the system updates both the prompts and the downstream Nano Banana selection log while preserving the evidence history.

---

## What Gets Created

```
your-project/
├── docs/
│   ├── prd.md                          # Product requirements
│   ├── architecture.md                 # Technical architecture
│   ├── stories/                        # Development stories
│   │   ├── story-1-dashboard.md
│   │   ├── story-2-task-details.md
│   │   └── ...
│   └── ui/                             # UI design artifacts
│       ├── design-tokens.json          # Locked design system
│       ├── ui-designer-screen-prompts.md  # Visual concept prompts
│       └── ui-designer-explorations.md    # Design decisions log
│
└── apps/aidesigner-poc/out/           # Generated code (optional)
    ├── data/
    │   ├── tokens.json
    │   └── components.map.json
    ├── generated/
    │   └── shadcn-app/
    └── reports/
        └── drift.json
```

---

## Next Steps

### After Completing the Workflow

1. **Review outputs** in `docs/` folder
2. **Generate visual concepts** using prompts in Google AI Studio
3. **Log your design selections** with `*log-selection`
4. **Start development** using stories as guide
5. **Validate against design tokens** using drift reports

### For Production

- Integrate design tokens into your CSS/Tailwind config
- Use component mappings (Shadcn/MUI) from architecture
- Run codemods to ensure token compliance
- Automate drift detection in CI/CD

---

## Troubleshooting

### "Chrome MCP not extracting tokens"

**Solution**:

1. Verify Chrome DevTools MCP is installed
2. Check `.mcp.json` configuration
3. Ensure the inspiration URL is publicly accessible

### "Generated code doesn't match design"

**Solution**:

1. Check `docs/ui/design-tokens.json` was created
2. Verify tokens in generated CSS match refined values
3. Run drift report: `npm run dev <url>` in aidesigner-poc

### "Too many screens to map"

**Solution**:

- Focus on core user journey (3-5 key screens)
- Additional screens can be mapped later
- Use Quick Lane for automatic inference

---

## Learn More

- **[User Guide](user-guide.md)** - Detailed BMAD methodology
- **[AiDesigner Strategy](aidesigner-strategy.md)** - Strategic vision
- **[AiDesigner POC Kit](aidesigner-poc-kit.md)** - Implementation details
- **[MCP Management](mcp-management.md)** - Chrome MCP setup

---

**Ready to start?**

```bash
npx aidesigner@latest start
```

The AI will guide you through the complete journey: Idea → Design → Implementation.
