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

Accept pre-populated context passed from Quick Lane engine **and attempt to hydrate it with stored Chrome MCP artifacts before falling back to SaaS defaults**:

```javascript
const quickLaneContext = {
  productName: "TaskFlow Pro",
  projectDescription: "Collaborative task management",
  journeySteps: [...], // Inferred from PRD
  chromeMcpEvidence: loadEvidence('docs/ui/chrome-mcp/*.json'),
  brandPalette: {...},  // May be replaced by synthesized preset
  typography: {...},    // May be replaced by synthesized preset
  layoutSystem: {...},  // May be replaced by synthesized preset
  // ... Quick Lane sensible defaults
}
```

> 🔍 **Evidence-first fallback:** Always inspect `chromeMcpEvidence` (or `referenceAssets[].chromeMcpArtifacts`) for CSS variables, extracted palettes, font families, and spacing scales. Only revert to the generic SaaS defaults if **no usable evidence** is available after synthesis.

### Step 2: Prepare Visual System Context

1. **Aggregate Chrome MCP evidence** (if present) into a synthesized preset.
2. **Blend multiple references** to reinforce recurring patterns.
3. **Only fall back to SaaS defaults** if neither the discovery state nor Chrome MCP evidence provides usable tokens.

```javascript
const { packs: evidencePacks, summary: blendSummary } = collectEvidence({
  chromeMcpEvidence,
  referenceAssets,
  discoveryDefaults: { brandPalette, typography, layoutSystem },
});

const synthesizedPreset = synthesizePreset(evidencePacks, blendSummary);

const {
  brandPalette: resolvedPalette,
  typography: resolvedTypography,
  layoutSystem: resolvedLayout,
  illustrationStyle: resolvedIllustration,
  motionNotes: resolvedMotion,
  confidenceNotes,
  evidenceTrail,
} = synthesizedPreset;

const visualSystem = {
  brandPaletteColors: `${resolvedPalette.primary}, ${resolvedPalette.accent}, ${resolvedPalette.neutral}`,

  cssVariables: `
${formatCssBlock(resolvedPalette.cssVariables, resolvedTypography.cssVariables, resolvedLayout.cssVariables)}
  `.trim(),

  headingFont: resolvedTypography.headingFont,
  bodyFont: resolvedTypography.bodyFont,
  fontScale: `${resolvedTypography.scale.body} body, ${resolvedTypography.scale.subtitle} subtitle, ${resolvedTypography.scale.heading} heading`,

  layoutStructure: resolvedLayout.structure,
  spacingTokens: resolvedLayout.spacingScale.map((value) => `${value}px`).join(', '),
  containerMaxWidth: resolvedLayout.maxWidth,
  gridPattern: resolvedLayout.gridPattern || 'Responsive grid (3-col desktop, 1-col mobile)',

  illustrationStyle: resolvedIllustration,
  motionNotes: resolvedMotion,
  confidenceNotes,
  evidenceTrail,
};

applyBlendMetadata(referenceAssets, evidencePacks);
```

> ✅ **Always annotate defaults with `confidenceNotes`** explaining whether they came from Chrome MCP evidence (high confidence), blended inference (medium), or SaaS fallback (low). Surface the `evidenceTrail` so downstream tasks can cite the exact source of each token.

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
    confidence_notes: visualSystem.confidenceNotes,
    evidence_trail: visualSystem.evidenceTrail,
    reference_blend_summary: blendSummary.blendNotes,

    // Reference Assets (passed as array for template loop)
    reference_assets: (referenceAssets || []).map((asset) => ({
      source_type: asset.sourceType,
      source_url_or_description: asset.sourceUrl || asset.description,
      elements_to_keep: asset.elementsToKeep,
      elements_to_avoid: asset.elementsToAvoid,
      css_extracted: !!asset.cssVariables,
      css_tokens: formatCSSTokens(asset.cssVariables),
      token_weight: asset.tokenWeight,
      typography_pairs: asset.typographyPairs,
      evidence_confidence: asset.evidenceConfidence,
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

function collectEvidence({ chromeMcpEvidence, referenceAssets, discoveryDefaults }) {
  const packs = [];

  if (Array.isArray(chromeMcpEvidence)) {
    chromeMcpEvidence.forEach((artifact) => {
      packs.push({
        source: artifact.sourceUrl || artifact.file,
        type: 'chrome-mcp',
        cssVariables: artifact.cssVariables,
        palette: artifact.palette,
        typography: artifact.typography,
        spacingScale: artifact.spacingScale,
      });
    });
  }

  (referenceAssets || []).forEach((asset) => {
    packs.push({
      source: asset.sourceUrl || asset.description,
      type: asset.cssVariables ? 'reference-css' : 'reference-manual',
      cssVariables: asset.cssVariables,
      palette: asset.palette,
      typography: asset.typography,
      spacingScale: asset.spacingScale,
    });
  });

  if (!packs.length) {
    if (!discoveryDefaults) {
      return {
        packs: [],
        summary: summarizeBlend([], undefined),
      };
    }
    return {
      packs: [
        {
          source: 'SaaS default pack',
          type: 'fallback',
          cssVariables: discoveryDefaults.brandPalette?.cssVariables,
          palette: discoveryDefaults.brandPalette,
          typography: discoveryDefaults.typography,
          spacingScale: discoveryDefaults.layoutSystem?.spacingScale,
          layoutSystem: discoveryDefaults.layoutSystem,
        },
      ],
      summary: summarizeBlend([], discoveryDefaults),
    };
  }

  return {
    packs,
    summary: summarizeBlend(packs, discoveryDefaults),
  };
}

function synthesizePreset(packs, blendSummary) {
  const weights = {};
  const paletteAccumulator = {};
  const typographyAccumulator = {};
  const spacingAccumulator = {};

  packs.forEach((pack) => {
    const baseWeight = pack.type === 'chrome-mcp' ? 3 : pack.type === 'reference-css' ? 2 : 1;
    Object.entries(pack.palette || {}).forEach(([token, value]) => {
      const key = value.toLowerCase();
      paletteAccumulator[key] = (paletteAccumulator[key] || 0) + baseWeight;
      weights[token] = weights[token] || {};
      weights[token][key] = (weights[token][key] || 0) + baseWeight;
    });

    (pack.typography?.pairings || []).forEach((pair) => {
      const key = `${pair.heading}|${pair.body}`.toLowerCase();
      typographyAccumulator[key] = (typographyAccumulator[key] || 0) + baseWeight;
    });

    (pack.spacingScale || []).forEach((value) => {
      const key = `${value}px`;
      spacingAccumulator[key] = (spacingAccumulator[key] || 0) + baseWeight;
    });
  });

  const resolvedPalette = resolvePalette(weights, paletteAccumulator);
  const resolvedTypography = resolveTypography(typographyAccumulator, packs);
  const resolvedLayout = resolveLayout(spacingAccumulator, packs);

  const evidenceTrail = packs.map((pack) => ({
    source: pack.source,
    type: pack.type,
    contributedTokens: Object.keys(pack.cssVariables || {}),
  }));

  const confidenceNotes = buildConfidence(
    resolvedPalette,
    resolvedTypography,
    resolvedLayout,
    packs,
  );

  return {
    brandPalette: resolvedPalette,
    typography: resolvedTypography,
    layoutSystem: resolvedLayout,
    illustrationStyle: blendSummary?.illustrationStyle || 'Clean SaaS with contextual accents',
    motionNotes: blendSummary?.motionNotes || 'Subtle micro-interactions (200ms easing)',
    confidenceNotes,
    evidenceTrail,
  };
}

function summarizeBlend(packs, discoveryDefaults) {
  if (!packs.length) {
    return {
      illustrationStyle: discoveryDefaults?.illustrationStyle || 'Clean SaaS illustration',
      motionNotes: discoveryDefaults?.motionNotes || 'Default SaaS interactions',
      blendNotes: 'No Chrome MCP evidence found — SaaS defaults applied.',
    };
  }

  const recurringSources = packs
    .filter((pack) => pack.type !== 'fallback')
    .map((pack) => pack.source)
    .join(', ');

  return {
    illustrationStyle:
      packs.find((pack) => pack.illustrationStyle)?.illustrationStyle ||
      discoveryDefaults?.illustrationStyle,
    motionNotes:
      packs.find((pack) => pack.motionNotes)?.motionNotes || discoveryDefaults?.motionNotes,
    blendNotes: `Synthesized from ${recurringSources || 'SaaS defaults'}`,
  };
}

function formatCssBlock(...tokenGroups) {
  return tokenGroups
    .filter(Boolean)
    .flatMap((group) => Object.entries(group))
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

function resolvePalette(tokenWeights, paletteAccumulator) {
  const resolved = { primary: '#2563EB', accent: '#F97316', neutral: '#1F2937', cssVariables: {} };
  Object.entries(tokenWeights).forEach(([token, values]) => {
    const sorted = Object.entries(values).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const [winner] = sorted[0];
      resolved[token] = winner.toUpperCase();
      resolved.cssVariables[`--color-${token}`] = winner;
    }
  });

  if (!Object.keys(resolved.cssVariables).length && Object.keys(paletteAccumulator).length) {
    const sorted = Object.entries(paletteAccumulator).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const [fallback] = sorted[0];
      resolved.primary = fallback.toUpperCase();
      resolved.cssVariables['--color-primary'] = fallback;
    }
  }

  return resolved;
}

function resolveTypography(typographyAccumulator, packs) {
  const resolved = {
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    scale: { body: '16px', subtitle: '18px', heading: '28px' },
    cssVariables: {
      '--font-heading': '"Inter", sans-serif',
      '--font-body': '"Inter", sans-serif',
    },
  };

  const sorted = Object.entries(typographyAccumulator).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const [pair] = sorted[0];
    const [heading, body] = pair.split('|');
    resolved.headingFont = heading;
    resolved.bodyFont = body;
    resolved.cssVariables['--font-heading'] = heading;
    resolved.cssVariables['--font-body'] = body;
  }

  const scaleSource = packs.find(
    (pack) => Array.isArray(pack.spacingScale) && pack.typography?.scale,
  );
  if (scaleSource?.typography?.scale) {
    resolved.scale = scaleSource.typography.scale;
  }

  return resolved;
}

function resolveLayout(spacingAccumulator, packs) {
  const resolved = {
    structure: 'Responsive cards with generous whitespace',
    spacingScale: [8, 16, 24, 32, 48, 64],
    maxWidth: '1200px',
    cssVariables: { '--space-base': '8px' },
  };

  const weightedSpacing = Object.entries(spacingAccumulator).sort((a, b) => b[1] - a[1]);
  if (weightedSpacing.length) {
    resolved.spacingScale = weightedSpacing.slice(0, 6).map(([value]) => parseInt(value, 10));
    resolved.cssVariables['--space-base'] = weightedSpacing[0][0];
  }

  const layoutSource = packs.find((pack) => pack.layoutSystem);
  if (layoutSource?.layoutSystem) {
    Object.assign(resolved, layoutSource.layoutSystem);
  }

  return resolved;
}

function buildConfidence(resolvedPalette, resolvedTypography, resolvedLayout, packs) {
  const highConfidence = packs.some((pack) => pack.type === 'chrome-mcp');
  const mediumConfidence = packs.some((pack) => pack.type === 'reference-css');

  if (highConfidence) {
    return `High confidence: palette + typography pulled directly from Chrome MCP evidence (${packs
      .filter((pack) => pack.type === 'chrome-mcp')
      .map((pack) => pack.source)
      .join(', ')}).`;
  }

  if (mediumConfidence) {
    return `Medium confidence: blended recurring tokens from reference URLs (${packs
      .filter((pack) => pack.type === 'reference-css')
      .map((pack) => pack.source)
      .join(', ')}). Override if brand guidance differs.`;
  }

  return 'Low confidence: SaaS defaults applied. Provide brand tokens or rerun Chrome MCP extraction to improve fidelity.';
}

function applyBlendMetadata(referenceAssets, packs) {
  if (!Array.isArray(referenceAssets)) return;

  referenceAssets.forEach((asset) => {
    const pack = packs.find((item) => item.source === (asset.sourceUrl || asset.description));
    if (!pack) return;
    const baseWeight = pack.type === 'chrome-mcp' ? 3 : pack.type === 'reference-css' ? 2 : 1;
    asset.tokenWeight = baseWeight;
    asset.typographyPairs = pack.typography?.pairings || [];
    asset.evidenceConfidence =
      pack.type === 'chrome-mcp' ? 'high' : pack.type === 'reference-css' ? 'medium' : 'low';
  });
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

### Confidence & Evidence

- Notes: {{confidence_notes}}
- Reference blend: {{reference_blend_summary}}
- Evidence trail:
  {{#each evidence_trail}}
  - {{type}} → {{source}} ({{contributedTokens.length}} tokens)
    {{/each}}

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
  - Confidence: {{evidenceConfidence}} (weight: {{tokenWeight}})
  {{#if typography_pairs}}
  - Typography pairs reinforcing defaults:
    {{#each typography_pairs}}
    - {{this.heading}} × {{this.body}}
    {{/each}}
  {{/if}}
  {{#if cssExtracted}}
  - CSS extracted: ✅ (see tokens above)
  {{/if}}
{{/each}}

---

*Generated by aidesigner UI Designer Workflow*
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
🔎 Confidence: {{confidence_notes}}
🔗 Evidence sources:
{{#each evidence_trail}}
  - {{type}} → {{source}} ({{contributedTokens.length}} tokens)
{{/each}}
🧪 Reference blend: {{reference_blend_summary}}

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

1. Inspect `chromeMcpEvidence` + `referenceAssets[].chromeMcpArtifacts`.
2. Weight Chrome MCP artifacts highest, CSS extraction mid, manual notes lowest.
3. Blend recurring tokens, typography pairings, and spacing before suggesting defaults.
4. Emit `confidenceNotes` + `evidenceTrail`, highlighting any low-confidence fields.
5. If **no evidence packs** remain, clearly warn the user and then apply SaaS presets.

**SaaS Fallback (evidence not found):**

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
