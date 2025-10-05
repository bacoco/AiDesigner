<!-- Powered by BMAD™ Core -->

# Generate UI Designer Prompts Task

## Purpose

To generate tailored, per-screen visual concept prompts for Google Nano Banana (Gemini 2.5 Flash Image) based on completed journey discovery. This task consumes the discovery state and outputs individual screen prompts enriched with journey context, CSS tokens, and reference inspiration.

## Prerequisites

**Required:**

- Completed `discover-ui-journey.md` task with full state capture OR
- Quick Lane auto-generated journey inference from PRD

**Inputs:**

- Journey steps with persona, goals, and emotions
- Visual system definition (brand palette, typography, layout)
- Reference assets (URLs with CSS extraction or images)
- Screen-specific requirements (components, states, edge cases)

## Key Activities & Instructions

### Workflow Overview

This task operates in **two modes**:

**Mode A: Complex Lane (Manual Discovery)**

- Loads discovery state from `discover-ui-journey.md` task
- Generates per-screen prompts for all journey steps
- User has full control over all context

**Mode B: Quick Lane (Auto-Inference)**

- Receives pre-populated context from Quick Lane engine
- Generates prompts from PRD-derived journey
- Uses sensible defaults for missing context

### Step 1: Load Discovery State

**If Complex Lane (discovery completed):**

Load the task state from `discover-ui-journey.md`:

```javascript
const discoveryState = {
  flowMode: "inspiration",
  journeySteps: [
    {
      stepName: "Browse products",
      screenPersona: "First-time visitor exploring catalog",
      screenGoal: "Discover product variety",
      requiredComponents: "Product grid, filters, search",
      emotionTags: "Excited, curious",
      edgeCases: "Empty catalog, loading"
    },
    // ... more steps
  ],
  referenceAssets: [
    {
      sourceType: "url",
      sourceUrl: "https://example.com",
      cssVariables: {
        "--color-primary": "#1E40AF",
        // ... CSS tokens
      },
      elementsToKeep: "Clean hierarchy",
      elementsToAvoid: "Dense information"
    }
  ],
  brandPalette: {
    primary: "#1E40AF",
    accent: "#F59E0B",
    // ...
  },
  typography: { ... },
  layoutSystem: { ... },
  illustrationStyle: "...",
  motionNotes: "..."
}
```

**If Quick Lane (auto-inference):**

Accept pre-populated context passed from Quick Lane engine:

```javascript
const quickLaneContext = {
  productName: "TaskFlow Pro",
  projectDescription: "Collaborative task management",
  journeySteps: [...], // Inferred from PRD
  brandPalette: {...},  // Defaults or from UX spec
  typography: {...},    // Defaults
  // ... Quick Lane sensible defaults
}
```

### Step 2: Prepare Visual System Context

Consolidate the visual system into reusable tokens:

```javascript
const visualSystem = {
  brandPaletteColors: `${brandPalette.primary}, ${brandPalette.accent}, ${brandPalette.neutral}`,

  cssVariables: `
--color-primary: ${brandPalette.primary};
--color-accent: ${brandPalette.accent};
--color-neutral: ${brandPalette.neutral};
--font-heading: ${typography.headingFont};
--font-body: ${typography.bodyFont};
--space-base: ${layoutSystem.spacingBase};
${generateSpacingTokens(layoutSystem.spacingScale)}
  `.trim(),

  headingFont: typography.headingFont,
  bodyFont: typography.bodyFont,
  fontScale: `${typography.scale.body} body, ${typography.scale.subtitle} subtitle, ${typography.scale.heading} heading`,

  layoutStructure: layoutSystem.structure,
  spacingTokens: layoutSystem.spacingScale.join(', ') + 'px',
  containerMaxWidth: layoutSystem.maxWidth,
  gridPattern: layoutSystem.gridPattern || 'Responsive grid (3-col desktop, 1-col mobile)',

  illustrationStyle: illustrationStyle,
  motionNotes: motionNotes,
};
```

### Step 3: Generate Per-Screen Prompts

For **EACH journey step**, populate the `ui-designer-screen-prompt.md` template:

```javascript
journeySteps.forEach((step, index) => {
  const screenPrompt = populateTemplate('ui-designer-screen-prompt.md', {
    // Product & Journey Context
    product_name: productName || 'Your Product',
    concept_variations: 3, // or user-specified
    screen_name: step.stepName,
    journey_position: `Step ${index + 1} of ${journeySteps.length}`,
    position_descriptor: getPositionDescriptor(index, journeySteps.length),
    previous_step: index > 0 ? journeySteps[index - 1].stepName : 'Entry point',
    next_step:
      index < journeySteps.length - 1 ? journeySteps[index + 1].stepName : 'Journey complete',

    // Persona & Goals
    persona_mindset: step.screenPersona,
    screen_goal: step.screenGoal,
    success_signal: step.successSignal || `User achieves: ${step.screenGoal}`,
    emotion_tags: step.emotionTags,

    // Visual System (from consolidated tokens)
    brand_palette_colors: visualSystem.brandPaletteColors,
    css_variables: visualSystem.cssVariables,
    heading_font: visualSystem.headingFont,
    body_font: visualSystem.bodyFont,
    font_scale: visualSystem.fontScale,
    layout_structure: visualSystem.layoutStructure,
    spacing_tokens: visualSystem.spacingTokens,
    container_max_width: visualSystem.containerMaxWidth,
    grid_pattern: visualSystem.gridPattern,
    illustration_style: visualSystem.illustrationStyle,
    motion_notes: visualSystem.motionNotes,

    // Reference Assets (passed as array for template loop)
    reference_assets: referenceAssets.map((asset) => ({
      source_type: asset.sourceType,
      source_url_or_description: asset.sourceUrl || asset.description,
      elements_to_keep: asset.elementsToKeep,
      elements_to_avoid: asset.elementsToAvoid,
      css_extracted: !!asset.cssVariables,
      css_tokens: formatCSSTokens(asset.cssVariables),
    })),

    // UI Requirements
    required_components: step.requiredComponents,
    data_states: step.dataStates || 'Default, Loading, Error, Empty',
    edge_cases: step.edgeCases,

    // Accessibility
    contrast_requirements: '4.5:1 for body text, 3:1 for large text (WCAG AA)',
    touch_target_size: '44x44px minimum (WCAG)',
    screen_reader_notes:
      step.screenReaderNotes || 'Ensure semantic HTML and ARIA labels for interactive elements',

    // Voice & States
    voice_guidelines:
      step.voiceGuidelines || 'Concise, action-oriented labels. Avoid verbose instructions.',
    screen_states: step.screenStates || '3 states (default, loading, error/empty)',
  });

  screenPrompts.push({
    stepName: step.stepName,
    stepIndex: index,
    prompt: screenPrompt,
  });
});
```

**Helper Functions:**

```javascript
function getPositionDescriptor(index, total) {
  if (index === 0) return 'Entry point - first impression';
  if (index === total - 1) return 'Final step - completion/confirmation';
  if (index < total / 2) return 'Early journey - exploration phase';
  return 'Late journey - commitment phase';
}

function generateSpacingTokens(spacingScale) {
  return spacingScale
    .map((value, i) => {
      const name = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'][i] || `step-${i}`;
      return `--space-${name}: ${value}px;`;
    })
    .join('\n');
}

function formatCSSTokens(cssVars) {
  if (!cssVars) return 'N/A';
  return Object.entries(cssVars)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}
```

### Step 4: Compile Prompts Document

Create `docs/ui/ui-designer-screen-prompts.md` with all prompts:

```markdown
# UI Designer Screen Prompts

**Product**: {{product_name}}
**Generated**: {{timestamp}}
**Journey Steps**: {{journey_step_count}}

## Journey Overview

{{#each journeySteps}}
{{index}}. **{{stepName}}**

- Persona: {{screenPersona}}
- Goal: {{screenGoal}}
- Emotion: {{emotionTags}}
  {{/each}}

---

## Visual System Summary

### Brand Palette

{{brand_palette_colors}}

### Typography

- Heading: {{heading_font}}
- Body: {{body_font}}
- Scale: {{font_scale}}

### Layout

- Structure: {{layout_structure}}
- Spacing: {{spacing_tokens}}
- Max width: {{container_max_width}}

### Style

- Illustrations: {{illustration_style}}
- Motion: {{motion_notes}}

---

## Per-Screen Prompts

{{#each screenPrompts}}

### {{stepName}} (Step {{stepIndex + 1}})

**Copy this prompt to Google AI Studio:**
```

{{prompt}}

```

**Usage Notes:**
- Model: Gemini 2.5 Flash (or latest Flash Image model)
- Expected output: {{concept_variations}} concept variations
- Aspect ratio: 4:5 (mobile-first)
- States: {{screen_states}}

---

{{/each}}

## Next Steps

1. **Copy each prompt** from the code blocks above
2. **Visit Google AI Studio**: https://aistudio.google.com
3. **Create new chat** with Gemini 2.5 Flash
4. **Paste prompt** for each screen
5. **Review generated concepts**
6. **Select your favorite direction**
7. **Log your selection**: Run `*log-selection` command with the UI Designer Liaison

## Reference Assets

{{#each referenceAssets}}
- **{{sourceType}}**: {{sourceUrl}}
  - Keep: {{elementsToKeep}}
  - Avoid: {{elementsToAvoid}}
{{/each}}

---

*Generated by Agilai UI Designer Workflow*
*Template version: 1.0.0*
```

### Step 5: Create Brief Summary (Legacy Support)

For backward compatibility, also generate `docs/ui/ui-designer-brief.md`:

```markdown
# UI Designer Visual Concept Brief

## Product Overview

**Name**: {{product_name}}
**Description**: {{product_description}}
**Primary Users**: {{primary_users}}

## Journey Map

{{#each journeySteps}}
{{index + 1}}. **{{stepName}}**: {{screenGoal}}
{{/each}}

## Visual Direction

- **Colors**: {{brand_palette_colors}}
- **Typography**: {{typography_summary}}
- **Layout**: {{layout_structure}}
- **Style**: {{illustration_style}}

## How to Use This Brief

This brief provides the foundation for visual concept exploration. For detailed, per-screen prompts optimized for Google Nano Banana, see:

**📄 [UI Designer Screen Prompts](./ui-designer-screen-prompts.md)**

The screen prompts document contains:

- Individual prompts for each journey step
- CSS tokens and design system details
- Reference inspiration notes
- Google AI Studio usage instructions

## Legacy Note

This brief supports the single-shot workflow. For the **conversational designer experience** with per-screen prompts, journey mapping, and CSS extraction, use the screen prompts document above.

---

*To log your selected concept, run `*log-selection` with the UI Designer Liaison\*
```

### Step 6: Confirm & Guide Next Steps

**Liaison Message:**

```
✅ **Visual concept prompts generated!**

**Created Files:**
- 📄 `docs/ui/ui-designer-screen-prompts.md` - Per-screen prompts (RECOMMENDED)
- 📄 `docs/ui/ui-designer-brief.md` - Journey summary

**Journey Mapped:**
{{journeySteps.length}} screens defined:
{{#each journeySteps}}
  {{index + 1}}. {{stepName}}
{{/each}}

**Visual System:**
✅ Color palette: {{brand_palette.primary}}, {{brand_palette.accent}}, {{brand_palette.neutral}}
✅ Typography: {{typography.headingFont}} / {{typography.bodyFont}}
✅ Layout: {{layoutSystem.structure}}

**Next Steps:**

1. **Open** `docs/ui/ui-designer-screen-prompts.md`
2. **Copy** each screen prompt (in code blocks)
3. **Visit** https://aistudio.google.com
4. **Select** Gemini 2.5 Flash model
5. **Paste** prompts one at a time
6. **Review** generated concepts for each screen
7. **Pick** your favorite direction
8. **Log selection** by running `*log-selection`

Would you like me to walk you through using the prompts in Google AI Studio?
```

## Important Notes

### State Reuse

All context from discovery is reused:

- Journey steps → Per-screen prompts
- Visual system → Consistent tokens across all prompts
- Reference assets → Included in every screen prompt
- CSS extraction → Embedded as design tokens

### Fallback Handling

**If discovery state is incomplete:**

1. Use PRD/UX spec to infer missing context
2. Apply sensible defaults for modern SaaS
3. Warn user about inferred values
4. Suggest re-running discovery for better prompts

**Default Visual System (if missing):**

```javascript
{
  brandPalette: {
    primary: "#1E40AF", // Deep blue
    accent: "#F59E0B",  // Amber
    neutral: "#6B7280"  // Gray
  },
  typography: {
    headingFont: "Inter Bold",
    bodyFont: "Inter Regular",
    scale: { body: "14px", subtitle: "18px", heading: "24px" }
  },
  layoutSystem: {
    structure: "Card-based with generous whitespace",
    spacingBase: "8px",
    spacingScale: [8, 16, 24, 32, 48, 64],
    maxWidth: "1200px"
  },
  illustrationStyle: "Minimal with subtle gradients",
  motionNotes: "Subtle transitions (200-300ms), soft hover effects"
}
```

### No Mock Data

- Never invent placeholder journey steps
- Always use actual discovery state or PRD-derived steps
- If context is missing, elicit from user or use documented defaults
- Warn when defaults are applied

### Chrome MCP Integration

Reference assets with CSS extraction should include:

- Original URL
- Extracted CSS variables
- Palette colors (hex codes)
- Typography stack
- Spacing tokens

Format for template:

```javascript
{
  sourceType: "url",
  sourceUrl: "https://linear.app",
  cssVariables: {
    "--color-primary": "#5E6AD2",
    "--font-base": "'Inter', sans-serif",
    "--space-unit": "4px"
  },
  elementsToKeep: "Minimal sidebar, generous spacing",
  elementsToAvoid: "Overly complex nested menus"
}
```

## Output Artifacts

**Primary:**

- `docs/ui/ui-designer-screen-prompts.md` - Per-screen prompts with full context

**Secondary (Legacy):**

- `docs/ui/ui-designer-brief.md` - Journey summary and visual direction

**State:**

- Stores generated prompts in project state for `record-ui-designer-selection.md` task

## Integration Points

**Called By:**

- UI Designer Liaison Agent: Via `*assemble-prompts` command (after discovery)
- Quick Lane: Automatically during `execute()` workflow
- Complex Lane UX Expert: Optional step after front-end spec

**Inputs From:**

- `discover-ui-journey.md` task state (Complex Lane)
- Quick Lane context object (Quick Lane)
- PRD/UX spec (fallback)

**Outputs To:**

- `record-ui-designer-selection.md` - Screen prompts + selected concepts
- `front-end-spec.md` - AI concept exploration section
- Developers - CSS tokens and design system

---

## Quick Lane vs Complex Lane

### Quick Lane Flow

1. User request → PRD generated
2. Journey steps inferred from PRD user stories
3. Sensible visual defaults applied
4. Prompts auto-generated
5. User reviews `docs/ui/ui-designer-screen-prompts.md`
6. User optionally logs selection

### Complex Lane Flow

1. User runs `@ui-designer-liaison`
2. Executes `*discover-journey` (full 6-stage flow)
3. User provides detailed context, inspiration, CSS extraction
4. Executes `*assemble-prompts` (this task)
5. Prompts generated from rich discovery state
6. User reviews, generates concepts, logs selection

Both flows output identical file structure for consistency.

---

**Version**: 1.0.0
**Last Updated**: 2025-10-05
**Status**: ✅ Production Ready
