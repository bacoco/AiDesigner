'use strict';
/**
 * Design Extractor Module
 * Extracts design systems from various sources (URLs, images, HTML)
 * Uses Chrome MCP for web scraping and Vision AI for image analysis
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractComponentStyleTool =
  exports.analyzeDesignFromImageTool =
  exports.extractDesignFromURLTool =
    void 0;
exports.extractFromURL = extractFromURL;
exports.extractFromImage = extractFromImage;
exports.extractFromHTML = extractFromHTML;
exports.normalizeDesignSystem = normalizeDesignSystem;
exports.extractElementStyle = extractElementStyle;
/**
 * Extract design system from a URL using Chrome MCP
 */
async function extractFromURL(url, chromeMCP) {
  // This would use Chrome MCP to:
  // 1. Navigate to the URL
  // 2. Extract computed styles
  // 3. Identify components
  // 4. Capture color palette
  // 5. Analyze typography
  // Placeholder implementation
  const extractionPrompt = `
Navigate to ${url} and extract:
1. Color palette (primary, secondary, accent, neutrals)
2. Typography (fonts, sizes, weights)
3. Spacing system (padding, margins, gaps)
4. Component styles (buttons, inputs, cards)
5. Border radius values
6. Shadow styles
7. Animation/transition styles

Return as structured JSON matching DesignSpec interface.
  `;
  // In production, this would use actual Chrome MCP
  const result = {
    source: url,
    type: 'url',
    timestamp: new Date().toISOString(),
    designSpec: {
      colors: {
        primary: '#5E6AD2',
        secondary: '#3D9970',
        accent: '#FF6B6B',
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
    },
    components: {
      navigation: [],
      buttons: [],
      forms: [],
      cards: [],
    },
    metadata: {
      title: 'Extracted Design',
      confidence: 0.85,
    },
  };
  return result;
}
/**
 * Extract design system from an image using Vision AI
 */
async function extractFromImage(imagePath, visionAI) {
  // This would use Vision AI to:
  // 1. Analyze the image
  // 2. Detect UI components
  // 3. Extract colors
  // 4. Identify typography
  // 5. Recognize patterns
  const analysisPrompt = `
Analyze this UI screenshot and extract:
1. Color palette with hex values
2. Typography details (font families if recognizable, sizes, weights)
3. Component identification (buttons, inputs, cards, navigation)
4. Layout patterns (grid, flexbox, spacing)
5. Visual style (minimal, modern, playful, professional)

Return structured data matching DesignSpec format.
  `;
  // Placeholder for Vision AI analysis
  const result = {
    source: imagePath,
    type: 'image',
    timestamp: new Date().toISOString(),
    designSpec: {
      colors: {
        primary: '#3B82F6',
        accent: '#10B981',
        neutral: ['#1F2937', '#6B7280'],
        background: '#F3F4F6',
      },
      typography: {
        fontFamily: 'Sans-serif',
        scale: 1.2,
      },
      spacing: {
        unit: '8px',
      },
      components: {
        borderRadius: '6px',
      },
    },
    components: {},
    metadata: {
      description: 'Design extracted from screenshot',
      confidence: 0.75,
    },
  };
  return result;
}
/**
 * Extract design patterns from raw HTML/CSS
 */
function extractFromHTML(html, css) {
  // Parse HTML and CSS to extract design tokens
  const colors = extractColors(html + (css || ''));
  const fonts = extractFonts(html + (css || ''));
  const components = identifyComponents(html);
  return {
    source: 'html',
    type: 'html',
    timestamp: new Date().toISOString(),
    designSpec: {
      colors: {
        primary: colors[0] || '#5E6AD2',
        accent: colors[1] || '#3D9970',
        neutral: colors.slice(2, 6),
        background: '#FFFFFF',
      },
      typography: {
        fontFamily: fonts[0] || 'system-ui',
      },
      spacing: {
        unit: '8px',
      },
      components: {
        borderRadius: '8px',
      },
    },
    components: components,
    metadata: {
      confidence: 0.9,
    },
  };
}
/**
 * Extract colors from text content
 */
function extractColors(content) {
  const colorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
  const rgbRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
  const colors = new Set();
  // Extract hex colors
  let match;
  while ((match = colorRegex.exec(content)) !== null) {
    colors.add(match[0]);
  }
  // Extract RGB colors and convert to hex
  while ((match = rgbRegex.exec(content)) !== null) {
    const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    colors.add(hex);
  }
  return Array.from(colors);
}
/**
 * Extract font families from content
 */
function extractFonts(content) {
  const fontRegex = /font-family:\s*([^;]+);/g;
  const fonts = new Set();
  let match;
  while ((match = fontRegex.exec(content)) !== null) {
    const fontList = match[1].split(',').map((f) => f.trim().replace(/['"]/g, ''));
    fontList.forEach((font) => fonts.add(font));
  }
  return Array.from(fonts);
}
/**
 * Identify UI components in HTML
 */
function identifyComponents(html) {
  const components = {
    navigation: [],
    buttons: [],
    forms: [],
    cards: [],
    modals: [],
    tables: [],
  };
  // Simple pattern matching for common components
  if (html.includes('<nav') || html.includes('navigation')) {
    components.navigation?.push({ type: 'navbar', detected: true });
  }
  if (html.includes('<button') || html.includes('btn')) {
    components.buttons?.push({ type: 'button', detected: true });
  }
  if (html.includes('<form') || html.includes('<input')) {
    components.forms?.push({ type: 'form', detected: true });
  }
  if (html.includes('card') || html.includes('panel')) {
    components.cards?.push({ type: 'card', detected: true });
  }
  if (html.includes('<table')) {
    components.tables?.push({ type: 'table', detected: true });
  }
  return components;
}
/**
 * Convert RGB to Hex
 */
function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}
/**
 * Normalize extracted design to standard format
 */
function normalizeDesignSystem(rawData) {
  // Ensure all required fields are present
  return {
    colors: {
      primary: rawData.colors?.primary || '#5E6AD2',
      secondary: rawData.colors?.secondary,
      accent: rawData.colors?.accent,
      neutral: rawData.colors?.neutral || ['#6B7280'],
      background: rawData.colors?.background || '#F9FAFB',
      surface: rawData.colors?.surface || '#FFFFFF',
    },
    typography: {
      fontFamily: rawData.typography?.fontFamily || 'system-ui, sans-serif',
      scale: rawData.typography?.scale || 1.25,
      headingFont: rawData.typography?.headingFont,
      bodyFont: rawData.typography?.bodyFont,
    },
    spacing: {
      unit: rawData.spacing?.unit || '8px',
      scale: rawData.spacing?.scale || [4, 8, 16, 24, 32, 48, 64],
    },
    components: {
      borderRadius: rawData.components?.borderRadius || '8px',
      shadowScale: rawData.components?.shadowScale || [
        '0 1px 2px rgba(0, 0, 0, 0.05)',
        '0 4px 6px rgba(0, 0, 0, 0.1)',
      ],
      button: rawData.components?.button,
      input: rawData.components?.input,
      card: rawData.components?.card,
    },
    layout: rawData.layout,
  };
}
/**
 * Extract specific element style using selector
 */
async function extractElementStyle(url, selector, chromeMCP) {
  // This would use Chrome MCP to:
  // 1. Navigate to URL
  // 2. Find element by selector
  // 3. Get computed styles
  // 4. Extract relevant design tokens
  const extractionScript = `
    const element = document.querySelector('${selector}');
    if (!element) return null;

    const styles = window.getComputedStyle(element);
    return {
      colors: {
        background: styles.backgroundColor,
        color: styles.color,
        border: styles.borderColor
      },
      typography: {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight
      },
      spacing: {
        padding: styles.padding,
        margin: styles.margin
      },
      dimensions: {
        width: styles.width,
        height: styles.height
      },
      effects: {
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow
      }
    };
  `;
  // Placeholder result
  return {
    selector,
    styles: {
      colors: { background: '#FFFFFF', color: '#000000' },
      typography: { fontFamily: 'Inter', fontSize: '16px' },
    },
  };
}
/**
 * Tool definition for extracting design from URL
 */
exports.extractDesignFromURLTool = {
  name: 'extract_design_from_url',
  description: 'Extract design system from a website URL',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to extract design from',
      },
      components: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific components to focus on',
      },
    },
    required: ['url'],
  },
};
/**
 * Tool definition for analyzing design from image
 */
exports.analyzeDesignFromImageTool = {
  name: 'analyze_design_from_image',
  description: 'Extract design system from a screenshot or image',
  inputSchema: {
    type: 'object',
    properties: {
      imagePath: {
        type: 'string',
        description: 'Path to the image file',
      },
      focusAreas: {
        type: 'array',
        items: { type: 'string' },
        description: "Specific areas to focus on (e.g., 'navigation', 'hero', 'footer')",
      },
    },
    required: ['imagePath'],
  },
};
/**
 * Tool definition for extracting component style
 */
exports.extractComponentStyleTool = {
  name: 'extract_component_style',
  description: 'Extract style of a specific component from a website',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The website URL',
      },
      selector: {
        type: 'string',
        description: 'CSS selector for the component',
      },
      componentType: {
        type: 'string',
        enum: ['button', 'navbar', 'card', 'form', 'modal', 'table'],
        description: 'Type of component',
      },
    },
    required: ['url', 'selector'],
  },
};
