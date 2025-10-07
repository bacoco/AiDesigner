'use strict';
/**
 * UI Generator Module
 * Generates HTML dynamically using AI based on design specifications
 * No static templates - pure AI-driven generation
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateUITool = void 0;
exports.buildGenerationPrompt = buildGenerationPrompt;
exports.generateUIFromDesignSystem = generateUIFromDesignSystem;
exports.mergeDesignSystems = mergeDesignSystems;
exports.extractComponentPatterns = extractComponentPatterns;
exports.generateVariants = generateVariants;
exports.getScreenTypePrompt = getScreenTypePrompt;
exports.synthesizeComponent = synthesizeComponent;
exports.applyDesignFeedback = applyDesignFeedback;
/**
 * Build a comprehensive prompt for AI to generate HTML
 */
function buildGenerationPrompt(request) {
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
  const stylePreferences = userPreferences
    ? `
Style preferences:
- Overall style: ${userPreferences.style || 'modern'}
- Density: ${userPreferences.density || 'comfortable'}
- Complexity: ${userPreferences.complexity || 'standard'}
- Animations: ${userPreferences.animations ? 'yes' : 'no'}
  `.trim()
    : '';
  const inspirationText = inspirations?.length ? `\nInspired by: ${inspirations.join(', ')}` : '';
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
async function generateUIFromDesignSystem(
  request,
  aiService, // This would be the AI service instance
) {
  const prompt = buildGenerationPrompt(request);
  // In production, this would call the actual AI service
  // For now, we'll return a placeholder that shows the concept
  const response = await aiService.generate(prompt);
  return response;
}
/**
 * Merge multiple design systems with weighted ratios
 */
function mergeDesignSystems(systems) {
  // Calculate weighted average for colors
  const mergedColors = {};
  // For simplicity, take the highest weighted system as base
  const primarySystem = systems.sort((a, b) => b.weight - a.weight)[0].design;
  // In a real implementation, this would blend colors, merge typography choices, etc.
  return {
    ...primarySystem,
    colors: {
      ...primarySystem.colors,
      // Would implement actual color blending here
    },
  };
}
/**
 * Extract component patterns from HTML/CSS
 */
function extractComponentPatterns(html, css) {
  // Parse HTML to identify reusable components
  const patterns = {
    buttons: [],
    forms: [],
    cards: [],
    navigation: [],
    layouts: [],
  };
  // In production, this would use a proper HTML parser
  // to identify and extract component patterns
  return patterns;
}
/**
 * Generate multiple variants of a design
 */
async function generateVariants(baseRequest, count = 3, aiService) {
  const variants = ['minimal', 'standard', 'rich'];
  const results = [];
  for (let i = 0; i < Math.min(count, variants.length); i++) {
    const variantRequest = {
      ...baseRequest,
      variation: variants[i],
    };
    const html = await generateUIFromDesignSystem(variantRequest, aiService);
    results.push(html);
  }
  return results;
}
/**
 * Create a meta-prompt for specific screen types
 */
function getScreenTypePrompt(screenType) {
  const prompts = {
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
    `,
  };
  return prompts[screenType] || 'Create a well-designed page';
}
/**
 * Tool definition for MCP
 */
exports.generateUITool = {
  name: 'generate_ui_from_specs',
  description: 'Generate HTML dynamically using AI based on design specifications',
  inputSchema: {
    type: 'object',
    properties: {
      screenType: {
        type: 'string',
        description: 'Type of screen to generate (login, dashboard, pricing, etc.)',
        enum: [
          'login',
          'dashboard',
          'pricing',
          'settings',
          'landing',
          'signup',
          'profile',
          'custom',
        ],
      },
      designSpec: {
        type: 'object',
        description: 'Design system specification with colors, typography, etc.',
      },
      variation: {
        type: 'string',
        description: 'Variation style',
        enum: ['minimal', 'standard', 'rich', 'experimental'],
      },
      userPreferences: {
        type: 'object',
        description: 'User style preferences',
      },
      inspirations: {
        type: 'array',
        items: { type: 'string' },
        description: 'URLs or references for design inspiration',
      },
    },
    required: ['screenType', 'designSpec'],
  },
};
/**
 * Synthesize components from multiple sources
 */
function synthesizeComponent(componentType, sources) {
  // This would blend component styles from multiple sources
  // For example, taking navigation structure from one site
  // and color scheme from another
  return {
    type: componentType,
    synthesized: true,
    sources: sources.map((s) => s.site),
  };
}
/**
 * Apply user feedback to refine design
 */
function applyDesignFeedback(currentDesign, feedback) {
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
