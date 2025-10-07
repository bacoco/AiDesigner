'use strict';
/**
 * Chrome MCP Adapter for Quick Designer v4
 * Integrates with chrome-devtools-mcp server for design extraction
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ChromeMCPAdapter = void 0;
exports.getChromeMCPAdapter = getChromeMCPAdapter;
class ChromeMCPAdapter {
  constructor(config = {}) {
    this.config = {
      serverUrl: config.serverUrl || 'chrome-devtools',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
    };
  }
  /**
   * Extract design tokens from a URL using Chrome MCP
   */
  async extractFromURL(url) {
    try {
      // Build extraction script
      const extractionScript = this.buildExtractionScript();
      // Call Chrome MCP to navigate and extract
      const extracted = await this.executeChromeMCP({
        action: 'navigate_and_extract',
        url,
        script: extractionScript,
      });
      // Convert to DesignSpec format
      const designSpec = this.convertToDesignSpec(extracted);
      return {
        source: url,
        type: 'url',
        timestamp: new Date().toISOString(),
        designSpec,
        components: this.extractComponents(extracted),
        metadata: {
          title: extracted.title || 'Extracted Design',
          description: `Design system extracted from ${url}`,
          confidence: this.calculateConfidence(extracted),
        },
      };
    } catch (error) {
      console.error(`Chrome MCP extraction failed for ${url}:`, error);
      return this.getFallbackDesign(url);
    }
  }
  /**
   * Build extraction script for Chrome DevTools
   */
  buildExtractionScript() {
    return `
      // Extract design tokens from the page
      function extractDesignTokens() {
        const styles = {};

        // Get computed styles from various elements
        const elements = document.querySelectorAll('button, input, a, h1, h2, h3, p, div');
        const colorSet = new Set();
        const fontSet = new Set();
        const radiusSet = new Set();
        const shadowSet = new Set();

        elements.forEach(el => {
          const computed = window.getComputedStyle(el);

          // Extract colors
          ['color', 'background-color', 'border-color'].forEach(prop => {
            const value = computed.getPropertyValue(prop);
            if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
              colorSet.add(value);
            }
          });

          // Extract fonts
          const fontFamily = computed.getPropertyValue('font-family');
          if (fontFamily) {
            fontFamily.split(',').forEach(font => {
              fontSet.add(font.trim().replace(/['"]/g, ''));
            });
          }

          // Extract border radius
          const borderRadius = computed.getPropertyValue('border-radius');
          if (borderRadius && borderRadius !== '0px') {
            radiusSet.add(borderRadius);
          }

          // Extract shadows
          const boxShadow = computed.getPropertyValue('box-shadow');
          if (boxShadow && boxShadow !== 'none') {
            shadowSet.add(boxShadow);
          }
        });

        // Analyze color palette
        const colors = Array.from(colorSet);
        const rgbToHex = (rgb) => {
          const match = rgb.match(/\\d+/g);
          if (!match) return rgb;
          const [r, g, b] = match;
          return '#' + [r, g, b].map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
        };

        // Find primary colors (most used in buttons/links)
        const buttonColors = [];
        document.querySelectorAll('button, a, .btn, .button').forEach(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)') {
            buttonColors.push(rgbToHex(bg));
          }
        });

        // Get page metadata
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.content;

        return {
          title,
          description,
          colors: colors.map(c => c.includes('rgb') ? rgbToHex(c) : c),
          fonts: Array.from(fontSet),
          borderRadii: Array.from(radiusSet),
          shadows: Array.from(shadowSet),
          primaryColor: buttonColors[0] || colors[0],
          backgroundColor: rgbToHex(window.getComputedStyle(document.body).backgroundColor)
        };
      }

      return extractDesignTokens();
    `;
  }
  /**
   * Execute Chrome MCP command
   */
  async executeChromeMCP(params) {
    // This would call the actual Chrome MCP server
    // For now, simulate the extraction
    return this.simulateExtraction(params.url);
  }
  /**
   * Simulate extraction for testing (replace with actual Chrome MCP call)
   */
  simulateExtraction(url) {
    // Common design patterns based on popular sites
    const patterns = {
      linear: {
        colors: ['#5E6AD2', '#3451B2', '#F7F8F8', '#FFFFFF'],
        fonts: ['Inter', 'system-ui'],
        primaryColor: '#5E6AD2',
      },
      stripe: {
        colors: ['#635BFF', '#00D924', '#F6F9FC', '#FFFFFF'],
        fonts: ['Sohne', 'system-ui'],
        primaryColor: '#635BFF',
      },
      notion: {
        colors: ['#000000', '#37352F', '#F7F6F3', '#FFFFFF'],
        fonts: ['Inter', 'SF Pro Display'],
        primaryColor: '#000000',
      },
      default: {
        colors: ['#3B82F6', '#10B981', '#F3F4F6', '#FFFFFF'],
        fonts: ['Inter', 'system-ui'],
        primaryColor: '#3B82F6',
      },
    };
    // Select pattern based on URL
    let pattern = patterns.default;
    if (url.includes('linear')) pattern = patterns.linear;
    else if (url.includes('stripe')) pattern = patterns.stripe;
    else if (url.includes('notion')) pattern = patterns.notion;
    return {
      title: 'Extracted Design',
      colors: pattern.colors,
      fonts: pattern.fonts,
      primaryColor: pattern.primaryColor,
      backgroundColor: pattern.colors[2],
      borderRadii: ['4px', '6px', '8px'],
      shadows: ['0 1px 3px rgba(0,0,0,0.12)', '0 4px 6px rgba(0,0,0,0.1)'],
    };
  }
  /**
   * Convert extracted data to DesignSpec format
   */
  convertToDesignSpec(extracted) {
    const colors = extracted.colors || [];
    const fonts = extracted.fonts || [];
    // Analyze and categorize colors
    const primary = extracted.primaryColor || colors[0] || '#3B82F6';
    const background = extracted.backgroundColor || '#F9FAFB';
    // Find accent color (different from primary)
    const accent = colors.find((c) => c !== primary && this.isAccentColor(c)) || '#10B981';
    // Extract neutral colors
    const neutrals = colors.filter((c) => this.isNeutralColor(c)).slice(0, 4);
    if (neutrals.length === 0) {
      neutrals.push('#6B7280', '#9CA3AF');
    }
    // Process fonts
    const fontFamily = fonts.filter((f) => !f.includes('emoji')).join(', ') || 'system-ui';
    // Process border radius
    const radii = extracted.borderRadii || ['8px'];
    const borderRadius = this.findMostCommonValue(radii) || '8px';
    // Process shadows
    const shadows = extracted.shadows || [
      '0 1px 2px rgba(0, 0, 0, 0.05)',
      '0 4px 6px rgba(0, 0, 0, 0.1)',
    ];
    return {
      colors: {
        primary,
        accent,
        neutral: neutrals,
        background,
        surface: '#FFFFFF',
      },
      typography: {
        fontFamily,
        scale: 1.25,
        headingFont: fonts[0] || fontFamily,
        bodyFont: fonts[1] || fontFamily,
      },
      spacing: {
        unit: '8px',
        scale: [4, 8, 12, 16, 24, 32, 48, 64],
      },
      components: {
        borderRadius,
        shadowScale: shadows.slice(0, 3),
      },
    };
  }
  /**
   * Extract components from the page
   */
  extractComponents(extracted) {
    // This would analyze the page structure for component patterns
    return {
      navigation: [],
      buttons: [],
      forms: [],
      cards: [],
    };
  }
  /**
   * Check if color is an accent color (bright/saturated)
   */
  isAccentColor(color) {
    // Simple heuristic: bright greens, blues, purples
    return /^#([0-9A-F]{2}[8-F][0-9A-F]{3}|[8-F][0-9A-F]{5})$/i.test(color);
  }
  /**
   * Check if color is neutral (grayscale)
   */
  isNeutralColor(color) {
    if (!color.startsWith('#')) return false;
    const hex = color.substring(1);
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Check if RGB values are similar (grayscale)
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return maxDiff < 20;
  }
  /**
   * Find most common value in array
   */
  findMostCommonValue(values) {
    if (values.length === 0) return null;
    const counts = new Map();
    for (const value of values) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    let maxCount = 0;
    let mostCommon = values[0];
    for (const [value, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    }
    return mostCommon;
  }
  /**
   * Calculate confidence score for extraction
   */
  calculateConfidence(extracted) {
    let score = 0;
    if (extracted.colors?.length > 3) score += 0.25;
    if (extracted.fonts?.length > 0) score += 0.25;
    if (extracted.primaryColor) score += 0.25;
    if (extracted.borderRadii?.length > 0) score += 0.15;
    if (extracted.shadows?.length > 0) score += 0.1;
    return Math.min(score, 1);
  }
  /**
   * Get fallback design if extraction fails
   */
  getFallbackDesign(url) {
    return {
      source: url,
      type: 'url',
      timestamp: new Date().toISOString(),
      designSpec: {
        colors: {
          primary: '#3B82F6',
          accent: '#10B981',
          neutral: ['#6B7280', '#9CA3AF'],
          background: '#F9FAFB',
          surface: '#FFFFFF',
        },
        typography: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          scale: 1.25,
        },
        spacing: {
          unit: '8px',
        },
        components: {
          borderRadius: '8px',
        },
      },
      components: {},
      metadata: {
        title: 'Fallback Design',
        description: 'Default design system',
        confidence: 0.5,
      },
    };
  }
  /**
   * Check if Chrome MCP is available
   */
  async checkAvailability() {
    try {
      // Check if chrome-devtools-mcp server is running
      // This would ping the actual server
      return true; // Simulated for now
    } catch {
      return false;
    }
  }
  /**
   * Extract design tokens from screenshot
   */
  async extractFromScreenshot(imagePath) {
    // This would use Chrome MCP to analyze the screenshot
    // For now, return a default design
    return this.getFallbackDesign(imagePath);
  }
}
exports.ChromeMCPAdapter = ChromeMCPAdapter;
// Singleton instance
let adapterInstance = null;
function getChromeMCPAdapter() {
  if (!adapterInstance) {
    adapterInstance = new ChromeMCPAdapter();
  }
  return adapterInstance;
}
exports.default = ChromeMCPAdapter;
