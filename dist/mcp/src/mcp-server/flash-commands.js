'use strict';
/**
 * Flash Command Surface Definition
 * Maps Quick Designer agent commands to MCP server implementations
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.flashCommands = void 0;
exports.getFlashTools = getFlashTools;
// In-memory session storage (will be replaced with proper persistence)
const sessions = new Map();
/**
 * Flash Command Handlers
 */
exports.flashCommands = {
  instant: {
    name: 'instant',
    description: 'Generate screen instantly with optimized prompt + HTML code + preview',
    handler: async (params) => {
      const { request, sessionId = 'default', referenceUrl } = params;
      // Get or create session
      let session = sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          pages: [],
        };
        sessions.set(sessionId, session);
      }
      // Extract screen type and style from request
      const screenType = detectScreenType(request);
      const style = detectStyle(request);
      // Extract design tokens if reference URL provided
      let designSpec = session.designSystem;
      if (referenceUrl) {
        // This would call Chrome MCP to extract design tokens
        designSpec = await extractDesignTokensFromUrl(referenceUrl);
        if (!session.designSystem) {
          session.designSystem = designSpec;
        }
      } else if (!designSpec) {
        // Use default design system
        designSpec = getDefaultDesignSystem();
        session.designSystem = designSpec;
      }
      // Generate variations using pattern remix (no LLM)
      const variations = await generatePatternBasedVariations(screenType, designSpec, style);
      // Add to session
      const page = {
        name: screenType,
        type: screenType,
        variations: variations.map((html, index) => ({
          name: getVariationName(index, style),
          html,
          specs: designSpec,
        })),
      };
      session.pages.push(page);
      // Generate mockup HTML
      const mockupHtml = await generateInteractiveMockupShell(session.pages, session.designSystem);
      // Save mockup to file
      await saveMockupToFile(mockupHtml);
      return {
        success: true,
        screenType,
        variationsGenerated: variations.length,
        mockupPath: 'docs/ui/mockup.html',
        message: `Generated ${variations.length} variations for ${screenType} screen`,
        session: session.id,
      };
    },
  },
  refine: {
    name: 'refine',
    description: 'Refine the last generated screen with adjustments or new variations',
    handler: async (params) => {
      const { sessionId = 'default', adjustments, addVariations = 0 } = params;
      const session = sessions.get(sessionId);
      if (!session || session.pages.length === 0) {
        throw new Error('No previous generation found. Use *instant first.');
      }
      const lastPage = session.pages[session.pages.length - 1];
      if (adjustments) {
        // Apply adjustments to design system
        session.designSystem = applyDesignAdjustments(session.designSystem, adjustments);
      }
      if (addVariations > 0) {
        // Generate additional variations
        const newVariations = await generatePatternBasedVariations(
          lastPage.type,
          session.designSystem,
          'additional',
          addVariations,
        );
        lastPage.variations.push(
          ...newVariations.map((html, index) => ({
            name: `Additional ${index + 1}`,
            html,
            specs: session.designSystem,
          })),
        );
      }
      // Regenerate mockup
      const mockupHtml = await generateInteractiveMockupShell(session.pages, session.designSystem);
      await saveMockupToFile(mockupHtml);
      return {
        success: true,
        adjustmentsApplied: !!adjustments,
        variationsAdded: addVariations,
        totalVariations: lastPage.variations.length,
        message: `Refined ${lastPage.name} with ${addVariations} new variations`,
      };
    },
  },
  validate: {
    name: 'validate',
    description: 'Validate a specific variation and update the Design System',
    handler: async (params) => {
      const { sessionId = 'default', variationIndex, pageIndex } = params;
      const session = sessions.get(sessionId);
      if (!session || session.pages.length === 0) {
        throw new Error('No session found');
      }
      const page =
        pageIndex !== undefined
          ? session.pages[pageIndex]
          : session.pages[session.pages.length - 1];
      if (variationIndex >= page.variations.length) {
        throw new Error(`Invalid variation index ${variationIndex}`);
      }
      // Mark variation as validated
      page.variations[variationIndex].validated = true;
      // Update design system with validated variation's specs if different
      if (page.variations[variationIndex].specs) {
        session.designSystem = mergeDesignSpecs(
          session.designSystem,
          page.variations[variationIndex].specs,
        );
      }
      return {
        success: true,
        validatedVariation: page.variations[variationIndex].name,
        page: page.name,
        designSystemUpdated: true,
        message: `Validated ${page.variations[variationIndex].name} and updated Design System`,
      };
    },
  },
  showSystem: {
    name: 'show-system',
    description: 'Display the current Design System',
    handler: async (params) => {
      const { sessionId = 'default' } = params;
      const session = sessions.get(sessionId);
      if (!session || !session.designSystem) {
        return {
          success: false,
          message: 'No Design System found. Generate a screen first with *instant',
        };
      }
      return {
        success: true,
        designSystem: session.designSystem,
        pagesGenerated: session.pages.length,
        totalVariations: session.pages.reduce((sum, page) => sum + page.variations.length, 0),
      };
    },
  },
  openMockup: {
    name: 'open-mockup',
    description: 'Open the evolving mockup in browser',
    handler: async () => {
      // This would trigger browser opening
      // For now, just return the path
      return {
        success: true,
        mockupPath: 'docs/ui/mockup.html',
        message: 'Mockup ready at docs/ui/mockup.html',
      };
    },
  },
};
/**
 * Helper Functions
 */
function detectScreenType(request) {
  const types = [
    'login',
    'signup',
    'dashboard',
    'settings',
    'profile',
    'search',
    'checkout',
    'pricing',
    'landing',
    '404',
  ];
  const lowercaseRequest = request.toLowerCase();
  for (const type of types) {
    if (lowercaseRequest.includes(type)) {
      return type;
    }
  }
  return 'custom';
}
function detectStyle(request) {
  if (request.includes('minimal')) return 'minimal';
  if (request.includes('modern')) return 'modern';
  if (request.includes('playful')) return 'playful';
  if (request.includes('professional')) return 'professional';
  if (request.includes('bold')) return 'bold';
  return 'standard';
}
function getVariationName(index, style) {
  const names = {
    minimal: ['Clean', 'Essential', 'Pure'],
    modern: ['Contemporary', 'Sleek', 'Fresh'],
    playful: ['Fun', 'Vibrant', 'Dynamic'],
    professional: ['Corporate', 'Business', 'Executive'],
    bold: ['Strong', 'Impactful', 'Statement'],
    standard: ['Classic', 'Balanced', 'Traditional'],
  };
  return names[style]?.[index] || `Variation ${index + 1}`;
}
function getDefaultDesignSystem() {
  return {
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      neutral: ['#1F2937', '#4B5563', '#6B7280', '#9CA3AF'],
      background: '#F9FAFB',
      surface: '#FFFFFF',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      scale: 1.25,
      headingFont: 'Inter',
      bodyFont: 'Inter',
    },
    spacing: {
      unit: '8px',
      scale: [4, 8, 12, 16, 24, 32, 48, 64],
    },
    components: {
      borderRadius: '8px',
      shadowScale: [
        '0 1px 2px rgba(0, 0, 0, 0.05)',
        '0 4px 6px rgba(0, 0, 0, 0.1)',
        '0 10px 15px rgba(0, 0, 0, 0.15)',
      ],
    },
  };
}
async function extractDesignTokensFromUrl(url) {
  // Placeholder for Chrome MCP integration
  // Would extract actual design tokens from the URL
  return getDefaultDesignSystem();
}
/**
 * Pattern-based generation (no LLM required)
 */
async function generatePatternBasedVariations(screenType, designSpec, style, count = 3) {
  const patterns = await loadPatternLibrary(screenType);
  const variations = [];
  for (let i = 0; i < count; i++) {
    const pattern = selectPattern(patterns, style, i);
    const html = applyDesignSystemToPattern(pattern, designSpec);
    variations.push(html);
  }
  return variations;
}
async function loadPatternLibrary(screenType) {
  // Load pre-defined HTML patterns for the screen type
  // These would be stored in a pattern library
  return getBuiltInPatterns(screenType);
}
function selectPattern(patterns, style, index) {
  // Select appropriate pattern based on style and index
  return patterns[index % patterns.length];
}
function applyDesignSystemToPattern(pattern, designSpec) {
  // Replace design tokens in the pattern with actual values
  let html = pattern;
  // Replace color tokens
  html = html.replace(/\$\{primary\}/g, designSpec.colors.primary);
  html = html.replace(/\$\{secondary\}/g, designSpec.colors.secondary || designSpec.colors.primary);
  html = html.replace(/\$\{accent\}/g, designSpec.colors.accent || designSpec.colors.primary);
  html = html.replace(/\$\{neutral\}/g, designSpec.colors.neutral?.[0] || '#6B7280');
  html = html.replace(/\$\{bg\}/g, designSpec.colors.background || '#F9FAFB');
  html = html.replace(/\$\{surface\}/g, designSpec.colors.surface || '#FFFFFF');
  // Replace typography tokens
  html = html.replace(/\$\{fontFamily\}/g, designSpec.typography.fontFamily);
  html = html.replace(/\$\{borderRadius\}/g, designSpec.components?.borderRadius || '8px');
  return html;
}
function getBuiltInPatterns(screenType) {
  // Built-in pattern library
  const patterns = {
    login: [
      // Minimal centered login
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: \${bg};
      font-family: \${fontFamily};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .login-card {
      background: \${surface};
      padding: 2rem;
      border-radius: \${borderRadius};
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      color: #111827;
      margin-bottom: 2rem;
      text-align: center;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      color: \${neutral};
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #E5E7EB;
      border-radius: \${borderRadius};
      font-size: 1rem;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: \${primary};
      color: white;
      border: none;
      border-radius: \${borderRadius};
      font-size: 1rem;
      cursor: pointer;
    }
    .links {
      text-align: center;
      margin-top: 1.5rem;
    }
    a {
      color: \${primary};
      text-decoration: none;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <h1>Connexion</h1>
    <form>
      <div class="form-group">
        <label>Email</label>
        <input type="email" placeholder="vous@example.com">
      </div>
      <div class="form-group">
        <label>Mot de passe</label>
        <input type="password" placeholder="••••••••">
      </div>
      <button type="submit">Se connecter</button>
    </form>
    <div class="links">
      <a href="#">Mot de passe oublié?</a>
    </div>
  </div>
</body>
</html>`,
      // Split screen login
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: \${fontFamily};
      display: flex;
      min-height: 100vh;
    }
    .brand-side {
      flex: 1;
      background: linear-gradient(135deg, \${primary}, \${accent});
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .form-side {
      flex: 1;
      background: \${surface};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .form-container {
      width: 100%;
      max-width: 400px;
    }
    h1 {
      color: #111827;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      color: \${neutral};
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #E5E7EB;
      border-radius: \${borderRadius};
      font-size: 1rem;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: \${primary};
      color: white;
      border: none;
      border-radius: \${borderRadius};
      font-size: 1rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="brand-side">
    <h2 style="font-size: 3rem;">Welcome</h2>
  </div>
  <div class="form-side">
    <div class="form-container">
      <h1>Connexion</h1>
      <form>
        <div class="form-group">
          <label>Email</label>
          <input type="email" placeholder="vous@example.com">
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input type="password" placeholder="••••••••">
        </div>
        <button type="submit">Se connecter</button>
      </form>
    </div>
  </div>
</body>
</html>`,
      // Floating card login
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: linear-gradient(135deg, \${primary}, \${accent});
      font-family: \${fontFamily};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .login-floating {
      background: \${surface};
      padding: 3rem;
      border-radius: calc(\${borderRadius} * 2);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 450px;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: \${primary};
      border-radius: 12px;
      margin: 0 auto 2rem;
    }
    h1 {
      color: #111827;
      margin-bottom: 2rem;
      text-align: center;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      color: \${neutral};
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    input {
      width: 100%;
      padding: 1rem;
      border: 2px solid #E5E7EB;
      border-radius: \${borderRadius};
      font-size: 1rem;
    }
    button {
      width: 100%;
      padding: 1rem;
      background: \${primary};
      color: white;
      border: none;
      border-radius: \${borderRadius};
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="login-floating">
    <div class="logo"></div>
    <h1>Bon retour!</h1>
    <form>
      <div class="form-group">
        <label>Adresse email</label>
        <input type="email" placeholder="vous@example.com">
      </div>
      <div class="form-group">
        <label>Mot de passe</label>
        <input type="password" placeholder="••••••••">
      </div>
      <button type="submit">Continuer</button>
    </form>
  </div>
</body>
</html>`,
    ],
    dashboard: [
      // Analytics dashboard
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tableau de bord</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: \${bg};
      font-family: \${fontFamily};
    }
    .header {
      background: \${surface};
      padding: 1rem 2rem;
      border-bottom: 1px solid #E5E7EB;
    }
    .container {
      padding: 2rem;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: \${surface};
      padding: 1.5rem;
      border-radius: \${borderRadius};
    }
    .metric-label {
      color: \${neutral};
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: \${primary};
    }
    .metric-change {
      color: \${accent};
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
    .chart-area {
      background: \${surface};
      padding: 2rem;
      border-radius: \${borderRadius};
      min-height: 400px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tableau de bord</h1>
  </div>
  <div class="container">
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-label">Revenus</div>
        <div class="metric-value">€124,500</div>
        <div class="metric-change">↑ 12% ce mois</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Utilisateurs</div>
        <div class="metric-value">8,492</div>
        <div class="metric-change">↑ 5% cette semaine</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Commandes</div>
        <div class="metric-value">1,234</div>
        <div class="metric-change">↑ 8% aujourd'hui</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Conversion</div>
        <div class="metric-value">3.24%</div>
        <div class="metric-change">↓ 0.5% hier</div>
      </div>
    </div>
    <div class="chart-area">
      <h2>Aperçu des performances</h2>
    </div>
  </div>
</body>
</html>`,
    ],
    pricing: [
      // Three-tier pricing
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tarifs</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: \${bg};
      font-family: \${fontFamily};
      padding: 3rem 2rem;
    }
    h1 {
      text-align: center;
      margin-bottom: 3rem;
      font-size: 2.5rem;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .pricing-card {
      background: \${surface};
      padding: 2rem;
      border-radius: \${borderRadius};
      text-align: center;
    }
    .pricing-card.featured {
      border: 2px solid \${primary};
      transform: scale(1.05);
    }
    .plan-name {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    .price {
      font-size: 3rem;
      font-weight: 700;
      color: \${primary};
      margin-bottom: 2rem;
    }
    .features {
      list-style: none;
      margin-bottom: 2rem;
    }
    .features li {
      padding: 0.5rem 0;
      color: \${neutral};
    }
    button {
      width: 100%;
      padding: 1rem;
      background: \${primary};
      color: white;
      border: none;
      border-radius: \${borderRadius};
      font-size: 1rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Choisissez votre plan</h1>
  <div class="pricing-grid">
    <div class="pricing-card">
      <h2 class="plan-name">Basique</h2>
      <div class="price">€9</div>
      <ul class="features">
        <li>✓ 1 utilisateur</li>
        <li>✓ 10 projets</li>
        <li>✓ Support email</li>
      </ul>
      <button>Commencer</button>
    </div>
    <div class="pricing-card featured">
      <h2 class="plan-name">Pro</h2>
      <div class="price">€29</div>
      <ul class="features">
        <li>✓ 5 utilisateurs</li>
        <li>✓ Projets illimités</li>
        <li>✓ Support prioritaire</li>
        <li>✓ Analytics avancés</li>
      </ul>
      <button>Commencer</button>
    </div>
    <div class="pricing-card">
      <h2 class="plan-name">Entreprise</h2>
      <div class="price">€99</div>
      <ul class="features">
        <li>✓ Utilisateurs illimités</li>
        <li>✓ Tout inclus</li>
        <li>✓ Support dédié</li>
        <li>✓ API access</li>
      </ul>
      <button>Nous contacter</button>
    </div>
  </div>
</body>
</html>`,
    ],
  };
  return patterns[screenType] || patterns.dashboard;
}
function applyDesignAdjustments(designSpec, adjustments) {
  const updated = { ...designSpec };
  // Parse adjustment commands
  if (adjustments.includes('darker')) {
    // Darken colors
  }
  if (adjustments.includes('lighter')) {
    // Lighten colors
  }
  if (adjustments.includes('more spacing')) {
    // Increase spacing
  }
  return updated;
}
function mergeDesignSpecs(current, validated) {
  // Merge validated specs into current design system
  return {
    ...current,
    colors: { ...current.colors, ...validated.colors },
    typography: { ...current.typography, ...validated.typography },
    spacing: { ...current.spacing, ...validated.spacing },
    components: { ...current.components, ...validated.components },
  };
}
async function generateInteractiveMockupShell(pages, designSystem) {
  // Import the existing function from quick-designer-integration
  const { generateInteractiveMockup } = await import('./quick-designer-integration.js');
  return generateInteractiveMockup(pages, designSystem);
}
async function saveMockupToFile(html) {
  // This will be implemented to save to docs/ui/mockup.html
  const fs = await import('fs-extra');
  const path = await import('path');
  const mockupPath = path.join(process.cwd(), 'docs', 'ui', 'mockup.html');
  await fs.ensureDir(path.dirname(mockupPath));
  await fs.writeFile(mockupPath, html, 'utf-8');
}
/**
 * Export Flash commands as MCP tools
 */
function getFlashTools() {
  return Object.entries(exports.flashCommands).map(([key, command]) => ({
    name: `quick_designer_${key}`,
    description: command.description,
    inputSchema: command.inputSchema || {
      type: 'object',
      properties: {},
      required: [],
    },
  }));
}
exports.default = exports.flashCommands;
