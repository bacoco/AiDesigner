#!/usr/bin/env node

/**
 * Theme Editor MCP Server
 * Provides CLI and programmatic control of theme operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

interface UITheme {
  primary: string;
  accent: string;
  background: string;
  updatedAt?: string;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: Partial<UITheme>;
  tags?: string[];
}

const DEFAULT_PRESETS: ThemePreset[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool, calming ocean-inspired palette',
    colors: { primary: '#0077be', accent: '#00d4ff', background: '#001f3f' },
    tags: ['blue', 'professional', 'calm'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm, vibrant sunset colors',
    colors: { primary: '#ff6b35', accent: '#fdc830', background: '#1a0b2e' },
    tags: ['warm', 'vibrant', 'energetic'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural, earthy forest tones',
    colors: { primary: '#2d6a4f', accent: '#74c69d', background: '#081c15' },
    tags: ['green', 'natural', 'calm'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep, mysterious midnight blues',
    colors: { primary: '#6366f1', accent: '#a855f7', background: '#020617' },
    tags: ['purple', 'dark', 'modern'],
  },
  {
    id: 'coral',
    name: 'Coral Reef',
    description: 'Vibrant coral and teal combination',
    colors: { primary: '#ff6f61', accent: '#2ec4b6', background: '#011627' },
    tags: ['coral', 'teal', 'vibrant'],
  },
];

class ThemeEditorMCPServer {
  private server: Server;
  private currentTheme: UITheme;
  private history: Array<{ theme: UITheme; action: string; timestamp: number }>;

  constructor() {
    this.server = new Server(
      {
        name: 'theme-editor',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.currentTheme = {
      primary: '#7c3aed',
      accent: '#ec4899',
      background: '#0f172a',
    };

    this.history = [{
      theme: { ...this.currentTheme },
      action: 'Initial theme',
      timestamp: Date.now()
    }];

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools()
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'theme_set_color':
            return await this.handleSetColor(args);
          case 'theme_apply_preset':
            return await this.handleApplyPreset(args);
          case 'theme_generate_palette':
            return await this.handleGeneratePalette(args);
          case 'theme_generate_dark_mode':
            return await this.handleGenerateDarkMode();
          case 'theme_get_current':
            return await this.handleGetCurrent();
          case 'theme_export':
            return await this.handleExport(args);
          case 'theme_undo':
            return await this.handleUndo();
          case 'theme_list_presets':
            return await this.handleListPresets();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'theme_set_color',
        description: 'Set a specific color token in the theme',
        inputSchema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              enum: ['primary', 'accent', 'background'],
              description: 'The color token to set'
            },
            color: {
              type: 'string',
              description: 'Hex color value (e.g., #7c3aed)'
            }
          },
          required: ['token', 'color']
        }
      },
      {
        name: 'theme_apply_preset',
        description: 'Apply a predefined theme preset',
        inputSchema: {
          type: 'object',
          properties: {
            presetId: {
              type: 'string',
              enum: ['ocean', 'sunset', 'forest', 'midnight', 'coral'],
              description: 'ID of the preset to apply'
            }
          },
          required: ['presetId']
        }
      },
      {
        name: 'theme_generate_palette',
        description: 'Generate a color palette from a base color',
        inputSchema: {
          type: 'object',
          properties: {
            baseColor: {
              type: 'string',
              description: 'Base hex color (e.g., #3b82f6)'
            },
            style: {
              type: 'string',
              enum: ['monochromatic', 'complementary', 'analogous', 'triadic'],
              description: 'Palette generation style',
              default: 'complementary'
            }
          },
          required: ['baseColor']
        }
      },
      {
        name: 'theme_generate_dark_mode',
        description: 'Generate a dark mode version of the current theme',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'theme_get_current',
        description: 'Get the current theme configuration',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'theme_export',
        description: 'Export the current theme in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json', 'css', 'tailwind'],
              description: 'Export format',
              default: 'json'
            }
          }
        }
      },
      {
        name: 'theme_undo',
        description: 'Undo the last theme change',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'theme_list_presets',
        description: 'List all available theme presets',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  private addToHistory(action: string) {
    this.history.push({
      theme: { ...this.currentTheme },
      action,
      timestamp: Date.now()
    });
  }

  private async handleSetColor(args: any) {
    const { token, color } = args;

    if (!color.match(/^#[0-9a-fA-F]{6}$/)) {
      throw new Error('Invalid hex color format. Expected #RRGGBB');
    }

    (this.currentTheme as any)[token] = color;
    this.addToHistory(`Set ${token} to ${color}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          theme: this.currentTheme,
          message: `✓ Set ${token} to ${color}`
        }, null, 2)
      }]
    };
  }

  private async handleApplyPreset(args: any) {
    const { presetId } = args;
    const preset = DEFAULT_PRESETS.find(p => p.id === presetId);

    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    this.currentTheme = {
      ...this.currentTheme,
      ...preset.colors
    } as UITheme;
    this.addToHistory(`Applied preset: ${preset.name}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          preset: preset.name,
          theme: this.currentTheme,
          message: `✓ Applied ${preset.name} preset`
        }, null, 2)
      }]
    };
  }

  private hexToHSL(hex: string): { h: number; s: number; l: number } {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private async handleGeneratePalette(args: any) {
    const { baseColor, style = 'complementary' } = args;

    if (!baseColor.match(/^#[0-9a-fA-F]{6}$/)) {
      throw new Error('Invalid hex color format. Expected #RRGGBB');
    }

    const hsl = this.hexToHSL(baseColor);
    let primary = baseColor;
    let accent = baseColor;
    let background = '#0f172a';

    if (style === 'monochromatic') {
      primary = baseColor;
      accent = this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 90));
      background = this.hslToHex(hsl.h, hsl.s * 0.3, 8);
    } else if (style === 'complementary') {
      primary = baseColor;
      accent = this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
      background = this.hslToHex(hsl.h, hsl.s * 0.5, 6);
    } else if (style === 'analogous') {
      primary = baseColor;
      accent = this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
      background = this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s * 0.4, 7);
    } else if (style === 'triadic') {
      primary = baseColor;
      accent = this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
      background = this.hslToHex((hsl.h + 240) % 360, hsl.s * 0.3, 8);
    }

    this.currentTheme = { primary, accent, background };
    this.addToHistory(`Generated ${style} palette from ${baseColor}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          style,
          baseColor,
          theme: this.currentTheme,
          message: `✓ Generated ${style} palette from ${baseColor}`
        }, null, 2)
      }]
    };
  }

  private async handleGenerateDarkMode() {
    const primaryHSL = this.hexToHSL(this.currentTheme.primary);
    const accentHSL = this.hexToHSL(this.currentTheme.accent);
    
    this.currentTheme = {
      primary: this.hslToHex(primaryHSL.h, primaryHSL.s * 0.9, Math.max(primaryHSL.l - 10, 40)),
      accent: this.hslToHex(accentHSL.h, accentHSL.s * 0.85, Math.max(accentHSL.l - 5, 45)),
      background: '#020617',
    };
    this.addToHistory('Generated dark mode version');

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          theme: this.currentTheme,
          message: '✓ Generated dark mode version'
        }, null, 2)
      }]
    };
  }

  private async handleGetCurrent() {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          theme: this.currentTheme,
          historyCount: this.history.length
        }, null, 2)
      }]
    };
  }

  private async handleExport(args: any) {
    const { format = 'json' } = args;
    let exported = '';

    if (format === 'json') {
      exported = JSON.stringify(this.currentTheme, null, 2);
    } else if (format === 'css') {
      exported = `:root {
  --theme-primary: ${this.currentTheme.primary};
  --theme-accent: ${this.currentTheme.accent};
  --theme-background: ${this.currentTheme.background};
}`;
    } else if (format === 'tailwind') {
      exported = `module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${this.currentTheme.primary}',
        accent: '${this.currentTheme.accent}',
        background: '${this.currentTheme.background}',
      },
    },
  },
};`;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          format,
          exported,
          message: `✓ Exported theme as ${format.toUpperCase()}`
        }, null, 2)
      }]
    };
  }

  private async handleUndo() {
    if (this.history.length <= 1) {
      throw new Error('No changes to undo');
    }

    this.history.pop();
    const previous = this.history[this.history.length - 1];
    this.currentTheme = { ...previous.theme };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          theme: this.currentTheme,
          action: previous.action,
          message: `✓ Undone to: ${previous.action}`
        }, null, 2)
      }]
    };
  }

  private async handleListPresets() {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          presets: DEFAULT_PRESETS.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            tags: p.tags
          })),
          count: DEFAULT_PRESETS.length
        }, null, 2)
      }]
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Theme Editor MCP Server started');
  }
}

const server = new ThemeEditorMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
