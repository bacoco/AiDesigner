import * as path from "path";
import { executeAutoCommand } from "../lib/auto-commands.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface BMADRuntimeOptions {
  projectPath?: string;
  llmClientOptions?: Record<string, unknown>;
  createLLMClient?: (LLMClient: any) => any;
}

export interface BMADRuntimeContext {
  projectState: any;
  bmadBridge: any;
  deliverableGen: any;
  brownfieldAnalyzer: any;
  quickLane: any;
  laneSelector: any;
  phaseTransitionHooks: any;
  contextPreservation: any;
}

export interface ModelRouterInput {
  tool: string;
  args: unknown;
  meta?: unknown;
  runtime: BMADRuntime;
  context: BMADRuntimeContext;
}

export type ModelRouter = (input: ModelRouterInput) => string | null | undefined;

export interface ApprovalCheckResult {
  approved: boolean;
  message?: string;
}

export type ApprovalChecker = (
  input: ModelRouterInput
) => Promise<ApprovalCheckResult> | ApprovalCheckResult;

export interface StateBridgeHooks {
  beforeCall?: (input: ModelRouterInput) => Promise<void> | void;
  afterCall?: (
    input: ModelRouterInput & { result: CallToolResult }
  ) => Promise<void> | void;
}

export interface CallToolOptions {
  meta?: unknown;
  modelRouter?: ModelRouter;
  approvalChecker?: ApprovalChecker;
  stateBridge?: StateBridgeHooks;
}

const BMAD_TOOLS = [
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
          enum: [
            "analyst",
            "pm",
            "architect",
            "sm",
            "dev",
            "qa",
            "ux",
            "po",
          ],
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
          enum: [
            "analyst",
            "pm",
            "architect",
            "sm",
            "dev",
            "qa",
            "ux",
            "po",
          ],
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
          enum: [
            "brief",
            "prd",
            "architecture",
            "epic",
            "story",
            "qa_assessment",
          ],
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
          description:
            "Decision identifier (e.g., 'tech_stack', 'architecture_pattern')",
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
          enum: [
            "analyst",
            "pm",
            "architect",
            "sm",
            "dev",
            "qa",
            "ux",
            "po",
          ],
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
          description:
            "Additional context (previousPhase, projectComplexity, forceLane, etc.)",
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
          description:
            "Additional context (forceLane, projectComplexity, etc.)",
        },
      },
      required: ["userRequest"],
    },
  },
];

export class BMADRuntime {
  private readonly options: BMADRuntimeOptions;
  private dependenciesLoaded = false;
  private hooksBound = false;
  private modules: {
    ProjectState?: any;
    BMADBridge?: any;
    DeliverableGenerator?: any;
    BrownfieldAnalyzer?: any;
    QuickLane?: any;
    LaneSelector?: any;
    phaseTransitionHooks?: any;
    contextPreservation?: any;
    LLMClient?: any;
  } = {};
  private instances: {
    projectState?: any;
    bmadBridge?: any;
    deliverableGen?: any;
    brownfieldAnalyzer?: any;
    quickLane?: any;
  } = {};

  constructor(options: BMADRuntimeOptions = {}) {
    this.options = options;
  }

  get projectPath(): string {
    return this.options.projectPath ?? process.cwd();
  }

  listTools() {
    return BMAD_TOOLS;
  }

  getContext(): BMADRuntimeContext {
    return {
      projectState: this.instances.projectState,
      bmadBridge: this.instances.bmadBridge,
      deliverableGen: this.instances.deliverableGen,
      brownfieldAnalyzer: this.instances.brownfieldAnalyzer,
      quickLane: this.instances.quickLane,
      laneSelector: this.modules.LaneSelector,
      phaseTransitionHooks: this.modules.phaseTransitionHooks,
      contextPreservation: this.modules.contextPreservation,
    };
  }

  async ensureReady() {
    if (!this.dependenciesLoaded) {
      await this.loadDependencies();
    }

    if (!this.instances.projectState) {
      this.instances.projectState = new this.modules.ProjectState(
        this.projectPath
      );
      await this.instances.projectState.initialize();
    }

    if (!this.instances.bmadBridge) {
      const llmClient = this.options.createLLMClient
        ? this.options.createLLMClient(this.modules.LLMClient)
        : new this.modules.LLMClient(this.options.llmClientOptions || {});

      this.instances.bmadBridge = new this.modules.BMADBridge({
        llmClient,
      });
      await this.instances.bmadBridge.initialize();
    }

    if (!this.instances.deliverableGen) {
      this.instances.deliverableGen = new this.modules.DeliverableGenerator(
        this.projectPath,
        { bmadBridge: this.instances.bmadBridge }
      );
      await this.instances.deliverableGen.initialize();
    }

    if (!this.instances.brownfieldAnalyzer) {
      this.instances.brownfieldAnalyzer = new this.modules.BrownfieldAnalyzer(
        this.projectPath
      );
    }

    if (!this.instances.quickLane) {
      this.instances.quickLane = new this.modules.QuickLane(this.projectPath, {
        llmClient: this.instances.bmadBridge.llmClient,
      });
      await this.instances.quickLane.initialize();
    }

    if (!this.hooksBound) {
      const projectState = this.instances.projectState;
      const bmadBridge = this.instances.bmadBridge;
      const contextPreservation = this.modules.contextPreservation;

      this.modules.phaseTransitionHooks.bindDependencies({
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

      this.hooksBound = true;
    }

    return this.getContext();
  }

  async callTool(name: string, args: unknown, options: CallToolOptions = {}) {
    await this.ensureReady();

    const context = this.getContext();

    if (options.stateBridge?.beforeCall) {
      await options.stateBridge.beforeCall({
        tool: name,
        args,
        meta: options.meta,
        runtime: this,
        context,
      });
    }

    if (options.approvalChecker) {
      const approval = await options.approvalChecker({
        tool: name,
        args,
        meta: options.meta,
        runtime: this,
        context,
      });

      if (!approval.approved) {
        return {
          content: [
            {
              type: "text",
              text:
                approval.message ||
                `The action "${name}" requires approval before execution.`,
            },
          ],
        } satisfies CallToolResult;
      }
    }

    const execute = async () => {
      try {
        const projectState = context.projectState;
        const bmadBridge = context.bmadBridge;
        const deliverableGen = context.deliverableGen;
        const brownfieldAnalyzer = context.brownfieldAnalyzer;
        const quickLane = context.quickLane;
        const LaneSelector = context.laneSelector;
        const phaseTransitionHooks = context.phaseTransitionHooks;

        switch (name) {
          case "get_project_context": {
            const params = args as {
              includeConversation?: boolean;
              conversationLimit?: number;
            };
            const state = projectState.getState();
            const value: any = {
              projectId: state.projectId,
              projectName: state.projectName,
              currentPhase: state.currentPhase,
              requirements: state.requirements,
              decisions: state.decisions,
              userPreferences: state.userPreferences,
              nextSteps: state.nextSteps,
              phaseHistory: state.phaseHistory,
            };

            if (params?.includeConversation !== false) {
              value.recentConversation = projectState.getConversation(
                params?.conversationLimit || 10
              );
            }

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(value, null, 2),
                },
              ],
            } satisfies CallToolResult;
          }

          case "detect_phase": {
            const params = args as {
              userMessage: string;
              conversationHistory?: any[];
            };

            const result = await phaseTransitionHooks.checkTransition(
              { conversation: params?.conversationHistory || [] },
              params.userMessage,
              projectState.state.currentPhase
            );

            const detection =
              result ||
              ({
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
            } satisfies CallToolResult;
          }

          case "load_agent_persona": {
            const params = args as { phase?: string };
            const phase = params?.phase || projectState.state.currentPhase;
            const agentId = bmadBridge.getPhaseAgent(phase);
            const agent = await bmadBridge.loadAgent(agentId);

            return {
              content: [
                {
                  type: "text",
                  text: `# ${agent.agent?.name || agentId} - ${
                    agent.agent?.title || "BMAD Agent"
                  }\n\n**Role**: ${agent.persona?.role || ""}\n**Style**: ${
                    agent.persona?.style || ""
                  }\n\n${agent.content}`,
                },
              ],
            } satisfies CallToolResult;
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
            } satisfies CallToolResult;
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
                result = await deliverableGen.generateArchitecture(
                  params.context
                );
                break;
              case "epic":
                result = await deliverableGen.generateEpic(params.context);
                break;
              case "story":
                result = await deliverableGen.generateStory(params.context);
                break;
              case "qa_assessment":
                result = await deliverableGen.generateQAAssessment(
                  params.context
                );
                break;
              default:
                throw new Error(`Unknown deliverable type: ${params.type}`);
            }

            await projectState.storeDeliverable(
              params.type,
              result.content
            );

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
            } satisfies CallToolResult;
          }

          case "record_decision": {
            const params = args as {
              key: string;
              value: string;
              rationale?: string;
            };
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
            } satisfies CallToolResult;
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
            } satisfies CallToolResult;
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
            } satisfies CallToolResult;
          }

          case "list_bmad_agents": {
            const agents = await bmadBridge.listAgents();

            return {
              content: [
                {
                  type: "text",
                  text: `Available BMAD Agents:\n${agents
                    .map((agentId: string) => `- ${agentId}`)
                    .join("\n")}`,
                },
              ],
            } satisfies CallToolResult;
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
            } satisfies CallToolResult;
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
            } satisfies CallToolResult;
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
            } satisfies CallToolResult;
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
                    }\nLast Updated: ${
                      previousState.lastUpdated
                    }\n\n${JSON.stringify(previousState.state, null, 2)}`,
                  },
                ],
              } satisfies CallToolResult;
            }

            return {
              content: [
                {
                  type: "text",
                  text: "No previous BMAD session found. Starting fresh.",
                },
              ],
            } satisfies CallToolResult;
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
            } satisfies CallToolResult;
          }

          case "select_development_lane": {
            const params = args as { userMessage: string; context?: any };
            const laneContext = {
              ...params?.context,
              previousPhase: projectState.state.currentPhase,
              hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
            };

            const decision = await LaneSelector.selectLaneWithLog(
              params.userMessage,
              laneContext,
              projectState.projectPath
            );

            await projectState.recordLaneDecision(
              decision.lane,
              decision.rationale,
              decision.confidence,
              params.userMessage
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(decision, null, 2),
                },
              ],
            } satisfies CallToolResult;
          }

          case "execute_workflow": {
            const params = args as { userRequest: string; context?: any };
            const laneContext = {
              ...params?.context,
              previousPhase: projectState.state.currentPhase,
              hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
            };

            const decision = await LaneSelector.selectLaneWithLog(
              params.userRequest,
              laneContext,
              projectState.projectPath
            );

            await projectState.recordLaneDecision(
              decision.lane,
              decision.rationale,
              decision.confidence,
              params.userRequest
            );

            let result: any;

            if (decision.lane === "quick") {
              console.error("[MCP] Executing quick lane workflow...");
              result = await quickLane.execute(params.userRequest, laneContext);
              result.lane = "quick";
              result.decision = decision;
            } else {
              console.error("[MCP] Executing complex lane workflow...");
              await bmadBridge.executePhaseWorkflow("analyst", {
                userMessage: params.userRequest,
                ...laneContext,
              });
              await bmadBridge.executePhaseWorkflow("pm", laneContext);
              await bmadBridge.executePhaseWorkflow("architect", laneContext);
              await bmadBridge.executePhaseWorkflow("sm", laneContext);

              result = {
                lane: "complex",
                decision,
                files: [
                  "docs/prd.md",
                  "docs/architecture.md",
                  "docs/stories/*.md",
                ],
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
            } satisfies CallToolResult;
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
        } satisfies CallToolResult;
      }
    };

    const overrideModel = options.modelRouter?.({
      tool: name,
      args,
      meta: options.meta,
      runtime: this,
      context,
    });

    let result: CallToolResult;

    if (overrideModel) {
      result = await this.withModelOverride(overrideModel, execute);
    } else {
      result = await execute();
    }

    if (options.stateBridge?.afterCall) {
      await options.stateBridge.afterCall({
        tool: name,
        args,
        meta: options.meta,
        runtime: this,
        context,
        result,
      });
    }

    return result;
  }

  private async withModelOverride<T>(model: string, fn: () => Promise<T>): Promise<T> {
    const llmClient = this.instances.bmadBridge?.llmClient;

    if (!llmClient || !model) {
      return fn();
    }

    const previousModel = llmClient.model;
    llmClient.model = model;

    try {
      return await fn();
    } finally {
      llmClient.model = previousModel;
    }
  }

  private async loadDependencies() {
    const rootDir = path.resolve(__dirname, "..", "..");
    const libPath = path.join(rootDir, "lib");
    const hooksPath = path.join(rootDir, "hooks");

    this.modules.ProjectState = (await import(
      path.join(libPath, "project-state.js")
    )).ProjectState;
    this.modules.BMADBridge = (await import(
      path.join(libPath, "bmad-bridge.js")
    )).BMADBridge;
    this.modules.DeliverableGenerator = (await import(
      path.join(libPath, "deliverable-generator.js")
    )).DeliverableGenerator;
    this.modules.BrownfieldAnalyzer = (await import(
      path.join(libPath, "brownfield-analyzer.js")
    )).BrownfieldAnalyzer;
    this.modules.QuickLane = (await import(
      path.join(libPath, "quick-lane.js")
    )).QuickLane;
    this.modules.LaneSelector = await import(path.join(
      libPath,
      "lane-selector.js"
    ));
    this.modules.phaseTransitionHooks = await import(
      path.join(hooksPath, "phase-transition.js")
    );
    this.modules.contextPreservation = await import(
      path.join(hooksPath, "context-preservation.js")
    );
    this.modules.LLMClient = (await import(
      path.join(libPath, "llm-client.js")
    )).LLMClient;

    this.dependenciesLoaded = true;
  }
}
