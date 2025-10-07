/**
 * UI Generator Module
 * Generates HTML dynamically using AI based on design specifications
 * No static templates - pure AI-driven generation
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface DesignSpec {
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    neutral?: string[];
    background?: string;
    surface?: string;
  };
  typography: {
    fontFamily: string;
    scale?: number;
    headingFont?: string;
    bodyFont?: string;
    monoFont?: string;
  };
  spacing: {
    unit?: string;
    scale?: number[];
  };
  components: {
    borderRadius?: string;
    shadowScale?: string[];
    button?: any;
    input?: any;
    card?: any;
  };
  layout?: {
    maxWidth?: string;
    containerPadding?: string;
    gridGap?: string;
  };
}

export interface UserPreferences {
  style?: 'minimal' | 'modern' | 'playful' | 'professional' | 'bold';
  density?: 'compact' | 'comfortable' | 'spacious';
  colorMode?: 'light' | 'dark' | 'auto';
  animations?: boolean;
  complexity?: 'simple' | 'standard' | 'rich';
}

export interface GenerationRequest {
  screenType: string;
  designSpec: DesignSpec;
  variation?: string;
  userPreferences?: UserPreferences;
  inspirations?: string[]; // URLs or design references
  components?: string[]; // Specific components to include
}

/**
 * Build a comprehensive prompt for AI to generate HTML
 */
export function buildGenerationPrompt(request: GenerationRequest): string {
  const { screenType, designSpec, variation, userPreferences, inspirations } = request;

  // Build CSS variables from design spec
  const cssVariables = `
    --primary: ${designSpec.colors.primary};
    --secondary: ${designSpec.colors.secondary || designSpec.colors.primary};
    --accent: ${designSpec.colors.accent || designSpec.colors.primary};
    --neutral: ${designSpec.colors.neutral?.[0] || '#6B7280'};
    --bg: ${designSpec.colors.background || '#F9FAFB'};
    --surface: ${designSpec.colors.surface || '#FFFFFF'};
    --font-family: ${designSpec.typography.fontFamily || 'Inter'};
    --border-radius: ${designSpec.components.borderRadius || '8px'};
  `.trim();

  const stylePreferences = userPreferences ? `
Style preferences:
- Overall style: ${userPreferences.style || 'modern'}
- Density: ${userPreferences.density || 'comfortable'}
- Complexity: ${userPreferences.complexity || 'standard'}
- Animations: ${userPreferences.animations ? 'yes' : 'no'}
  `.trim() : '';

  const inspirationText = inspirations?.length ?
    `\nInspired by: ${inspirations.join(', ')}` : '';

  return `
Generate a complete, production-ready HTML page for a ${screenType} screen.

Design System:
${cssVariables}

${stylePreferences}
${inspirationText}

Requirements:
1. Use ONLY inline styles with CSS variables where appropriate
2. Make it fully responsive and accessible
3. Include semantic HTML5 elements
4. Add appropriate ARIA labels
5. Ensure the design is cohesive and professional
6. The HTML should be self-contained and ready to display
7. Use French text for UI labels (e.g., "Connexion", "Tableau de bord", etc.)
8. Include interactive states (hover, focus) where appropriate

Variation: ${variation || 'standard'}

Generate ONLY the HTML code, no explanations. Make it beautiful and functional.
Start with <!DOCTYPE html> and include all necessary styles inline.
  `.trim();
}

/**
 * Generate HTML using AI based on design specifications
 */
export async function generateUIFromDesignSystem(
  request: GenerationRequest,
  aiService: any // This would be the AI service instance
): Promise<string> {
  const prompt = buildGenerationPrompt(request);

  // In production, this would call the actual AI service
  // For now, we'll return a placeholder that shows the concept
  const response = await aiService.generate(prompt);

  return response;
}

/**
 * Merge multiple design systems with weighted ratios
 */
export function mergeDesignSystems(
  systems: Array<{ design: DesignSpec; weight: number }>
): DesignSpec {
  // Calculate weighted average for colors
  const mergedColors: any = {};

  // For simplicity, take the highest weighted system as base
  const primarySystem = systems.sort((a, b) => b.weight - a.weight)[0].design;

  // In a real implementation, this would blend colors, merge typography choices, etc.
  return {
    ...primarySystem,
    colors: {
      ...primarySystem.colors,
      // Would implement actual color blending here
    }
  };
}

/**
 * Extract component patterns from HTML/CSS
 */
export function extractComponentPatterns(html: string, css?: string): any {
  // Parse HTML to identify reusable components
  const patterns = {
    buttons: [],
    forms: [],
    cards: [],
    navigation: [],
    layouts: []
  };

  // In production, this would use a proper HTML parser
  // to identify and extract component patterns

  return patterns;
}

/**
 * Generate multiple variants of a design
 */
export async function generateVariants(
  baseRequest: GenerationRequest,
  count: number = 3,
  aiService: any
): Promise<string[]> {
  const variants = ['minimal', 'standard', 'rich'];
  const results: string[] = [];

  for (let i = 0; i < Math.min(count, variants.length); i++) {
    const variantRequest = {
      ...baseRequest,
      variation: variants[i]
    };

    const html = await generateUIFromDesignSystem(variantRequest, aiService);
    results.push(html);
  }

  return results;
}

/**
 * Create a meta-prompt for specific screen types
 */
export function getScreenTypePrompt(screenType: string): string {
  const prompts: Record<string, string> = {
    login: `
Create a login screen with:
- Email and password fields
- "Remember me" checkbox
- "Forgot password" link
- Submit button
- Optional social login buttons
- Link to signup page
    `,
    dashboard: `
Create a dashboard screen with:
- Header with navigation
- Key metrics/stats cards
- Charts or data visualizations
- Recent activity table or list
- Quick actions section
    `,
    pricing: `
Create a pricing page with:
- Pricing tiers (typically 3)
- Feature comparison
- Highlighted "popular" option
- CTA buttons for each tier
- FAQ section or additional info
    `,
    settings: `
Create a settings page with:
- User profile section
- Account settings
- Notification preferences
- Security settings
- Save/cancel buttons
    `,
    landing: `
Create a landing page with:
- Hero section with headline and CTA
- Feature highlights
- Benefits section
- Testimonials or social proof
- Footer with links
    `
  };

  return prompts[screenType] || 'Create a well-designed page';
}

/**
 * Tool definition for MCP
 */
export const generateUITool: Tool = {
  name: "generate_ui_from_specs",
  description: "Generate HTML dynamically using AI based on design specifications",
  inputSchema: {
    type: "object",
    properties: {
      screenType: {
        type: "string",
        description: "Type of screen to generate (login, dashboard, pricing, etc.)",
        enum: ["login", "dashboard", "pricing", "settings", "landing", "signup", "profile", "custom"]
      },
      designSpec: {
        type: "object",
        description: "Design system specification with colors, typography, etc."
      },
      variation: {
        type: "string",
        description: "Variation style",
        enum: ["minimal", "standard", "rich", "experimental"]
      },
      userPreferences: {
        type: "object",
        description: "User style preferences"
      },
      inspirations: {
        type: "array",
        items: { type: "string" },
        description: "URLs or references for design inspiration"
      }
    },
    required: ["screenType", "designSpec"]
  }
};

/**
 * Synthesize components from multiple sources
 */
export function synthesizeComponent(
  componentType: string,
  sources: Array<{ site: string; component: any; weight: number }>
): any {
  // This would blend component styles from multiple sources
  // For example, taking navigation structure from one site
  // and color scheme from another

  return {
    type: componentType,
    synthesized: true,
    sources: sources.map(s => s.site)
  };
}

/**
 * Apply user feedback to refine design
 */
export function applyDesignFeedback(
  currentDesign: DesignSpec,
  feedback: {
    component?: string;
    adjustment: string;
    value?: any;
  }
): DesignSpec {
  const updatedDesign = { ...currentDesign };

  // Apply feedback based on type
  switch (feedback.adjustment) {
    case 'darker':
      // Darken colors
      break;
    case 'lighter':
      // Lighten colors
      break;
    case 'more-spacing':
      // Increase spacing
      break;
    case 'less-spacing':
      // Decrease spacing
      break;
    default:
      // Direct value assignment
      if (feedback.value) {
        // Apply the value to the appropriate property
      }
  }

  return updatedDesign;
}