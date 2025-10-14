const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');

const laneDecisionsQueue = [];

const stopTimerStub = () => 0;

function summarizeScaleSignals(scale = {}) {
  const contributions = Array.isArray(scale.signals?.contributions)
    ? scale.signals.contributions
    : [];
  const deductions = Array.isArray(scale.signals?.deductions) ? scale.signals.deductions : [];
  const parts = [];

  if (contributions.length > 0) {
    parts.push(`Positive signals: ${contributions.map((entry) => entry.description).join(', ')}.`);
  }

  if (deductions.length > 0) {
    parts.push(`Negative signals: ${deductions.map((entry) => entry.description).join(', ')}.`);
  }

  if (parts.length === 0) {
    parts.push('Scale assessment derived without detailed signal breakdown.');
  }

  parts.push(`Result: level ${scale.level ?? 'unknown'} (score ${scale.score ?? 'n/a'}).`);
  return parts.join(' ');
}

jest.mock('../../dist/codex/lib-resolver.js', () => {
  const actual = jest.requireActual('../../dist/codex/lib-resolver.js');

  return {
    ...actual,
    importLibModule: async (moduleName) => actual.requireLibModule(moduleName),
    importFromPackageRoot: async (...segments) => {
      const modulePath = actual.resolveFromPackageRoot(...segments);
      return require(modulePath);
    },
  };
});

jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  const instances = [];

  class FakeServer {
    constructor(info, options) {
      this.info = info;
      this.options = options;
      this.handlers = new Map();
    }

    setRequestHandler(schema, handler) {
      this.handlers.set(schema, handler);
    }

    async connect(transport) {
      this.transport = transport;
      if (transport?.start) {
        await transport.start();
      }
    }
  }

  const Server = jest.fn().mockImplementation((info, options) => {
    const instance = new FakeServer(info, options);
    instances.push(instance);
    return instance;
  });

  return { Server, __instances: instances };
});

jest.mock('../lib/lane-selector.js', () => {
  const selectLaneWithLog = jest.fn(async () => {
    const baseDecision =
      laneDecisionsQueue.length > 0
        ? laneDecisionsQueue.shift()
        : {
            lane: 'quick',
            rationale: 'default',
            confidence: 0.75,
            scale: { level: 1, score: 2, signals: {} },
          };

    const decision = { ...baseDecision };

    if (decision.scale && decision.level === undefined) {
      decision.level = decision.scale.level;
    }

    if (decision.scale && !decision.levelRationale) {
      decision.levelRationale = summarizeScaleSignals(decision.scale);
    }

    return decision;
  });

  return { selectLaneWithLog, __laneDecisionsQueue: laneDecisionsQueue };
});

const mockQuickLaneExecute = jest.fn();
const mockQuickLaneInitialize = jest.fn();

jest.mock('../lib/quick-lane.js', () => {
  const QuickLane = jest.fn().mockImplementation(() => ({
    initialize: mockQuickLaneInitialize,
    execute: mockQuickLaneExecute,
  }));

  return {
    QuickLane,
    __quickLaneMocks: { execute: mockQuickLaneExecute, initialize: mockQuickLaneInitialize },
  };
});

const mockBridgeInitialize = jest.fn();
const mockRunAgent = jest.fn();
const mockExecutePhaseWorkflow = jest.fn();
const mockLoadAgent = jest.fn();
const mockListAgents = jest.fn();
const mockGetEnvironmentInfo = jest.fn();

jest.mock('../lib/aidesigner-bridge.js', () => {
  const AidesignerBridge = jest.fn().mockImplementation(() => ({
    initialize: mockBridgeInitialize,
    getEnvironmentInfo: mockGetEnvironmentInfo,
    runAgent: mockRunAgent,
    executePhaseWorkflow: mockExecutePhaseWorkflow,
    loadAgent: mockLoadAgent,
    listAgents: mockListAgents,
  }));

  return {
    AidesignerBridge,
    __bridgeMocks: {
      initializeMock: mockBridgeInitialize,
      runAgentMock: mockRunAgent,
      executePhaseWorkflowMock: mockExecutePhaseWorkflow,
      loadAgentMock: mockLoadAgent,
      listAgentsMock: mockListAgents,
      getEnvironmentInfoMock: mockGetEnvironmentInfo,
    },
  };
});

const mockGeneratorInitialize = jest.fn();
const mockGenerateBrief = jest.fn();
const mockGeneratePRD = jest.fn();
const mockGenerateArchitecture = jest.fn();
const mockGenerateEpic = jest.fn();
const mockGenerateStory = jest.fn();
const mockGenerateQA = jest.fn();

jest.mock('../lib/deliverable-generator.js', () => {
  const DeliverableGenerator = jest.fn().mockImplementation(() => ({
    initialize: mockGeneratorInitialize,
    generateBrief: mockGenerateBrief,
    generatePRD: mockGeneratePRD,
    generateArchitecture: mockGenerateArchitecture,
    generateEpic: mockGenerateEpic,
    generateStory: mockGenerateStory,
    generateQAAssessment: mockGenerateQA,
  }));

  return {
    DeliverableGenerator,
    __generatorMocks: {
      initialize: mockGeneratorInitialize,
      generateBrief: mockGenerateBrief,
      generatePRD: mockGeneratePRD,
      generateArchitecture: mockGenerateArchitecture,
      generateEpic: mockGenerateEpic,
      generateStory: mockGenerateStory,
      generateQAAssessment: mockGenerateQA,
    },
  };
});

const mockScanCodebase = jest.fn();
const mockDetectDocs = jest.fn();
const mockDetectState = jest.fn();
const mockSummarizeCodebase = jest.fn();

jest.mock('../lib/brownfield-analyzer.js', () => {
  const BrownfieldAnalyzer = jest.fn().mockImplementation(() => ({
    scanCodebase: mockScanCodebase,
    detectExistingDocs: mockDetectDocs,
    detectPreviousState: mockDetectState,
    generateCodebaseSummary: mockSummarizeCodebase,
  }));

  return {
    BrownfieldAnalyzer,
    __brownfieldMocks: {
      scanCodebase: mockScanCodebase,
      detectExistingDocs: mockDetectDocs,
      detectPreviousState: mockDetectState,
      generateCodebaseSummary: mockSummarizeCodebase,
    },
  };
});

const mockExecuteAutoCommand = jest.fn();

jest.mock('../lib/auto-commands.js', () => ({
  executeAutoCommand: mockExecuteAutoCommand,
}));

let mockLastProjectStateInstance;

jest.mock('../lib/project-state.js', () => {
  const ProjectState = jest.fn().mockImplementation((projectPath) => {
    const deliverables = {};
    const instance = {
      projectPath,
      state: {
        currentPhase: 'analyst',
        decisions: {},
        requirements: {},
        phaseHistory: [],
      },
      deliverables,
      conversation: [],
      initialize: jest.fn().mockResolvedValue(),
      getState: jest.fn(() => ({ ...instance.state })),
      updateState: jest.fn().mockResolvedValue(),
      storeDeliverable: jest.fn(async (type, content, metadata = {}) => {
        deliverables[type] = { content, metadata };
      }),
      getPhaseDeliverables: jest.fn().mockResolvedValue([]),
      getDeliverable: jest.fn((type) => deliverables[type]),
      getDeliverablesByType: jest.fn((type) => (deliverables[type] ? [deliverables[type]] : [])),
      recordLaneDecision: jest.fn(
        async (lane, rationale, confidence, userMessage, options = {}) => {
          instance.state.currentLane = lane;
          instance.state.laneHistory = instance.state.laneHistory || [];
          const { level, levelScore, levelSignals, levelRationale } = options || {};
          const record = { lane, rationale, confidence, userMessage };
          if (level !== undefined) {
            record.level = level;
          }
          if (levelScore !== undefined) {
            record.levelScore = levelScore;
          }
          if (levelSignals !== undefined) {
            record.levelSignals = levelSignals;
          }
          if (levelRationale !== undefined) {
            record.levelRationale = levelRationale;
          }
          instance.state.laneHistory.push(record);
        },
      ),
      recordDecision: jest.fn().mockResolvedValue(),
      addMessage: jest.fn().mockResolvedValue(),
      getConversation: jest.fn(() => []),
      getSummary: jest.fn(() => ({ status: 'ok' })),
      setDeveloperContext: jest.fn(),
      trackDeveloperContext: jest.fn(),
    };

    mockLastProjectStateInstance = instance;
    return instance;
  });

  return { ProjectState, __getLastInstance: () => mockLastProjectStateInstance };
});

const boundDepsHolder = { current: null };
const mockBindDependencies = jest.fn((deps) => {
  boundDepsHolder.current = deps;
});
const mockCheckTransition = jest.fn();
const mockHandleTransition = jest.fn();

jest.mock('../hooks/phase-transition.js', () => ({
  bindDependencies: mockBindDependencies,
  checkTransition: mockCheckTransition,
  handleTransition: mockHandleTransition,
  __getBoundDeps: () => boundDepsHolder.current,
  __resetBoundDeps: () => {
    boundDepsHolder.current = null;
  },
}));

const mockPreserveContext = jest.fn();

jest.mock('../hooks/context-preservation.js', () => ({
  preserveContext: mockPreserveContext,
}));

const mockRunStoryContextValidation = jest.fn();
const mockEnsureStoryContextReady = jest.fn();

jest.mock('../lib/story-context-validator.js', () => {
  const api = {
    runStoryContextValidation: mockRunStoryContextValidation,
    ensureStoryContextReadyForDevelopment: mockEnsureStoryContextReady,
  };

  return { ...api, default: api };
});

const { __instances: serverInstances } = require('@modelcontextprotocol/sdk/server/index.js');
const laneSelector = require('../lib/lane-selector.js');
const quickLaneModule = require('../lib/quick-lane.js');
const bridgeModule = require('../lib/aidesigner-bridge.js');
const deliverableGeneratorModule = require('../lib/deliverable-generator.js');
const projectStateModule = require('../lib/project-state.js');
const phaseTransitionModule = require('../hooks/phase-transition.js');
function loadRuntimeForTests() {
  const filePath = path.resolve(__dirname, '../../dist/codex/runtime.js');
  let source = fs.readFileSync(filePath, 'utf8');
  source = source.replace(
    '"use strict";',
    '"use strict";\nconst dynamicRequire = (specifier) => Promise.resolve(require(specifier));',
  );
  source = source.replaceAll('await import(', 'await dynamicRequire(');
  const moduleRequire = createRequire(pathToFileURL(filePath));
  const moduleExports = {};
  const sandbox = {
    module: { exports: moduleExports },
    exports: moduleExports,
    require: moduleRequire,
    process,
    console,
    __dirname: path.dirname(filePath),
    __filename: filePath,
  };
  vm.runInNewContext(source, sandbox, { filename: filePath });
  return sandbox.module.exports;
}

const { runOrchestratorServer } = loadRuntimeForTests();

const { CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

function createMockLogger() {
  const childLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    recordTiming: jest.fn(),
    startTimer: jest.fn(() => stopTimerStub),
    child: jest.fn(() => childLogger),
  };
}

async function setupServer(options = {}) {
  const transport = options.transport ?? { start: jest.fn().mockResolvedValue() };
  const ensureOperationAllowed = options.ensureOperationAllowed ?? jest.fn().mockResolvedValue();
  const createLLMClient = options.createLLMClient ?? jest.fn().mockResolvedValue({});

  await runOrchestratorServer({
    transport,
    ensureOperationAllowed,
    createLLMClient,
    log: options.log ?? jest.fn(),
    logger: options.logger,
  });

  const server = serverInstances.at(-1);
  return { server, transport, ensureOperationAllowed, createLLMClient };
}

describe('runOrchestratorServer integration flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    laneSelector.__laneDecisionsQueue.length = 0;
    serverInstances.length = 0;
    phaseTransitionModule.__resetBoundDeps();

    quickLaneModule.__quickLaneMocks.initialize.mockResolvedValue();
    quickLaneModule.__quickLaneMocks.execute.mockImplementation(async () => ({
      message: 'quick-complete',
      files: ['docs/prd.md'],
    }));

    bridgeModule.__bridgeMocks.initializeMock.mockResolvedValue();
    bridgeModule.__bridgeMocks.getEnvironmentInfoMock.mockReturnValue({
      mode: 'v6-modules',
      root: '/tmp/project',
      catalog: { moduleCount: 2 },
    });
    bridgeModule.__bridgeMocks.executePhaseWorkflowMock.mockImplementation(async () => ({
      ok: true,
    }));
    bridgeModule.__bridgeMocks.runAgentMock.mockResolvedValue({
      response: JSON.stringify({ ok: true }),
    });
    bridgeModule.__bridgeMocks.loadAgentMock.mockResolvedValue({ content: 'Agent persona' });
    bridgeModule.__bridgeMocks.listAgentsMock.mockResolvedValue(['analyst', 'pm']);

    deliverableGeneratorModule.__generatorMocks.initialize.mockResolvedValue();
    deliverableGeneratorModule.__generatorMocks.generateBrief.mockResolvedValue({
      path: 'docs/brief.md',
      content: '# brief',
    });
    deliverableGeneratorModule.__generatorMocks.generatePRD.mockResolvedValue({
      path: 'docs/prd.md',
      content: '# prd',
    });
    deliverableGeneratorModule.__generatorMocks.generateArchitecture.mockResolvedValue({
      path: 'docs/architecture.md',
      content: '# architecture',
    });
    deliverableGeneratorModule.__generatorMocks.generateEpic.mockResolvedValue({
      path: 'docs/epic.md',
      content: '# epic',
    });
    deliverableGeneratorModule.__generatorMocks.generateStory.mockResolvedValue({
      path: 'docs/story.md',
      content: '# story',
    });
    deliverableGeneratorModule.__generatorMocks.generateQAAssessment.mockResolvedValue({
      path: 'docs/qa.md',
      content: '# qa',
    });

    phaseTransitionModule.bindDependencies.mockClear();
    phaseTransitionModule.checkTransition.mockResolvedValue(null);
    phaseTransitionModule.handleTransition.mockImplementation(async (projectState, toPhase) => ({
      transitionedTo: toPhase,
    }));

    mockPreserveContext.mockImplementation(async (fromPhase, toPhase, context) => context);
    mockRunStoryContextValidation.mockResolvedValue({
      checkpoint: 'chk-123',
      status: 'ok',
      issues: [],
      record: { status: 'ok' },
    });
    mockEnsureStoryContextReady.mockResolvedValue({
      record: { status: 'ready' },
    });

    mockExecuteAutoCommand.mockResolvedValue({ status: 'ok' });
  });

  it('executes the quick lane workflow and honors approval gating', async () => {
    laneSelector.__laneDecisionsQueue.push({
      lane: 'quick',
      rationale: 'fast path',
      confidence: 0.82,
      scale: {
        level: 2,
        score: 6,
        signals: {
          contributions: [{ description: 'Quick keyword', value: 2 }],
          deductions: [],
          keywordMatches: { level2: ['quick'] },
        },
      },
    });

    const ensureOperationAllowed = jest.fn().mockResolvedValue();
    const createLLMClient = jest.fn().mockResolvedValue({ client: true });
    const logger = createMockLogger();
    const { server } = await setupServer({ ensureOperationAllowed, createLLMClient, logger });

    const callTool = server.handlers.get(CallToolRequestSchema);
    expect(typeof callTool).toBe('function');

    quickLaneModule.__quickLaneMocks.execute.mockResolvedValueOnce({
      message: 'Quick lane done',
      files: [
        'docs/prd.md',
        'docs/architecture.md',
        'docs/stories/story-1.md',
        'docs/ui/nano-banana-brief.md',
      ],
    });

    const response = await callTool({
      params: {
        name: 'execute_workflow',
        arguments: { userRequest: 'Ship login', context: {} },
      },
    });

    const payload = JSON.parse(response.content[0].text);
    expect(payload.lane).toBe('quick');
    expect(payload.decision.lane).toBe('quick');
    expect(payload.decision.scale).toEqual(
      expect.objectContaining({ level: 2, score: 6, signals: expect.any(Object) }),
    );
    expect(payload.decision.level).toBe(2);
    expect(payload.decision.levelRationale).toContain('Result: level 2');
    expect(quickLaneModule.__quickLaneMocks.execute).toHaveBeenCalledWith(
      'Ship login',
      expect.objectContaining({ previousPhase: 'analyst' }),
    );
    expect(ensureOperationAllowed).toHaveBeenCalledWith(
      'execute_quick_lane',
      expect.objectContaining({
        decision: expect.objectContaining({ lane: 'quick' }),
        request: 'Ship login',
      }),
    );
    expect(createLLMClient).toHaveBeenCalledWith('quick');

    const projectState = projectStateModule.__getLastInstance();
    expect(projectState.state.laneHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lane: 'quick',
          level: 2,
          levelScore: 6,
          levelSignals: expect.any(Object),
          levelRationale: expect.stringContaining('Result: level 2'),
          userMessage: 'Ship login',
        }),
      ]),
    );

    const laneSelectionLog = logger.info.mock.calls.find(
      ([event]) => event === 'lane_selection_completed',
    );
    expect(laneSelectionLog?.[1]).toEqual(
      expect.objectContaining({
        lane: 'quick',
        level: 2,
        levelScore: 6,
        levelSignals: expect.any(Object),
        levelRationale: expect.stringContaining('Result: level 2'),
      }),
    );
  });

  it('falls back to the complex lane when quick lane setup fails', async () => {
    laneSelector.__laneDecisionsQueue.push({
      lane: 'quick',
      rationale: 'fallback scenario',
      confidence: 0.6,
    });

    const quickError = new Error('quick lane unavailable');
    const createLLMClient = jest.fn().mockImplementation(async (lane) => {
      if (lane === 'quick') {
        throw quickError;
      }

      return { lane };
    });

    const ensureOperationAllowed = jest.fn().mockResolvedValue();
    const logger = createMockLogger();

    const { server } = await setupServer({
      createLLMClient,
      ensureOperationAllowed,
      logger,
    });

    const callTool = server.handlers.get(CallToolRequestSchema);

    const response = await callTool({
      params: {
        name: 'execute_workflow',
        arguments: { userRequest: 'Fix landing page typo', context: {} },
      },
    });

    expect(response.isError).not.toBe(true);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.lane).toBe('complex');
    expect(payload.quickLane).toEqual(
      expect.objectContaining({
        available: false,
        reason: expect.stringContaining('quick lane unavailable'),
      }),
    );
    expect(quickLaneModule.__quickLaneMocks.initialize).not.toHaveBeenCalled();
    expect(quickLaneModule.__quickLaneMocks.execute).not.toHaveBeenCalled();
    expect(ensureOperationAllowed).toHaveBeenCalledWith(
      'execute_complex_lane',
      expect.objectContaining({ request: 'Fix landing page typo' }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'quick_lane_disabled',
      expect.objectContaining({ reason: expect.stringContaining('quick lane unavailable') }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'quick_lane_execution_skipped',
      expect.objectContaining({ fallbackLane: 'complex' }),
    );
  });

  it('executes the complex lane workflow, saving deliverables with approval hooks', async () => {
    laneSelector.__laneDecisionsQueue.push({
      lane: 'complex',
      rationale: 'deep dive',
      confidence: 0.91,
    });

    const ensureOperationAllowed = jest.fn().mockResolvedValue();

    bridgeModule.__bridgeMocks.executePhaseWorkflowMock.mockImplementation(
      async (phase, context) => {
        const deps = phaseTransitionModule.__getBoundDeps();
        if (phase === 'sm' && deps?.saveDeliverable) {
          await deps.saveDeliverable('architecture', '# plan');
        }

        return { phase, context };
      },
    );

    const { server } = await setupServer({ ensureOperationAllowed });

    const callTool = server.handlers.get(CallToolRequestSchema);

    const response = await callTool({
      params: {
        name: 'execute_workflow',
        arguments: { userRequest: 'Build analytics suite', context: {} },
      },
    });

    const payload = JSON.parse(response.content[0].text);
    expect(payload.lane).toBe('complex');
    expect(bridgeModule.__bridgeMocks.executePhaseWorkflowMock).toHaveBeenCalledTimes(4);
    expect(bridgeModule.__bridgeMocks.executePhaseWorkflowMock).toHaveBeenNthCalledWith(
      1,
      'analyst',
      expect.objectContaining({ userMessage: 'Build analytics suite' }),
    );
    expect(ensureOperationAllowed).toHaveBeenCalledWith(
      'execute_complex_lane',
      expect.objectContaining({ decision: expect.objectContaining({ lane: 'complex' }) }),
    );

    const projectState = projectStateModule.__getLastInstance();
    expect(projectState.storeDeliverable).toHaveBeenCalledWith('architecture', '# plan');

    expect(ensureOperationAllowed).toHaveBeenCalledWith(
      'save_deliverable',
      expect.objectContaining({ type: 'architecture' }),
    );
  });

  it('propagates malformed agent responses as tool errors', async () => {
    const ensureOperationAllowed = jest.fn().mockResolvedValue();
    bridgeModule.__bridgeMocks.runAgentMock.mockResolvedValue({ response: 'not-json' });

    phaseTransitionModule.handleTransition.mockImplementation(
      async (projectState, toPhase, context = {}) => {
        const deps = phaseTransitionModule.__getBoundDeps();
        const agentResult = await deps.triggerAgent(
          context.agentId ?? 'qa',
          context.agentContext ?? {},
        );
        if (agentResult?.error) {
          throw new Error(`Agent failure: ${agentResult.error}`);
        }
        return agentResult;
      },
    );

    const { server } = await setupServer({ ensureOperationAllowed });

    const callTool = server.handlers.get(CallToolRequestSchema);
    const response = await callTool({
      params: {
        name: 'transition_phase',
        arguments: { toPhase: 'dev', context: { agentId: 'qa' }, validated: true },
      },
    });

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('Failed to parse response from agent qa');
  });
});
