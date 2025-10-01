import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as path from "path";
import * as fs from "fs/promises";
import { executeAutoCommand } from "../lib/auto-commands.js";

// Dynamic imports for CommonJS modules
let ProjectState: any;
let BMADBridge: any;
let DeliverableGenerator: any;
let BrownfieldAnalyzer: any;
let phaseTransitionHooks: any;
let contextPreservation: any;

async function loadDependencies() {
  const libPath = path.join(__dirname, "..", "..", "lib");
  const hooksPath = path.join(__dirname, "..", "..", "hooks");

  ProjectState = (await import(path.join(libPath, "project-state.js"))).ProjectState;
  BMADBridge = (await import(path.join(libPath, "bmad-bridge.js"))).BMADBridge;
  DeliverableGenerator = (await import(path.join(libPath, "deliverable-generator.js"))).DeliverableGenerator;
  BrownfieldAnalyzer = (await import(path.join(libPath, "brownfield-analyzer.js"))).BrownfieldAnalyzer;
  phaseTransitionHooks = await import(path.join(hooksPath, "phase-transition.js"));
  contextPreservation = await import(path.join(hooksPath, "context-preservation.js"));
}

// Initialize project instances
let projectState: any;
let bmadBridge: any;
let deliverableGen: any;
let brownfieldAnalyzer: any;

async function initializeProject(projectPath: string = process.cwd()) {
  if (!projectState) {
    projectState = new ProjectState(projectPath);
    await projectState.initialize();
  }

  if (!bmadBridge) {
    bmadBridge = new BMADBridge();
    await bmadBridge.initialize();
  }

  if (!deliverableGen) {
    deliverableGen = new DeliverableGenerator(projectPath, { bmadBridge });
    await deliverableGen.initialize();
  }

  if (!brownfieldAnalyzer) {
    brownfieldAnalyzer = new BrownfieldAnalyzer(projectPath);
  }

  // Bind phase transition hooks
  phaseTransitionHooks.bindDependencies({
    triggerAgent: async (agentId: string, context: any) => {
      const result = await bmadBridge.runAgent(agentId, context);

      if (!result) {
        return null;
      }

      const rawResponse = result.response;

      if (rawResponse == null) {
        return null;
      }

      if (typeof rawResponse === "string") {
        try {
          return JSON.parse(rawResponse);
        } catch (error) {
          console.error(
            `[MCP] Failed to parse response from agent ${agentId}: ${error instanceof Error ? error.message : error}`
          );
          return {
            error: `Failed to parse response from agent ${agentId}`,
            rawResponse,
          };
        }
      }

      if (typeof rawResponse === "object") {
        return rawResponse;
      }

      return {
        error: `Unsupported response type from agent ${agentId}`,
        rawResponse,
      };
    },
    triggerCommand: async (command: string, context: any) => {
      console.error(`[MCP] Executing command: ${command}`);
      return executeAutoCommand(command, context, bmadBridge);
    },
    updateProjectState: async (updates: any) => {
      await projectState.updateState(updates);
    },
    saveDeliverable: async (type: string, content: any) => {
      await projectState.storeDeliverable(type, content);
    },
    loadPhaseContext: async (phase: string, context: any) => {
      return contextPreservation.preserveContext(
        projectState.state.currentPhase,
        phase,
        context,
        async (p: string) => projectState.getPhaseDeliverables(p)
      );
    },
  });
}

// Create server instance
const server = new Server(
  {
    name: "bmad-invisible-orchestrator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_project_context",
        description: "Get complete project context including phase, requirements, decisions, and conversation history",
        inputSchema: {
          type: "object",
          properties: {
            includeConversation: {
              type: "boolean",
              description: "Include recent conversation history",
              default: true,
            },
            conversationLimit: {
              type: "number",
              description: "Number of recent messages to include",
              default: 10,
            },
          },
        },
      },
      {
        name: "detect_phase",
        description: "Analyze user message and conversation to determine appropriate BMAD phase",
        inputSchema: {
          type: "object",
          properties: {
            userMessage: {
              type: "string",
              description: "User's latest message",
            },
            conversationHistory: {
              type: "array",
              description: "Recent conversation messages",
              items: { type: "object" },
              default: [],
            },
          },
          required: ["userMessage"],
        },
      },
      {
        name: "load_agent_persona",
        description: "Load BMAD agent persona for the current or specified phase",
        inputSchema: {
          type: "object",
          properties: {
            phase: {
              type: "string",
              enum: ["analyst", "pm", "architect", "sm", "dev", "qa", "ux", "po"],
              description: "Phase to load agent for (defaults to current phase)",
            },
          },
        },
      },
      {
        name: "transition_phase",
        description: "Safely transition to a new project phase with validation",
        inputSchema: {
          type: "object",
          properties: {
            toPhase: {
              type: "string",
              enum: ["analyst", "pm", "architect", "sm", "dev", "qa", "ux", "po"],
              description: "Target phase",
            },
            context: {
              type: "object",
              description: "Context to carry forward",
            },
            userValidated: {
              type: "boolean",
              description: "Whether user has validated the transition",
              default: false,
            },
          },
          required: ["toPhase"],
        },
      },
      {
        name: "generate_deliverable",
        description: "Generate BMAD deliverable (PRD, architecture, story, etc.) and save to docs/",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["brief", "prd", "architecture", "epic", "story", "qa_assessment"],
              description: "Type of deliverable to generate",
            },
            context: {
              type: "object",
              description: "Context data for the deliverable",
            },
          },
          required: ["type", "context"],
        },
      },
      {
        name: "record_decision",
        description: "Record a project decision for future reference",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Decision identifier (e.g., 'tech_stack', 'architecture_pattern')",
            },
            value: {
              type: "string",
              description: "The decision made",
            },
            rationale: {
              type: "string",
              description: "Why this decision was made",
            },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "add_conversation_message",
        description: "Add a message to the conversation history",
        inputSchema: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["user", "assistant"],
              description: "Message role",
            },
            content: {
              type: "string",
              description: "Message content",
            },
          },
          required: ["role", "content"],
        },
      },
      {
        name: "get_project_summary",
        description: "Get a high-level summary of project status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_bmad_agents",
        description: "List all available BMAD agents",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "execute_bmad_workflow",
        description: "Execute a complete BMAD workflow for a phase",
        inputSchema: {
          type: "object",
          properties: {
            phase: {
              type: "string",
              enum: ["analyst", "pm", "architect", "sm", "dev", "qa", "ux", "po"],
              description: "Phase workflow to execute",
            },
            context: {
              type: "object",
              description: "Workflow context",
            },
          },
          required: ["phase"],
        },
      },
      {
        name: "scan_codebase",
        description: "Scan existing codebase structure, tech stack, and architecture (for brownfield projects)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "detect_existing_docs",
        description: "Find and load existing BMAD documentation (brief, prd, architecture, stories)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "load_previous_state",
        description: "Load state from previous BMAD session to resume work",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_codebase_summary",
        description: "Get comprehensive codebase analysis including structure, tech stack, and existing BMAD docs",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Ensure dependencies and project are loaded
    if (!ProjectState) {
      await loadDependencies();
    }
    await initializeProject();

    switch (name) {
      case "get_project_context": {
        const params = args as { includeConversation?: boolean; conversationLimit?: number };
        const state = projectState.getState();
        const context: any = {
          projectId: state.projectId,
          projectName: state.projectName,
          currentPhase: state.currentPhase,
          requirements: state.requirements,
          decisions: state.decisions,
          userPreferences: state.userPreferences,
          nextSteps: state.nextSteps,
          phaseHistory: state.phaseHistory,
        };

        if (params.includeConversation !== false) {
          context.recentConversation = projectState.getConversation(
            params.conversationLimit || 10
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(context, null, 2),
            },
          ],
        };
      }

      case "detect_phase": {
        const params = args as { userMessage: string; conversationHistory?: any[] };

        // Use phase detection logic
        const result = await phaseTransitionHooks.checkTransition(
          { conversation: params.conversationHistory || [] },
          params.userMessage,
          projectState.state.currentPhase
        );

        const detection = result || {
          detected_phase: projectState.state.currentPhase,
          confidence: 0.5,
          shouldTransition: false,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(detection, null, 2),
            },
          ],
        };
      }

      case "load_agent_persona": {
        const params = args as { phase?: string };
        const phase = params.phase || projectState.state.currentPhase;
        const agentId = bmadBridge.getPhaseAgent(phase);
        const agent = await bmadBridge.loadAgent(agentId);

        return {
          content: [
            {
              type: "text",
              text: `# ${agent.agent?.name || agentId} - ${agent.agent?.title || "BMAD Agent"}

**Role**: ${agent.persona?.role || ""}
**Style**: ${agent.persona?.style || ""}

${agent.content}`,
            },
          ],
        };
      }

      case "transition_phase": {
        const params = args as {
          toPhase: string;
          context?: any;
          userValidated?: boolean;
        };

        const fromPhase = projectState.state.currentPhase;
        const result = await phaseTransitionHooks.executeTransition(
          fromPhase,
          params.toPhase,
          params.context || {}
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_deliverable": {
        const params = args as { type: string; context: any };

        let result;
        switch (params.type) {
          case "brief":
            result = await deliverableGen.generateBrief(params.context);
            break;
          case "prd":
            result = await deliverableGen.generatePRD(params.context);
            break;
          case "architecture":
            result = await deliverableGen.generateArchitecture(params.context);
            break;
          case "epic":
            result = await deliverableGen.generateEpic(params.context);
            break;
          case "story":
            result = await deliverableGen.generateStory(params.context);
            break;
          case "qa_assessment":
            result = await deliverableGen.generateQAAssessment(params.context);
            break;
          default:
            throw new Error(`Unknown deliverable type: ${params.type}`);
        }

        // Store in project state
        await projectState.storeDeliverable(params.type, result.content);

        return {
          content: [
            {
              type: "text",
              text: `Deliverable generated: ${result.path}\n\nPreview:\n${result.content.substring(0, 500)}...`,
            },
          ],
        };
      }

      case "record_decision": {
        const params = args as { key: string; value: string; rationale?: string };
        await projectState.recordDecision(params.key, params.value, params.rationale || "");

        return {
          content: [
            {
              type: "text",
              text: `Decision recorded: ${params.key} = ${params.value}`,
            },
          ],
        };
      }

      case "add_conversation_message": {
        const params = args as { role: string; content: string };
        await projectState.addMessage(params.role, params.content);

        return {
          content: [
            {
              type: "text",
              text: "Message added to conversation history",
            },
          ],
        };
      }

      case "get_project_summary": {
        const summary = projectState.getSummary();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "list_bmad_agents": {
        const agents = await bmadBridge.listAgents();

        return {
          content: [
            {
              type: "text",
              text: `Available BMAD Agents:\n${agents.map((a: string) => `- ${a}`).join("\n")}`,
            },
          ],
        };
      }

      case "execute_bmad_workflow": {
        const params = args as { phase: string; context?: any };
        const result = await bmadBridge.executePhaseWorkflow(
          params.phase,
          params.context || {}
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "scan_codebase": {
        const codebase = await brownfieldAnalyzer.scanCodebase();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(codebase, null, 2),
            },
          ],
        };
      }

      case "detect_existing_docs": {
        const docs = await brownfieldAnalyzer.detectExistingDocs();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(docs, null, 2),
            },
          ],
        };
      }

      case "load_previous_state": {
        const previousState = await brownfieldAnalyzer.detectPreviousState();

        if (previousState.exists && previousState.state) {
          // Load the previous state into current project state
          await projectState.updateState(previousState.state);

          return {
            content: [
              {
                type: "text",
                text: `Previous session loaded successfully!\n\nLast Phase: ${previousState.lastPhase}\nLast Updated: ${previousState.lastUpdated}\n\n${JSON.stringify(previousState.state, null, 2)}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: "No previous BMAD session found. Starting fresh.",
            },
          ],
        };
      }

      case "get_codebase_summary": {
        const summary = await brownfieldAnalyzer.generateCodebaseSummary();

        return {
          content: [
            {
              type: "text",
              text: summary.summary, // Returns formatted markdown summary
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  await loadDependencies();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BMAD Invisible Orchestrator MCP Server v1.0.0 running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
