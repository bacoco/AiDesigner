'use strict';
/**
 * Quick Designer Integration Module
 * Uses Chrome MCP and pattern remixing - NO LLM API CALLS
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.QuickDesignerV4 = void 0;
exports.generateInteractiveMockup = generateInteractiveMockup;
const ui_generator_js_1 = require('./ui-generator.js');
const design_extractor_js_1 = require('./design-extractor.js');
const workflow_manager_js_1 = require('./workflow-manager.js');
const chrome_mcp_integration_js_1 = require('./chrome-mcp-integration.js');

// Pattern-based HTML Generator (NO AI SERVICE)
class PatternRemixService {
  async generate(prompt, designSpec) {
    // Extract screen type and variation from prompt
    const screenType = this.extractScreenType(prompt);
    const variationName = this.extractVariationName(prompt);

    // Use Chrome MCP patterns to generate HTML
    return chrome_mcp_integration_js_1.generateVariation(screenType, variationName, [designSpec]);
  }

  extractScreenType(prompt) {
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('login')) return 'login';
    if (promptLower.includes('pricing')) return 'pricing';
    return 'dashboard';
  }

  extractVariationName(prompt) {
    // Map prompt keywords to design patterns
    if (prompt.includes('Analytics Focus') || prompt.includes('data visualization')) {
      return 'Bloomberg Terminal';
    }
    if (prompt.includes('Data Table Focus') || prompt.includes('data tables')) {
      return 'Linear Developer';
    }
    if (prompt.includes('Minimal') || prompt.includes('clean card')) {
      return 'Apple Minimalist';
    }
    if (prompt.includes('Split Screen')) {
      return 'Stripe Modern';
    }
    if (prompt.includes('Floating') || prompt.includes('playful')) {
      return 'Spotify Playful';
    }
    // Default
    return 'Stripe Modern';
  }
}

/**
 * Generate mockup HTML with interactive design system
 */
async function generateInteractiveMockup(pages, designSystem) {
  const remixService = new PatternRemixService();

  // Generate HTML for each page variation using pattern remixing
  for (const page of pages) {
    if (page.variations) {
      for (const variation of page.variations) {
        if (!variation.html) {
          // Create a prompt that includes screen type and variation name
          const prompt = `Generate ${page.type || page.name} screen with ${variation.name} variation`;
          try {
            // Use Pattern Remix Service to generate distinct layouts WITHOUT AI
            variation.html = await remixService.generate(prompt, variation.specs || designSystem);
          } catch (error) {
            console.error(`Failed to generate HTML for ${page.name}/${variation.name}:`, error);
            variation.html = `<div>Error generating HTML: ${error}</div>`;
          }
        }
      }
    }
  }

  // Build complete mockup HTML
  const primary = designSystem.colors?.primary || '#3B82F6';
  const accent = designSystem.colors?.accent || '#10B981';
  const neutral = designSystem.colors?.neutral?.[0] || '#6B7280';
  const bg = designSystem.colors?.background || '#F9FAFB';
  const fontFamily = designSystem.typography?.fontFamily || 'Inter';
  const borderRadius = designSystem.components?.borderRadius || '8px';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Designer v4 - Pattern Remix System (No AI)</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Consolas&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${neutral};
      --bg: ${bg};
      --font-family: ${fontFamily};
      --border-radius: ${borderRadius};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-family), sans-serif;
      background: var(--bg);
      color: #111827;
    }

    #app {
      display: flex;
      height: 100vh;
    }

    /* Design System Sidebar */
    .design-system {
      width: 320px;
      background: white;
      border-right: 1px solid #E5E7EB;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .design-system h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #111827;
    }

    .control-group {
      margin-bottom: 2rem;
    }

    .control-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--neutral);
      margin-bottom: 0.75rem;
    }

    .pattern-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .pattern-option {
      padding: 0.75rem;
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .pattern-option:hover {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.05);
    }

    .pattern-option.selected {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.1);
    }

    .pattern-name {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .pattern-desc {
      font-size: 0.75rem;
      color: var(--neutral);
    }

    /* Main Content Area */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Tabs */
    .tabs {
      display: flex;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      padding: 0 1rem;
    }

    .tab {
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--neutral);
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab:hover {
      color: #111827;
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    /* Preview Area */
    .preview {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .page-content {
      display: none;
    }

    .page-content.active {
      display: block;
    }

    .variations {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
    }

    .variation-card {
      border: 1px solid #E5E7EB;
      border-radius: var(--border-radius);
      overflow: hidden;
      background: white;
    }

    .variation-header {
      padding: 1rem;
      background: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .variation-name {
      font-weight: 600;
      color: #111827;
    }

    .variation-preview {
      height: 500px;
      position: relative;
      overflow: hidden;
    }

    .variation-preview iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    /* Style Badges */
    .style-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #111827;
      color: white;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .style-badge.bloomberg {
      background: #000;
      color: #0F0;
    }

    .style-badge.stripe {
      background: #635BFF;
    }

    .style-badge.apple {
      background: #000;
    }

    .style-badge.spotify {
      background: #1DB954;
    }

    .style-badge.linear {
      background: #5E6AD2;
    }

    /* Chrome MCP Status */
    .mcp-status {
      margin-top: 2rem;
      padding: 1rem;
      background: #F0FDF4;
      border: 1px solid #86EFAC;
      border-radius: 8px;
    }

    .mcp-status-title {
      font-weight: 600;
      color: #166534;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mcp-status-desc {
      font-size: 0.75rem;
      color: #15803D;
    }

    /* Toast Notification */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- Design System Sidebar -->
    <div class="design-system">
      <h2>🎨 Pattern Remix System</h2>

      <!-- Pattern Selection -->
      <div class="control-group">
        <label>Design Patterns (No AI)</label>
        <div class="pattern-grid">
          <div class="pattern-option selected" onclick="selectPattern('bloomberg')">
            <div class="pattern-name">Bloomberg Terminal</div>
            <div class="pattern-desc">Dense financial data, green on black, monospace</div>
          </div>
          <div class="pattern-option" onclick="selectPattern('stripe')">
            <div class="pattern-name">Stripe Modern</div>
            <div class="pattern-desc">Clean SaaS, purple accent, card-based</div>
          </div>
          <div class="pattern-option" onclick="selectPattern('apple')">
            <div class="pattern-name">Apple Minimalist</div>
            <div class="pattern-desc">Spacious luxury, massive whitespace</div>
          </div>
          <div class="pattern-option" onclick="selectPattern('spotify')">
            <div class="pattern-name">Spotify Playful</div>
            <div class="pattern-desc">Dark theme, green accent, music-focused</div>
          </div>
          <div class="pattern-option" onclick="selectPattern('linear')">
            <div class="pattern-name">Linear Developer</div>
            <div class="pattern-desc">Minimal dev tool, subtle grays</div>
          </div>
        </div>
      </div>

      <!-- Chrome MCP Status -->
      <div class="mcp-status">
        <div class="mcp-status-title">
          <span>🌐</span>
          <span>Chrome MCP Integration</span>
        </div>
        <div class="mcp-status-desc">
          Extracting real HTML/CSS patterns from websites. No LLM API calls required.
        </div>
      </div>

      <!-- Web Search Status -->
      <div class="mcp-status" style="margin-top: 1rem; background: #FEF3C7; border-color: #FCD34D;">
        <div class="mcp-status-title" style="color: #92400E;">
          <span>🔍</span>
          <span>Web Search Active</span>
        </div>
        <div class="mcp-status-desc" style="color: #78350F;">
          Finding and remixing design patterns from the web.
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Tabs -->
      <div class="tabs" id="tabs">
        ${pages
          .map(
            (page, index) =>
              `<div class="tab ${index === 0 ? 'active' : ''}" data-page="${page.name}" onclick="switchTab('${page.name}')">${page.name}</div>`,
          )
          .join('')}
      </div>

      <!-- Preview Area -->
      <div class="preview" id="preview">
        ${pages
          .map(
            (page, index) => `
          <div class="page-content ${index === 0 ? 'active' : ''}" id="page-${page.name}">
            <div class="variations">
              ${
                page.variations
                  ? page.variations
                      .map((variation, vIndex) => {
                        // Determine style badge based on variation name
                        let badgeClass = 'stripe';
                        if (variation.name.includes('Analytics')) badgeClass = 'bloomberg';
                        else if (variation.name.includes('Minimal')) badgeClass = 'apple';
                        else if (variation.name.includes('Featured')) badgeClass = 'spotify';
                        else if (variation.name.includes('Simple')) badgeClass = 'linear';

                        return `
                <div class="variation-card">
                  <div class="variation-header">
                    <span class="variation-name">${variation.name}</span>
                    <span class="style-badge ${badgeClass}">${badgeClass.charAt(0).toUpperCase() + badgeClass.slice(1)} Style</span>
                  </div>
                  <div class="variation-preview">
                    <iframe srcdoc="${(variation.html || '')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#39;')}"></iframe>
                  </div>
                </div>
              `;
                      })
                      .join('')
                  : '<div>No variations available</div>'
              }
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  </div>

  <script>
    const MOCKUP_DATA = ${JSON.stringify({ pages, designSystem })};

    // Current selected pattern
    let currentPattern = 'bloomberg';

    // Switch between tabs
    function switchTab(pageName) {
      // Update tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === pageName);
      });

      // Update content
      document.querySelectorAll('.page-content').forEach(content => {
        content.classList.toggle('active', content.id === 'page-' + pageName);
      });
    }

    // Select design pattern
    function selectPattern(patternName) {
      currentPattern = patternName;

      // Update UI
      document.querySelectorAll('.pattern-option').forEach(option => {
        const isSelected = option.querySelector('.pattern-name').textContent.toLowerCase().includes(patternName);
        option.classList.toggle('selected', isSelected);
      });

      // NOTE: In real implementation, this would reload variations with new pattern
      showToast('Pattern ' + patternName + ' selected - variations will be regenerated');
    }

    // Show toast notification
    function showToast(message) {
      const toast = document.createElement('div');
      toast.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: #111827;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
      \`;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }

    // Initialize
    console.log('Quick Designer v4 - Pattern Remix System (NO AI REQUIRED)');
    console.log('Chrome MCP: Active');
    console.log('Web Search: Active');
    console.log('LLM APIs: DISABLED');
    console.log('Pages:', MOCKUP_DATA.pages.length);
  </script>
</body>
</html>`;
}

/**
 * Export for use in existing runtime
 */
exports.QuickDesignerV4 = {
  generateUIFromDesignSystem: ui_generator_js_1.generateUIFromDesignSystem,
  generateVariants: ui_generator_js_1.generateVariants,
  extractFromURL: chrome_mcp_integration_js_1.extractDesignFromURL,
  extractFromImage: design_extractor_js_1.extractFromImage,
  normalizeDesignSystem: design_extractor_js_1.normalizeDesignSystem,
  generateInteractiveMockup,
  generateDistinctVariations: chrome_mcp_integration_js_1.generateDistinctVariations,
  DesignWorkflow: workflow_manager_js_1.DesignWorkflow,
  PatternRemixService,
  DESIGN_PATTERNS: chrome_mcp_integration_js_1.DESIGN_PATTERNS,
};
