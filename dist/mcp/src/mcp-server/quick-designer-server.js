#!/usr/bin/env node
'use strict';
/**
 * Quick Designer v4 MCP Server
 * Exposes Flash commands for Claude CLI integration
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
const index_js_1 = require('@modelcontextprotocol/sdk/server/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const path = __importStar(require('path'));
const flash_commands_js_1 = require('./flash-commands.js');
const design_library_storage_js_1 = require('./design-library-storage.js');
const chrome_mcp_adapter_js_1 = require('./chrome-mcp-adapter.js');
const quick_designer_integration_v4_js_1 = require('./quick-designer-integration-v4.js');
// Server name
const SERVER_NAME = 'quick-designer-v4';
const SERVER_VERSION = '4.0.0';
class QuickDesignerMCPServer {
  constructor() {
    this.storage = (0, design_library_storage_js_1.getStorage)();
    this.chromeMCP = (0, chrome_mcp_adapter_js_1.getChromeMCPAdapter)();
    this.patternService = new quick_designer_integration_v4_js_1.PatternRemixService();
    this.server = new index_js_1.Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
    this.setupHandlers();
  }
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));
    // Handle tool calls
    this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const result = await this.handleToolCall(name, args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }
  getTools() {
    return [
      {
        name: 'quick_designer_instant',
        description: 'Générer instantanément un écran UI avec variations',
        inputSchema: {
          type: 'object',
          properties: {
            request: {
              type: 'string',
              description:
                "Description de l'écran à générer (ex: 'login screen minimal', 'dashboard modern')",
            },
            referenceUrl: {
              type: 'string',
              description: 'URL de référence pour extraire le design (optionnel)',
            },
            sessionId: {
              type: 'string',
              description: 'ID de session (optionnel)',
            },
          },
          required: ['request'],
        },
      },
      {
        name: 'quick_designer_refine',
        description: 'Raffiner le dernier écran généré avec ajustements ou nouvelles variations',
        inputSchema: {
          type: 'object',
          properties: {
            adjustments: {
              type: 'string',
              description: "Ajustements à appliquer (ex: 'darker colors', 'more spacing')",
            },
            addVariations: {
              type: 'number',
              description: 'Nombre de variations supplémentaires à générer',
            },
            sessionId: {
              type: 'string',
              description: 'ID de session',
            },
          },
        },
      },
      {
        name: 'quick_designer_validate',
        description: 'Valider une variation spécifique et mettre à jour le Design System',
        inputSchema: {
          type: 'object',
          properties: {
            variationIndex: {
              type: 'number',
              description: 'Index de la variation à valider (0-based)',
            },
            pageIndex: {
              type: 'number',
              description: 'Index de la page (optionnel)',
            },
            sessionId: {
              type: 'string',
              description: 'ID de session',
            },
          },
          required: ['variationIndex'],
        },
      },
      {
        name: 'quick_designer_show_system',
        description: 'Afficher le Design System actuel',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID de session',
            },
          },
        },
      },
      {
        name: 'quick_designer_open_mockup',
        description: 'Ouvrir la maquette évolutive dans le navigateur',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'quick_designer_generate_with_ai',
        description: "Générer un écran en utilisant l'IA de Claude (avec ton plan MAX)",
        inputSchema: {
          type: 'object',
          properties: {
            screenType: {
              type: 'string',
              description: "Type d'écran (login, dashboard, pricing, landing, etc.)",
              enum: [
                'login',
                'dashboard',
                'pricing',
                'landing',
                'signup',
                'settings',
                'profile',
                'checkout',
                'search',
              ],
            },
            style: {
              type: 'string',
              description: 'Style visuel',
              enum: ['minimal', 'modern', 'bold', 'playful', 'professional', 'gradient', 'dark'],
            },
            variations: {
              type: 'number',
              description: 'Nombre de variations à générer (1-8)',
              minimum: 1,
              maximum: 8,
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fonctionnalités spécifiques à inclure',
            },
            inspiration: {
              type: 'string',
              description: 'Site ou design de référence (Linear, Stripe, Notion, etc.)',
            },
          },
          required: ['screenType'],
        },
      },
      {
        name: 'quick_designer_batch_generate',
        description: 'Générer plusieurs écrans en batch pour créer une app complète',
        inputSchema: {
          type: 'object',
          properties: {
            screens: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  style: { type: 'string' },
                  variations: { type: 'number' },
                },
              },
              description: 'Liste des écrans à générer',
            },
            designSystem: {
              type: 'object',
              description: 'Design system à utiliser (optionnel)',
            },
          },
          required: ['screens'],
        },
      },
    ];
  }
  async handleToolCall(name, args) {
    switch (name) {
      case 'quick_designer_instant':
        return await this.handleInstant(args);
      case 'quick_designer_refine':
        return await flash_commands_js_1.flashCommands.refine.handler(args);
      case 'quick_designer_validate':
        return await flash_commands_js_1.flashCommands.validate.handler(args);
      case 'quick_designer_show_system':
        return await flash_commands_js_1.flashCommands.showSystem.handler(args);
      case 'quick_designer_open_mockup':
        return await flash_commands_js_1.flashCommands.openMockup.handler(args);
      case 'quick_designer_generate_with_ai':
        return await this.handleGenerateWithAI(args);
      case 'quick_designer_batch_generate':
        return await this.handleBatchGenerate(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  async handleInstant(args) {
    const result = await flash_commands_js_1.flashCommands.instant.handler(args);
    // Generate the actual HTML mockup
    const mockupPath = path.join(process.cwd(), 'docs', 'ui', 'mockup.html');
    return {
      ...result,
      instructions: [
        `✅ Généré ${result.variationsGenerated} variations pour l'écran ${result.screenType}`,
        `📁 Mockup sauvegardé dans: ${mockupPath}`,
        `🎨 Design System appliqué et persisté`,
        '',
        'Commandes disponibles:',
        "- Utilisez 'quick_designer_refine' pour ajouter des variations",
        "- Utilisez 'quick_designer_validate' pour valider une variation",
        "- Utilisez 'quick_designer_open_mockup' pour voir le résultat",
      ].join('\n'),
    };
  }
  async handleGenerateWithAI(args) {
    const { screenType, style = 'modern', variations = 3, features = [], inspiration } = args;
    // Build AI prompt
    const prompt = this.buildAIPrompt(screenType, style, features, inspiration);
    // For now, return instructions for Claude to generate
    return {
      prompt,
      instructions: [
        '🤖 Prompt AI généré pour Claude:',
        '',
        "Utilisez ce prompt pour générer les variations d'écran:",
        '```',
        prompt,
        '```',
        '',
        `Générez ${variations} variations distinctes avec:`,
        `- Type: ${screenType}`,
        `- Style: ${style}`,
        features.length > 0 ? `- Features: ${features.join(', ')}` : '',
        inspiration ? `- Inspiration: ${inspiration}` : '',
        '',
        'Chaque variation doit avoir:',
        '1. Une structure de layout unique',
        '2. Le même design system',
        '3. Des approches UX différentes',
        '4. Code HTML/CSS complet et fonctionnel',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }
  async handleBatchGenerate(args) {
    const { screens, designSystem } = args;
    const results = [];
    let sessionId = `batch-${Date.now()}`;
    // Generate each screen
    for (const screen of screens) {
      const result = await flash_commands_js_1.flashCommands.instant.handler({
        request: `${screen.type} ${screen.style || 'modern'}`,
        sessionId,
      });
      results.push({
        type: screen.type,
        ...result,
      });
    }
    // Create combined mockup
    const session = await this.storage.loadSession(sessionId);
    return {
      sessionId,
      screensGenerated: results.length,
      totalVariations: results.reduce((sum, r) => sum + r.variationsGenerated, 0),
      results,
      instructions: [
        `✅ Batch generation complète!`,
        '',
        `📊 Résumé:`,
        `- ${results.length} écrans générés`,
        `- ${results.reduce((sum, r) => sum + r.variationsGenerated, 0)} variations totales`,
        `- Session ID: ${sessionId}`,
        '',
        'Écrans générés:',
        ...results.map((r) => `  - ${r.type}: ${r.variationsGenerated} variations`),
        '',
        "Utilisez 'quick_designer_open_mockup' pour voir tous les écrans",
      ].join('\n'),
    };
  }
  buildAIPrompt(screenType, style, features, inspiration) {
    const prompts = {
      login: 'écran de connexion avec email/password, options sociales',
      dashboard: 'tableau de bord avec métriques, graphiques, données',
      pricing: 'page de tarification avec plans et comparaison',
      landing: "page d'accueil avec hero, features, CTA",
      signup: "écran d'inscription avec validation",
      settings: 'page de paramètres avec sections',
      profile: 'page de profil utilisateur',
      checkout: 'processus de paiement',
      search: 'interface de recherche avec filtres',
    };
    const styleGuides = {
      minimal: "épuré, beaucoup d'espace blanc, typographie forte",
      modern: 'contemporain, ombres subtiles, gradients légers',
      bold: 'couleurs vives, contraste fort, éléments imposants',
      playful: 'animations, formes arrondies, couleurs joyeuses',
      professional: 'corporate, structuré, palette neutre',
      gradient: 'dégradés colorés, effets visuels',
      dark: 'mode sombre, contraste élevé',
    };
    let prompt = `Génère un ${prompts[screenType] || screenType} avec un style ${styleGuides[style] || style}.\n\n`;
    if (features.length > 0) {
      prompt += `Fonctionnalités à inclure:\n${features.map((f) => `- ${f}`).join('\n')}\n\n`;
    }
    if (inspiration) {
      prompt += `Inspiration: ${inspiration}\n\n`;
    }
    prompt += `Exigences techniques:
- HTML5 sémantique complet
- CSS moderne avec variables
- Responsive design
- Accessible (ARIA labels)
- Interface en français
- Animations subtiles
- Code production-ready

Génère le code HTML complet avec styles inline.`;
    return prompt;
  }
  async start() {
    const transport = new stdio_js_1.StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Quick Designer v4 MCP Server started`);
  }
}
// Start the server
const server = new QuickDesignerMCPServer();
server.start().catch(console.error);
