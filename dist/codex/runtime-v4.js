'use strict';
/**
 * Runtime V4 - AI-Driven UI Generation System
 * This is the new runtime that integrates the AI-driven UI generation system
 * replacing the old template-based approach.
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
exports.runQuickDesignerV4 = runQuickDesignerV4;
const index_js_1 = require('@modelcontextprotocol/sdk/server/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const fs = __importStar(require('fs-extra'));
const path = __importStar(require('node:path'));
// Import new AI-driven modules
const ui_generator_js_1 = require('./ui-generator.js');
const design_extractor_js_1 = require('./design-extractor.js');
const workflow_manager_js_1 = require('./workflow-manager.js');
class DesignLibraryStorage {
  constructor(projectRoot) {
    this.storagePath = path.join(projectRoot, '.aidesigner', 'design-library.json');
    this.library = {
      designs: new Map(),
      references: new Map(),
      userPreferences: new Map(),
      sessions: new Map(),
    };
  }
  async load() {
    if (await fs.pathExists(this.storagePath)) {
      const data = await fs.readJson(this.storagePath);
      this.library.designs = new Map(Object.entries(data.designs || {}));
      this.library.references = new Map(Object.entries(data.references || {}));
      this.library.userPreferences = new Map(Object.entries(data.userPreferences || {}));
      this.library.sessions = new Map(Object.entries(data.sessions || {}));
    }
  }
  async save() {
    await fs.ensureDir(path.dirname(this.storagePath));
    await fs.writeJson(
      this.storagePath,
      {
        designs: Object.fromEntries(this.library.designs),
        references: Object.fromEntries(this.library.references),
        userPreferences: Object.fromEntries(this.library.userPreferences),
        sessions: Object.fromEntries(this.library.sessions),
      },
      { spaces: 2 },
    );
  }
  addDesign(id, design) {
    this.library.designs.set(id, design);
  }
  getDesign(id) {
    return this.library.designs.get(id);
  }
  addReference(url, reference) {
    this.library.references.set(url, reference);
  }
  getReference(url) {
    return this.library.references.get(url);
  }
}
// AI Service Mock (in production, this would call actual AI service)
class AIService {
  constructor(projectRoot) {
    this.metaPromptPath = path.join(projectRoot, '.dev', 'prompts', 'ui-generation-meta.md');
  }
  async generate(prompt) {
    // In production, this would call the actual AI service
    // For now, return a placeholder HTML
    const metaPrompt = await this.loadMetaPrompt();
    // This is where we'd call the actual AI with metaPrompt + prompt
    // For testing, generate a basic HTML structure
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Generated Page</title>
  <style>
    :root {
      --primary: #3B82F6;
      --accent: #10B981;
      --neutral: #6B7280;
      --bg: #F9FAFB;
      --font-family: system-ui, -apple-system, sans-serif;
      --border-radius: 8px;
    }
    body {
      margin: 0;
      padding: 2rem;
      background: var(--bg);
      font-family: var(--font-family);
      color: var(--neutral);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #111827;
      margin: 0 0 1rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Page Générée par IA</h1>
    <p>Cette page a été générée dynamiquement par l'IA basée sur vos spécifications de design.</p>
    <button style="background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--border-radius); font-weight: 600; cursor: pointer;">
      Action Principale
    </button>
  </div>
</body>
</html>`;
  }
  async loadMetaPrompt() {
    if (await fs.pathExists(this.metaPromptPath)) {
      return await fs.readFile(this.metaPromptPath, 'utf-8');
    }
    return '';
  }
}
// Chrome MCP Integration
class ChromeMCPIntegration {
  async isAvailable() {
    // Check if Chrome MCP is available
    // This would check if the chrome-devtools-mcp is installed
    return false; // Placeholder
  }
  async extractDesignFromURL(url) {
    // This would use Chrome MCP to extract design from URL
    return (0, design_extractor_js_1.extractFromURL)(url);
  }
  async captureElementStyle(url, selector) {
    // This would use Chrome MCP to capture element style
    return (0, design_extractor_js_1.extractElementStyle)(url, selector);
  }
}
// Vision AI Integration
class VisionAIIntegration {
  async analyzeImage(imagePath) {
    // This would use Vision AI to analyze the image
    return (0, design_extractor_js_1.extractFromImage)(imagePath);
  }
  async extractComponentsFromImage(imagePath) {
    // Extract specific components from image
    return {
      components: [],
      confidence: 0.8,
    };
  }
}
// Main Runtime Function
async function runQuickDesignerV4(options = {}) {
  const serverName = options.serverInfo?.name ?? 'quick-designer-v4';
  const serverVersion = options.serverInfo?.version ?? '4.0.0';
  const projectRoot = options.projectRoot || process.cwd();
  // Initialize services
  const designLibrary = new DesignLibraryStorage(projectRoot);
  await designLibrary.load();
  const aiService = new AIService(projectRoot);
  const chromeMCP = new ChromeMCPIntegration();
  const visionAI = new VisionAIIntegration();
  // Active workflow sessions
  const workflows = new Map();
  // Create server
  const server = new index_js_1.Server(
    {
      name: serverName,
      version: serverVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  // Register tool handlers
  server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
      // New AI-driven tools
      ui_generator_js_1.generateUITool,
      design_extractor_js_1.extractDesignFromURLTool,
      design_extractor_js_1.analyzeDesignFromImageTool,
      design_extractor_js_1.extractComponentStyleTool,
      workflow_manager_js_1.capturePreferenceTool,
      workflow_manager_js_1.applyFeedbackTool,
      workflow_manager_js_1.mergeDesignSystemsTool,
      // Interactive workflow tool
      {
        name: 'start_design_session',
        description: 'Start an interactive design session with AI guidance',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Optional session ID to resume',
            },
          },
        },
      },
      // Process user input in design session
      {
        name: 'process_design_input',
        description: 'Process user input in active design session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID',
            },
            input: {
              type: 'string',
              description: 'User input text',
            },
          },
          required: ['sessionId', 'input'],
        },
      },
      // Export design
      {
        name: 'export_design',
        description: 'Export generated design in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID',
            },
            format: {
              type: 'string',
              enum: ['html', 'react', 'tokens'],
              description: 'Export format',
            },
          },
          required: ['sessionId', 'format'],
        },
      },
      // Chrome MCP tools
      {
        name: 'check_chrome_mcp',
        description: 'Check if Chrome DevTools MCP is available',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Vision AI tools
      {
        name: 'analyze_ui_screenshot',
        description: 'Analyze UI screenshot to extract design patterns',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: {
              type: 'string',
              description: 'Path to screenshot',
            },
          },
          required: ['imagePath'],
        },
      },
    ],
  }));
  server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      let response;
      switch (name) {
        case 'generate_ui_from_specs': {
          const params = args;
          const html = await (0, ui_generator_js_1.generateUIFromDesignSystem)(params, aiService);
          // Save to mockup
          const mockupPath = path.join(projectRoot, 'docs', 'ui', 'generated.html');
          await fs.ensureDir(path.dirname(mockupPath));
          await fs.writeFile(mockupPath, html);
          response = {
            content: [
              {
                type: 'text',
                text: `UI generated successfully! Saved to docs/ui/generated.html\n\nDesign specs used:\n${JSON.stringify(params.designSpec, null, 2)}`,
              },
            ],
          };
          break;
        }
        case 'extract_design_from_url': {
          const params = args;
          const extracted = await chromeMCP.extractDesignFromURL(params.url);
          // Store in library
          designLibrary.addReference(params.url, extracted);
          await designLibrary.save();
          response = {
            content: [
              {
                type: 'text',
                text: `Design extracted from ${params.url}:\n${JSON.stringify(extracted.designSpec, null, 2)}`,
              },
            ],
          };
          break;
        }
        case 'analyze_design_from_image': {
          const params = args;
          const extracted = await visionAI.analyzeImage(params.imagePath);
          response = {
            content: [
              {
                type: 'text',
                text: `Design analyzed from image:\n${JSON.stringify(extracted.designSpec, null, 2)}`,
              },
            ],
          };
          break;
        }
        case 'start_design_session': {
          const params = args;
          const sessionId = params.sessionId || `session-${Date.now()}`;
          let workflow = workflows.get(sessionId);
          if (!workflow) {
            workflow = new workflow_manager_js_1.DesignWorkflow(sessionId);
            workflows.set(sessionId, workflow);
          }
          response = {
            content: [
              {
                type: 'text',
                text: `Design session started: ${sessionId}\n\nI'm ready to help you create a UI. You can:\n- Share URLs for design inspiration\n- Upload screenshots to analyze\n- Describe the style you want\n\nWhat would you like to build?`,
              },
            ],
          };
          break;
        }
        case 'process_design_input': {
          const params = args;
          const workflow = workflows.get(params.sessionId);
          if (!workflow) {
            throw new Error('Session not found. Please start a design session first.');
          }
          const result = await workflow.processUserInput(params.input);
          // Handle actions if any
          if (result.action) {
            switch (result.action.type) {
              case 'extract_url':
                const extracted = await chromeMCP.extractDesignFromURL(result.action.params.url);
                designLibrary.addReference(result.action.params.url, extracted);
                break;
              case 'analyze_image':
                const analyzed = await visionAI.analyzeImage(result.action.params.imagePath);
                break;
              case 'generate_variant':
                const variants = await (0, ui_generator_js_1.generateVariants)(
                  result.action.params,
                  result.action.params.count || 3,
                  aiService,
                );
                break;
            }
          }
          const suggestions = result.suggestions
            ? '\n\nSuggestions:\n' + result.suggestions.map((s) => `- ${s}`).join('\n')
            : '';
          response = {
            content: [
              {
                type: 'text',
                text: `${result.response}${suggestions}`,
              },
            ],
          };
          break;
        }
        case 'export_design': {
          const params = args;
          const workflow = workflows.get(params.sessionId);
          if (!workflow) {
            throw new Error('Session not found.');
          }
          const exported = workflow.exportPages(params.format);
          // Save to file
          const exportPath = path.join(
            projectRoot,
            'docs',
            'ui',
            `export-${params.sessionId}.${params.format === 'react' ? 'jsx' : params.format}`,
          );
          await fs.ensureDir(path.dirname(exportPath));
          await fs.writeFile(
            exportPath,
            typeof exported === 'string' ? exported : JSON.stringify(exported, null, 2),
          );
          response = {
            content: [
              {
                type: 'text',
                text: `Design exported as ${params.format} to ${exportPath}`,
              },
            ],
          };
          break;
        }
        case 'check_chrome_mcp': {
          const available = await chromeMCP.isAvailable();
          response = {
            content: [
              {
                type: 'text',
                text: available
                  ? 'Chrome DevTools MCP is available and ready!'
                  : 'Chrome DevTools MCP is not installed. Install it with: npm install -g chrome-devtools-mcp',
              },
            ],
          };
          break;
        }
        case 'analyze_ui_screenshot': {
          const params = args;
          const analysis = await visionAI.analyzeImage(params.imagePath);
          response = {
            content: [
              {
                type: 'text',
                text: `Screenshot analysis:\n${JSON.stringify(analysis, null, 2)}`,
              },
            ],
          };
          break;
        }
        case 'apply_design_feedback': {
          const params = args;
          // Get active workflow
          const activeWorkflow = Array.from(workflows.values())[0]; // Get first active
          if (activeWorkflow) {
            const updated = activeWorkflow.applyFeedback({
              component: params.targetComponent,
              adjustment: params.adjustment,
              value: params.value,
            });
            response = {
              content: [
                {
                  type: 'text',
                  text: `Design updated based on feedback: ${params.feedback}`,
                },
              ],
            };
          } else {
            response = {
              content: [
                {
                  type: 'text',
                  text: 'No active design session. Please start a session first.',
                },
              ],
            };
          }
          break;
        }
        case 'merge_design_systems': {
          const params = args;
          const systemsToMerge = await Promise.all(
            params.systems.map(async (sys) => {
              const ref = designLibrary.getReference(sys.source);
              return {
                design: ref?.designSpec || {},
                weight: sys.weight,
              };
            }),
          );
          const merged = (0, ui_generator_js_1.mergeDesignSystems)(systemsToMerge);
          response = {
            content: [
              {
                type: 'text',
                text: `Merged design system:\n${JSON.stringify(merged, null, 2)}`,
              },
            ],
          };
          break;
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      return response;
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  });
  // Start server
  const transport = new stdio_js_1.StdioServerTransport();
  await server.connect(transport);
  if (options.onServerReady) {
    await options.onServerReady(server);
  }
  console.error(`Quick Designer v4.0 - AI-Driven UI Generation System`);
  console.error(`Ready for interactive design sessions!`);
}
