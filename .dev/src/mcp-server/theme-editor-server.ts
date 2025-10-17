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
import { hexToHSL, hslToHex, isValidHex } from '../../../common/utils/colorUtils.js';
import { DEFAULT_PRESETS } from '../../../common/constants/themePresets.js';
import type { ThemePreset } from '../../../common/constants/themePresets.js';

interface UITheme {
  primary: string;
  accent: string;
  background: string;
  updatedAt?: string;
}

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
              enum: DEFAULT_PRESETS.map(p => p.id),
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
    // Cap history to prevent unbounded growth
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  private async handleSetColor(args: any) {
    const { token, color } = args;

    // Validate token
    const allowedTokens = ['primary', 'accent', 'background'] as const;
    if (!allowedTokens.includes(token)) {
      throw new Error(`Invalid token: ${token}. Must be one of: ${allowedTokens.join(', ')}`);
    }

    // Validate hex color
    if (!isValidHex(color)) {
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

  private async handleGeneratePalette(args: any) {
    const { baseColor, style = 'complementary' } = args;

    // Validate hex color
    if (!isValidHex(baseColor)) {
      throw new Error('Invalid hex color format. Expected #RRGGBB');
    }

    const hsl = hexToHSL(baseColor);
    let primary = baseColor;
    let accent = baseColor;
    let background = '#0f172a';

    if (style === 'monochromatic') {
      primary = baseColor;
      accent = hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 90));
      background = hslToHex(hsl.h, hsl.s * 0.3, 8);
    } else if (style === 'complementary') {
      primary = baseColor;
      accent = hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
      background = hslToHex(hsl.h, hsl.s * 0.5, 6);
    } else if (style === 'analogous') {
      primary = baseColor;
      accent = hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
      background = hslToHex((hsl.h - 30 + 360) % 360, hsl.s * 0.4, 7);
    } else if (style === 'triadic') {
      primary = baseColor;
      accent = hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
      background = hslToHex((hsl.h + 240) % 360, hsl.s * 0.3, 8);
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
    const primaryHSL = hexToHSL(this.currentTheme.primary);
    const accentHSL = hexToHSL(this.currentTheme.accent);

    this.currentTheme = {
      primary: hslToHex(primaryHSL.h, primaryHSL.s * 0.9, Math.max(primaryHSL.l - 10, 40)),
      accent: hslToHex(accentHSL.h, accentHSL.s * 0.85, Math.max(accentHSL.l - 5, 45)),
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

    const validFormats = ['json', 'css', 'tailwind'];
    if (!validFormats.includes(format)) {
      throw new Error(`Unsupported export format: ${format}. Must be one of: ${validFormats.join(', ')}`);
    }

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
