const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const repoRoot = path.join(__dirname, '..');

function ensureBuildArtifacts() {
  const artifactPath = path.join(repoRoot, 'dist', 'codex', 'codex-server.js');
  if (!fs.existsSync(artifactPath)) {
    execSync('npm run build:mcp', { cwd: repoRoot, stdio: 'inherit' });
  }
}

ensureBuildArtifacts();

const { CodexClient } = require(path.join(repoRoot, 'dist', 'codex', 'codex-server.js'));
const { OperationPolicyEnforcer } = require(
  path.join(repoRoot, 'dist', 'codex', 'operation-policy.js'),
);

const routerStub = {
  resolve() {
    return { provider: 'stub', model: 'stub' };
  },
  describe() {
    return 'stub-route';
  },
};

describe('Codex operation policy enforcement', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows compliant usage within per-hour limits', async () => {
    const enforcer = new OperationPolicyEnforcer({
      operations: {
        deploy_release: { maxExecutionsPerHour: 2 },
      },
    });

    const client = new CodexClient(routerStub, false, false, new Set(), enforcer);

    await expect(client.ensureOperationAllowed('deploy_release')).resolves.toBeUndefined();
    await expect(client.ensureOperationAllowed('deploy_release')).resolves.toBeUndefined();
  });

  test('blocks operations that exceed their quota with descriptive errors', async () => {
    const enforcer = new OperationPolicyEnforcer({
      operations: {
        deploy_release: { maxExecutionsPerHour: 2 },
      },
    });

    const client = new CodexClient(routerStub, false, false, new Set(), enforcer);

    await client.ensureOperationAllowed('deploy_release');
    await client.ensureOperationAllowed('deploy_release');

    await expect(client.ensureOperationAllowed('deploy_release')).rejects.toThrow(
      /limit of 2 executions per hour exceeded/i,
    );
  });

  test('enforces escalation requirements until approval is granted', async () => {
    const approvals = new Set();
    const enforcer = new OperationPolicyEnforcer({
      operations: {
        run_review_checkpoint: { escalate: true },
      },
    });

    const client = new CodexClient(routerStub, false, false, approvals, enforcer);

    await expect(client.ensureOperationAllowed('run_review_checkpoint')).rejects.toThrow(
      /requires escalation/i,
    );

    approvals.add('run_review_checkpoint');
    await expect(client.ensureOperationAllowed('run_review_checkpoint')).resolves.toBeUndefined();
  });

  test('loads policies from environment-specified YAML files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-policy-'));
    const policyPath = path.join(tempDir, 'policy.yaml');

    await fs.writeFile(
      policyPath,
      ['operations:', '  execute_auto_command:', '    maxExecutionsPerHour: 1'].join('\n'),
    );

    const originalEnv = {
      CODEX_POLICY_PATH: process.env.CODEX_POLICY_PATH,
      CODEX_POLICY_FILE: process.env.CODEX_POLICY_FILE,
      CODEX_APPROVAL_MODE: process.env.CODEX_APPROVAL_MODE,
      CODEX_AUTO_APPROVE: process.env.CODEX_AUTO_APPROVE,
      CODEX_APPROVED_OPERATIONS: process.env.CODEX_APPROVED_OPERATIONS,
    };

    process.env.CODEX_POLICY_PATH = policyPath;
    process.env.CODEX_POLICY_FILE = '';
    process.env.CODEX_APPROVAL_MODE = 'false';
    process.env.CODEX_AUTO_APPROVE = 'false';
    process.env.CODEX_APPROVED_OPERATIONS = '';

    try {
      const client = CodexClient.fromEnvironment();

      await client.ensureOperationAllowed('execute_auto_command');
      await expect(client.ensureOperationAllowed('execute_auto_command')).rejects.toThrow(
        /limit of 1 executions per hour exceeded/i,
      );
    } finally {
      process.env.CODEX_POLICY_PATH = originalEnv.CODEX_POLICY_PATH;
      process.env.CODEX_POLICY_FILE = originalEnv.CODEX_POLICY_FILE;
      process.env.CODEX_APPROVAL_MODE = originalEnv.CODEX_APPROVAL_MODE;
      process.env.CODEX_AUTO_APPROVE = originalEnv.CODEX_AUTO_APPROVE;
      process.env.CODEX_APPROVED_OPERATIONS = originalEnv.CODEX_APPROVED_OPERATIONS;

      await fs.remove(tempDir);
    }
  });
});
