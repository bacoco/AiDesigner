import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as path from "node:path";
import { executeAutoCommand } from "../../lib/auto-commands.js";

export type LaneKey = "default" | "quick" | "complex" | string;

export interface OrchestratorServerOptions {
  serverInfo?: {
    name?: string;
    version?: string;
  };
  transport?: StdioServerTransport;
  createLLMClient?: (lane: LaneKey) => Promise<any> | any;
  ensureOperationAllowed?: (
    operation: string,
    metadata?: Record<string, unknown>
  ) => Promise<void> | void;
  log?: (message: string) => void;
  onServerReady?: (server: Server) => void | Promise<void>;
}

interface LaneDecisionRecord {
  lane: string;
  rationale?: string;
  confidence?: number;
  trigger?: string;
}

async function getDefaultLLMClientCtor(): Promise<any> {
  const mod = await import("../../lib/llm-client.js");
  return mod.LLMClient;
}

export async function runOrchestratorServer(
  options: OrchestratorServerOptions = {}
): Promise<void> {
  const serverName = options.serverInfo?.name ?? "bmad-invisible-orchestrator";
  const serverVersion = options.serverInfo?.version ?? "1.0.0";
  const log = options.log ?? console.error;
  const ensureOperationAllowed =
    options.ensureOperationAllowed ?? (async () => {
      /* no-op */
    });

  let defaultLLMCtor: any;
  const createLLMClient: (lane: LaneKey) => Promise<any> = async (lane) => {
    if (options.createLLMClient) {
      const result = await options.createLLMClient(lane);
      return result;
    }

    if (!defaultLLMCtor) {
      defaultLLMCtor = await getDefaultLLMClientCtor();
    }

    return new defaultLLMCtor();
  };

  let ProjectState: any;
  let BMADBridge: any;
  let DeliverableGenerator: any;
  let BrownfieldAnalyzer: any;
  let QuickLane: any;
  let LaneSelector: any;
  let phaseTransitionHooks: any;
  let contextPreservation: any;

  let projectState: any;
  let bmadBridge: any;
  let deliverableGen: any;
  let brownfieldAnalyzer: any;
  let quickLane: any;
  const laneDecisions: LaneDecisionRecord[] = [];

  async function loadDependencies() {
    const libPath = path.join(__dirname, "..", "..", "lib");
    const hooksPath = path.join(__dirname, "..", "..", "hooks");

    if (!ProjectState) {
      ({ ProjectState } = await import(path.join(libPath, "project-state.js")));
    }
    if (!BMADBridge) {
      ({ BMADBridge } = await import(path.join(libPath, "bmad-bridge.js")));
    }
    if (!DeliverableGenerator) {
      ({ DeliverableGenerator } = await import(path.join(libPath, "deliverable-generator.js")));
    }
    if (!BrownfieldAnalyzer) {
      ({ BrownfieldAnalyzer } = await import(path.join(libPath, "brownfield-analyzer.js")));
    }
    if (!QuickLane) {
      ({ QuickLane } = await import(path.join(libPath, "quick-lane.js")));
    }
    if (!LaneSelector) {
      LaneSelector = await import(path.join(libPath, "lane-selector.js"));
    }
    if (!phaseTransitionHooks) {
      phaseTransitionHooks = await import(path.join(hooksPath, "phase-transition.js"));
    }
    if (!contextPreservation) {
      contextPreservation = await import(path.join(hooksPath, "context-preservation.js"));
    }
  }

  async function initializeProject(projectPath: string = process.cwd()) {
    if (!projectState) {
      projectState = new ProjectState(projectPath);
      await projectState.initialize();
    }

    if (!bmadBridge) {
      const llmClient = await createLLMClient("default");
      bmadBridge = new BMADBridge({ llmClient });
      await bmadBridge.initialize();
    }

    if (!deliverableGen) {
      deliverableGen = new DeliverableGenerator(projectPath, { bmadBridge });
      await deliverableGen.initialize();
    }

    if (!brownfieldAnalyzer) {
      brownfieldAnalyzer = new BrownfieldAnalyzer(projectPath);
    }

    if (!quickLane) {
      const quickLaneLLM = await createLLMClient("quick");
      quickLane = new QuickLane(projectPath, { llmClient: quickLaneLLM });
      await quickLane.initialize();
    }

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
          } catch (error: unknown) {
            log(
              `[MCP] Failed to parse response from agent ${agentId}: ${
                error instanceof Error ? error.message : error
              }`
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
        await ensureOperationAllowed("execute_auto_command", { command });
        log(`[MCP] Executing command: ${command}`);
        return executeAutoCommand(command, context, bmadBridge);
      },
      updateProjectState: async (updates: any) => {
        await projectState.updateState(updates);
      },
      saveDeliverable: async (type: string, content: any) => {
        await ensureOperationAllowed("save_deliverable", { type });
        await projectState.storeDeliverable(type, content);
      },
      loadPhaseContext: async (phase: string, context: any) =>
        contextPreservation.preserveContext(
          projectState.state.currentPhase,
          phase,
          context,
          async (p: string) => projectState.getPhaseDeliverables(p)
        ),
    });
  }

  const server = new Server(
    {
      name: serverName,
      version: serverVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_project_context",
        description:
          "Get complete project context including phase, requirements, decisions, and conversation history",
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
        description:
          "Analyze user message and conversation to determine appropriate BMAD phase",
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
        description:
          "Generate BMAD deliverable (PRD, architecture, story, etc.) and save to docs/",
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
        description:
          "Scan existing codebase structure, tech stack, and architecture (for brownfield projects)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "detect_existing_docs",
        description:
          "Find and load existing BMAD documentation (brief, prd, architecture, stories)",
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
        description:
          "Get comprehensive codebase analysis including structure, tech stack, and existing BMAD docs",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "select_development_lane",
        description:
          "Analyze user message to determine whether to use complex (multi-agent) or quick (template-based) lane",
        inputSchema: {
          type: "object",
          properties: {
            userMessage: {
              type: "string",
              description: "User's message/request to analyze",
            },
            context: {
              type: "object",
              description: "Additional context (previousPhase, projectComplexity, forceLane, etc.)",
            },
          },
          required: ["userMessage"],
        },
      },
      {
        name: "execute_workflow",
        description:
          "Execute development workflow - automatically routes between quick and complex lanes, outputs to docs/",
        inputSchema: {
          type: "object",
          properties: {
            userRequest: {
              type: "string",
              description: "User's feature request or task description",
            },
            context: {
              type: "object",
              description: "Additional context (forceLane, projectComplexity, etc.)",
            },
          },
          required: ["userRequest"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (!ProjectState) {
        await loadDependencies();
      }
      await initializeProject();

      switch (name) {
        case "get_project_context": {
          const params = args as {
            includeConversation?: boolean;
            conversationLimit?: number;
          };
          const state = projectState.getState();
          const context: Record<string, unknown> = {
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

          const result = await phaseTransitionHooks.checkTransition(
            { conversation: params.conversationHistory || [] },
            params.userMessage,
            projectState.state.currentPhase
          );

          const detection =
            result || ({
              detected_phase: projectState.state.currentPhase,
              confidence: 0.5,
              shouldTransition: false,
            } as const);

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
          const agent = await bmadBridge.loadAgent(`${phase}`);

          return {
            content: [
              {
                type: "text",
                text: agent.content,
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

          const transitionResult = await phaseTransitionHooks.handleTransition(
            projectState,
            params.toPhase,
            params.context || {},
            params.userValidated || false
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(transitionResult, null, 2),
              },
            ],
          };
        }

        case "generate_deliverable": {
          const params = args as { type: string; context: any };
          await ensureOperationAllowed("generate_deliverable", {
            type: params.type,
          });

          let result: any;
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

          await projectState.storeDeliverable(params.type, result.content);

          return {
            content: [
              {
                type: "text",
                text: `Deliverable generated: ${result.path}\n\nPreview:\n${result.content.substring(
                  0,
                  500
                )}...`,
              },
            ],
          };
        }

        case "record_decision": {
          const params = args as { key: string; value: string; rationale?: string };
          await projectState.recordDecision(
            params.key,
            params.value,
            params.rationale || ""
          );

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
                text: `Available BMAD Agents:\n${agents
                  .map((a: string) => `- ${a}`)
                  .join("\n")}`,
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
            await projectState.updateState(previousState.state);

            return {
              content: [
                {
                  type: "text",
                  text: `Previous session loaded successfully!\n\nLast Phase: ${
                    previousState.lastPhase
                  }\nLast Updated: ${previousState.lastUpdated}\n\n${JSON.stringify(
                    previousState.state,
                    null,
                    2
                  )}`,
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
                text: summary.summary,
              },
            ],
          };
        }

        case "select_development_lane": {
          const params = args as { userMessage: string; context?: any };
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };

          const decision = await LaneSelector.selectLaneWithLog(
            params.userMessage,
            context,
            projectState.projectPath
          );

          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userMessage
          );

          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userMessage,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(decision, null, 2),
              },
            ],
          };
        }

        case "execute_workflow": {
          const params = args as { userRequest: string; context?: any };
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };

          const decision = await LaneSelector.selectLaneWithLog(
            params.userRequest,
            context,
            projectState.projectPath
          );

          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userRequest
          );

          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userRequest,
          });

          let result: any;

          if (decision.lane === "quick") {
            await ensureOperationAllowed("execute_quick_lane", {
              decision,
              request: params.userRequest,
            });
            log("[MCP] Executing quick lane workflow...");
            result = await quickLane.execute(params.userRequest, context);
            result.lane = "quick";
            result.decision = decision;
          } else {
            await ensureOperationAllowed("execute_complex_lane", {
              decision,
              request: params.userRequest,
            });
            log("[MCP] Executing complex lane workflow...");

            await bmadBridge.executePhaseWorkflow("analyst", {
              userMessage: params.userRequest,
              ...context,
            });
            await bmadBridge.executePhaseWorkflow("pm", context);
            await bmadBridge.executePhaseWorkflow("architect", context);
            await bmadBridge.executePhaseWorkflow("sm", context);

            result = {
              lane: "complex",
              decision,
              files: ["docs/prd.md", "docs/architecture.md", "docs/stories/*.md"],
              message: "Complex workflow executed through BMAD agents",
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: unknown) {
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

  await loadDependencies();
  const transport = options.transport ?? new StdioServerTransport();
  await server.connect(transport);

  log(
    `${serverName} MCP Server v${serverVersion} running on stdio${
      laneDecisions.length > 0 ? ` (lanes tracked: ${laneDecisions.length})` : ""
    }`
  );

  if (options.onServerReady) {
    await options.onServerReady(server);
  }
}
