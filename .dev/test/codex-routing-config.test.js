const { spawnSync } = require('node:child_process');
const path = require('node:path');

const NODE_EXEC = process.execPath;
const CODEX_CONFIG_PATH = path.resolve(__dirname, '../../dist/codex/codex-config.js');
const CODEX_SERVER_PATH = path.resolve(__dirname, '../../dist/codex/codex-server.js');

function runLoadModelRoutingConfig(envOverrides = {}) {
  const script = `
    const { loadModelRoutingConfig } = require(${JSON.stringify(CODEX_CONFIG_PATH)});
    try {
      const result = loadModelRoutingConfig(process.env);
      console.log(JSON.stringify({ ok: true, result }));
    } catch (error) {
      console.error(error.message);
      console.log(JSON.stringify({ ok: false, message: error.message }));
      process.exit(1);
    }
  `;

  return spawnSync(NODE_EXEC, ['-e', script], {
    env: {
      ...process.env,
      ...envOverrides,
      CODEX_DISABLE_AUTORUN: 'true',
    },
    encoding: 'utf8',
  });
}

function runCodexClient(envOverrides = {}) {
  const script = `
    process.env.CODEX_DISABLE_AUTORUN = "true";
    const { CodexClient } = require(${JSON.stringify(CODEX_SERVER_PATH)});
    const client = CodexClient.fromEnvironment();
    const router = client.router;
    const quick = router.resolve("fast");
    const review = router.resolve("governance");
    console.log(JSON.stringify({ quick, review }));
  `;

  return spawnSync(NODE_EXEC, ['-e', script], {
    env: {
      ...process.env,
      ...envOverrides,
    },
    encoding: 'utf8',
  });
}

function parseStdout(output) {
  const trimmed = output.trim();
  return trimmed ? JSON.parse(trimmed) : undefined;
}

describe('Codex routing configuration', () => {
  it('normalizes alias overrides and supports friendly names', () => {
    const env = {
      CODEX_DEFAULT_PROVIDER: 'anthropic',
      CODEX_DEFAULT_MODEL: 'claude-default',
      CODEX_FAST_PROVIDER: 'openai',
      CODEX_QUICK_MODEL: 'gpt-quick',
      CODEX_REVIEW_MAX_TOKENS: '4096',
      CODEX_GOVERNANCE_MODEL: 'audit-model',
    };

    const configRun = runLoadModelRoutingConfig(env);
    expect(configRun.status).toBe(0);
    expect(configRun.stderr.trim()).toBe('');

    const parsed = parseStdout(configRun.stdout);
    expect(parsed).toEqual({
      ok: true,
      result: {
        defaultRoute: { provider: 'anthropic', model: 'claude-default' },
        overrides: {
          quick: { provider: 'openai', model: 'gpt-quick' },
          review: { model: 'audit-model', maxTokens: 4096 },
        },
      },
    });

    const clientRun = runCodexClient(env);
    expect(clientRun.status).toBe(0);
    expect(clientRun.stderr.trim()).toBe('');
    const clientParsed = parseStdout(clientRun.stdout);
    expect(clientParsed).toEqual({
      quick: { provider: 'openai', model: 'gpt-quick' },
      review: { provider: 'anthropic', model: 'audit-model', maxTokens: 4096 },
    });
  });

  it('rejects unrecognized override aliases', () => {
    const env = {
      CODEX_SPEEDY_MODEL: 'fast-model',
    };

    const result = runLoadModelRoutingConfig(env);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '[Codex] Invalid CODEX override configuration: Unrecognized override alias "SPEEDY" in CODEX_SPEEDY_MODEL',
    );
    const parsed = parseStdout(result.stdout);
    expect(parsed).toEqual({
      ok: false,
      message:
        '[Codex] Invalid CODEX override configuration: Unrecognized override alias "SPEEDY" in CODEX_SPEEDY_MODEL',
    });
  });

  it('detects conflicting alias values', () => {
    const env = {
      CODEX_QUICK_MODEL: 'model-A',
      CODEX_FAST_MODEL: 'model-B',
    };

    const result = runLoadModelRoutingConfig(env);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '[Codex] Invalid CODEX override configuration: Conflicting values for quick model: "model-A" vs "model-B" (via CODEX_FAST_MODEL)',
    );
    const parsed = parseStdout(result.stdout);
    expect(parsed).toEqual({
      ok: false,
      message:
        '[Codex] Invalid CODEX override configuration: Conflicting values for quick model: "model-A" vs "model-B" (via CODEX_FAST_MODEL)',
    });
  });

  it('validates max token overrides', () => {
    const env = {
      CODEX_REVIEW_MAX_TOKENS: 'not-a-number',
    };

    const result = runLoadModelRoutingConfig(env);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '[Codex] Invalid model routing configuration: overrides.review.maxTokens: Expected number, received string',
    );
    const parsed = parseStdout(result.stdout);
    expect(parsed).toEqual({
      ok: false,
      message:
        '[Codex] Invalid model routing configuration: overrides.review.maxTokens: Expected number, received string',
    });
  });

  it('enforces required default route fields', () => {
    const env = {
      CODEX_DEFAULT_PROVIDER: '   ',
    };

    const result = runLoadModelRoutingConfig(env);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '[Codex] Invalid model routing configuration: defaultRoute.provider: value must not be empty',
    );
    const parsed = parseStdout(result.stdout);
    expect(parsed).toEqual({
      ok: false,
      message:
        '[Codex] Invalid model routing configuration: defaultRoute.provider: value must not be empty',
    });
  });
});
