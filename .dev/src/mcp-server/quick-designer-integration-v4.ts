/**
 * Quick Designer Integration Module v4
 * Pattern-based UI generation without external LLM calls
 */

import * as path from "path";
import * as fs from "fs-extra";
import {
  generateUIFromDesignSystem,
  generateVariants,
  type DesignSpec,
  type GenerationRequest,
} from "./ui-generator.js";
import {
  extractFromURL,
  extractFromImage,
  normalizeDesignSystem,
} from "./design-extractor.js";
import { DesignWorkflow } from "./workflow-manager.js";
import {
  getPatternsForScreen,
  selectPatternByStyle,
  applyDesignSystem,
  type Pattern
} from "./pattern-library.js";

/**
 * Pattern-based generation service (no LLM required)
 */
export class PatternRemixService {
  private patterns: Map<string, Pattern[]> = new Map();

  constructor() {
    this.loadPatterns();
  }

  private loadPatterns(): void {
    // Load built-in patterns from pattern library
    const screenTypes = ["login", "dashboard", "pricing", "settings", "profile"];
    for (const screenType of screenTypes) {
      this.patterns.set(screenType, getPatternsForScreen(screenType));
    }
  }

  /**
   * Generate HTML using pattern remix approach
   */
  async generate(
    screenType: string,
    designSpec: DesignSpec,
    style: string = "modern",
    variationIndex: number = 0
  ): Promise<string> {
    // Get patterns for screen type
    const patterns = this.patterns.get(screenType) || this.patterns.get("dashboard")!;

    // Select pattern based on style and index
    const pattern = selectPatternByStyle(patterns, style, variationIndex);

    // Apply design system to pattern
    const html = applyDesignSystem(pattern.html, designSpec);

    return html;
  }

  /**
   * Generate multiple variations
   */
  async generateVariations(
    screenType: string,
    designSpec: DesignSpec,
    count: number = 3
  ): Promise<string[]> {
    const styles = ["minimal", "modern", "bold"];
    const variations: string[] = [];

    for (let i = 0; i < count; i++) {
      const style = styles[i % styles.length];
      const html = await this.generate(screenType, designSpec, style, i);
      variations.push(html);
    }

    return variations;
  }
}

/**
 * Generate interactive mockup with multi-variation support
 */
export async function generateInteractiveMockup(
  pages: any[],
  designSystem: DesignSpec
): Promise<string> {
  const patternService = new PatternRemixService();

  // Ensure all variations have HTML
  for (const page of pages) {
    if (page.variations) {
      for (let i = 0; i < page.variations.length; i++) {
        const variation = page.variations[i];
        if (!variation.html) {
          // Generate using pattern remix
          variation.html = await patternService.generate(
            page.type || page.name,
            variation.specs || designSystem,
            variation.style || "modern",
            i
          );
        }
      }
    } else {
      // Generate default variations if none exist
      const htmlVariations = await patternService.generateVariations(
        page.type || page.name,
        designSystem
      );
      page.variations = htmlVariations.map((html, index) => ({
        name: getVariationName(page.type, index),
        html,
        specs: designSystem
      }));
    }
  }

  // Build the interactive mockup shell
  return generateMockupHTML(pages, designSystem);
}

/**
 * Get variation name based on type and index
 */
function getVariationName(screenType: string, index: number): string {
  const names = {
    login: ["Minimal", "Split Screen", "Floating Card"],
    dashboard: ["Analytics Focus", "Cards View", "Data Table"],
    pricing: ["Simple Cards", "Feature Table", "Comparison"],
    settings: ["Tabbed", "Sidebar", "Accordion"],
    profile: ["Compact", "Detailed", "Social"]
  };

  const typeNames = names[screenType as keyof typeof names];
  return typeNames?.[index] || `Variation ${index + 1}`;
}

/**
 * Generate the complete mockup HTML with design system controls
 */
function generateMockupHTML(pages: any[], designSystem: DesignSpec): string {
  const primary = designSystem.colors?.primary || "#3B82F6";
  const accent = designSystem.colors?.accent || "#10B981";
  const neutral = designSystem.colors?.neutral?.[0] || "#6B7280";
  const bg = designSystem.colors?.background || "#F9FAFB";
  const surface = designSystem.colors?.surface || "#FFFFFF";
  const fontFamily = designSystem.typography?.fontFamily || "Inter";
  const borderRadius = designSystem.components?.borderRadius || "8px";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Designer v4 - Mockup Interactif</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${neutral};
      --bg: ${bg};
      --surface: ${surface};
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .palette-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .palette-option {
      padding: 0.5rem;
      border: 2px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .palette-option:hover {
      border-color: var(--primary);
      transform: translateY(-1px);
    }

    .palette-option.selected {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.05);
    }

    .color-preview {
      width: 100%;
      height: 24px;
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }

    select, input[type="range"] {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      font-size: 0.875rem;
      background: white;
    }

    input[type="range"] {
      padding: 0;
    }

    .range-value {
      text-align: center;
      margin-top: 0.5rem;
      font-size: 0.875rem;
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
      overflow-x: auto;
    }

    .tab {
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--neutral);
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      position: relative;
    }

    .tab:hover {
      color: #111827;
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: var(--accent);
      color: white;
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 999px;
    }

    /* Preview Area */
    .preview {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0),
                  linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0);
      background-size: 20px 20px;
      background-position: 0 0, 10px 10px;
    }

    .page-content {
      display: none;
    }

    .page-content.active {
      display: block;
    }

    .variations {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 2rem;
    }

    .variation-card {
      border: 1px solid #E5E7EB;
      border-radius: var(--border-radius);
      overflow: hidden;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;
    }

    .variation-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
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
      background: white;
    }

    .variation-preview iframe {
      width: 100%;
      height: 100%;
      border: none;
      transform: scale(0.8);
      transform-origin: top left;
      width: 125%;
      height: 125%;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.recommended {
      background: var(--accent);
      color: white;
    }

    .badge.validated {
      background: var(--primary);
      color: white;
    }

    /* Status Indicators */
    .status-indicator {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(59, 130, 246, 0.05);
      border-left: 4px solid var(--primary);
      border-radius: 4px;
    }

    .status-indicator h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .status-indicator p {
      font-size: 0.75rem;
      color: var(--neutral);
    }

    /* Animations */
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

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .design-system {
        display: none;
      }
      .variations {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- Design System Sidebar -->
    <div class="design-system">
      <h2>🎨 Design System</h2>

      <!-- Color Palettes -->
      <div class="control-group">
        <label>Palette de couleurs</label>
        <div class="palette-grid">
          <div class="palette-option selected" onclick="selectPalette('ocean')">
            <div class="color-preview" style="background: linear-gradient(90deg, #3B82F6, #06B6D4);"></div>
            Ocean
          </div>
          <div class="palette-option" onclick="selectPalette('sunset')">
            <div class="color-preview" style="background: linear-gradient(90deg, #F59E0B, #EF4444);"></div>
            Sunset
          </div>
          <div class="palette-option" onclick="selectPalette('forest')">
            <div class="color-preview" style="background: linear-gradient(90deg, #10B981, #059669);"></div>
            Forest
          </div>
          <div class="palette-option" onclick="selectPalette('midnight')">
            <div class="color-preview" style="background: linear-gradient(90deg, #4C1D95, #1E3A8A);"></div>
            Midnight
          </div>
          <div class="palette-option" onclick="selectPalette('coral')">
            <div class="color-preview" style="background: linear-gradient(90deg, #F87171, #FB923C);"></div>
            Coral
          </div>
          <div class="palette-option" onclick="selectPalette('mono')">
            <div class="color-preview" style="background: linear-gradient(90deg, #374151, #6B7280);"></div>
            Mono
          </div>
        </div>
      </div>

      <!-- Typography -->
      <div class="control-group">
        <label>Typographie</label>
        <select onchange="selectFont(this.value)">
          <option value="Inter">Inter (Moderne)</option>
          <option value="Roboto">Roboto (Classique)</option>
          <option value="Playfair Display">Playfair (Élégant)</option>
          <option value="Space Mono">Space Mono (Tech)</option>
          <option value="Poppins">Poppins (Amical)</option>
        </select>
      </div>

      <!-- Border Radius -->
      <div class="control-group">
        <label>Arrondi des coins</label>
        <input type="range" min="0" max="24" value="8" onchange="updateRadius(this.value)">
        <div class="range-value">
          <span id="radiusValue">8</span>px
        </div>
      </div>

      <!-- Density -->
      <div class="control-group">
        <label>Densité</label>
        <select onchange="updateDensity(this.value)">
          <option value="compact">Compact</option>
          <option value="comfortable" selected>Confortable</option>
          <option value="spacious">Spacieux</option>
        </select>
      </div>

      <!-- Status -->
      <div class="status-indicator">
        <h3>⚡ Mode Pattern Remix</h3>
        <p>Génération instantanée sans appel LLM</p>
        <p style="margin-top: 0.5rem;">
          <strong>Pages:</strong> ${pages.length}<br>
          <strong>Variations:</strong> ${pages.reduce((sum, p) => sum + (p.variations?.length || 0), 0)}
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Tabs -->
      <div class="tabs" id="tabs">
        ${pages
          .map(
            (page, index) => `
          <div class="tab ${index === 0 ? "active" : ""}"
               data-page="${page.name}"
               onclick="switchTab('${page.name}')">
            ${page.name}
            ${page.variations?.some((v: any) => v.validated) ? '<span class="tab-badge">✓</span>' : ''}
          </div>`
          )
          .join("")}
      </div>

      <!-- Preview Area -->
      <div class="preview" id="preview">
        ${pages
          .map(
            (page, index) => `
          <div class="page-content ${index === 0 ? "active" : ""}" id="page-${page.name}">
            <div class="variations">
              ${
                page.variations
                  ? page.variations
                      .map(
                        (variation: any, vIndex: number) => `
                <div class="variation-card">
                  <div class="variation-header">
                    <span class="variation-name">${variation.name}</span>
                    <div>
                      ${vIndex === 0 ? '<span class="badge recommended">Recommandé</span>' : ""}
                      ${variation.validated ? '<span class="badge validated">Validé</span>' : ""}
                    </div>
                  </div>
                  <div class="variation-preview">
                    <iframe srcdoc="${(variation.html || "")
                      .replace(/"/g, "&quot;")
                      .replace(/'/g, "&#39;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")}"></iframe>
                  </div>
                </div>
              `
                      )
                      .join("")
                  : "<div>Aucune variation disponible</div>"
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </div>

  <script>
    const MOCKUP_DATA = ${JSON.stringify({ pages, designSystem })};

    // Palette definitions
    const PALETTES = {
      ocean: {
        primary: '#3B82F6',
        accent: '#06B6D4',
        neutral: '#64748B'
      },
      sunset: {
        primary: '#F59E0B',
        accent: '#EF4444',
        neutral: '#78716C'
      },
      forest: {
        primary: '#10B981',
        accent: '#059669',
        neutral: '#6B7280'
      },
      midnight: {
        primary: '#4C1D95',
        accent: '#1E3A8A',
        neutral: '#475569'
      },
      coral: {
        primary: '#F87171',
        accent: '#FB923C',
        neutral: '#78716C'
      },
      mono: {
        primary: '#374151',
        accent: '#6B7280',
        neutral: '#9CA3AF'
      }
    };

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

    // Select color palette
    function selectPalette(paletteName) {
      const palette = PALETTES[paletteName];
      if (!palette) return;

      // Update CSS variables
      document.documentElement.style.setProperty('--primary', palette.primary);
      document.documentElement.style.setProperty('--accent', palette.accent);
      document.documentElement.style.setProperty('--neutral', palette.neutral);

      // Update UI
      document.querySelectorAll('.palette-option').forEach(option => {
        const optionName = option.textContent.trim().toLowerCase();
        option.classList.toggle('selected', optionName === paletteName);
      });

      // Update all iframes
      updateAllPreviews();
      showToast('Palette ' + paletteName + ' appliquée');
    }

    // Select font
    function selectFont(fontName) {
      document.documentElement.style.setProperty('--font-family', fontName);

      // Load font from Google Fonts
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=' +
                  fontName.replace(' ', '+') + ':wght@400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      updateAllPreviews();
      showToast('Police ' + fontName + ' appliquée');
    }

    // Update border radius
    function updateRadius(value) {
      document.documentElement.style.setProperty('--border-radius', value + 'px');
      document.getElementById('radiusValue').textContent = value;
      updateAllPreviews();
    }

    // Update density
    function updateDensity(density) {
      let multiplier = 1;
      switch (density) {
        case 'compact': multiplier = 0.75; break;
        case 'comfortable': multiplier = 1; break;
        case 'spacious': multiplier = 1.5; break;
      }

      // Update spacing in iframes
      updateAllPreviews();
      showToast('Densité ' + density + ' appliquée');
    }

    // Update all preview iframes with new styles
    function updateAllPreviews() {
      const styles = getComputedStyle(document.documentElement);
      const cssVars = {
        '--primary': styles.getPropertyValue('--primary'),
        '--accent': styles.getPropertyValue('--accent'),
        '--neutral': styles.getPropertyValue('--neutral'),
        '--bg': styles.getPropertyValue('--bg'),
        '--surface': styles.getPropertyValue('--surface'),
        '--font-family': styles.getPropertyValue('--font-family'),
        '--border-radius': styles.getPropertyValue('--border-radius')
      };

      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc && doc.documentElement) {
            Object.entries(cssVars).forEach(([key, value]) => {
              doc.documentElement.style.setProperty(key, value);
            });
          }
        } catch (e) {
          console.log('Could not update iframe:', e);
        }
      });
    }

    // Show toast notification
    function showToast(message) {
      // Remove existing toasts
      document.querySelectorAll('.toast').forEach(t => t.remove());

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }

    // Initialize
    console.log('Quick Designer v4 - Pattern Remix System');
    console.log('Pages:', MOCKUP_DATA.pages.length);
    console.log('Total Variations:', MOCKUP_DATA.pages.reduce((sum, p) => sum + (p.variations?.length || 0), 0));

    // Fix iframe scaling on load
    window.addEventListener('load', () => {
      document.querySelectorAll('iframe').forEach(iframe => {
        iframe.onload = () => {
          updateAllPreviews();
        };
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Export for MCP integration
 */
export const QuickDesignerV4 = {
  PatternRemixService,
  generateInteractiveMockup,
  extractFromURL,
  extractFromImage,
  normalizeDesignSystem,
  DesignWorkflow
};

export default QuickDesignerV4;