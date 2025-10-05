# Google Nano Banana Visual Concept Prompt

## Canonical Prompt Template

This template contains the canonical prompt structure for Google Nano Banana (Gemini 2.5 Flash Image) visual concept generation. All placeholders should be replaced with actual project context before use.

---

You are Google Nano Banana (Gemini 2.5 Flash Image). Generate {{concept_variations}} distinct visual concepts for {{product_name}}, a {{product_descriptor}} serving {{primary_persona}}.

For each concept, render a cohesive storyboard of four mobile-first screens:

1. Search screen for {{search_goal}}
2. Write/Compose screen for {{write_goal}}
3. Sign Up screen highlighting {{signup_value_prop}}
4. Sign In screen emphasizing {{signin_security_needs}}

Creative constraints:

- Brand cues: {{brand_palette}}, {{typography}}, {{illustration_style}}
- Tone: {{experience_tone}} (ensure consistency across all screens)
- Layout guidance: use {{layout_principles}} with clear hierarchy, accessible contrast, and prominent primary actions
- Include placeholder copy reflecting {{voice_guidelines}}; avoid lorem ipsum
- Maintain component consistency so UI kits can be extracted (buttons, form fields, nav bars, empty states)

Output instructions:

- Deliver each concept as a 4-frame grid (aspect ratio 4:5 per frame) with labels per screen
- Keep backgrounds clean; no watermarks
- After rendering, summarize the differentiators for each concept so stakeholders can pick one

If any required context is missing, assume sensible defaults for a modern SaaS productivity tool and provide helpful clarifying questions.

---

## Placeholder Reference

Replace these placeholders when assembling the final prompt:

### Product Context

- `{{concept_variations}}`: Number of distinct concepts to generate (recommend 3-4)
- `{{product_name}}`: Name of the product (e.g., "TaskFlow", "NoteMate")
- `{{product_descriptor}}`: One-sentence description (e.g., "a collaborative task management tool for remote teams")
- `{{primary_persona}}`: Main user type (e.g., "remote team managers", "freelance designers")

### User Scenarios

- `{{search_goal}}`: What users search/browse for (e.g., "finding project tasks by status or assignee")
- `{{write_goal}}`: What users create/compose (e.g., "creating new tasks with descriptions and due dates")
- `{{signup_value_prop}}`: Key benefit highlighted during onboarding (e.g., "unlimited projects and team collaboration")
- `{{signin_security_needs}}`: Trust/security elements for returning users (e.g., "two-factor authentication and session security")

### Brand & Visual Direction

- `{{brand_palette}}`: Primary and accent colors with hex codes (e.g., "Deep blue #1E3A8A, vibrant orange #F97316, neutral grays")
- `{{typography}}`: Font style direction (e.g., "Modern sans-serif with bold headings and readable body text")
- `{{illustration_style}}`: Visual treatment (e.g., "Flat design with subtle gradients", "Minimal line icons", "Hand-drawn illustrations")
- `{{experience_tone}}`: Overall feeling (e.g., "Professional yet approachable", "Energetic and motivating", "Calm and focused")

### Layout & Copy

- `{{layout_principles}}`: Structural approach (e.g., "Card-based layouts with generous whitespace", "Dense list views with clear visual hierarchy")
- `{{voice_guidelines}}`: Copy tone and style (e.g., "Concise and action-oriented", "Friendly and conversational", "Technical and precise")

## Usage Notes

1. **Context First**: Always gather complete project context before populating placeholders
2. **Specificity Matters**: Generic placeholders produce generic designs; be detailed
3. **Brand Consistency**: Ensure brand elements (colors, fonts, style) align across all placeholder values
4. **Mobile-First**: All scenarios should describe mobile screen experiences first
5. **Real Content**: Avoid placeholder text like "lorem ipsum"; request realistic copy that reflects voice guidelines

## Integration Points

This template is used by:

- **Complex Lane**: `generate-nano-banana-prompt.md` task populates this for interactive prompt creation
- **Quick Lane**: `nano-banana-brief-template.md` embeds this with auto-populated context from PRD/specs
- **Nano Banana Liaison**: Agent references this template when executing `*generate-nano-brief` command
