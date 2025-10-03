'use strict';
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
exports.runOrchestratorServer = runOrchestratorServer;
const index_js_1 = require('@modelcontextprotocol/sdk/server/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const path = __importStar(require('node:path'));
const auto_commands_js_1 = require('../../lib/auto-commands.js');
const observability_js_1 = require('./observability.js');
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
function buildParseError({ agentId, rawResponse, error, context, guidance }) {
  let stringified = '';
  if (typeof rawResponse === 'string') {
    stringified = rawResponse;
  } else if (rawResponse != null) {
    try {
      stringified = JSON.stringify(rawResponse);
    } catch {
      stringified = '[unserializable payload]';
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
  const contextMetadata = (() => {
    if (!context || typeof context !== 'object') {
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
    errorType: 'agent_parse_error',
    agentId,
    message: `Failed to parse response from agent ${agentId}`,
    rawSnippet: snippet,
    rawResponse,
    guidance: guidance ?? 'Ensure the agent returns valid JSON matching the documented contract.',
    cause,
    contextMetadata,
  };
}
function stringifyValue(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => `- ${stringifyValue(item)}`).join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `- ${key}: ${stringifyValue(val)}`)
      .join('\n');
  }
  return JSON.stringify(value, null, 2);
}
function buildDeveloperContextSections(projectState) {
  if (!projectState) {
    return [];
  }
  const sections = [];
  const state = typeof projectState.getState === 'function' ? projectState.getState() : {};
  const story =
    typeof projectState.getDeliverable === 'function'
      ? projectState.getDeliverable('sm', 'story')
      : null;
  const structuredStory =
    typeof projectState.getStory === 'function'
      ? projectState.getStory(story?.storyId)
      : story?.structured || story?.structuredStory || null;
  if (structuredStory) {
    const overviewBody = [];
    if (structuredStory.title) {
      overviewBody.push(`Story: ${structuredStory.title}`);
    }
    if (structuredStory.epicNumber != null && structuredStory.storyNumber != null) {
      overviewBody.push(`Sequence: ${structuredStory.epicNumber}.${structuredStory.storyNumber}`);
    }
    if (structuredStory.summary) {
      overviewBody.push(structuredStory.summary);
    } else if (structuredStory.description) {
      overviewBody.push(structuredStory.description);
    }
    const acceptanceCriteria = Array.isArray(structuredStory.acceptanceCriteria)
      ? structuredStory.acceptanceCriteria
      : [];
    if (acceptanceCriteria.length > 0) {
      overviewBody.push(
        '',
        'Acceptance Criteria:',
        ...acceptanceCriteria.map((item) => `- ${String(item)}`),
      );
    }
    sections.push({
      title: 'Current Story Overview',
      body: overviewBody.filter(Boolean).join('\n'),
      priority: 'high',
    });
  } else if (story?.content) {
    sections.push({
      title: 'Current Story Overview',
      body: typeof story.content === 'string' ? story.content : stringifyValue(story.content),
      priority: 'high',
    });
  }
  if (state?.requirements && Object.keys(state.requirements).length > 0) {
    sections.push({
      title: 'Key Requirements Snapshot',
      body: stringifyValue(state.requirements),
      priority: 'high',
    });
  }
  if (state?.decisions && Object.keys(state.decisions).length > 0) {
    sections.push({
      title: 'Relevant Decisions',
      body: stringifyValue(
        Object.fromEntries(
          Object.entries(state.decisions).map(([key, entry]) => [key, entry?.value ?? entry]),
        ),
      ),
      priority: 'medium',
    });
  }
  if (state?.nextSteps) {
    sections.push({
      title: 'Next Steps from SM',
      body: stringifyValue(state.nextSteps),
      priority: 'medium',
    });
  }
  const recentConversation =
    typeof projectState.getConversation === 'function' ? projectState.getConversation(5) : [];
  if (Array.isArray(recentConversation) && recentConversation.length > 0) {
    const conversationBody = recentConversation
      .map((msg) => {
        const role = msg?.role ?? 'unknown';
        const phase = msg?.phase ? ` [${msg.phase}]` : '';
        const content = msg?.content ?? '';
        return `- ${role}${phase}: ${content}`;
      })
      .join('\n');
    sections.push({
      title: 'Recent Conversation Signals',
      body: conversationBody,
      priority: 'low',
    });
  }
  return sections;
}
function createDeveloperContextInjector(projectState) {
  return async function developerContextInjector({ agentId }) {
    if (agentId !== 'dev') {
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
const REVIEW_CHECKPOINTS = {
  pm_plan_review: {
    title: 'Plan Quality Gate',
    sourcePhase: 'pm',
    agent: 'po',
    lane: 'review',
    deliverableKeys: ['prd', 'project_plan', 'timeline'],
    instructions:
      'You are acting as an independent reviewer validating the product plan. Review the provided planning deliverables, identify risks or gaps, and respond with JSON {"status": "approve"|"revise"|"block", "summary": string, "risks": string[], "follow_up": string[]}.',
  },
  architecture_design_review: {
    title: 'Architecture Design Review',
    sourcePhase: 'architect',
    agent: 'architect',
    lane: 'review',
    deliverableKeys: ['architecture', 'system_design', 'tech_stack'],
    instructions:
      'You are a principal architect performing a design review. Inspect the architecture deliverables for feasibility, scalability, and alignment with requirements. Respond with JSON {"status": "approve"|"revise"|"block", "summary": string, "risks": string[], "follow_up": string[]}.',
  },
  story_scope_review: {
    title: 'Story Scope Review',
    sourcePhase: 'sm',
    agent: 'qa',
    lane: 'review',
    deliverableKeys: ['user_stories', 'epics', 'sprint_plan'],
    instructions:
      'You are a senior QA reviewer validating story readiness. Evaluate the backlog deliverables for clarity, testability, and risk. Respond with JSON {"status": "approve"|"revise"|"block", "summary": string, "risks": string[], "follow_up": string[]}.',
  },
};
const STORY_CONTEXT_VALIDATION_CHECKPOINT = 'story_context_validation';
const REVIEW_CHECKPOINT_NAMES = Object.freeze(Object.keys(REVIEW_CHECKPOINTS));
async function getDefaultLLMClientCtor() {
  const mod = await import('../../lib/llm-client.js');
  return mod.LLMClient;
}
async function runOrchestratorServer(options = {}) {
  const serverName = options.serverInfo?.name ?? 'bmad-invisible-orchestrator';
  const serverVersion = options.serverInfo?.version ?? '1.0.0';
  const logger =
    options.logger ??
    (0, observability_js_1.createStructuredLogger)({
      name: serverName,
      base: { component: 'mcp-orchestrator' },
    });
  const textLog = options.log ?? ((message) => logger.info('runtime_log', { message }));
  const ensureOperationAllowed =
    options.ensureOperationAllowed ??
    (async () => {
      /* no-op */
    });
  let defaultLLMCtor;
  const createLLMClient = async (lane) => {
    if (options.createLLMClient) {
      const result = await options.createLLMClient(lane);
      return result;
    }
    if (!defaultLLMCtor) {
      defaultLLMCtor = await getDefaultLLMClientCtor();
    }
    return new defaultLLMCtor();
  };
  let ProjectState;
  let BMADBridge;
  let DeliverableGenerator;
  let BrownfieldAnalyzer;
  let QuickLane;
  let LaneSelector;
  let phaseTransitionHooks;
  let contextPreservation;
  let storyContextValidator;
  let projectState;
  let bmadBridge;
  let deliverableGen;
  let brownfieldAnalyzer;
  let quickLane;
  const laneDecisions = [];
  let developerContextInjectorRegistered = false;
  const developerLaneConfig = {
    validateStoryContext: false,
    validationLane: 'review',
  };
  async function loadDependencies() {
    const libPath = path.join(__dirname, '..', '..', 'lib');
    const hooksPath = path.join(__dirname, '..', '..', 'hooks');
    if (!ProjectState) {
      ({ ProjectState } = await import(path.join(libPath, 'project-state.js')));
    }
    if (!BMADBridge) {
      ({ BMADBridge } = await import(path.join(libPath, 'bmad-bridge.js')));
    }
    if (!DeliverableGenerator) {
      ({ DeliverableGenerator } = await import(path.join(libPath, 'deliverable-generator.js')));
    }
    if (!BrownfieldAnalyzer) {
      ({ BrownfieldAnalyzer } = await import(path.join(libPath, 'brownfield-analyzer.js')));
    }
    if (!QuickLane) {
      ({ QuickLane } = await import(path.join(libPath, 'quick-lane.js')));
    }
    if (!LaneSelector) {
      LaneSelector = await import(path.join(libPath, 'lane-selector.js'));
    }
    if (!phaseTransitionHooks) {
      phaseTransitionHooks = await import(path.join(hooksPath, 'phase-transition.js'));
    }
    if (!contextPreservation) {
      contextPreservation = await import(path.join(hooksPath, 'context-preservation.js'));
    }
    if (!storyContextValidator) {
      const module = await import(path.join(libPath, 'story-context-validator.js'));
      storyContextValidator = module?.default ?? module;
    }
  }
  async function initializeProject(projectPath = process.cwd()) {
    if (!projectState) {
      projectState = new ProjectState(projectPath);
      await projectState.initialize();
    }
    if (!bmadBridge) {
      const llmClient = await createLLMClient('default');
      bmadBridge = new BMADBridge({ llmClient });
      await bmadBridge.initialize();
      const environmentInfo =
        typeof bmadBridge.getEnvironmentInfo === 'function'
          ? bmadBridge.getEnvironmentInfo()
          : null;
      if (environmentInfo?.mode === 'v6-modules') {
        logger.info('environment_detected', {
          operation: 'detect_environment',
          mode: environmentInfo.mode,
          modulesRoot: environmentInfo.modulesRoot || environmentInfo.root,
          moduleCount: environmentInfo.catalog?.moduleCount ?? 0,
        });
      }
    }
    if (!deliverableGen) {
      deliverableGen = new DeliverableGenerator(projectPath, { bmadBridge });
      await deliverableGen.initialize();
    }
    if (!brownfieldAnalyzer) {
      brownfieldAnalyzer = new BrownfieldAnalyzer(projectPath);
    }
    if (!quickLane) {
      const quickLaneLLM = await createLLMClient('quick');
      quickLane = new QuickLane(projectPath, { llmClient: quickLaneLLM });
      await quickLane.initialize();
    }
    phaseTransitionHooks.bindDependencies({
      triggerAgent: async (agentId, context) => {
        const result = await bmadBridge.runAgent(agentId, context);
        if (!result) {
          return null;
        }
        const rawResponse = result.response;
        if (rawResponse == null) {
          return null;
        }
        if (typeof rawResponse === 'string') {
          try {
            return JSON.parse(rawResponse);
          } catch (error) {
            logger.warn('agent_response_parse_failed', {
              operation: 'trigger_agent',
              agentId,
              error: error instanceof Error ? error.message : String(error),
            });
            return {
              error: `Failed to parse response from agent ${agentId}`,
              rawResponse,
            };
          }
        }
        if (typeof rawResponse === 'object') {
          return rawResponse;
        }
        const structuredError = buildParseError({
          agentId,
          rawResponse,
          error: new Error('Unsupported response type'),
          context,
        });
        logger.error(
          `[MCP] Failed to parse response from agent ${agentId}: Unsupported response type (${typeof rawResponse})`,
        );
        return structuredError;
      },
      triggerCommand: async (command, context) => {
        await ensureOperationAllowed('execute_auto_command', { command });
        logger.info('auto_command_execute', {
          operation: 'execute_auto_command',
          command,
        });
        return (0, auto_commands_js_1.executeAutoCommand)(command, context, bmadBridge);
      },
      updateProjectState: async (updates) => {
        await projectState.updateState(updates);
      },
      saveDeliverable: async (type, content) => {
        await ensureOperationAllowed('save_deliverable', { type });
        await projectState.storeDeliverable(type, content);
      },
      loadPhaseContext: async (phase, context) =>
        contextPreservation.preserveContext(
          projectState.state.currentPhase,
          phase,
          context,
          async (p) => projectState.getPhaseDeliverables(p),
        ),
    });
  }
  async function runStoryContextValidationHook({ notes, trigger } = {}) {
    if (!storyContextValidator?.runStoryContextValidation) {
      await loadDependencies();
    }
    const validationModule = storyContextValidator?.default
      ? storyContextValidator.default
      : storyContextValidator;
    if (!validationModule?.runStoryContextValidation) {
      throw new Error('Story context validator not available');
    }
    const lane = developerLaneConfig.validationLane ?? 'review';
    return validationModule.runStoryContextValidation({
      projectState,
      createLLMClient,
      BMADBridge,
      lane,
      notes,
      trigger,
      log: textLog,
    });
  }
  async function ensureStoryContextReadyForDevelopment({ notes, trigger } = {}) {
    if (!storyContextValidator) {
      await loadDependencies();
    }
    const validationModule = storyContextValidator?.default
      ? storyContextValidator.default
      : storyContextValidator;
    if (validationModule?.ensureStoryContextReadyForDevelopment) {
      const lane = developerLaneConfig.validationLane ?? 'review';
      return validationModule.ensureStoryContextReadyForDevelopment({
        projectState,
        createLLMClient,
        BMADBridge,
        lane,
        notes,
        trigger,
        log: textLog,
      });
    }
    return runStoryContextValidationHook({ notes, trigger });
  }
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
  server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_project_context',
        description:
          'Get complete project context including phase, requirements, decisions, and conversation history',
        inputSchema: {
          type: 'object',
          properties: {
            includeConversation: {
              type: 'boolean',
              description: 'Include recent conversation history',
              default: true,
            },
            conversationLimit: {
              type: 'number',
              description: 'Number of recent messages to include',
              default: 10,
            },
          },
        },
      },
      {
        name: 'detect_phase',
        description: 'Analyze user message and conversation to determine appropriate BMAD phase',
        inputSchema: {
          type: 'object',
          properties: {
            userMessage: {
              type: 'string',
              description: "User's latest message",
            },
            conversationHistory: {
              type: 'array',
              description: 'Recent conversation messages',
              items: { type: 'object' },
              default: [],
            },
          },
          required: ['userMessage'],
        },
      },
      {
        name: 'load_agent_persona',
        description: 'Load BMAD agent persona for the current or specified phase',
        inputSchema: {
          type: 'object',
          properties: {
            phase: {
              type: 'string',
              enum: ['analyst', 'pm', 'architect', 'sm', 'dev', 'qa', 'ux', 'po'],
              description: 'Phase to load agent for (defaults to current phase)',
            },
          },
        },
      },
      {
        name: 'transition_phase',
        description: 'Safely transition to a new project phase with validation',
        inputSchema: {
          type: 'object',
          properties: {
            toPhase: {
              type: 'string',
              enum: ['analyst', 'pm', 'architect', 'sm', 'dev', 'qa', 'ux', 'po'],
              description: 'Target phase',
            },
            context: {
              type: 'object',
              description: 'Context to carry forward',
            },
            userValidated: {
              type: 'boolean',
              description: 'Whether user has validated the transition',
              default: false,
            },
          },
          required: ['toPhase'],
        },
      },
      {
        name: 'configure_developer_lane',
        description: 'Configure developer lane behavior including story context validation toggles',
        inputSchema: {
          type: 'object',
          properties: {
            validateStoryContext: {
              type: 'boolean',
              description:
                'Enable or disable story context validation before developer transitions',
            },
            validationLane: {
              type: 'string',
              description: 'Lane key to use for story context validation reviewer bridge',
            },
          },
        },
      },
      {
        name: 'run_story_context_validation',
        description: 'Re-run story context enrichment in isolation and record the audit checkpoint',
        inputSchema: {
          type: 'object',
          properties: {
            notes: {
              type: 'string',
              description: 'Additional notes to attach to the validation record',
            },
          },
        },
      },
      {
        name: 'generate_deliverable',
        description: 'Generate BMAD deliverable (PRD, architecture, story, etc.) and save to docs/',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['brief', 'prd', 'architecture', 'epic', 'story', 'qa_assessment'],
              description: 'Type of deliverable to generate',
            },
            context: {
              type: 'object',
              description: 'Context data for the deliverable',
            },
          },
          required: ['type', 'context'],
        },
      },
      {
        name: 'record_decision',
        description: 'Record a project decision for future reference',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: "Decision identifier (e.g., 'tech_stack', 'architecture_pattern')",
            },
            value: {
              type: 'string',
              description: 'The decision made',
            },
            rationale: {
              type: 'string',
              description: 'Why this decision was made',
            },
          },
          required: ['key', 'value'],
        },
      },
      {
        name: 'add_conversation_message',
        description: 'Add a message to the conversation history',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
              description: 'Message role',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
          },
          required: ['role', 'content'],
        },
      },
      {
        name: 'get_project_summary',
        description: 'Get a high-level summary of project status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_bmad_agents',
        description: 'List all available BMAD agents',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'execute_bmad_workflow',
        description: 'Execute a complete BMAD workflow for a phase',
        inputSchema: {
          type: 'object',
          properties: {
            phase: {
              type: 'string',
              enum: ['analyst', 'pm', 'architect', 'sm', 'dev', 'qa', 'ux', 'po'],
              description: 'Phase workflow to execute',
            },
            context: {
              type: 'object',
              description: 'Workflow context',
            },
          },
          required: ['phase'],
        },
      },
      {
        name: 'run_review_checkpoint',
        description:
          'Run an independent reviewer model against a validation checkpoint and capture the outcome',
        inputSchema: {
          type: 'object',
          properties: {
            checkpoint: {
              type: 'string',
              enum: REVIEW_CHECKPOINT_NAMES,
              description: 'Review checkpoint identifier',
            },
            notes: {
              type: 'string',
              description: 'Additional context or concerns for the reviewer',
            },
          },
          required: ['checkpoint'],
        },
      },
      {
        name: 'scan_codebase',
        description:
          'Scan existing codebase structure, tech stack, and architecture (for brownfield projects)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'detect_existing_docs',
        description:
          'Find and load existing BMAD documentation (brief, prd, architecture, stories)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'load_previous_state',
        description: 'Load state from previous BMAD session to resume work',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_codebase_summary',
        description:
          'Get comprehensive codebase analysis including structure, tech stack, and existing BMAD docs',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'select_development_lane',
        description:
          'Analyze user message to determine whether to use complex (multi-agent) or quick (template-based) lane',
        inputSchema: {
          type: 'object',
          properties: {
            userMessage: {
              type: 'string',
              description: "User's message/request to analyze",
            },
            context: {
              type: 'object',
              description: 'Additional context (previousPhase, projectComplexity, forceLane, etc.)',
            },
          },
          required: ['userMessage'],
        },
      },
      {
        name: 'execute_workflow',
        description:
          'Execute development workflow - automatically routes between quick and complex lanes, outputs to docs/',
        inputSchema: {
          type: 'object',
          properties: {
            userRequest: {
              type: 'string',
              description: "User's feature request or task description",
            },
            context: {
              type: 'object',
              description: 'Additional context (forceLane, projectComplexity, etc.)',
            },
          },
          required: ['userRequest'],
        },
      },
    ],
  }));
  server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolLogger = logger.child({ tool: name });
    const stopToolTimer = logger.startTimer();
    const outcomeFields = { operation: name };
    try {
      if (!ProjectState) {
        await loadDependencies();
      }
      await initializeProject();
      let response;
      switch (name) {
        case 'get_project_context': {
          const params = args;
          const state = projectState.getState();
          const context = {
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
              params.conversationLimit || 10,
            );
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(context, null, 2),
              },
            ],
          };
          break;
        }
        case 'detect_phase': {
          const params = args;
          const result = await phaseTransitionHooks.checkTransition(
            { conversation: params.conversationHistory || [] },
            params.userMessage,
            projectState.state.currentPhase,
          );
          if (result && typeof result === 'object' && 'error' in result) {
            const errorPayload = {
              detected_phase: projectState.state.currentPhase,
              confidence: 0,
              shouldTransition: false,
              error: result.error,
            };
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(errorPayload, null, 2),
                },
              ],
            };
          }
          const detection = result || {
            detected_phase: projectState.state.currentPhase,
            confidence: 0.5,
            shouldTransition: false,
          };
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(detection, null, 2),
              },
            ],
          };
          break;
        }
        case 'load_agent_persona': {
          const params = args;
          const phase = params.phase || projectState.state.currentPhase;
          const agent = await bmadBridge.loadAgent(`${phase}`);
          response = {
            content: [
              {
                type: 'text',
                text: agent.content,
              },
            ],
          };
          break;
        }
        case 'transition_phase': {
          const params = args;
          let storyContextValidationResult = null;
          if (params.toPhase === 'dev' && developerLaneConfig.validateStoryContext) {
            await ensureOperationAllowed('run_story_context_validation', {
              checkpoint: STORY_CONTEXT_VALIDATION_CHECKPOINT,
              mode: 'pre_transition',
              lane: developerLaneConfig.validationLane,
            });
            storyContextValidationResult = await ensureStoryContextReadyForDevelopment({
              notes: params.context?.validationNotes,
              trigger: 'phase_transition',
            });
          }
          const transitionResult = await phaseTransitionHooks.handleTransition(
            projectState,
            params.toPhase,
            params.context || {},
            params.userValidated || false,
          );
          if (transitionResult && storyContextValidationResult?.record) {
            transitionResult.storyContextValidation = storyContextValidationResult.record;
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(transitionResult, null, 2),
              },
            ],
          };
          break;
        }
        case 'configure_developer_lane': {
          const params = args;
          await ensureOperationAllowed('configure_developer_lane', params || {});
          if (typeof params.validateStoryContext === 'boolean') {
            developerLaneConfig.validateStoryContext = params.validateStoryContext;
          }
          if (params.validationLane) {
            developerLaneConfig.validationLane = params.validationLane;
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    validateStoryContext: developerLaneConfig.validateStoryContext,
                    validationLane: developerLaneConfig.validationLane,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'run_story_context_validation': {
          const params = args;
          await ensureOperationAllowed('run_story_context_validation', {
            checkpoint: STORY_CONTEXT_VALIDATION_CHECKPOINT,
            lane: developerLaneConfig.validationLane,
            mode: 'manual',
          });
          const result = await runStoryContextValidationHook({
            notes: params.notes,
            trigger: 'manual_tool',
          });
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    checkpoint: result.checkpoint,
                    status: result.status,
                    issues: result.issues,
                    record: result.record,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'generate_deliverable': {
          const params = args;
          await ensureOperationAllowed('generate_deliverable', {
            type: params.type,
          });
          let result;
          switch (params.type) {
            case 'brief':
              result = await deliverableGen.generateBrief(params.context);
              break;
            case 'prd':
              result = await deliverableGen.generatePRD(params.context);
              break;
            case 'architecture':
              result = await deliverableGen.generateArchitecture(params.context);
              break;
            case 'epic':
              result = await deliverableGen.generateEpic(params.context);
              break;
            case 'story':
              result = await deliverableGen.generateStory(params.context);
              break;
            case 'qa_assessment':
              result = await deliverableGen.generateQAAssessment(params.context);
              break;
            default:
              throw new Error(`Unknown deliverable type: ${params.type}`);
          }
          const metadata = {};
          if (result?.path) {
            metadata.path = result.path;
          }
          if (params.type === 'story') {
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
              const structuredStory = result.structured;
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
                type: 'text',
                text: `Deliverable generated: ${result.path}\n\nPreview:\n${result.content.substring(0, 500)}...`,
              },
            ],
          };
          break;
        }
        case 'record_decision': {
          const params = args;
          await projectState.recordDecision(params.key, params.value, params.rationale || '');
          response = {
            content: [
              {
                type: 'text',
                text: `Decision recorded: ${params.key} = ${params.value}`,
              },
            ],
          };
          break;
        }
        case 'add_conversation_message': {
          const params = args;
          await projectState.addMessage(params.role, params.content);
          response = {
            content: [
              {
                type: 'text',
                text: 'Message added to conversation history',
              },
            ],
          };
          break;
        }
        case 'get_project_summary': {
          const summary = projectState.getSummary();
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(summary, null, 2),
              },
            ],
          };
          break;
        }
        case 'list_bmad_agents': {
          const agents = await bmadBridge.listAgents();
          response = {
            content: [
              {
                type: 'text',
                text: `Available BMAD Agents:\n${agents.map((a) => `- ${a}`).join('\n')}`,
              },
            ],
          };
          break;
        }
        case 'execute_bmad_workflow': {
          const params = args;
          const result = await bmadBridge.executePhaseWorkflow(params.phase, params.context || {});
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
          break;
        }
        case 'run_review_checkpoint': {
          const params = args;
          const config = REVIEW_CHECKPOINTS[params.checkpoint];
          if (!config) {
            throw new Error(`Unknown review checkpoint: ${params.checkpoint}`);
          }
          await ensureOperationAllowed('run_review_checkpoint', {
            checkpoint: params.checkpoint,
            phase: config.sourcePhase,
          });
          const lane = config.lane ?? 'review';
          logger.info('review_checkpoint_started', {
            operation: 'run_review_checkpoint',
            checkpoint: params.checkpoint,
            reviewer: config.agent,
            lane,
          });
          const reviewLLM = await createLLMClient(lane);
          const reviewBridge = new BMADBridge({ llmClient: reviewLLM });
          await reviewBridge.initialize();
          const projectSnapshot = projectState.exportForLLM();
          const phaseDeliverables = projectState.getPhaseDeliverables(config.sourcePhase);
          const deliverables =
            config.deliverableKeys && config.deliverableKeys.length > 0
              ? Object.fromEntries(
                  config.deliverableKeys
                    .map((key) => [key, phaseDeliverables?.[key]])
                    .filter(([, value]) => value != null),
                )
              : phaseDeliverables;
          const reviewContext = {
            task: config.instructions,
            checkpoint: params.checkpoint,
            reviewerTitle: config.title,
            project: projectSnapshot,
            phaseDeliverables: deliverables,
            additionalNotes: params.notes ?? '',
          };
          const reviewResult = await reviewBridge.runAgent(config.agent, reviewContext);
          let parsedOutcome = reviewResult?.response;
          if (typeof parsedOutcome === 'string') {
            try {
              parsedOutcome = JSON.parse(parsedOutcome);
            } catch (error) {
              parsedOutcome = {
                status: 'revise',
                summary: 'Reviewer response was not valid JSON.',
                raw: reviewResult?.response,
              };
            }
          }
          if (parsedOutcome == null || typeof parsedOutcome !== 'object') {
            parsedOutcome = {
              status: 'revise',
              summary: 'Reviewer response unavailable.',
              raw: reviewResult?.response,
            };
          }
          if (!parsedOutcome.status) {
            parsedOutcome.status = 'revise';
          }
          const record = await projectState.recordReviewOutcome(params.checkpoint, {
            phase: config.sourcePhase,
            reviewer: config.agent,
            lane,
            status: parsedOutcome.status,
            summary: parsedOutcome.summary ?? parsedOutcome.notes ?? '',
            risks: parsedOutcome.risks ?? [],
            followUp: parsedOutcome.follow_up ?? parsedOutcome.actions ?? [],
            additionalNotes: params.notes ?? undefined,
            outcome: parsedOutcome,
          });
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    checkpoint: params.checkpoint,
                    record,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
          break;
        }
        case 'scan_codebase': {
          const codebase = await brownfieldAnalyzer.scanCodebase();
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(codebase, null, 2),
              },
            ],
          };
          break;
        }
        case 'detect_existing_docs': {
          const docs = await brownfieldAnalyzer.detectExistingDocs();
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(docs, null, 2),
              },
            ],
          };
          break;
        }
        case 'load_previous_state': {
          const previousState = await brownfieldAnalyzer.detectPreviousState();
          if (previousState.exists && previousState.state) {
            await projectState.updateState(previousState.state);
            response = {
              content: [
                {
                  type: 'text',
                  text: `Previous session loaded successfully!\n\nLast Phase: ${previousState.lastPhase}\nLast Updated: ${previousState.lastUpdated}\n\n${JSON.stringify(previousState.state, null, 2)}`,
                },
              ],
            };
            break;
          }
          response = {
            content: [
              {
                type: 'text',
                text: 'No previous BMAD session found. Starting fresh.',
              },
            ],
          };
          break;
        }
        case 'get_codebase_summary': {
          const summary = await brownfieldAnalyzer.generateCodebaseSummary();
          response = {
            content: [
              {
                type: 'text',
                text: summary.summary,
              },
            ],
          };
          break;
        }
        case 'select_development_lane': {
          const params = args;
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };
          const selectionTimer = logger.startTimer();
          const decision = await LaneSelector.selectLaneWithLog(
            params.userMessage,
            context,
            projectState.projectPath,
          );
          const selectionDurationMs = selectionTimer();
          logger.info('lane_selection_completed', {
            operation: 'select_development_lane',
            lane: decision.lane,
            confidence: decision.confidence,
            durationMs: selectionDurationMs,
          });
          logger.recordTiming('mcp.lane.selection.duration_ms', selectionDurationMs, {
            operation: 'select_development_lane',
            lane: decision.lane,
          });
          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userMessage,
          );
          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userMessage,
          });
          outcomeFields.lane = decision.lane;
          outcomeFields.confidence = decision.confidence;
          outcomeFields.trigger = params.userMessage;
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(decision, null, 2),
              },
            ],
          };
          break;
        }
        case 'execute_workflow': {
          const params = args;
          const context = {
            ...params.context,
            previousPhase: projectState.state.currentPhase,
            hasExistingPRD: Object.keys(projectState.deliverables).length > 0,
          };
          const selectionTimer = logger.startTimer();
          const decision = await LaneSelector.selectLaneWithLog(
            params.userRequest,
            context,
            projectState.projectPath,
          );
          const selectionDurationMs = selectionTimer();
          logger.info('lane_selection_completed', {
            operation: 'execute_workflow',
            lane: decision.lane,
            confidence: decision.confidence,
            durationMs: selectionDurationMs,
          });
          logger.recordTiming('mcp.lane.selection.duration_ms', selectionDurationMs, {
            operation: 'execute_workflow',
            lane: decision.lane,
          });
          await projectState.recordLaneDecision(
            decision.lane,
            decision.rationale,
            decision.confidence,
            params.userRequest,
          );
          laneDecisions.push({
            lane: decision.lane,
            rationale: decision.rationale,
            confidence: decision.confidence,
            trigger: params.userRequest,
          });
          let result;
          outcomeFields.lane = decision.lane;
          outcomeFields.confidence = decision.confidence;
          outcomeFields.request = params.userRequest;
          if (decision.lane === 'quick') {
            await ensureOperationAllowed('execute_quick_lane', {
              decision,
              request: params.userRequest,
            });
            logger.info('lane_workflow_started', {
              operation: 'execute_workflow',
              lane: 'quick',
              request: params.userRequest,
            });
            const laneTimer = logger.startTimer();
            result = await quickLane.execute(params.userRequest, context);
            const laneDurationMs = laneTimer();
            logger.info('lane_workflow_completed', {
              operation: 'execute_workflow',
              lane: 'quick',
              confidence: decision.confidence,
              durationMs: laneDurationMs,
            });
            logger.recordTiming('mcp.lane.workflow.duration_ms', laneDurationMs, {
              operation: 'execute_workflow',
              lane: 'quick',
            });
            outcomeFields.workflowDurationMs = laneDurationMs;
            result.lane = 'quick';
            result.decision = decision;
          } else {
            await ensureOperationAllowed('execute_complex_lane', {
              decision,
              request: params.userRequest,
            });
            logger.info('lane_workflow_started', {
              operation: 'execute_workflow',
              lane: 'complex',
              request: params.userRequest,
            });
            const laneTimer = logger.startTimer();
            await bmadBridge.executePhaseWorkflow('analyst', {
              userMessage: params.userRequest,
              ...context,
            });
            await bmadBridge.executePhaseWorkflow('pm', context);
            await bmadBridge.executePhaseWorkflow('architect', context);
            await bmadBridge.executePhaseWorkflow('sm', context);
            result = {
              lane: 'complex',
              decision,
              files: ['docs/prd.md', 'docs/architecture.md', 'docs/stories/*.md'],
              message: 'Complex workflow executed through BMAD agents',
            };
            const laneDurationMs = laneTimer();
            logger.info('lane_workflow_completed', {
              operation: 'execute_workflow',
              lane: 'complex',
              confidence: decision.confidence,
              durationMs: laneDurationMs,
            });
            logger.recordTiming('mcp.lane.workflow.duration_ms', laneDurationMs, {
              operation: 'execute_workflow',
              lane: 'complex',
            });
            outcomeFields.workflowDurationMs = laneDurationMs;
          }
          response = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
          break;
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      const durationMs = stopToolTimer();
      toolLogger.info('tool_completed', { ...outcomeFields, durationMs });
      logger.recordTiming(`mcp.tool.${name}.duration_ms`, durationMs, {
        tool: name,
        operation: name,
        status: 'ok',
      });
      return response;
    } catch (error) {
      const durationMs = stopToolTimer();
      toolLogger.error('tool_failed', {
        ...outcomeFields,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.recordTiming(`mcp.tool.${name}.duration_ms`, durationMs, {
        tool: name,
        operation: name,
        status: 'error',
      });
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });
  await loadDependencies();
  const transport = options.transport ?? new stdio_js_1.StdioServerTransport();
  await server.connect(transport);
  logger.info('server_started', {
    operation: 'startup',
    server: serverName,
    version: serverVersion,
    transport: 'stdio',
    lanesTracked: laneDecisions.length,
  });
  if (options.onServerReady) {
    await options.onServerReady(server);
  }
}
