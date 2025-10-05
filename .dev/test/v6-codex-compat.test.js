const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { executeAutoCommand } = require('../lib/auto-commands.js');
const { aidesignerBridge } = require('../lib/aidesigner-bridge.js');
const { DeliverableGenerator } = require('../lib/deliverable-generator.js');
const { ProjectState } = require('../lib/project-state.js');
const { QuickLane } = require('../lib/quick-lane.js');

class StubLLMClient {
  constructor(responses) {
    this.responses = Array.isArray(responses) ? [...responses] : responses;
  }

  async chat() {
    if (Array.isArray(this.responses)) {
      return this.responses.shift() ?? 'stub-response';
    }

    if (typeof this.responses === 'function') {
      return this.responses(...arguments);
    }

    return this.responses ?? 'stub-response';
  }
}

describe('Codex CLI V6 sandbox compatibility', () => {
  const tempDirs = [];

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      await fs.remove(dir);
    }
  });

  test('Codex config manager writes GPT-5 auto-approval defaults', async () => {
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-home-'));
    tempDirs.push(tempHome);

    const originalHome = process.env.HOME;
    process.env.HOME = tempHome;

    const modulePath = require.resolve('../lib/codex/config-manager.js');
    delete require.cache[modulePath];

    const { ensureCodexConfig } = require('../lib/codex/config-manager.js');

    try {
      const result = await ensureCodexConfig({ nonInteractive: false });
      const toml = await fs.readFile(result.configPath, 'utf8');

      expect(toml).toContain('default_model = "GPT-5-Codex"');
      expect(toml).toContain('require_manual_approval = false');
      expect(toml).toContain('auto_approve_tools = true');
      expect(toml).toContain('auto_approve = true');
    } finally {
      process.env.HOME = originalHome;
    }
  });

  test('Quick lane produces docs with stubbed LLM responses', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-quick-'));
    tempDirs.push(tempDir);

    const stubLLM = new StubLLMClient([
      '# Spec Document\n\nDetails about the requested feature.',
      '# Implementation Plan\n\nStep-by-step plan.',
      '### Task 1: Setup\nDo the setup.\n### Task 2: Build\nImplement the core logic.',
    ]);

    const quickLane = new QuickLane(tempDir, { llmClient: stubLLM });
    await quickLane.initialize();
    const result = await quickLane.execute('Create a sample feature', {
      lane: 'quick',
    });

    expect(result.files).toEqual(
      expect.arrayContaining(['docs/prd.md', 'docs/architecture.md', 'docs/stories/story-1.md']),
    );

    const spec = await fs.readFile(path.join(tempDir, 'docs/prd.md'), 'utf8');
    expect(spec).toContain('Spec Document');

    const plan = await fs.readFile(path.join(tempDir, 'docs/architecture.md'), 'utf8');
    expect(plan).toContain('Implementation Plan');

    const story = await fs.readFile(path.join(tempDir, 'docs/stories/story-1.md'), 'utf8');
    expect(story).toContain('Do the setup.');
  });

  test('Complex lane auto command and deliverable storage remain consistent', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-complex-'));
    tempDirs.push(tempDir);

    const stubLLM = new StubLLMClient('Mock agent output for planning');
    const bridge = new aidesignerBridge({ llmClient: stubLLM });
    await bridge.initialize();

    const autoResult = await executeAutoCommand(
      'auto-plan',
      { task: 'Plan the V6 sandbox integration' },
      bridge,
    );

    expect(autoResult.response).toBe('Mock agent output for planning');

    const projectState = new ProjectState(tempDir);
    await projectState.initialize();
    await projectState.transitionPhase('pm');
    await projectState.storeDeliverable('plan', autoResult.response, {
      summary: 'Mock summary',
    });

    const stored = projectState.getDeliverable('pm', 'plan');
    expect(stored.content).toBe('Mock agent output for planning');

    const generator = new DeliverableGenerator(tempDir, { aidesignerBridge: bridge });
    await generator.initialize();

    const prd = await generator.generatePRD({
      problemStatement: 'We need to document the sandbox rollout.',
      targetUsers: 'Internal platform team',
      goals: 'Enable Codex CLI parity in V6 sandbox',
      successCriteria: 'Commands and deliverables match V5 behavior',
    });

    expect(await fs.pathExists(prd.path)).toBe(true);
  });
});
