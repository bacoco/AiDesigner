import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mkdtempSync, rmSync } from "node:fs";
import { performance } from "node:perf_hooks";
import * as path from "node:path";
import { tmpdir } from "node:os";
import { createStructuredLogger, StructuredLogger } from "./observability.js";
import {
  importFromPackageRoot,
  importLibModule,
  requireLibModule,
} from "./lib-resolver.js";

type AutoCommandsModule = typeof import("../../lib/auto-commands.js");
const { executeAutoCommand } = requireLibModule<AutoCommandsModule>(
  "auto-commands.js"
);

type TargetedSection = {
  title: string;
  body: string;
  priority?: string | number;
};

type LLMClientModule = typeof import("../../lib/llm-client.js");

export interface AgentTriggerParseError {
  ok: false;
  errorType: "agent_parse_error";
  agentId: string;
  message: string;
  rawSnippet: string;
  rawResponse: unknown;
  guidance: string;
  cause: {
    name?: string;
    message: string;
    stack?: string;
  };
  contextMetadata?: {
    provided: boolean;
    keys?: string[];
  };
}

/**
 * Builds a structured parse error for agent trigger failures.
 *
 * @param agentId - The ID of the agent that failed to parse
 * @param rawResponse - The unparsable response from the agent
 * @param error - The error that occurred during parsing
 * @param context - The context passed to the agent
 * @param guidance - Optional custom guidance message for the error
 * @returns A structured AgentTriggerParseError with debugging metadata
 */
function buildParseError({
  agentId,
  rawResponse,
  error,
  context,
  guidance,
}: {
  agentId: string;
  rawResponse: unknown;
  error: unknown;
  context: any;
  guidance?: string;
}): AgentTriggerParseError {
  let stringified = "";
  if (typeof rawResponse === "string") {
    stringified = rawResponse;
  } else if (rawResponse != null) {
    try {
      stringified = JSON.stringify(rawResponse);
    } catch {
      stringified = "[unserializable payload]";
    }
  }

  const snippet = stringified.slice(0, 200);
  const cause =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : {
          message: String(error),
        };

  const contextMetadata: { provided: boolean; keys?: string[] } = (() => {
    if (!context || typeof context !== "object") {
      return { provided: Boolean(context) };
    }

    try {
      return {
        provided: true,
        keys: Object.keys(context).slice(0, 12),
      };
    } catch {
      return { provided: true };
    }
  })();

  return {
    ok: false,
    errorType: "agent_parse_error",
    agentId,
    message: `Failed to parse response from agent ${agentId}`,
    rawSnippet: snippet,
    rawResponse,
    guidance:
      guidance ??
      "Ensure the agent returns valid JSON matching the documented contract.",
    cause,
    contextMetadata,
  };
}

function stringifyValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => `- ${stringifyValue(item)}`)
      .join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `- ${key}: ${stringifyValue(val)}`)
      .join("\n");
  }

  return JSON.stringify(value, null, 2);
}

function buildDeveloperContextSections(projectState: any): TargetedSection[] {
  if (!projectState) {
    return [];
  }

  const sections: TargetedSection[] = [];
  const state = typeof projectState.getState === "function" ? projectState.getState() : {};

  const story =
    typeof projectState.getDeliverable === "function"
      ? projectState.getDeliverable("sm", "story")
      : null;

  const structuredStory =
    typeof projectState.getStory === "function"
      ? projectState.getStory(story?.storyId)
      : story?.structured || story?.structuredStory || null;

  if (structuredStory) {
    const overviewBody: string[] = [];

    if (structuredStory.title) {
      overviewBody.push(`Story: ${structuredStory.title}`);
    }

    if (
      structuredStory.epicNumber != null &&
      structuredStory.storyNumber != null
    ) {
      overviewBody.push(`Sequence: ${structuredStory.epicNumber}.${structuredStory.storyNumber}`);
    }

    if (structuredStory.summary) {
      overviewBody.push(structuredStory.summary);
    } else if (structuredStory.description) {
      overviewBody.push(structuredStory.description);
    }

    const acceptanceCriteria: unknown[] = Array.isArray(structuredStory.acceptanceCriteria)
      ? structuredStory.acceptanceCriteria
      : [];

    if (acceptanceCriteria.length > 0) {
      overviewBody.push(
        "",
        "Acceptance Criteria:",
        ...acceptanceCriteria.map((item: unknown) => `- ${String(item)}`)
      );
    }

    sections.push({
      title: "Current Story Overview",
      body: overviewBody.filter(Boolean).join("\n"),
      priority: "high",
    });
  } else if (story?.content) {
    sections.push({
      title: "Current Story Overview",
      body: typeof story.content === "string" ? story.content : stringifyValue(story.content),
      priority: "high",
    });
  }

  if (state?.requirements && Object.keys(state.requirements).length > 0) {
    sections.push({
      title: "Key Requirements Snapshot",
      body: stringifyValue(state.requirements),
      priority: "high",
    });
  }

  if (state?.decisions && Object.keys(state.decisions).length > 0) {
    sections.push({
      title: "Relevant Decisions",
      body: stringifyValue(
        Object.fromEntries(
          Object.entries(state.decisions).map(([key, entry]: [string, any]) => [
            key,
            entry?.value ?? entry,
          ])
        )
      ),
      priority: "medium",
    });
  }

  if (state?.nextSteps) {
    sections.push({
      title: "Next Steps from SM",
      body: stringifyValue(state.nextSteps),
      priority: "medium",
    });
  }

  const recentConversation =
    typeof projectState.getConversation === "function"
      ? projectState.getConversation(5)
      : [];

  if (Array.isArray(recentConversation) && recentConversation.length > 0) {
    const conversationBody = recentConversation
      .map((msg: any) => {
        const role = msg?.role ?? "unknown";
        const phase = msg?.phase ? ` [${msg.phase}]` : "";
        const content = msg?.content ?? "";
        return `- ${role}${phase}: ${content}`;
      })
      .join("\n");

    sections.push({
      title: "Recent Conversation Signals",
      body: conversationBody,
      priority: "low",
    });
  }

  return sections;
}

function createDeveloperContextInjector(projectState: any) {
  return async function developerContextInjector({ agentId }: { agentId: string }) {
    if (agentId !== "dev") {
      return null;
    }

    const sections = buildDeveloperContextSections(projectState);

    if (!sections.length) {
      return null;
    }

    return {
      sections,
    };
  };
}

export type LaneKey = "default" | "quick" | "complex" | string;

const QUICK_LANE_FALLBACK_REASON = "Quick lane unavailable or not initialized";

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
  logger?: StructuredLogger;
}

interface LaneDecisionRecord {
  lane: string;
  rationale?: string;
  confidence?: number;
  trigger?: string;
  level?: number;
  levelScore?: number;
  levelSignals?: unknown;
  levelRationale?: string;
}

interface ReviewCheckpointConfig {
  title: string;
  sourcePhase: string;
  agent: string;
  lane?: LaneKey;
  deliverableKeys?: string[];
  instructions: string;
}

const REVIEW_CHECKPOINTS: Record<string, ReviewCheckpointConfig> = {
  pm_plan_review: {
    title: "Plan Quality Gate",
    sourcePhase: "pm",
    agent: "po",
    lane: "review",
    deliverableKeys: ["prd", "project_plan", "timeline"],
    instructions:
      "You are acting as an independent reviewer validating the product plan. Review the provided planning deliverables, identify risks or gaps, and respond with JSON {\"status\": \"approve\"|\"revise\"|\"block\", \"summary\": string, \"risks\": string[], \"follow_up\": string[]}.",
  },
  architecture_design_review: {
    title: "Architecture Design Review",
    sourcePhase: "architect",
    agent: "architect",
    lane: "review",
    deliverableKeys: ["architecture", "system_design", "tech_stack"],
    instructions:
      "You are a principal architect performing a design review. Inspect the architecture deliverables for feasibility, scalability, and alignment with requirements. Respond with JSON {\"status\": \"approve\"|\"revise\"|\"block\", \"summary\": string, \"risks\": string[], \"follow_up\": string[]}.",
  },
  story_scope_review: {
    title: "Story Scope Review",
    sourcePhase: "sm",
    agent: "qa",
    lane: "review",
    deliverableKeys: ["user_stories", "epics", "sprint_plan"],
    instructions:
      "You are a senior QA reviewer validating story readiness. Evaluate the backlog deliverables for clarity, testability, and risk. Respond with JSON {\"status\": \"approve\"|\"revise\"|\"block\", \"summary\": string, \"risks\": string[], \"follow_up\": string[]}.",
  },
};

const STORY_CONTEXT_VALIDATION_CHECKPOINT = "story_context_validation";

const REVIEW_CHECKPOINT_NAMES = Object.freeze(Object.keys(REVIEW_CHECKPOINTS));

async function getDefaultLLMClientCtor(): Promise<any> {
  const mod = await importLibModule<LLMClientModule>("llm-client.js");
  return mod.LLMClient;
}

export async function runOrchestratorServer(
  options: OrchestratorServerOptions = {}
): Promise<void> {
  const serverName = options.serverInfo?.name ?? "agilai-orchestrator";
  const serverVersion = options.serverInfo?.version ?? "1.0.0";
  const logger =
    options.logger ??
    createStructuredLogger({
      name: serverName,
      base: { component: "mcp-orchestrator" },
    });
  const textLog = options.log ?? ((message: string) => logger.info("runtime_log", { message }));
  const ensureOperationAllowed =
    options.ensureOperationAllowed ?? (async () => {
      /* no-op */
    });

  let quickLane: any;
  let quickLaneEnabled = true;
  let quickLaneDisabledReason: string | undefined;

  const disableQuickLane = (stage: string, error: unknown) => {
    if (!quickLaneEnabled) {
      return;
    }

    quickLaneEnabled = false;
    quickLane = undefined;
    quickLaneDisabledReason =
      error instanceof Error ? error.message : String(error);

    logger.warn("quick_lane_disabled", {
      operation: stage,
      reason: quickLaneDisabledReason,
    });
  };

  let defaultLLMCtor: any;
  const createLLMClient: (lane: LaneKey) => Promise<any> = async (lane) => {
    try {
      if (options.createLLMClient) {
        const result = await options.createLLMClient(lane);
        return result;
      }

      if (!defaultLLMCtor) {
        defaultLLMCtor = await getDefaultLLMClientCtor();
      }

      return new defaultLLMCtor();
    } catch (error) {
      if (lane === "quick") {
        disableQuickLane("create_llm_client", error);
        return undefined;
      }
      throw error;
    }
  };

  let ProjectState: any;
  let AgilaiBridge: any;
  let DeliverableGenerator: any;
  let BrownfieldAnalyzer: any;
  let QuickLane: any;
  let LaneSelector: any;
  let phaseTransitionHooks: any;
  let contextPreservation: any;
  let storyContextValidator: any;

  let projectState: any;
  let agilaiBridge: any;
  let deliverableGen: any;
  let brownfieldAnalyzer: any;
  const laneDecisions: LaneDecisionRecord[] = [];
  let developerContextInjectorRegistered = false;
  const developerLaneConfig: { validateStoryContext: boolean; validationLane: LaneKey } = {
    validateStoryContext: false,
    validationLane: "review",
  };

    async function loadDependencies() {
      if (!ProjectState) {
        ({ ProjectState } = await importLibModule<any>("project-state.js"));
      }
      if (!AgilaiBridge) {
        ({ AgilaiBridge } = await importLibModule<any>("agilai-bridge.js"));
      }
      if (!DeliverableGenerator) {
        ({ DeliverableGenerator } = await importLibModule<any>(
          "deliverable-generator.js"
        ));
      }
      if (!BrownfieldAnalyzer) {
        ({ BrownfieldAnalyzer } = await importLibModule<any>("brownfield-analyzer.js"));
      }
      if (!QuickLane) {
        ({ QuickLane } = await importLibModule<any>("quick-lane.js"));
      }
      if (!LaneSelector) {
        LaneSelector = await importLibModule<any>("lane-selector.js");
      }
      if (!phaseTransitionHooks) {
        phaseTransitionHooks = await importFromPackageRoot<any>(
          "hooks",
          "phase-transition.js"
        );
      }
      if (!contextPreservation) {
        contextPreservation = await importFromPackageRoot<any>(
          "hooks",
          "context-preservation.js"
        );
      }
      if (!storyContextValidator) {
        const module = await importLibModule<any>("story-context-validator.js");
        storyContextValidator = module?.default ?? module;
      }
    }

  async function initializeProject(projectPath: string = process.cwd()) {
    if (!projectState) {
      projectState = new ProjectState(projectPath);
      await projectState.initialize();
    }

    if (!agilaiBridge) {
      const llmClient = await createLLMClient("default");
      agilaiBridge = new AgilaiBridge({ llmClient });
      await agilaiBridge.initialize();

      const environmentInfo =
        typeof agilaiBridge.getEnvironmentInfo === "function"
          ? agilaiBridge.getEnvironmentInfo()
          : null;

      if (environmentInfo?.mode === "v6-modules") {
        logger.info("environment_detected", {
          operation: "detect_environment",
          mode: environmentInfo.mode,
          modulesRoot: environmentInfo.modulesRoot || environmentInfo.root,
          moduleCount: environmentInfo.catalog?.moduleCount ?? 0,
        });
      }
    }

    if (!deliverableGen) {
      deliverableGen = new DeliverableGenerator(projectPath, { agilaiBridge });
      await deliverableGen.initialize();
    }

    if (!brownfieldAnalyzer) {
      brownfieldAnalyzer = new BrownfieldAnalyzer(projectPath);
    }

    if (quickLaneEnabled && !quickLane) {
      try {
        const quickLaneLLM = await createLLMClient("quick");
        // Guard against race condition where quickLaneEnabled was flipped to false
        // during the async createLLMClient call (e.g., if it failed and called disableQuickLane)
        if (!quickLaneEnabled) {
          // Quick lane already disabled, skip initialization but continue with complex lane setup
        } else {
          quickLane = new QuickLane(projectPath, { llmClient: quickLaneLLM });
          await quickLane.initialize();
        }
      } catch (error) {
        disableQuickLane("initialize_quick_lane", error);
      }
    }

    phaseTransitionHooks.bindDependencies({
      triggerAgent: async (agentId: string, context: any) => {
        const result = await agilaiBridge.runAgent(agentId, context);

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
            logger.warn("agent_response_parse_failed", {
              operation: "trigger_agent",
              agentId,
              error: error instanceof Error ? error.message : String(error),
            });
            return {
              error: `Failed to parse response from agent ${agentId}`,
              rawResponse,
            };
          }
        }

        if (typeof rawResponse === "object") {
          return rawResponse;
        }

        const structuredError = buildParseError({
          agentId,
          rawResponse,
          error: new Error("Unsupported response type"),
          context,
        });
        logger.error(
          `[MCP] Failed to parse response from agent ${agentId}: Unsupported response type (${typeof rawResponse})`
        );
        return structuredError;
      },
      triggerCommand: async (command: string, context: any) => {
        await ensureOperationAllowed("execute_auto_command", { command });
        logger.info("auto_command_execute", {
          operation: "execute_auto_command",
          command,
        });
        return executeAutoCommand(command, context, agilaiBridge);
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

  async function runStoryContextValidationHook({
    notes,
    trigger,
  }: { notes?: string; trigger?: string } = {}) {
    if (!storyContextValidator?.runStoryContextValidation) {
      await loadDependencies();
    }

    const validationModule = storyContextValidator?.default
      ? storyContextValidator.default
      : storyContextValidator;

    if (!validationModule?.runStoryContextValidation) {
      throw new Error("Story context validator not available");
    }

    const lane = developerLaneConfig.validationLane ?? ("review" as LaneKey);

    return validationModule.runStoryContextValidation({
      projectState,
      createLLMClient,
      AgilaiBridge,
      lane,
      notes,
      trigger,
      log: textLog,
    });
  }

  async function ensureStoryContextReadyForDevelopment({
    notes,
    trigger,
  }: { notes?: string; trigger?: string } = {}) {
    if (!storyContextValidator) {
      await loadDependencies();
    }

    const validationModule = storyContextValidator?.default
      ? storyContextValidator.default
      : storyContextValidator;

    if (validationModule?.ensureStoryContextReadyForDevelopment) {
      const lane = developerLaneConfig.validationLane ?? ("review" as LaneKey);
      return validationModule.ensureStoryContextReadyForDevelopment({
        projectState,
        createLLMClient,
        AgilaiBridge,
        lane,
        notes,
        trigger,
        log: textLog,
      });
    }

    return runStoryContextValidationHook({ notes, trigger });
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
          "Analyze user message and conversation to determine appropriate Agilai phase",
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
        description: "Load Agilai agent persona for the current or specified phase",
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
        name: "configure_developer_lane",
        description:
          "Configure developer lane behavior including story context validation toggles",
        inputSchema: {
          type: "object",
          properties: {
            validateStoryContext: {
              type: "boolean",
              description:
                "Enable or disable story context validation before developer transitions",
            },
            validationLane: {
              type: "string",
              description: "Lane key to use for story context validation reviewer bridge",
            },
          },
        },
      },
      {
        name: "run_story_context_validation",
        description:
          "Re-run story context enrichment in isolation and record the audit checkpoint",
        inputSchema: {
          type: "object",
          properties: {
            notes: {
              type: "string",
              description: "Additional notes to attach to the validation record",
            },
          },
        },
      },
      {
        name: "generate_deliverable",
        description:
          "Generate Agilai deliverable (PRD, architecture, story, etc.) and save to docs/",
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
        name: "list_agilai_agents",
        description: "List all available Agilai agents",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "execute_agilai_workflow",
        description: "Execute a complete Agilai workflow for a phase",
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
        name: "run_review_checkpoint",
        description:
          "Run an independent reviewer model against a validation checkpoint and capture the outcome",
        inputSchema: {
          type: "object",
          properties: {
            checkpoint: {
              type: "string",
              enum: REVIEW_CHECKPOINT_NAMES,
              description: "Review checkpoint identifier",
            },
            notes: {
              type: "string",
              description: "Additional context or concerns for the reviewer",
            },
          },
          required: ["checkpoint"],
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
          "Find and load existing Agilai documentation (brief, prd, architecture, stories)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "load_previous_state",
        description: "Load state from previous Agilai session to resume work",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_codebase_summary",
        description:
          "Get comprehensive codebase analysis including structure, tech stack, and existing Agilai docs",
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
      {
        name: "search_mcp_servers",
        description:
          "Search for MCP servers in the registry by keyword. Returns matching servers with installation info.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'database', 'browser', 'github')",
            },
            category: {
              type: "string",
              description: "Optional category filter",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "suggest_mcp_servers",
        description:
          "Get intelligent MCP server suggestions based on project context (dependencies, tech stack, etc.)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "install_mcp_server",
        description:
          "Install and configure an MCP server from the registry. Handles environment variables interactively.",
        inputSchema: {
          type: "object",
          properties: {
            serverId: {
              type: "string",
              description: "Server ID or name (e.g., 'github', 'postgres', 'puppeteer')",
            },
            config: {
              type: "string",
              enum: ["claude", "agilai", "both", "bmad"],
              description: "Target configuration (default: claude, legacy alias: bmad)",
              default: "claude",
            },
            envVars: {
              type: "object",
              description: "Environment variables as key-value pairs",
            },
          },
          required: ["serverId"],
        },
      },
      {
        name: "list_mcp_servers",
        description:
          "List all currently configured MCP servers with their status and configuration source",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_mcp_health",
        description:
          "Check health status of all configured MCP servers. Returns detailed diagnostics.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "browse_mcp_registry",
        description:
          "Browse all available MCP servers in the registry, organized by category",
        inputSchema: {
          type: "object",
          properties: {
            refresh: {
              type: "boolean",
              description: "Force refresh the registry cache",
              default: false,
            },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolLogger = logger.child({ tool: name });
    const stopToolTimer = logger.startTimer();
    const outcomeFields: Record<string, unknown> = { operation: name };

    try {
      if (!ProjectState) {
        await loadDependencies();
      }
      await initializeProject();

      let response: any;

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

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(context, null, 2),
              },
            ],
          };
          break;
        }

        case "detect_phase": {
          const params = args as { userMessage: string; conversationHistory?: any[] };

          const result = await phaseTransitionHooks.checkTransition(
            { conversation: params.conversationHistory || [] },
            params.userMessage,
            projectState.state.currentPhase
          );

          if (result && typeof result === "object" && "error" in result) {
            const errorPayload = {
              detected_phase: projectState.state.currentPhase,
              confidence: 0,
              shouldTransition: false,
              error: result.error,
            } as const;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(errorPayload, null, 2),
                },
              ],
            };
          }

          const detection =
            result || ({
              detected_phase: projectState.state.currentPhase,
              confidence: 0.5,
              shouldTransition: false,
            } as const);

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(detection, null, 2),
              },
            ],
          };
          break;
        }

        case "load_agent_persona": {
          const params = args as { phase?: string };
          const phase = params.phase || projectState.state.currentPhase;
          const agent = await agilaiBridge.loadAgent(`${phase}`);

          response = {
            content: [
              {
                type: "text",
                text: agent.content,
              },
            ],
          };
          break;
        }

        case "transition_phase": {
          const params = args as {
            toPhase: string;
            context?: any;
            userValidated?: boolean;
          };

          let storyContextValidationResult: any = null;
          if (params.toPhase === "dev" && developerLaneConfig.validateStoryContext) {
            await ensureOperationAllowed("run_story_context_validation", {
              checkpoint: STORY_CONTEXT_VALIDATION_CHECKPOINT,
              mode: "pre_transition",
              lane: developerLaneConfig.validationLane,
            });

            storyContextValidationResult = await ensureStoryContextReadyForDevelopment({
              notes: params.context?.validationNotes,
              trigger: "phase_transition",
            });
          }

          const transitionResult = await phaseTransitionHooks.handleTransition(
            projectState,
            params.toPhase,
            params.context || {},
            params.userValidated || false
          );

          if (transitionResult && storyContextValidationResult?.record) {
            transitionResult.storyContextValidation = storyContextValidationResult.record;
          }

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(transitionResult, null, 2),
              },
            ],
          };
          break;
        }

        case "configure_developer_lane": {
          const params = args as { validateStoryContext?: boolean; validationLane?: string };

          await ensureOperationAllowed("configure_developer_lane", params || {});

          if (typeof params.validateStoryContext === "boolean") {
            developerLaneConfig.validateStoryContext = params.validateStoryContext;
          }

          if (params.validationLane) {
            developerLaneConfig.validationLane = params.validationLane as LaneKey;
          }

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    validateStoryContext: developerLaneConfig.validateStoryContext,
                    validationLane: developerLaneConfig.validationLane,
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        case "run_story_context_validation": {
          const params = args as { notes?: string };

          await ensureOperationAllowed("run_story_context_validation", {
            checkpoint: STORY_CONTEXT_VALIDATION_CHECKPOINT,
            lane: developerLaneConfig.validationLane,
            mode: "manual",
          });

          const result = await runStoryContextValidationHook({
            notes: params.notes,
            trigger: "manual_tool",
          });

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    checkpoint: result.checkpoint,
                    status: result.status,
                    issues: result.issues,
                    record: result.record,
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
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

          const metadata: Record<string, unknown> = {};

          if (result?.path) {
            metadata.path = result.path;
          }

          if (params.type === "story") {
            if (result?.storyId) {
              metadata.storyId = result.storyId;
            }

            if (result?.epicNumber != null) {
              metadata.epicNumber = result.epicNumber;
            }

            if (result?.storyNumber != null) {
              metadata.storyNumber = result.storyNumber;
            }

            if (result?.structured) {
              metadata.structuredStory = result.structured;

              const structuredStory = result.structured as Record<string, any>;

              if (structuredStory?.title) {
                metadata.title = structuredStory.title;
              }

              if (structuredStory?.persona) {
                metadata.persona = structuredStory.persona;
              }

              if (structuredStory?.acceptanceCriteria) {
                metadata.acceptanceCriteria = structuredStory.acceptanceCriteria;
              }

              if (structuredStory?.definitionOfDone) {
                metadata.definitionOfDone = structuredStory.definitionOfDone;
              }

              if (structuredStory?.testingStrategy) {
                metadata.testingStrategy = structuredStory.testingStrategy;
              }

              if (structuredStory?.technicalDetails) {
                metadata.technicalDetails = structuredStory.technicalDetails;
              }
            }
          }

          await projectState.storeDeliverable(params.type, result.content, metadata);

          response = {
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
          break;
        }

        case "record_decision": {
          const params = args as { key: string; value: string; rationale?: string };
          await projectState.recordDecision(
            params.key,
            params.value,
            params.rationale || ""
          );

          response = {
            content: [
              {
                type: "text",
                text: `Decision recorded: ${params.key} = ${params.value}`,
              },
            ],
          };
          break;
        }

        case "add_conversation_message": {
          const params = args as { role: string; content: string };
          await projectState.addMessage(params.role, params.content);

          response = {
            content: [
              {
                type: "text",
                text: "Message added to conversation history",
              },
            ],
          };
          break;
        }

        case "get_project_summary": {
          const summary = projectState.getSummary();

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(summary, null, 2),
              },
            ],
          };
          break;
        }

        case "list_agilai_agents": {
          const agents = await agilaiBridge.listAgents();

          response = {
            content: [
              {
                type: "text",
                text: `Available Agilai agents:\n${agents
                  .map((a: string) => `- ${a}`)
                  .join("\n")}`,
              },
            ],
          };
          break;
        }

        case "execute_agilai_workflow": {
          const params = args as { phase: string; context?: any };
          const result = await agilaiBridge.executePhaseWorkflow(
            params.phase,
            params.context || {}
          );

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
          break;
        }

        case "run_review_checkpoint": {
          const params = args as { checkpoint: string; notes?: string };
          const config = REVIEW_CHECKPOINTS[params.checkpoint];

          if (!config) {
            throw new Error(`Unknown review checkpoint: ${params.checkpoint}`);
          }

          await ensureOperationAllowed("run_review_checkpoint", {
            checkpoint: params.checkpoint,
            phase: config.sourcePhase,
          });

          const lane = config.lane ?? "review";
          logger.info("review_checkpoint_started", {
            operation: "run_review_checkpoint",
            checkpoint: params.checkpoint,
            reviewer: config.agent,
            lane,
          });

          const reviewLLM = await createLLMClient(lane);
          const reviewBridge = new AgilaiBridge({ llmClient: reviewLLM });
          await reviewBridge.initialize();

          const projectSnapshot = projectState.exportForLLM();
          const phaseDeliverables = projectState.getPhaseDeliverables(config.sourcePhase);

          const deliverables =
            config.deliverableKeys && config.deliverableKeys.length > 0
              ? Object.fromEntries(
                  config.deliverableKeys
                    .map((key) => [key, phaseDeliverables?.[key]])
                    .filter(([, value]) => value != null)
                )
              : phaseDeliverables;

          const reviewContext = {
            task: config.instructions,
            checkpoint: params.checkpoint,
            reviewerTitle: config.title,
            project: projectSnapshot,
            phaseDeliverables: deliverables,
            additionalNotes: params.notes ?? "",
          };

          const reviewResult = await reviewBridge.runAgent(config.agent, reviewContext);
          let parsedOutcome: any = reviewResult?.response;

          if (typeof parsedOutcome === "string") {
            try {
              parsedOutcome = JSON.parse(parsedOutcome);
            } catch (error) {
              parsedOutcome = {
                status: "revise",
                summary: "Reviewer response was not valid JSON.",
                raw: reviewResult?.response,
              };
            }
          }

          if (parsedOutcome == null || typeof parsedOutcome !== "object") {
            parsedOutcome = {
              status: "revise",
              summary: "Reviewer response unavailable.",
              raw: reviewResult?.response,
            };
          }

          if (!parsedOutcome.status) {
            parsedOutcome.status = "revise";
          }

          const record = await projectState.recordReviewOutcome(params.checkpoint, {
            phase: config.sourcePhase,
            reviewer: config.agent,
            lane,
            status: parsedOutcome.status,
            summary: parsedOutcome.summary ?? parsedOutcome.notes ?? "",
            risks: parsedOutcome.risks ?? [],
            followUp: parsedOutcome.follow_up ?? parsedOutcome.actions ?? [],
            additionalNotes: params.notes ?? undefined,
            outcome: parsedOutcome,
          });

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    checkpoint: params.checkpoint,
                    record,
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        case "scan_codebase": {
          const codebase = await brownfieldAnalyzer.scanCodebase();

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(codebase, null, 2),
              },
            ],
          };
          break;
        }

        case "detect_existing_docs": {
          const docs = await brownfieldAnalyzer.detectExistingDocs();

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(docs, null, 2),
              },
            ],
          };
          break;
        }

        case "load_previous_state": {
          const previousState = await brownfieldAnalyzer.detectPreviousState();

          if (previousState.exists && previousState.state) {
            await projectState.updateState(previousState.state);

            response = {
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
            break;
          }

          response = {
            content: [
              {
                type: "text",
                text: "No previous Agilai session found. Starting fresh.",
              },
            ],
          };
          break;
        }

        case "get_codebase_summary": {
          const summary = await brownfieldAnalyzer.generateCodebaseSummary();

          response = {
            content: [
              {
                type: "text",
                text: summary.summary,
              },
            ],
          };
          break;
        }

        case "select_development_lane": {
          const params = args as { userMessage: string; context?: any };
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };

          const selectionTimer = logger.startTimer();
          const decision = await LaneSelector.selectLaneWithLog(
            params.userMessage,
            context,
            projectState.projectPath
          );

          const selectionDurationMs = selectionTimer();
          const scaleLevel = decision.level ?? decision.scale?.level;
          const scaleScore = decision.scale?.score;
          const scaleSignals = decision.scale?.signals;
          const levelRationale = decision.levelRationale;
          logger.info("lane_selection_completed", {
            operation: "select_development_lane",
            lane: decision.lane,
            confidence: decision.confidence,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
            durationMs: selectionDurationMs,
          });
          logger.recordTiming("mcp.lane.selection.duration_ms", selectionDurationMs, {
            operation: "select_development_lane",
            lane: decision.lane,
          });

          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userMessage,
            {
              level: scaleLevel,
              levelScore: scaleScore,
              levelSignals: scaleSignals,
              levelRationale,
            }
          );

          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userMessage,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
          });

          outcomeFields.lane = decision.lane;
          outcomeFields.confidence = decision.confidence;
          outcomeFields.trigger = params.userMessage;
          if (scaleLevel !== undefined) {
            outcomeFields.level = scaleLevel;
          }
          if (scaleScore !== undefined) {
            outcomeFields.levelScore = scaleScore;
          }
          if (scaleSignals !== undefined) {
            outcomeFields.levelSignals = scaleSignals;
          }
          if (levelRationale) {
            outcomeFields.levelRationale = levelRationale;
          }

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(decision, null, 2),
              },
            ],
          };
          break;
        }

        case "execute_workflow": {
          const params = args as { userRequest: string; context?: any };
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };

          const selectionTimer = logger.startTimer();
          const decision = await LaneSelector.selectLaneWithLog(
            params.userRequest,
            context,
            projectState.projectPath
          );

          const selectionDurationMs = selectionTimer();
          const scaleLevel = decision.level ?? decision.scale?.level;
          const scaleScore = decision.scale?.score;
          const scaleSignals = decision.scale?.signals;
          const levelRationale = decision.levelRationale;
          logger.info("lane_selection_completed", {
            operation: "execute_workflow",
            lane: decision.lane,
            confidence: decision.confidence,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
            durationMs: selectionDurationMs,
          });
          logger.recordTiming("mcp.lane.selection.duration_ms", selectionDurationMs, {
            operation: "execute_workflow",
            lane: decision.lane,
          });

          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userRequest,
            {
              level: scaleLevel,
              levelScore: scaleScore,
              levelSignals: scaleSignals,
              levelRationale,
            }
          );

          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userRequest,
            level: scaleLevel,
            levelScore: scaleScore,
            levelSignals: scaleSignals,
            levelRationale,
          });

          let result: any;

          const quickLaneActive = quickLaneEnabled && typeof quickLane?.execute === "function";
          const selectedQuickLane = decision.lane === "quick";
          const executedLane = selectedQuickLane && quickLaneActive ? "quick" : "complex";

          outcomeFields.lane = decision.lane;
          outcomeFields.executedLane = executedLane;
          outcomeFields.confidence = decision.confidence;
          outcomeFields.request = params.userRequest;
          if (scaleLevel !== undefined) {
            outcomeFields.level = scaleLevel;
          }
          if (scaleScore !== undefined) {
            outcomeFields.levelScore = scaleScore;
          }
          if (scaleSignals !== undefined) {
            outcomeFields.levelSignals = scaleSignals;
          }
          if (levelRationale) {
            outcomeFields.levelRationale = levelRationale;
          }
          if (selectedQuickLane && !quickLaneActive) {
            outcomeFields.quickLaneAvailable = false;
            if (quickLaneDisabledReason) {
              outcomeFields.quickLaneDisabledReason = quickLaneDisabledReason;
            }
          }

          if (executedLane === "quick") {
            await ensureOperationAllowed("execute_quick_lane", {
              decision,
              request: params.userRequest,
            });
            logger.info("lane_workflow_started", {
              operation: "execute_workflow",
              lane: "quick",
              request: params.userRequest,
            });
            const laneTimer = logger.startTimer();
            result = await quickLane.execute(params.userRequest, context);
            const laneDurationMs = laneTimer();
            logger.info("lane_workflow_completed", {
              operation: "execute_workflow",
              lane: "quick",
              confidence: decision.confidence,
              durationMs: laneDurationMs,
            });
            logger.recordTiming("mcp.lane.workflow.duration_ms", laneDurationMs, {
              operation: "execute_workflow",
              lane: "quick",
            });
            outcomeFields.workflowDurationMs = laneDurationMs;
            result.lane = "quick";
            result.decision = decision;
          } else {
            if (selectedQuickLane && !quickLaneActive) {
              logger.info("quick_lane_execution_skipped", {
                operation: "execute_workflow",
                fallbackLane: "complex",
                reason: quickLaneDisabledReason ?? QUICK_LANE_FALLBACK_REASON,
              });
            }

            await ensureOperationAllowed("execute_complex_lane", {
              decision,
              request: params.userRequest,
            });
            logger.info("lane_workflow_started", {
              operation: "execute_workflow",
              lane: "complex",
              request: params.userRequest,
            });
            const laneTimer = logger.startTimer();
            await agilaiBridge.executePhaseWorkflow("analyst", {
              userMessage: params.userRequest,
              ...context,
            });
            await agilaiBridge.executePhaseWorkflow("pm", context);
            await agilaiBridge.executePhaseWorkflow("architect", context);
            await agilaiBridge.executePhaseWorkflow("sm", context);

            result = {
              lane: "complex",
              decision,
              files: ["docs/prd.md", "docs/architecture.md", "docs/stories/*.md"],
              message: "Complex workflow executed through Agilai agents",
            };
            if (selectedQuickLane && !quickLaneActive) {
              result.quickLane = {
                available: false,
                reason: quickLaneDisabledReason,
              };
            }
            const laneDurationMs = laneTimer();
            logger.info("lane_workflow_completed", {
              operation: "execute_workflow",
              lane: "complex",
              confidence: decision.confidence,
              durationMs: laneDurationMs,
            });
            logger.recordTiming("mcp.lane.workflow.duration_ms", laneDurationMs, {
              operation: "execute_workflow",
              lane: "complex",
            });
            outcomeFields.workflowDurationMs = laneDurationMs;
          }

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
          break;
        }

        case "search_mcp_servers": {
          const params = args as { query: string; category?: string };
          const McpRegistry = requireLibModule<any>("../tools/mcp-registry.js");
          const registry = new McpRegistry();
          const results = await registry.search(params.query, {
            category: params.category,
          });

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: params.query,
                    results: results.map((s: any) => ({
                      id: s.id,
                      name: s.name,
                      category: s.category,
                      description: s.description,
                      envVars: s.envVars || [],
                      installCommand: `install_mcp_server with serverId: ${s.id}`,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        case "suggest_mcp_servers": {
          const McpRegistry = requireLibModule<any>("../tools/mcp-registry.js");
          const registry = new McpRegistry();
          const suggestions = await registry.suggestForProject(projectState.projectPath);

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    suggestions: suggestions.map((s: any) => ({
                      server: {
                        id: s.server.id,
                        name: s.server.name,
                        category: s.server.category,
                        description: s.server.description,
                        envVars: s.server.envVars || [],
                      },
                      reason: s.reason,
                      installCommand: `install_mcp_server with serverId: ${s.server.id}`,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        case "install_mcp_server": {
          const params = args as {
            serverId: string;
            config?: string;
            envVars?: Record<string, string>;
          };

          await ensureOperationAllowed("install_mcp_server", { serverId: params.serverId });

          const McpRegistry = requireLibModule<any>("../tools/mcp-registry.js");
          const McpManager = requireLibModule<any>("../tools/mcp-manager.js");

          const registry = new McpRegistry();
          const manager = new McpManager({ rootDir: projectState.projectPath });

          const server = await registry.getServer(params.serverId);

          if (!server) {
            throw new Error(`MCP server "${params.serverId}" not found in registry`);
          }

          const serverConfig: any = {
            command: server.installType === "npx" ? "npx" : server.command,
            args: server.installType === "npx" ? ["-y", server.name] : server.args || [],
            disabled: false,
          };

          if (params.envVars && Object.keys(params.envVars).length > 0) {
            serverConfig.env = params.envVars;
          }

          const requestedConfig = params.config || "agilai";
          const normalisedRequest = requestedConfig.toLowerCase();

          // Validate config parameter
          const validConfigs = ["agilai", "claude", "both", "bmad"];
          if (!validConfigs.includes(normalisedRequest)) {
            throw new Error(
              `Invalid config parameter: "${params.config}". Valid options are: "agilai" (default), "claude", "both", or "bmad" (legacy alias for "agilai")`
            );
          }

          const legacyAliasUsed = normalisedRequest === "bmad";
          const effectiveConfig = legacyAliasUsed ? "agilai" : normalisedRequest;
          const applyClaudeConfig =
            normalisedRequest === "claude" || normalisedRequest === "both";
          const applyAgilaiConfig =
            effectiveConfig === "agilai" || normalisedRequest === "both";

          if (applyClaudeConfig) {
            const config = manager.loadClaudeConfig();
            config.mcpServers = config.mcpServers || {};
            config.mcpServers[params.serverId] = serverConfig;
            manager.saveClaudeConfig(config);
          }

          if (applyAgilaiConfig) {
            const config = manager.loadAgilaiConfig();
            config.mcpServers = config.mcpServers || {};
            config.mcpServers[params.serverId] = serverConfig;
            manager.saveAgilaiConfig(config);
          }

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    serverId: params.serverId,
                    serverName: server.name,
                    targetConfig: effectiveConfig,
                    requestedConfig,
                    message: `Successfully installed ${server.name} to ${effectiveConfig} configuration${
                      legacyAliasUsed ? " (legacy alias: bmad)" : ""
                    }`,
                    restartRequired: true,
                    restartMessage: "Please restart your chat session for the MCP server to be loaded and available.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        case "list_mcp_servers": {
          const McpManager = requireLibModule<any>("../tools/mcp-manager.js");
          const manager = new McpManager({ rootDir: projectState.projectPath });

          const claudeConfig = manager.loadClaudeConfig();
          const agilaiConfig = manager.loadAgilaiConfig();

          const allServers = new Map();

          for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
            allServers.set(name, { ...(config as Record<string, any>), source: "claude" });
          }

          for (const [name, config] of Object.entries(agilaiConfig.mcpServers || {})) {
            if (!allServers.has(name)) {
              allServers.set(name, { ...(config as Record<string, any>), source: "agilai" });
            } else {
              (allServers.get(name) as any).source = "both";
            }
          }

          const serverList = Array.from(allServers.entries()).map(([name, config]: [string, any]) => ({
            name,
            command: config.command,
            args: config.args || [],
            disabled: config.disabled || false,
            source: config.source,
            hasEnv: config.env && Object.keys(config.env).length > 0,
          }));

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    servers: serverList,
                    total: serverList.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        case "get_mcp_health": {
          const McpManager = requireLibModule<any>("../tools/mcp-manager.js");
          const manager = new McpManager({ rootDir: projectState.projectPath });

          const claudeConfig = manager.loadClaudeConfig();
          const agilaiConfig = manager.loadAgilaiConfig();

          const allServers = new Map();

          for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
            allServers.set(name, config);
          }

          for (const [name, config] of Object.entries(agilaiConfig.mcpServers || {})) {
            if (!allServers.has(name)) {
              allServers.set(name, config);
            }
          }

          const healthResults = [];
          for (const [name, config] of allServers) {
            if ((config as any).disabled) {
              healthResults.push({ name, status: "disabled" });
              continue;
            }

            try {
              const result = await manager.testServer(name, config);
              healthResults.push(result);
            } catch (error: unknown) {
              healthResults.push({
                name,
                status: "error",
                message: error instanceof Error ? error.message : String(error),
              });
            }
          }

          const healthy = healthResults.filter((r) => r.status === "healthy").length;
          const total = healthResults.length;

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    summary: `${healthy}/${total} servers healthy`,
                    healthy,
                    total,
                    servers: healthResults,
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        case "browse_mcp_registry": {
          const params = args as { refresh?: boolean };
          const McpRegistry = requireLibModule<any>("../tools/mcp-registry.js");
          const registry = new McpRegistry();

          const servers = await registry.getServers(params.refresh || false);
          const categories = await registry.getCategories();

          const grouped: Record<string, any[]> = {};
          for (const category of categories) {
            grouped[category] = servers.filter((s: any) => s.category === category);
          }

          response = {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    total: servers.length,
                    categories,
                    servers: grouped,
                  },
                  null,
                  2
                ),
              },
            ],
          };
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const durationMs = stopToolTimer();
      toolLogger.info("tool_completed", { ...outcomeFields, durationMs });
      logger.recordTiming(`mcp.tool.${name}.duration_ms`, durationMs, {
        tool: name,
        operation: name,
        status: "ok",
      });

      return response;
    } catch (error: unknown) {
      const durationMs = stopToolTimer();
      toolLogger.error("tool_failed", {
        ...outcomeFields,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.recordTiming(`mcp.tool.${name}.duration_ms`, durationMs, {
        tool: name,
        operation: name,
        status: "error",
      });

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

  const smokeTestCompleted = await runBundledToolsSmokeCheck({
    ensureOperationAllowed,
    logger,
  });

  if (smokeTestCompleted) {
    return;
  }
  const transport = options.transport ?? new StdioServerTransport();
  await server.connect(transport);

  logger.info("server_started", {
    operation: "startup",
    server: serverName,
    version: serverVersion,
    transport: "stdio",
    lanesTracked: laneDecisions.length,
  });

  if (options.onServerReady) {
    await options.onServerReady(server);
  }
}

/**
 * Type definitions for MCP tool modules
 */
interface McpServerSearchResult {
  id: string;
  name: string;
  category: string;
  description: string;
  installType: string;
  tags: string[];
  envVars?: string[];
}

interface McpServerDetails {
  id: string;
  name: string;
  installType: string;
  command?: string;
  args?: string[];
  envVars?: string[];
}

interface McpConfig {
  mcpServers?: Record<string, unknown>;
}

interface McpRegistryModule {
  new (): {
    search(query: string, options: Record<string, unknown>): Promise<McpServerSearchResult[]>;
    getServer(idOrName: string): Promise<McpServerDetails | null>;
  };
}

interface McpManagerModule {
  new (options: { rootDir: string; profile: string }): {
    loadClaudeConfig(profileName?: string | null): McpConfig;
    saveClaudeConfig(config: McpConfig, profileName?: string | null): void;
    loadAgilaiConfig(profileName?: string | null): McpConfig;
    saveAgilaiConfig(config: McpConfig, profileName?: string | null): void;
  };
}

/**
 * Runs a smoke test for bundled MCP tools to verify they can be loaded and used.
 *
 * This test validates that:
 * - MCP registry and manager modules can be successfully loaded from the bundle
 * - Registry search functionality works correctly
 * - Server installation and configuration can be performed
 * - Both Claude and Agilai config files are properly generated
 *
 * The smoke test is enabled by setting AGILAI_MCP_SMOKE_TEST=1 environment variable.
 * When enabled, the test runs at server startup and exits early (returns true) to
 * prevent the server from continuing to run, making it suitable for CI/CD validation.
 *
 * @param ensureOperationAllowed - Security callback to validate operations
 * @param logger - Structured logger for recording test results
 * @returns true if smoke test was enabled and completed, false if disabled
 * @throws Error if smoke test fails (module not found, search fails, etc.)
 */
async function runBundledToolsSmokeCheck({
  ensureOperationAllowed,
  logger,
}: {
  ensureOperationAllowed: NonNullable<OrchestratorServerOptions["ensureOperationAllowed"]>;
  logger: StructuredLogger;
}): Promise<boolean> {
  if (process.env.AGILAI_MCP_SMOKE_TEST !== "1") {
    return false;
  }

  const McpRegistry = requireLibModule<McpRegistryModule>("mcp-registry.js");
  const McpManager = requireLibModule<McpManagerModule>("mcp-manager.js");

  const smokeRoot =
    process.env.AGILAI_MCP_SMOKE_ROOT ?? mkdtempSync(path.join(tmpdir(), "agilai-mcp-smoke-"));
  const cleanupRoot = !process.env.AGILAI_MCP_SMOKE_ROOT;
  const profile = process.env.MCP_PROFILE ?? "default";

  try {
    const registry = new McpRegistry();
    const manager = new McpManager({ rootDir: smokeRoot, profile });
    const searchResults = await registry.search("filesystem", {});

    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      throw new Error("MCP smoke test failed: registry search returned no results");
    }

    const targetServer = await registry.getServer(searchResults[0].id);

    if (!targetServer) {
      throw new Error("MCP smoke test failed: unable to resolve server from registry");
    }

    await ensureOperationAllowed("install_mcp_server", { serverId: targetServer.id });

    const serverConfig: Record<string, unknown> = {
      command: targetServer.installType === "npx" ? "npx" : targetServer.command,
      args:
        targetServer.installType === "npx"
          ? ["-y", targetServer.name]
          : Array.isArray(targetServer.args)
            ? targetServer.args
            : [],
      disabled: false,
    };

    if (targetServer.envVars && targetServer.envVars.length > 0) {
      const placeholderEnv: Record<string, string> = {};
      for (const key of targetServer.envVars) {
        placeholderEnv[key] = `set-${key.toLowerCase()}`;
      }
      serverConfig.env = placeholderEnv;
    }

    const claudeConfig = manager.loadClaudeConfig();
    claudeConfig.mcpServers = claudeConfig.mcpServers || {};
    claudeConfig.mcpServers[targetServer.id] = serverConfig;
    manager.saveClaudeConfig(claudeConfig);

    const agilaiConfig = manager.loadAgilaiConfig();
    agilaiConfig.mcpServers = agilaiConfig.mcpServers || {};
    agilaiConfig.mcpServers[targetServer.id] = serverConfig;
    manager.saveAgilaiConfig(agilaiConfig);

    logger.info("mcp_smoke_test_completed", {
      operation: "smoke_test",
      serverId: targetServer.id,
    });

    return true;
  } catch (error) {
    logger.error("mcp_smoke_test_failed", {
      operation: "smoke_test",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  } finally {
    if (cleanupRoot) {
      rmSync(smokeRoot, { recursive: true, force: true });
    }
  }
}
