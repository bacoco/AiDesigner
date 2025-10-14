const path = require('node:path');
const os = require('node:os');

const mockSpawn = jest.fn();

jest.mock('child_process', () => ({
  spawn: (...args) => mockSpawn(...args),
}));

const cli = require('../../bin/aidesigner');
const { buildAssistantSpawnEnv } = require('../../common/utils/assistant-env');

const fs = require('node:fs');

describe('aidesigner start assistant selection', () => {
  const originalInit = cli.commands.init;
  let exitSpy;
  let existsSpy;
  let originalIsTTY;
  const originalEnv = process.env;

  beforeEach(() => {
    mockSpawn.mockReset();
    mockSpawn.mockImplementation(() => ({
      on: jest.fn((event, handler) => {
        if (event === 'exit') {
          handler(0);
        }
        return;
      }),
    }));

    cli.commands.init = jest.fn().mockResolvedValue();
    existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    originalIsTTY = process.stdout.isTTY;
    process.env = { ...originalEnv };
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_MODEL;
    delete process.env.ZHIPUAI_API_KEY;
    delete process.env.GLM_API_KEY;
    delete process.env.GLM_BASE_URL;
    delete process.env.BMAD_ASSISTANT_PROVIDER;
  });

  afterEach(() => {
    cli.commands.init = originalInit;
    existsSpy.mockRestore();
    exitSpy.mockRestore();
    process.stdout.isTTY = originalIsTTY;
    process.env = originalEnv;
  });

  test('errors in non-TTY mode when no assistant flag is provided', async () => {
    process.stdout.isTTY = false;
    cli.setRuntimeContext('start', []);

    await cli.commands.start();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  test('launches Claude chat when requested via flag', async () => {
    cli.setRuntimeContext('start', ['--assistant=claude']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('node');
    expect(lastCall[1][0]).toContain(path.join('bin', 'aidesigner-claude'));
    expect(lastCall[1].some((arg) => arg.includes('--assistant'))).toBe(false);
  });

  test('launches OpenCode when requested via flag', async () => {
    cli.setRuntimeContext('start', ['--assistant=opencode']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('opencode');
    expect(lastCall[1]).toEqual([]);
    expect(lastCall[2].shell).toBe(false);
    expect(lastCall[2].env).toBeDefined();
  });

  test('handles invalid assistant flag by exiting with error', async () => {
    process.stdout.isTTY = false;
    cli.setRuntimeContext('start', ['--assistant=invalid']);

    await cli.commands.start();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  test('handles spawn error for Codex', async () => {
    mockSpawn.mockImplementationOnce(() => {
      const emitter = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('spawn ENOENT'));
          }
          return emitter;
        }),
      };
      return emitter;
    });

    cli.setRuntimeContext('codex', []);

    expect(() => cli.commands.codex()).not.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles spawn error for OpenCode', async () => {
    mockSpawn.mockImplementationOnce(() => {
      const emitter = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            // Simulate async error
            setTimeout(() => handler(new Error('spawn ENOENT')), 0);
          }
          return emitter;
        }),
      };
      return emitter;
    });

    cli.setRuntimeContext('opencode', []);

    await cli.commands.opencode();

    // Wait for async error handling
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('plumbs GLM provider into spawned CLI environment without mutating parent env', async () => {
    process.env.GLM_API_KEY = 'glm-test-key';
    cli.setRuntimeContext('start', ['--assistant=codex', '--glm']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[2].env.LLM_PROVIDER).toBe('glm');
    expect(lastCall[2].env.ZHIPUAI_API_KEY).toBe('glm-test-key');
    expect(process.env.LLM_PROVIDER).toBeUndefined();
    expect(process.env.ZHIPUAI_API_KEY).toBeUndefined();
  });

  test('start with --glm maps GLM credentials into Anthropic-compatible environment', async () => {
    process.env.GLM_API_KEY = 'glm-test-key';
    process.env.GLM_BASE_URL = 'https://glm.example.com';
    cli.setRuntimeContext('start', ['--assistant=claude', '--glm']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    const spawnedEnv = lastCall[2].env;
    // The CLI should set these environment variables for GLM mode
    expect(spawnedEnv.LLM_PROVIDER).toBe('glm');
    expect(spawnedEnv.GLM_API_KEY).toBe('glm-test-key');
    expect(spawnedEnv.GLM_BASE_URL).toBe('https://glm.example.com');
  });

  test('direct codex command respects --llm-provider flag', async () => {
    cli.setRuntimeContext('codex', ['--llm-provider=glm']);
    process.env.ZHIPUAI_API_KEY = 'direct-key';

    await cli.commands.codex();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('node');
    expect(lastCall[2].env.LLM_PROVIDER).toBe('glm');
    expect(lastCall[2].env.ZHIPUAI_API_KEY).toBe('direct-key');
    expect(process.env.LLM_PROVIDER).toBeUndefined();
  });
});

describe('aidesigner init npm scripts', () => {
  let tempDir;
  let originalCwd;
  let originalIsTTY;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aidesigner-init-test-'));
    process.chdir(tempDir);

    originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = false;
  });

  afterEach(() => {
    process.stdout.isTTY = originalIsTTY;
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const readPackageJson = () => {
    const file = fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8');
    return JSON.parse(file);
  };

  test('seeds aidesigner:opencode script in new projects', async () => {
    await cli.commands.init();

    const packageJson = readPackageJson();
    expect(packageJson.scripts['aidesigner:opencode']).toBe('aidesigner opencode');
  });

  test('does not overwrite an existing aidesigner:opencode script', async () => {
    const preexisting = {
      name: 'fixture',
      scripts: {
        'aidesigner:opencode': 'custom-opencode',
      },
    };
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(preexisting, null, 2));

    await cli.commands.init();

    const packageJson = readPackageJson();
    expect(packageJson.scripts['aidesigner:opencode']).toBe('custom-opencode');
  });
});
