<!-- Powered by BMAD™ Core -->

# Record Nano Banana Selection Task

## Purpose

To capture the chosen Google Nano Banana visual concept exploration and persist the design decision for downstream architecture, UX specifications, and development phases. This task bridges AI-powered ideation and implementation by documenting which visual direction was selected and why.

## Prerequisites

- User has run the Nano Banana prompt in Google AI Studio
- User has received multiple concept variations (typically 3-4)
- User has reviewed concepts with stakeholders (if applicable)
- User has selected one concept as the primary visual direction

## Key Activities & Instructions

### 1. Elicit Concept Selection Details

Ask the user to provide the following information about their selected concept. Be conversational but thorough:

#### 1.1 Basic Selection Information

- **Concept Identifier**: Which concept did you choose? (e.g., "Concept 2", "Option B", "The gradient-based design")
- **Concept Name/Label**: Give it a memorable name for team reference (e.g., "Clean Professional", "Vibrant Energy", "Minimal Trust")

#### 1.2 Visual Characteristics

Capture the defining visual elements of the chosen concept:

- **Color Palette**: What are the primary colors used? (hex codes if available)
- **Typography Style**: How would you describe the typography? (modern, classic, bold, elegant, etc.)
- **Layout Approach**: What's the overall layout structure? (card-based, list-based, grid, asymmetric, etc.)
- **Visual Style**: What's the illustration/visual treatment? (flat, gradient, 3D, minimal, hand-drawn, photographic, etc.)
- **Overall Aesthetic**: Sum up the feeling in 2-3 adjectives (e.g., "professional, trustworthy, efficient")

#### 1.3 Key Differentiators

Ask: "What made you choose this concept over the others?"
Capture 2-4 specific reasons, such as:

- Better alignment with brand values
- Clearer information hierarchy
- More accessible contrast/readability
- Stronger visual differentiation
- Better user flow clarity
- More scalable component system

#### 1.4 Asset References

Gather links or references to the generated assets:

- **Generated Images**: URLs, file paths, or screenshot locations
- **Storage Location**: Where are these assets saved? (e.g., Figma, Google Drive, project repo)
- **Frame/File Names**: Specific identifiers for each screen in the concept set

Example: "All 4 screens saved to `docs/ui/concepts/clean-professional/*.png`"

#### 1.5 Implementation Guidance

Ask: "What should the development team know about implementing this concept?"
Capture any important notes:

- Component consistency requirements (e.g., "Use the same button style across all screens")
- Accessibility considerations (e.g., "Maintain 4.5:1 contrast ratio for all text")
- Animation/interaction hints (e.g., "Cards should have subtle hover lift effect")
- Responsive adaptation notes (e.g., "On desktop, show sidebar navigation instead of bottom nav")

### 2. Create Exploration Log Entry

Use the `create-doc.md` task to append to `docs/ui/nano-banana-explorations.md` (create if doesn't exist).

If this is the first entry, create the document with:

```markdown
# Google Nano Banana Concept Explorations

This document tracks visual concept explorations generated with Google Nano Banana (Gemini 2.5 Flash Image) and records design decisions for downstream phases.

---

## [Concept Name] - [Date]

**Status**: Selected ✅

**Concept Identifier**: [Which variation was chosen]

### Visual Characteristics

- **Color Palette**: [Colors/hex codes]
- **Typography**: [Style description]
- **Layout**: [Approach description]
- **Visual Style**: [Treatment description]
- **Aesthetic**: [Adjectives]

### Key Differentiators

1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

### Asset References

- **Location**: [Where assets are stored]
- **Files**: [Specific file names or paths]
- **Screens Included**:
  1. Search/Browse screen
  2. Create/Compose screen
  3. Sign Up screen
  4. Sign In screen

### Implementation Guidance

[Notes for development team]

### Decision Rationale

[Why this concept was selected over alternatives]

---
```

If `docs/ui/nano-banana-explorations.md` already exists, append the new entry with a horizontal rule separator.

### 3. Persist Decision to Project State

Call the MCP `recordDecision` tool/method with the following structure:

**Key**: `ui_concept`

**Value** (object):

```javascript
{
  conceptName: "[The memorable name given to the concept]",
  conceptId: "[Concept identifier from Google AI Studio]",
  selectedDate: "[ISO date string]",
  summary: "[2-3 sentence summary of the concept]",
  colorPalette: ["#hex1", "#hex2", "#hex3"],
  typography: "[Style description]",
  visualStyle: "[Treatment description]",
  aesthetic: "[Adjectives]",
  assetLinks: [
    "path/to/screen-1.png",
    "path/to/screen-2.png"
  ],
  keyDifferentiators: [
    "[Reason 1]",
    "[Reason 2]"
  ],
  implementationNotes: "[Guidance for dev team]"
}
```

**Rationale**: "[Why this concept was chosen - from decision rationale section]"

### 4. Confirm and Guide Next Steps

After logging the selection:

1. **Confirm the recording**:
   - "✅ Concept '[Name]' recorded to project state"
   - "📝 Exploration log updated: docs/ui/nano-banana-explorations.md"

2. **Explain downstream impact**:
   - The frontend architecture will reference this concept
   - UX specifications will include this as the design foundation
   - Development stories will mention the selected visual direction
   - Quick Lane specs will incorporate the concept if available

3. **Recommend next actions**:
   - Proceed to architecture phase (if in Complex Lane workflow)
   - Update UX spec to reference the exploration (if needed)
   - Share the exploration log with the development team
   - Consider creating high-fidelity mockups in Figma/design tool based on selected concept

## Important Notes

- **No Mock Data**: Only record concepts that were actually generated and reviewed by the user
- **Actual Asset Paths**: Require real file paths or URLs, not placeholder references
- **User Decision Required**: Never auto-select a concept; this must be an explicit user choice
- **Single Primary Concept**: Only one concept should be marked as "Selected ✅" at a time
- **Preserves Alternatives**: Document other concepts as "Considered" for future reference if desired

## Output Artifacts

1. **docs/ui/nano-banana-explorations.md**: Markdown log with visual decision details
2. **Project State Decision**: Persistent record accessible to all downstream agents and Quick Lane
3. **Confirmation Summary**: Clear message to user confirming what was recorded and next steps

## Integration Points

This task is called:

- **Complex Lane**: After UX Expert generates the Nano Banana prompt and user runs it in Google AI Studio
- **Quick Lane**: Can be invoked manually after user generates concepts from the emitted brief
- **Manual Mode**: User can call `@nano-banana-liaison` then `*log-nano-selection` anytime
