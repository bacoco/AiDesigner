#!/usr/bin/env node
'use strict';
/**
 * Quick Designer V4 - Working MCP Server
 * Standalone server that actually works
 */
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const index_js_1 = require('@modelcontextprotocol/sdk/server/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const session_manager_js_1 = require('./session-manager.js');
const variation_generator_js_1 = require('./variation-generator.js');
const promises_1 = __importDefault(require('fs/promises'));
const path_1 = __importDefault(require('path'));
class QuickDesignerMCPServer {
  constructor() {
    this.currentSessionId = null;
    this.server = new index_js_1.Server(
      {
        name: 'quick-designer-v4',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
    this.sessionManager = new session_manager_js_1.SessionManager();
    this.generator = new variation_generator_js_1.VariationGenerator();
    this.setupHandlers();
  }
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });
    // Handle tool calls
    this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        switch (name) {
          case 'quick_designer_generate':
            return await this.handleGenerate(args);
          case 'quick_designer_add_variation':
            return await this.handleAddVariation(args);
          case 'quick_designer_show_session':
            return await this.handleShowSession(args);
          case 'quick_designer_export':
            return await this.handleExport(args);
          case 'quick_designer_list_sessions':
            return await this.handleListSessions();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }
  getTools() {
    return [
      {
        name: 'quick_designer_generate',
        description:
          "Générer une ou plusieurs variations d'UI à partir d'un prompt. Crée automatiquement une nouvelle session ou ajoute à la session en cours.",
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description:
                'Description de l\'interface à générer (ex: "dashboard analytics", "landing page SaaS", "form login")',
            },
            count: {
              type: 'number',
              description: 'Nombre de variations à générer (1-8)',
              default: 3,
            },
            style: {
              type: 'string',
              enum: ['minimal', 'modern', 'playful', 'professional', 'elegant'],
              description: 'Style visuel des variations',
              default: 'modern',
            },
            sessionId: {
              type: 'string',
              description:
                'ID de session existante (optionnel - si omis, crée une nouvelle session)',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'quick_designer_add_variation',
        description: 'Ajouter une nouvelle variation à la session en cours avec un nouveau prompt',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Nouveau prompt pour la variation additionnelle',
            },
            sessionId: {
              type: 'string',
              description: 'ID de la session (utilise la session courante si omis)',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'quick_designer_show_session',
        description:
          'Afficher toutes les variations de la session en cours dans un viewer HTML interactif',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID de session (utilise la session courante si omis)',
            },
            open: {
              type: 'boolean',
              description: 'Ouvrir automatiquement dans le navigateur',
              default: true,
            },
          },
        },
      },
      {
        name: 'quick_designer_export',
        description: 'Exporter la session complète avec toutes les variations',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID de session à exporter',
            },
            format: {
              type: 'string',
              enum: ['html', 'json'],
              description: "Format d'export",
              default: 'html',
            },
            outputPath: {
              type: 'string',
              description: 'Chemin de sortie (optionnel)',
            },
          },
        },
      },
      {
        name: 'quick_designer_list_sessions',
        description: 'Lister toutes les sessions sauvegardées',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }
  async handleGenerate(args) {
    const { prompt, count = 3, style = 'modern', sessionId } = args;
    // Get or create session
    let session;
    if (sessionId) {
      session = await this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
    } else if (this.currentSessionId) {
      session = await this.sessionManager.getSession(this.currentSessionId);
    }
    if (!session) {
      session = await this.sessionManager.createSession();
      this.currentSessionId = session.sessionId;
    }
    // Generate variations
    const htmlVariations = await this.generator.generateFromPrompt(prompt, session, {
      count,
      style,
    });
    // Add variations to session
    for (let i = 0; i < htmlVariations.length; i++) {
      await this.sessionManager.addVariation(session.sessionId, {
        name: `${prompt.substring(0, 30)} - Var ${session.variations.length + 1}`,
        html: htmlVariations[i],
        prompt,
      });
    }
    // Refresh session
    const refreshedSession = await this.sessionManager.getSession(session.sessionId);
    if (!refreshedSession) {
      throw new Error(`Failed to refresh session ${session.sessionId}`);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              sessionId: refreshedSession.sessionId,
              variationsGenerated: count,
              totalVariations: refreshedSession.variations.length,
              designSystem: refreshedSession.designSystem,
              message: `✨ ${count} variations générées avec succès!\n\nSession: ${refreshedSession.sessionId}\nTotal variations: ${refreshedSession.variations.length}\n\nUtilise 'quick_designer_show_session' pour voir toutes les variations.`,
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  async handleAddVariation(args) {
    const { prompt, sessionId } = args;
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error('No active session. Use quick_designer_generate first.');
    }
    const session = await this.sessionManager.getSession(targetSessionId);
    if (!session) {
      throw new Error(`Session ${targetSessionId} not found`);
    }
    // Generate single variation
    const [html] = await this.generator.generateFromPrompt(prompt, session, { count: 1 });
    await this.sessionManager.addVariation(session.sessionId, {
      name: `${prompt.substring(0, 30)} - Var ${session.variations.length + 1}`,
      html,
      prompt,
    });
    const updatedSession = await this.sessionManager.getSession(session.sessionId);
    if (!updatedSession) {
      throw new Error(`Failed to get updated session ${session.sessionId}`);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              sessionId: updatedSession.sessionId,
              totalVariations: updatedSession.variations.length,
              message: `✨ Nouvelle variation ajoutée!\n\nTotal variations: ${updatedSession.variations.length}`,
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  async handleShowSession(args) {
    const { sessionId, open = true } = args;
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error('No active session');
    }
    const session = await this.sessionManager.getSession(targetSessionId);
    if (!session) {
      throw new Error(`Session ${targetSessionId} not found`);
    }
    // Generate viewer HTML
    const viewerHtml = await this.sessionManager.generateViewerHTML(targetSessionId);
    // Save viewer
    const viewerPath = path_1.default.join(
      process.cwd(),
      `quick-designer-session-${targetSessionId.substring(0, 12)}.html`,
    );
    await promises_1.default.writeFile(viewerPath, viewerHtml, 'utf-8');
    // Open if requested
    if (open) {
      const { exec } = await import('child_process');
      exec(`open "${viewerPath}"`);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              sessionId: targetSessionId,
              totalVariations: session.variations.length,
              viewerPath,
              message: `📄 Viewer HTML créé: ${viewerPath}\n\n${open ? '🌐 Ouverture dans le navigateur...' : 'Utilisez "open" pour ouvrir manuellement'}`,
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  async handleExport(args) {
    const { sessionId, format = 'html', outputPath } = args;
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error('No active session');
    }
    const defaultPath =
      outputPath ||
      path_1.default.join(
        process.cwd(),
        `quick-designer-export-${targetSessionId.substring(0, 12)}.${format}`,
      );
    if (format === 'html') {
      const html = await this.sessionManager.generateViewerHTML(targetSessionId);
      await promises_1.default.writeFile(defaultPath, html, 'utf-8');
    } else {
      await this.sessionManager.exportSession(targetSessionId, defaultPath);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              exportPath: defaultPath,
              format,
              message: `💾 Session exportée: ${defaultPath}`,
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  async handleListSessions() {
    const sessions = await this.sessionManager.listSessions();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              sessions,
              currentSession: this.currentSessionId,
              count: sessions.length,
              message: `📋 ${sessions.length} session(s) disponible(s)`,
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  async start() {
    await this.sessionManager.init();
    const transport = new stdio_js_1.StdioServerTransport();
    await this.server.connect(transport);
    console.error('Quick Designer v4 MCP Server started');
  }
}
// Start server
const server = new QuickDesignerMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
