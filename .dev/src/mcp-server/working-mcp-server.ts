#!/usr/bin/env node

/**
 * Quick Designer V4 - Working MCP Server
 * Standalone server that actually works
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import { SessionManager } from './session-manager.js';
import { VariationGenerator } from './variation-generator.js';
import fs from 'fs/promises';
import path from 'path';

class QuickDesignerMCPServer {
  private server: Server;
  private sessionManager: SessionManager;
  private generator: VariationGenerator;
  private currentSessionId: string | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'quick-designer-v4',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.sessionManager = new SessionManager();
    this.generator = new VariationGenerator();

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
        name: 'quick_designer_generate',
        description: 'Générer une ou plusieurs variations d\'UI à partir d\'un prompt. Crée automatiquement une nouvelle session ou ajoute à la session en cours.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Description de l\'interface à générer (ex: "dashboard analytics", "landing page SaaS", "form login")'
            },
            count: {
              type: 'number',
              description: 'Nombre de variations à générer (1-8)',
              default: 3
            },
            style: {
              type: 'string',
              enum: ['minimal', 'modern', 'playful', 'professional', 'elegant'],
              description: 'Style visuel des variations',
              default: 'modern'
            },
            sessionId: {
              type: 'string',
              description: 'ID de session existante (optionnel - si omis, crée une nouvelle session)'
            }
          },
          required: ['prompt']
        }
      },
      {
        name: 'quick_designer_add_variation',
        description: 'Ajouter une nouvelle variation à la session en cours avec un nouveau prompt',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Nouveau prompt pour la variation additionnelle'
            },
            sessionId: {
              type: 'string',
              description: 'ID de la session (utilise la session courante si omis)'
            }
          },
          required: ['prompt']
        }
      },
      {
        name: 'quick_designer_show_session',
        description: 'Afficher toutes les variations de la session en cours dans un viewer HTML interactif',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID de session (utilise la session courante si omis)'
            },
            open: {
              type: 'boolean',
              description: 'Ouvrir automatiquement dans le navigateur',
              default: true
            }
          }
        }
      },
      {
        name: 'quick_designer_export',
        description: 'Exporter la session complète avec toutes les variations',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID de session à exporter'
            },
            format: {
              type: 'string',
              enum: ['html', 'json'],
              description: 'Format d\'export',
              default: 'html'
            },
            outputPath: {
              type: 'string',
              description: 'Chemin de sortie (optionnel)'
            }
          }
        }
      },
      {
        name: 'quick_designer_list_sessions',
        description: 'Lister toutes les sessions sauvegardées',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  private async handleGenerate(args: any) {
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
    const htmlVariations = await this.generator.generateFromPrompt(
      prompt,
      session,
      { count, style }
    );

    // Add variations to session
    for (let i = 0; i < htmlVariations.length; i++) {
      await this.sessionManager.addVariation(session.sessionId, {
        name: `${prompt.substring(0, 30)} - Var ${session.variations.length + 1}`,
        html: htmlVariations[i],
        prompt
      });
    }

    // Refresh session
    session = await this.sessionManager.getSession(session.sessionId)!;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessionId: session.sessionId,
          variationsGenerated: count,
          totalVariations: session.variations.length,
          designSystem: session.designSystem,
          message: `✨ ${count} variations générées avec succès!\n\nSession: ${session.sessionId}\nTotal variations: ${session.variations.length}\n\nUtilise 'quick_designer_show_session' pour voir toutes les variations.`
        }, null, 2)
      }]
    };
  }

  private async handleAddVariation(args: any) {
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
      prompt
    });

    const updatedSession = await this.sessionManager.getSession(session.sessionId)!;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessionId: updatedSession.sessionId,
          totalVariations: updatedSession.variations.length,
          message: `✨ Nouvelle variation ajoutée!\n\nTotal variations: ${updatedSession.variations.length}`
        }, null, 2)
      }]
    };
  }

  private async handleShowSession(args: any) {
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
    const viewerPath = path.join(process.cwd(), `quick-designer-session-${targetSessionId.substring(0, 12)}.html`);
    await fs.writeFile(viewerPath, viewerHtml, 'utf-8');

    // Open if requested
    if (open) {
      const { exec } = await import('child_process');
      exec(`open "${viewerPath}"`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessionId: targetSessionId,
          totalVariations: session.variations.length,
          viewerPath,
          message: `📄 Viewer HTML créé: ${viewerPath}\n\n${open ? '🌐 Ouverture dans le navigateur...' : 'Utilisez "open" pour ouvrir manuellement'}`
        }, null, 2)
      }]
    };
  }

  private async handleExport(args: any) {
    const { sessionId, format = 'html', outputPath } = args;
    const targetSessionId = sessionId || this.currentSessionId;

    if (!targetSessionId) {
      throw new Error('No active session');
    }

    const defaultPath = outputPath || path.join(
      process.cwd(),
      `quick-designer-export-${targetSessionId.substring(0, 12)}.${format}`
    );

    if (format === 'html') {
      const html = await this.sessionManager.generateViewerHTML(targetSessionId);
      await fs.writeFile(defaultPath, html, 'utf-8');
    } else {
      await this.sessionManager.exportSession(targetSessionId, defaultPath);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          exportPath: defaultPath,
          format,
          message: `💾 Session exportée: ${defaultPath}`
        }, null, 2)
      }]
    };
  }

  private async handleListSessions() {
    const sessions = await this.sessionManager.listSessions();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessions,
          currentSession: this.currentSessionId,
          count: sessions.length,
          message: `📋 ${sessions.length} session(s) disponible(s)`
        }, null, 2)
      }]
    };
  }

  async start() {
    await this.sessionManager.init();

    const transport = new StdioServerTransport();
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