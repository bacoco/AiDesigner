const {
  STORY_CONTEXT_VALIDATION_CHECKPOINT,
  runStoryContextValidation,
  ensureStoryContextReadyForDevelopment,
} = require('../lib/story-context-validator');

function createProjectState(overrides = {}) {
  const records = [];
  const base = {
    projectPath: '/tmp/project',
    state: {
      requirements: { foo: 'bar' },
      decisions: { stack: 'node' },
    },
    getDeliverable: jest.fn((phase, type) => {
      if (phase === 'sm' && type === 'story') {
        return {
          content: {
            title: 'Sample Story',
            acceptanceCriteria: ['passes validation'],
            definitionOfDone: ['tests updated'],
          },
        };
      }
      return null;
    }),
    getPhaseDeliverables: jest.fn(() => ({ story: { content: 'Story content' } })),
    async recordReviewOutcome(checkpoint, details) {
      const record = { checkpoint, ...details, timestamp: '2024-01-01T00:00:00Z' };
      records.push(record);
      return record;
    },
    records,
  };

  return Object.assign(base, overrides);
}

function createBridgeClass(enrichment) {
  const instances = [];

  return class FakeBridge {
    constructor() {
      instances.push(this);
      this.llmClient = null;
    }

    async initialize() {
      this.initialized = true;
    }

    async loadAgent(agentId) {
      this.loadedAgentId = agentId;
      return { id: agentId };
    }

    async applyContextEnrichers(agent, context) {
      this.lastAgent = agent;
      this.lastContext = context;
      return typeof enrichment === 'function' ? enrichment(agent, context) : enrichment;
    }

    static getInstances() {
      return instances;
    }
  };
}

describe('story context validation helper', () => {
  it('approves when persona fragments and sections are present', async () => {
    const projectState = createProjectState();
    const enrichment = {
      context: { story: { title: 'Sample Story' } },
      personaFragments: ['Senior Frontend Engineer persona'],
      contextSections: [
        { title: 'Acceptance Criteria', body: '- passes validation' },
        { title: 'Definition of Done', body: '- tests updated' },
      ],
    };

    const FakeBridge = createBridgeClass(enrichment);

    const result = await runStoryContextValidation({
      projectState,
      createLLMClient: async () => ({ lane: 'review' }),
      AidesignerBridge: FakeBridge,
      notes: 'smoke test',
      trigger: 'unit_test',
    });

    expect(result.status).toBe('approve');
    expect(result.checkpoint).toBe(STORY_CONTEXT_VALIDATION_CHECKPOINT);
    expect(projectState.records).toHaveLength(1);
    expect(projectState.records[0].status).toBe('approve');

    const [instance] = FakeBridge.getInstances();
    expect(instance.initialized).toBe(true);
    expect(instance.loadedAgentId).toBe('dev');
    expect(instance.lastContext.story).toBeDefined();
  });

  it('blocks when acceptance criteria are missing', async () => {
    const projectState = createProjectState({
      getDeliverable: jest.fn(() => ({ content: { title: 'Story Without AC' } })),
    });
    const enrichment = {
      context: { story: { title: 'Story Without AC' } },
      personaFragments: [],
      contextSections: [{ title: 'Definition of Done', body: '- tests updated' }],
    };
    const FakeBridge = createBridgeClass(enrichment);

    const result = await runStoryContextValidation({
      projectState,
      createLLMClient: async () => ({ lane: 'review' }),
      AidesignerBridge: FakeBridge,
    });

    expect(result.status).toBe('block');
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Acceptance Criteria section missing from enriched context.',
        'No persona fragments generated for developer lane.',
      ]),
    );
    expect(projectState.records[0].status).toBe('block');
  });

  it('throws when ensureStoryContextReadyForDevelopment encounters block status', async () => {
    const projectState = createProjectState({
      getDeliverable: jest.fn(() => null),
    });
    const enrichment = {
      context: {},
      personaFragments: [],
      contextSections: [],
    };
    const FakeBridge = createBridgeClass(enrichment);

    await expect(
      ensureStoryContextReadyForDevelopment({
        projectState,
        createLLMClient: async () => ({ lane: 'review' }),
        AidesignerBridge: FakeBridge,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Story context validation failed'),
      validation: expect.objectContaining({ status: 'block' }),
    });
  });
});
