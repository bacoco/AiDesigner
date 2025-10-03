const { getAssistantProvider, buildAssistantSpawnEnv } = require('../common/utils/assistant-env');

const runCommandWithGlm = async (command) => {
  jest.resetModules();

  const spawnMock = jest.fn(() => {
    const child = {
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'exit') {
          handler(0);
        }
        return child;
      }),
    };
    return child;
  });

  jest.doMock('child_process', () => ({ spawn: spawnMock }));

  const cli = require('../bin/bmad-invisible');
  cli.setRuntimeContext(command, ['--glm']);

  delete process.env.BMAD_ASSISTANT_PROVIDER;
  delete process.env.LLM_PROVIDER;
  process.env.GLM_API_KEY = 'test-key';

  await cli.commands[command]();

  const options = spawnMock.mock.calls[0][2];
  return { env: options.env, spawnMock };
};

describe('assistant-env', () => {
  let originalEnv;
  let exitSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    originalEnv = { ...process.env };
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('getAssistantProvider', () => {
    test('returns empty string when BMAD_ASSISTANT_PROVIDER is not set', () => {
      delete process.env.BMAD_ASSISTANT_PROVIDER;
      expect(getAssistantProvider()).toBe('');
    });

    test('returns normalized provider name', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = '  GLM  ';
      expect(getAssistantProvider()).toBe('glm');
    });

    test('converts to lowercase', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'GLM';
      expect(getAssistantProvider()).toBe('glm');
    });
  });

  describe('buildAssistantSpawnEnv', () => {
    test('returns process.env when provider is not glm', () => {
      delete process.env.BMAD_ASSISTANT_PROVIDER;
      const result = buildAssistantSpawnEnv();

      expect(result.isGlm).toBe(false);
      expect(result.env).toBe(process.env);
    });

    test('returns process.env when provider is set to something other than glm', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'claude';
      const result = buildAssistantSpawnEnv();

      expect(result.isGlm).toBe(false);
      expect(result.env).toBe(process.env);
    });

    test('builds GLM environment with BMAD_GLM_BASE_URL', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_BASE_URL = 'https://glm.example.com';
      process.env.BMAD_GLM_API_KEY = 'test-key';

      const result = buildAssistantSpawnEnv();

      expect(result.isGlm).toBe(true);
      expect(result.env.ANTHROPIC_BASE_URL).toBe('https://glm.example.com');
      expect(result.env.ANTHROPIC_API_KEY).toBe('test-key');
      expect(result.env.LLM_PROVIDER).toBe('glm');
    });

    test('prefers BMAD_GLM_BASE_URL over GLM_BASE_URL', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_BASE_URL = 'https://bmad.example.com';
      process.env.GLM_BASE_URL = 'https://glm.example.com';
      process.env.BMAD_GLM_API_KEY = 'test-key';

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_BASE_URL).toBe('https://bmad.example.com');
    });

    test('falls back to GLM_BASE_URL when BMAD_GLM_BASE_URL is not set', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.GLM_BASE_URL = 'https://glm.example.com';
      process.env.BMAD_GLM_API_KEY = 'test-key';

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_BASE_URL).toBe('https://glm.example.com');
    });

    test('falls back to ANTHROPIC_BASE_URL when GLM variables are not set', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.ANTHROPIC_BASE_URL = 'https://anthropic.example.com';
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_BASE_URL).toBe('https://anthropic.example.com');
      expect(result.env.ANTHROPIC_API_KEY).toBe('test-key');
    });

    test('handles auth token preference chain', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_AUTH_TOKEN = 'bmad-token';
      process.env.GLM_AUTH_TOKEN = 'glm-token';
      process.env.ANTHROPIC_AUTH_TOKEN = 'anthropic-token';
      process.env.BMAD_GLM_API_KEY = 'test-key';

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_AUTH_TOKEN).toBe('bmad-token');
    });

    test('handles API key preference chain', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_API_KEY = 'bmad-key';
      process.env.GLM_API_KEY = 'glm-key';
      process.env.ANTHROPIC_API_KEY = 'anthropic-key';

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_API_KEY).toBe('bmad-key');
    });

    test('deletes ANTHROPIC_BASE_URL when no base URL is found', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.ANTHROPIC_BASE_URL = 'https://old.example.com';
      process.env.BMAD_GLM_API_KEY = 'test-key';
      delete process.env.BMAD_GLM_BASE_URL;
      delete process.env.GLM_BASE_URL;

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_BASE_URL).toBeUndefined();
    });

    test('deletes ANTHROPIC_AUTH_TOKEN when no auth token is found', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.ANTHROPIC_AUTH_TOKEN = 'old-token';
      process.env.BMAD_GLM_API_KEY = 'test-key';
      delete process.env.BMAD_GLM_AUTH_TOKEN;
      delete process.env.GLM_AUTH_TOKEN;

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    });

    test('exits with error when GLM mode has no base URL or API key', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      delete process.env.BMAD_GLM_BASE_URL;
      delete process.env.GLM_BASE_URL;
      delete process.env.ANTHROPIC_BASE_URL;
      delete process.env.BMAD_GLM_API_KEY;
      delete process.env.GLM_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      buildAssistantSpawnEnv();

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('GLM mode requires at least one of'),
      );
    });

    test('allows GLM mode with only base URL', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_BASE_URL = 'https://glm.example.com';
      delete process.env.BMAD_GLM_API_KEY;
      delete process.env.GLM_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = buildAssistantSpawnEnv();

      expect(result.isGlm).toBe(true);
      expect(exitSpy).not.toHaveBeenCalled();
    });

    test('allows GLM mode with only API key', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_API_KEY = 'test-key';
      delete process.env.BMAD_GLM_BASE_URL;
      delete process.env.GLM_BASE_URL;
      delete process.env.ANTHROPIC_BASE_URL;

      const result = buildAssistantSpawnEnv();

      expect(result.isGlm).toBe(true);
      expect(exitSpy).not.toHaveBeenCalled();
    });

    test('does not mutate process.env', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_BASE_URL = 'https://glm.example.com';
      process.env.BMAD_GLM_API_KEY = 'test-key';

      const envBefore = { ...process.env };
      buildAssistantSpawnEnv();
      const envAfter = { ...process.env };

      expect(envBefore).toEqual(envAfter);
    });

    test('ignores empty string values in preference chain', () => {
      process.env.BMAD_ASSISTANT_PROVIDER = 'glm';
      process.env.BMAD_GLM_BASE_URL = '';
      process.env.GLM_BASE_URL = 'https://glm.example.com';
      process.env.BMAD_GLM_API_KEY = 'test-key';

      const result = buildAssistantSpawnEnv();

      expect(result.env.ANTHROPIC_BASE_URL).toBe('https://glm.example.com');
    });
  });

  describe('bmad-invisible CLI GLM flags', () => {
    afterEach(() => {
      jest.dontMock('child_process');
      jest.resetModules();
    });

    test('chat command propagates GLM provider env via --glm flag', async () => {
      const { env } = await runCommandWithGlm('chat');

      expect(env.BMAD_ASSISTANT_PROVIDER).toBe('glm');
      expect(env.LLM_PROVIDER).toBe('glm');
    });

    test('codex command propagates GLM provider env via --glm flag', async () => {
      const { env } = await runCommandWithGlm('codex');

      expect(env.BMAD_ASSISTANT_PROVIDER).toBe('glm');
      expect(env.LLM_PROVIDER).toBe('glm');
    });
  });
});
