const path = require('node:path');

const mockSpawn = jest.fn();

jest.mock('child_process', () => ({
  spawn: (...args) => mockSpawn(...args),
}));

const cli = require('../bin/bmad-invisible');
const { buildAssistantSpawnEnv } = require('../common/utils/assistant-env');

const fs = require('node:fs');

describe('bmad-invisible start assistant selection', () => {
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
    expect(lastCall[1][0]).toContain(path.join('bin', 'bmad-claude'));
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
            handler(new Error('spawn ENOENT'));
          }
          return emitter;
        }),
      };
      return emitter;
    });

    cli.setRuntimeContext('opencode', []);

    expect(() => cli.commands.opencode()).not.toThrow();
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
    expect(spawnedEnv.ANTHROPIC_API_KEY).toBe('glm-test-key');
    expect(spawnedEnv.ANTHROPIC_BASE_URL).toBe('https://glm.example.com');
    expect(spawnedEnv.LLM_PROVIDER).toBe('glm');
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
