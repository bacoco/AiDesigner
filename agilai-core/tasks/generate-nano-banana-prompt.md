<!-- Powered by BMAD™ Core -->

# Generate Google Nano Banana Prompt Task

## Purpose

To generate a comprehensive, context-rich prompt for Google Nano Banana (Gemini 2.5 Flash Image) that will produce multiple cohesive visual concept explorations for your product's user interface. This task bridges project requirements and AI-powered visual ideation.

## Inputs

- Completed Product Requirements Document (`docs/prd.md`)
- Completed UI/UX Specification (`docs/front-end-spec.md`) - if available
- Project context (name, descriptor, target personas, value propositions)

## Key Activities & Instructions

### 1. Understanding Google Nano Banana

Google Nano Banana (Gemini 2.5 Flash Image) is a multimodal AI model specifically designed to generate visual content based on detailed textual descriptions. Unlike code generation tools (v0, Lovable), Nano Banana creates **visual concept explorations** that help teams:

- Explore multiple visual directions before committing to one
- Align stakeholders on design aesthetic and layout principles
- Accelerate the design phase with AI-powered ideation
- Capture design intent early in the process

### 2. Core Prompting Principles for Visual AI

Before assembling the prompt, understand these principles for effective visual AI generation:

- **Rich Context Creates Rich Visuals**: Provide detailed project background, user personas, and value propositions
- **Specific Constraints Drive Quality**: Define brand palette, typography, layout principles, and tone explicitly
- **Multiple Concepts Enable Choice**: Request 3-5 distinct visual directions to give stakeholders real options
- **Consistency Validates Concepts**: Ask for multiple screens per concept to verify visual coherence
- **Mobile-First Reveals Truth**: Mobile screens expose layout and hierarchy decisions more clearly than desktop

### 3. Context Gathering Workflow

Walk through the following context gathering steps before presenting the final prompt:

#### Step 3.1: Product Foundation

Gather from PRD and project brief:

- **Product Name**: What is the product called?
- **Product Descriptor**: One-sentence description (e.g., "a collaborative task management tool")
- **Primary Persona**: Who is the main user? (e.g., "remote team managers")
- **Core Value Proposition**: What's the #1 benefit users get?

#### Step 3.2: Key User Scenarios

Identify 3-4 critical user actions that should be visualized. For a complete concept exploration, select screens that represent:

1. **Search/Browse**: How users find or discover content
2. **Create/Compose**: How users input or create something new
3. **Sign Up**: How new users onboard (highlight value prop)
4. **Sign In**: How returning users access the product (emphasize security/trust)

For each scenario, note:

- **Goal**: What is the user trying to accomplish?
- **Key elements**: What must be visible on this screen?

#### Step 3.3: Brand & Visual Direction

Gather from UX spec or elicit if missing:

- **Brand Palette**: Primary colors, accent colors (hex codes if available)
- **Typography Preference**: Modern, classic, playful, technical?
- **Illustration Style**: Flat, gradient, 3D, minimal, hand-drawn?
- **Experience Tone**: Professional, friendly, energetic, calming, trustworthy?

#### Step 3.4: Layout & Interaction Principles

Define structural guidelines:

- **Layout Principles**: Grid-based, asymmetric, card-based, list-based?
- **Hierarchy Approach**: Bold headings, visual weight, color coding?
- **Primary Action Style**: Prominent buttons, floating actions, inline actions?
- **Accessibility Requirements**: Contrast ratios, touch target sizes?

#### Step 3.5: Voice & Copy Guidelines

How should UI copy sound?

- **Voice Characteristics**: Concise, conversational, technical, encouraging?
- **Copy Length**: Minimal labels vs descriptive text?
- **Instructional Tone**: Direct commands vs gentle suggestions?

### 4. Assembling the Nano Banana Prompt

Once context is gathered, assemble the prompt using the canonical template from `templates/nano-banana-prompt.md`. The template includes placeholders for:

**Product Context:**

- `{{product_name}}`: Product name
- `{{product_descriptor}}`: One-line description
- `{{primary_persona}}`: Main user type
- `{{concept_variations}}`: Number of concepts (recommend 3-4)

**Scenario Details:**

- `{{search_goal}}`: What users search/browse for
- `{{write_goal}}`: What users create/compose
- `{{signup_value_prop}}`: Key benefit shown during signup
- `{{signin_security_needs}}`: Trust/security elements for signin

**Brand & Visual:**

- `{{brand_palette}}`: Colors (hex codes)
- `{{typography}}`: Font style direction
- `{{illustration_style}}`: Visual style
- `{{experience_tone}}`: Overall feeling

**Layout & Copy:**

- `{{layout_principles}}`: Structural approach
- `{{voice_guidelines}}`: Copy tone and style

### 5. Present the Prompt and Usage Instructions

After assembling the prompt:

1. **Display the Complete Prompt**: Show the fully populated prompt in a code block for easy copying
2. **Explain the Structure**: Briefly note what makes this prompt effective (context, constraints, specific outputs)
3. **Provide Google AI Studio Instructions**:
   - Visit https://aistudio.google.com/
   - Create a new chat with Gemini 2.5 Flash
   - Paste the prompt
   - Review the generated concept sets
   - Export or screenshot the concepts you want to explore further
4. **Set Expectations**:
   - Nano Banana will generate 4-screen storyboards for each concept variation
   - Concepts will be visually distinct to enable meaningful choice
   - Each concept maintains internal consistency
   - Generated images are starting points for discussion and refinement
5. **Next Steps Guidance**:
   - Review concepts with stakeholders
   - Select one concept as the primary direction
   - Run the `*log-nano-selection` command to record the choice
   - The logged decision will inform architecture and development phases

### 6. Document Creation

Use the `create-doc.md` task to write the prompt brief to `docs/ui/nano-banana-brief.md` with:

- Project context summary
- The complete prompt (in a code block)
- Usage instructions for Google AI Studio
- Expected outputs description
- Next steps (logging selection)

## Important Notes

- **No Mock Data**: Use real project details from PRD and specs; never invent placeholder information
- **Mobile-First Always**: All screen specifications should start with mobile layout
- **Consistency Over Cleverness**: Request coherent design systems, not disparate screen experiments
- **User Review Required**: All AI-generated concepts require human review and selection before proceeding
- **Decision Capture Essential**: The value comes from logging the chosen direction for downstream phases

## Output Artifact

`docs/ui/nano-banana-brief.md` containing:

1. Project context
2. Ready-to-use Nano Banana prompt
3. Google AI Studio instructions
4. Expected outputs and next steps
