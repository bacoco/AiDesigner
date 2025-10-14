const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

function loadCodexTestHarness() {
  const filePath = path.join(__dirname, '..', '..', 'dist', 'codex', 'codex-server.js');
  let source = fs.readFileSync(filePath, 'utf8');

  source = source.replace(
    'async function main() {',
    'globalThis.__CODEX_TEST_HOOKS = { CodexClient, ModelRouter, normalizeOperation };\nasync function main() {',
  );

  source = source.replace(
    'main().catch((error) => {',
    'if (process.env.__CODEX_TEST__ !== "1") main().catch((error) => {',
  );

  const moduleRequire = createRequire(filePath);
  const sandboxProcess = {
    ...process,
    env: { ...process.env, __CODEX_TEST__: '1' },
    exit: () => {},
  };

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: moduleRequire,
    process: sandboxProcess,
    console,
    __dirname: path.dirname(filePath),
    __filename: filePath,
  };

  vm.runInNewContext(source, sandbox, { filename: filePath });
  const hooks = sandbox.__CODEX_TEST_HOOKS;
  if (!hooks) {
    throw new Error('Failed to load Codex test hooks');
  }

  return { ...hooks, process: sandboxProcess };
}

describe('CodexClient approval guardrails', () => {
  let harness;

  beforeEach(() => {
    harness = loadCodexTestHarness();
  });

  it('allows operations freely when approval mode is disabled', async () => {
    harness.process.env = {};
    const client = harness.CodexClient.fromEnvironment();

    await expect(client.ensureOperationAllowed('generate_deliverable')).resolves.toBeUndefined();
    await expect(
      client.ensureOperationAllowed('execute_quick_lane', { decision: { lane: 'quick' } }),
    ).resolves.toBeUndefined();
  });

  it('blocks operations when approval mode is enabled without matching approvals', async () => {
    harness.process.env = {
      CODEX_APPROVAL_MODE: 'true',
      CODEX_AUTO_APPROVE: 'false',
      CODEX_APPROVED_OPERATIONS: 'generate_deliverable, execute_complex_lane@complex',
    };

    const client = harness.CodexClient.fromEnvironment();

    await expect(
      client.ensureOperationAllowed('Execute_Complex_Lane', {
        decision: { lane: 'complex' },
      }),
    ).resolves.toBeUndefined();

    await expect(client.ensureOperationAllowed('Execute_Quick_Lane')).rejects.toThrow(
      'Operation "Execute_Quick_Lane" blocked by Codex approval mode.',
    );
  });

  it('normalizes metadata overrides for approval matching', async () => {
    harness.process.env = {
      CODEX_APPROVAL_MODE: '1',
      CODEX_AUTO_APPROVE: '0',
      CODEX_APPROVED_OPERATIONS:
        ' generate_deliverable:Story ; execute_quick_lane@FAST , run_review_checkpoint:final ',
    };

    const client = harness.CodexClient.fromEnvironment();

    await expect(
      client.ensureOperationAllowed('Generate_Deliverable', { type: 'story' }),
    ).resolves.toBeUndefined();

    await expect(
      client.ensureOperationAllowed('execute_quick_lane', { decision: { lane: 'fast' } }),
    ).resolves.toBeUndefined();

    await expect(
      client.ensureOperationAllowed('run_review_checkpoint', { type: 'FINAL' }),
    ).resolves.toBeUndefined();

    await expect(
      client.ensureOperationAllowed('run_review_checkpoint', { type: 'initial' }),
    ).rejects.toThrow('Operation "run_review_checkpoint" blocked by Codex approval mode.');

    const normalized = harness.normalizeOperation('Generate_Deliverable', {
      type: 'Story',
      decision: { lane: 'Quick' },
    });

    expect(normalized).toEqual(
      expect.arrayContaining([
        'generate_deliverable',
        'generate_deliverable:story',
        'generate_deliverable@quick',
      ]),
    );
  });

  it('bypasses approvals when auto-approve is enabled', async () => {
    harness.process.env = {
      CODEX_APPROVAL_MODE: 'yes',
      CODEX_AUTO_APPROVE: 'true',
    };

    const client = harness.CodexClient.fromEnvironment();

    await expect(
      client.ensureOperationAllowed('delete_repository', { scope: 'all' }),
    ).resolves.toBeUndefined();
  });
});
