# Per-Screen Visual Concept Prompt Template

## Canonical Template for Individual Screen Prompts

This template generates a tailored prompt for each screen in the user journey, optimized for Google Nano Banana (Gemini 2.5 Flash Image) visual concept generation.

---

## Template Structure

````markdown
You are Google Nano Banana (Gemini 2.5 Flash Image). Render {{concept_variations}} concept options for the **{{screen_name}}** step of {{product_name}}.

## Context

- **Journey position**: {{journey_position}} ({{position_descriptor}})
- **Previous step**: {{previous_step}}
- **Next step**: {{next_step}}
- **Persona mindset**: {{persona_mindset}}
- **Screen goal**: {{screen_goal}}
- **Success signal**: {{success_signal}}
- **Emotional tone**: {{emotion_tags}}

## Visual System

### Brand Palette

{{brand_palette_colors}}

**CSS Tokens:**

```css
{{css_variables}}
```
````

### Typography

- **Heading font**: {{heading_font}}
- **Body font**: {{body_font}}
- **Font scale**: {{font_scale}}

### Layout System

- **Structure**: {{layout_structure}}
- **Spacing scale**: {{spacing_tokens}}
- **Container max-width**: {{container_max_width}}
- **Grid/Layout pattern**: {{grid_pattern}}

### Icon & Illustration Style

{{illustration_style}}

### Motion & Interaction Cues

{{motion_notes}}

### Layout Planning & Responsive Flow

1. **Box the layout before styling**: Treat every visible element (navigation, headers, cards, buttons, sidebars, text blocks, forms) as nested boxes. Describe how each box contains or aligns with others and how empty space flows between them so the structure stays balanced even before visuals are applied.
2. **Plan for reordering without chaos**: Define how those boxes can rearrange naturally when space changes (e.g., columns collapsing into rows, cards stacking) while preserving hierarchy and rhythm.
3. **Narrate responsive behavior**: Explain how the layout "breathes" as the viewport grows or shrinks—what rises above, what shifts below, what expands, and what compresses—so priority areas (hero, navigation, key actions) stay prominent and secondary zones gracefully step back.
4. **Guard consistent spacing logic**: Use scalable margins and consistent gaps so reflow feels intentional rather than cramped.

### Color Layering & Depth System

- **Generate 3-4 shades per base color** from the brand palette or neutral system: Shade 1 = base −0.1 lightness, Shade 2 = base, Shade 3 = base +0.1, optional Shade 4 = base +0.2.
- **Apply shades by hierarchy**: Shade 1 for page backgrounds, Shade 2 for containers/cards/navigation bases, Shade 3 for interactive elements (buttons, tabs, inputs) and highlighted cards, Shade 4 for selected/hover/active states.
- **Compensate text & icons**: Whenever a lighter shade is used behind content, increase the foreground lightness equally to maintain contrast.
- **Drop borders on light layers**: Remove borders from elements using Shades 3 or 4; rely on color contrast and depth for separation (use borders sparingly on Shade 1/2 only if absolutely required).
- **Component specifics**:
  - **Tabs**: Shade 2 base, Shade 3 selected.
  - **Cards**: Shade 2 wrapper, Shade 3 for important surfaces. When selected, use Shade 3 and add a soft shadow.
  - **Dropdowns/Buttons**: Shade 2 for default states, Shade 3 for primary/important ones. For a premium feel, an optional gradient and inner shadow can be added.
  - **Radios/Checkboxes**: Shade 2 for containers, with Shade 3 for selected states.
  - **Tables**: Shade 1 for backgrounds to make them recede.
- **Control emphasis with lightness**: Lighter shades (3/4) pull elements forward, darker shades (1/2) push elements back, supporting the 60-30-10 balance (neutrals dominant, accents intentional).

### Shadow & Gradient Depth Rules

- **Two-layer shadows**: Apply a light inset/top layer (soft white glow) plus a darker drop shadow beneath. Choose intensity by component importance—small for subtle items (profile cards, nav tabs), medium for core cards/dropdowns/modals, large for hover/focus states or priority modals.
- **Gradient enhancement** (when appropriate for premium feel): Use a top-to-bottom gradient with a lighter top (base +0.1–0.2) and slightly darker bottom (base −0.05–0.1). Add an inset 0 1px 0 highlight (white/light color at 0.2–0.4 opacity) and reinforce with the matching two-layer shadow.
- **Consistency across states**: Ensure hover/active states increase elevation by stepping up shadow size or lightness rather than introducing new colors.

## Reference Inspiration

{{#each reference_assets}}

### {{source_type}}: {{source_url_or_description}}

- **What to keep**: {{elements_to_keep}}
- **What to avoid**: {{elements_to_avoid}}
  {{#if css_extracted}}
- **Extracted tokens**: {{css_tokens}}
  {{/if}}
  {{/each}}

## UI Requirements

### Critical Components

{{required_components}}

### Data States

{{data_states}}

### Edge Cases & Errors

{{edge_cases}}

### Accessibility Requirements

- Contrast ratio: {{contrast_requirements}}
- Touch targets: {{touch_target_size}}
- Screen reader considerations: {{screen_reader_notes}}

### Microcopy Voice

{{voice_guidelines}}

## Output Instructions

- Produce **mobile-first artboards** (aspect ratio 4:5)
- Generate **{{screen_states}}** for this screen (e.g., default, loading, error, empty)
- Include **CSS-ready color callouts** in image annotations
- Show **font pairing examples** with actual text samples
- Annotate **spacing tokens** wherever layout structure is visible (e.g., "padding: var(--space-lg)")
- For {{concept_variations}} concepts, ensure each has a distinct visual approach while maintaining brand consistency
- Add brief **differentiator notes** for each concept explaining its unique approach

## Success Criteria

This screen successfully:

- Guides user toward: {{screen_goal}}
- Evokes emotion: {{emotion_tags}}
- Supports user with: {{required_components}}
- Handles gracefully: {{edge_cases}}

````

---

## Placeholder Reference Guide

### Product & Journey Context

- `{{product_name}}`: Full product name (e.g., "TaskFlow Pro")
- `{{concept_variations}}`: Number of visual concepts to generate (typically 3-4)
- `{{screen_name}}`: Name of this specific screen (e.g., "Search & Filter", "Product Details")
- `{{journey_position}}`: Numeric position in journey (e.g., "Step 2 of 6")
- `{{position_descriptor}}`: Contextual position (e.g., "Early exploration phase", "Final commitment step")
- `{{previous_step}}`: Name of previous screen
- `{{next_step}}`: Name of next screen

### Persona & Goals

- `{{persona_mindset}}`: User's mental state on this screen (e.g., "Goal-oriented shopper looking to narrow options")
- `{{screen_goal}}`: What user should accomplish (e.g., "Filter products by category, price, and rating")
- `{{success_signal}}`: How to know goal is achieved (e.g., "Reduced product set matching user criteria")
- `{{emotion_tags}}`: Target emotional response (e.g., "Focused, efficient, in control")

### Visual System Tokens

- `{{brand_palette_colors}}`: Human-readable color list (e.g., "Deep Blue #1E40AF, Vibrant Amber #F59E0B")
- `{{css_variables}}`: CSS custom properties block:
  ```css
  --color-primary: #1E40AF;
  --color-accent: #F59E0B;
  --font-heading: 'Inter', sans-serif;
  --space-base: 8px;
  --space-lg: 32px;
````

- `{{heading_font}}`: Typeface for headings (e.g., "Inter Bold")
- `{{body_font}}`: Typeface for body text (e.g., "Inter Regular")
- `{{font_scale}}`: Size scale (e.g., "14px body, 18px subtitle, 24px heading")

- `{{layout_structure}}`: Layout approach (e.g., "Card-based grid with filters sidebar")
- `{{spacing_tokens}}`: Spacing values (e.g., "8px, 16px, 24px, 32px, 48px")
- `{{container_max_width}}`: Max content width (e.g., "1200px")
- `{{grid_pattern}}`: Grid specification (e.g., "3-column on desktop, 1-column on mobile")

- `{{illustration_style}}`: Visual treatment (e.g., "Minimal line icons with subtle gradients")
- `{{motion_notes}}`: Animation guidance (e.g., "Soft hover lift (4px), smooth transitions (250ms)")

### Reference Assets (loop)

- `{{reference_assets}}`: Array of inspiration sources
  - `{{source_type}}`: "URL" or "Image"
  - `{{source_url_or_description}}`: Link or description
  - `{{elements_to_keep}}`: What to adopt from reference
  - `{{elements_to_avoid}}`: What NOT to use from reference
  - `{{css_extracted}}`: Boolean - true if CSS was extracted
  - `{{css_tokens}}`: CSS variables extracted from URL (if applicable)

### UI Specifications

- `{{required_components}}`: Essential UI elements (e.g., "Search bar, filter dropdowns, product cards, 'Clear filters' button")
- `{{data_states}}`: States to show (e.g., "Default with results, Loading, No results, Error")
- `{{edge_cases}}`: Error/edge scenarios (e.g., "Empty search results, filter combinations with no matches, slow network")

- `{{contrast_requirements}}`: WCAG level (e.g., "4.5:1 for body text, 3:1 for large text")
- `{{touch_target_size}}`: Minimum interactive area (e.g., "44x44px minimum")
- `{{screen_reader_notes}}`: Accessibility notes (e.g., "Filter count announcements, live region for results")

- `{{voice_guidelines}}`: Copy tone (e.g., "Concise, action-oriented labels. Example: 'Filter by price' not 'You can filter products by selecting a price range'")

- `{{screen_states}}`: Number/type of states to render (e.g., "3 states: default, loading, empty")

---

## Usage Notes

### When to Use This Template

- **Per-screen generation**: One prompt per journey step
- **After discovery**: Requires completed `discover-ui-journey.md` task state
- **Individual concepts**: Each screen gets its own tailored prompt

### How to Populate

1. **Load journey discovery state** from `discover-ui-journey.md` task
2. **Select specific screen** from `journeySteps[]` array
3. **Populate placeholders**:
   - Journey context from screen position
   - Visual system from consolidated design tokens
   - Reference assets from inspiration intake
   - UI requirements from step deep-dive
4. **Generate prompt** for this screen only
5. **Repeat** for all screens in journey

### Output Format

The generated prompt should be:

- **Copy-paste ready** for Google AI Studio
- **Self-contained** (no external references needed)
- **Specific to screen** (not generic)
- **CSS-aware** (includes design tokens for developer handoff)

---

## Integration Points

### Used By

- `generate-ui-designer-prompt.md` task - Populates this template for each journey screen
- Quick Lane engine - Auto-generates per-screen prompts from PRD inference
- Complex Lane liaison - Manual conversational prompt assembly

### Inputs Required

- Journey discovery state (from `discover-ui-journey.md`)
- Visual system definition (colors, typography, layout)
- Reference assets (URLs with CSS extraction or images)
- Screen-specific requirements (components, states, edge cases)

### Outputs Produced

- Individual screen prompt markdown blocks
- Compiled into `docs/ui/ui-designer-screen-prompts.md`
- Referenced by `docs/front-end-spec.md` in AI concepts section

---

## Example Populated Prompt

````markdown
You are Google Nano Banana (Gemini 2.5 Flash Image). Render 3 concept options for the **Search & Filter** step of TaskFlow Pro.

## Context

- **Journey position**: Step 2 of 6 (Early exploration phase)
- **Previous step**: Browse Tasks
- **Next step**: Task Details
- **Persona mindset**: User with specific criteria looking to narrow task list
- **Screen goal**: Filter tasks by status, assignee, and due date to find relevant items
- **Success signal**: Focused task list matching user's filter criteria
- **Emotional tone**: Efficient, in-control, focused

## Visual System

### Brand Palette

Deep Blue #1E40AF, Vibrant Amber #F59E0B, Neutral Gray #6B7280

**CSS Tokens:**

```css
--color-primary: #1e40af;
--color-accent: #f59e0b;
--color-neutral: #6b7280;
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--space-base: 8px;
--space-md: 16px;
--space-lg: 32px;
```
````

### Typography

- **Heading font**: Inter Bold
- **Body font**: Inter Regular
- **Font scale**: 14px body, 18px subtitle, 24px heading

### Layout System

- **Structure**: Sidebar filters with main content area
- **Spacing scale**: 8px, 16px, 24px, 32px, 48px
- **Container max-width**: 1200px
- **Grid/Layout pattern**: Filters left (280px), content right (fluid)

### Icon & Illustration Style

Minimal line icons with subtle color fills

### Motion & Interaction Cues

Filter dropdown: smooth expand (200ms), hover lift on filter chips (2px), instant result updates

## Reference Inspiration

### URL: https://linear.app/filters

- **What to keep**: Clean filter sidebar, chip-based active filters, instant visual feedback
- **What to avoid**: Overly complex filter nesting, too many options visible at once
- **Extracted tokens**: `--filter-bg: #F3F4F6`, `--chip-radius: 6px`, `--sidebar-width: 280px`

## UI Requirements

### Critical Components

- Search bar (persistent top), Filter sidebar (status, assignee, due date dropdowns), Active filter chips (dismissible), Task list (filtered results), "Clear all filters" link

### Data States

1. Default with filters applied (results shown)
2. Loading (skeleton task cards)
3. No results (empty state with suggestion to adjust filters)
4. Filter sidebar collapsed (mobile)

### Edge Cases & Errors

- Filter combination yields no results (helpful empty state)
- Slow filter query (show loading state)
- Filter sidebar overflow (scrollable)

### Accessibility Requirements

- Contrast ratio: 4.5:1 for all text
- Touch targets: 44x44px for filter buttons
- Screen reader considerations: Live region announces result count after filter change

### Microcopy Voice

Concise action labels. Examples: "Filter by status" (not "You can filter..."), "Clear filters", "3 tasks match"

## Output Instructions

- Produce **mobile-first artboards** (aspect ratio 4:5)
- Generate **4 states** for this screen: default, loading, empty, mobile-collapsed
- Include **CSS-ready color callouts** in image annotations
- Show **font pairing examples** with actual task titles and metadata
- Annotate **spacing tokens** wherever layout structure is visible (e.g., "padding: var(--space-lg)")
- For 3 concepts, ensure each has a distinct filtering UI approach while maintaining brand consistency
- Add brief **differentiator notes** for each concept explaining its unique approach

## Success Criteria

This screen successfully:

- Guides user toward: Filtering tasks efficiently by multiple criteria
- Evokes emotion: Efficient, in-control, focused
- Supports user with: Intuitive filter controls and instant visual feedback
- Handles gracefully: Empty results, loading states, mobile constraints

```

---

**Template Version**: 1.0.0
**Last Updated**: 2025-10-05
**Status**: ✅ Production Ready
```
