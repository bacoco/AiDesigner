jest.mock('node:https', () => ({
  request: jest.fn(),
}));

const https = require('node:https');
const { LLMClient } = require('../lib/llm-client');

describe('LLMClient', () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GLM_API_KEY;
    delete process.env.LLM_PROVIDER;
    delete process.env.ZHIPUAI_API_KEY;
    delete process.env.GLM_API_KEY;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws a descriptive error when initialized without credentials', () => {
    expect(() => new LLMClient({ provider: 'claude' })).toThrow(
      'Missing API key for provider "claude". Set the ANTHROPIC_API_KEY environment variable or provide an apiKey option.',
    );
  });

  it('reads GLM credentials from either ZHIPUAI_API_KEY or GLM_API_KEY', () => {
    process.env.GLM_API_KEY = 'glm-key';
    let client;
    expect(() => {
      client = new LLMClient({ provider: 'glm' });
    }).not.toThrow();
    expect(client.apiKey).toBe('glm-key');

    process.env.ZHIPUAI_API_KEY = 'zhipu-key';
    const prioritized = new LLMClient({ provider: 'glm' });
    expect(prioritized.apiKey).toBe('zhipu-key');
  });

  it('exposes glm default model without requiring anthropic credentials', () => {
    process.env.ZHIPUAI_API_KEY = 'glm-key';
    const client = new LLMClient({ provider: 'glm' });
    expect(client.model).toBe('glm-4-plus');
  });

  it('routes chat requests to chatGLM when provider is glm', async () => {
    process.env.ZHIPUAI_API_KEY = 'glm-key';
    const client = new LLMClient({ provider: 'glm' });

    const glmSpy = jest.spyOn(client, 'chatGLM').mockResolvedValue('glm-response');
    const anthropicSpy = jest
      .spyOn(client, 'chatAnthropic')
      .mockResolvedValue('anthropic-response');

    const result = await client.chat([{ role: 'user', content: 'Hi there' }]);

    expect(result).toBe('glm-response');
    expect(glmSpy).toHaveBeenCalledTimes(1);
    expect(anthropicSpy).not.toHaveBeenCalled();
  });

  it('uses the default GLM base URL when none is configured', async () => {
    process.env.ZHIPUAI_API_KEY = 'glm-key';
    const client = new LLMClient({ provider: 'glm' });

    const makeRequestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ choices: [{ message: { content: 'hello world' } }] });

    const result = await client.chatGLM([{ role: 'user', content: 'Ping?' }], {
      temperature: 0.2,
      maxTokens: 32,
    });

    expect(result).toBe('hello world');
    expect(makeRequestSpy).toHaveBeenCalledWith(
      'open.bigmodel.cn',
      '/api/paas/v4/chat/completions',
      'POST',
      expect.objectContaining({ model: 'glm-4-plus' }),
      expect.objectContaining({
        Authorization: 'Bearer glm-key',
        Accept: 'application/json',
      }),
      undefined,
    );
  });

  it('honors configured GLM base URLs including custom paths and ports', async () => {
    process.env.ZHIPUAI_API_KEY = 'glm-key';
    process.env.BMAD_GLM_BASE_URL = 'https://example.com:7443/custom/base';

    const client = new LLMClient({ provider: 'glm' });

    const makeRequestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ choices: [{ message: { content: 'custom base' } }] });

    const result = await client.chatGLM([{ role: 'user', content: 'Ping?' }], {
      temperature: 0.2,
      maxTokens: 32,
    });

    expect(result).toBe('custom base');
    expect(makeRequestSpy).toHaveBeenCalledWith(
      'example.com',
      '/custom/base/api/paas/v4/chat/completions',
      'POST',
      expect.any(Object),
      expect.objectContaining({ Authorization: 'Bearer glm-key' }),
      7443,
    );
  });

  it('passes the port from ANTHROPIC_BASE_URL to https.request', async () => {
    const expectedPort = '8443';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.ANTHROPIC_BASE_URL = `https://example.com:${expectedPort}`;

    const responseListeners = {};
    const mockResponse = {
      statusCode: 200,
      on: jest.fn((event, handler) => {
        responseListeners[event] = handler;
      }),
    };

    const writeMock = jest.fn();

    https.request.mockImplementation((options, callback) => {
      callback(mockResponse);

      if (responseListeners.data) {
        responseListeners.data(JSON.stringify({ content: [{ text: 'mocked response' }] }));
      }
      if (responseListeners.end) {
        responseListeners.end();
      }

      return {
        on: jest.fn(),
        write: writeMock,
        end: jest.fn(),
      };
    });

    const client = new LLMClient({ provider: 'claude' });
    const result = await client.chatAnthropic([{ role: 'user', content: 'Hello' }], {
      temperature: 0.5,
      maxTokens: 100,
    });

    expect(result).toBe('mocked response');
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: 'example.com', port: expectedPort }),
      expect.any(Function),
    );

    const sentPayload = JSON.parse(writeMock.mock.calls[0][0]);
    expect(sentPayload).toEqual(
      expect.objectContaining({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Hello',
              },
            ],
          },
        ],
      }),
    );
  });

  it('sends correctly formatted messages through chat() method with claude provider', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const responseListeners = {};
    const mockResponse = {
      statusCode: 200,
      on: jest.fn((event, handler) => {
        responseListeners[event] = handler;
      }),
    };

    const writeMock = jest.fn();

    https.request.mockImplementation((options, callback) => {
      callback(mockResponse);

      if (responseListeners.data) {
        responseListeners.data(JSON.stringify({ content: [{ text: 'end-to-end response' }] }));
      }
      if (responseListeners.end) {
        responseListeners.end();
      }

      return {
        on: jest.fn(),
        write: writeMock,
        end: jest.fn(),
      };
    });

    const client = new LLMClient({ provider: 'claude' });
    const result = await client.chat(
      [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' },
        { role: 'user', content: 'What is 3+3?' },
      ],
      {
        systemPrompt: 'You are a helpful math assistant.',
        temperature: 0.7,
        maxTokens: 200,
      },
    );

    expect(result).toBe('end-to-end response');

    // Verify the full payload structure sent to Anthropic API
    const sentPayload = JSON.parse(writeMock.mock.calls[0][0]);
    expect(sentPayload).toEqual({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      temperature: 0.7,
      system: 'You are a helpful math assistant.',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'What is 2+2?' }],
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: '4' }],
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'What is 3+3?' }],
        },
      ],
    });
  });

  it('routes GLM requests to open.bigmodel.cn not Anthropic', async () => {
    process.env.GLM_API_KEY = 'glm-test-key';

    const responseListeners = {};
    const mockResponse = {
      statusCode: 200,
      on: jest.fn((event, handler) => {
        responseListeners[event] = handler;
      }),
    };

    https.request.mockImplementation((options, callback) => {
      callback(mockResponse);

      if (responseListeners.data) {
        responseListeners.data(
          JSON.stringify({
            choices: [{ message: { content: 'GLM response' } }],
          }),
        );
      }
      if (responseListeners.end) {
        responseListeners.end();
      }

      return {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };
    });

    const client = new LLMClient({ provider: 'glm' });
    const result = await client.chat([{ role: 'user', content: 'Hello' }], {
      temperature: 0.5,
      maxTokens: 100,
    });

    expect(result).toBe('GLM response');
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'open.bigmodel.cn',
        path: '/api/paas/v4/chat/completions',
      }),
      expect.any(Function),
    );
  });

  it('automatically adds https:// scheme to GLM base URL without scheme', async () => {
    process.env.ZHIPUAI_API_KEY = 'glm-key';
    process.env.GLM_BASE_URL = 'example.com';

    const client = new LLMClient({ provider: 'glm' });

    const makeRequestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ choices: [{ message: { content: 'response' } }] });

    await client.chatGLM([{ role: 'user', content: 'Ping?' }], {
      temperature: 0.2,
      maxTokens: 32,
    });

    expect(makeRequestSpy).toHaveBeenCalledWith(
      'example.com',
      '/api/paas/v4/chat/completions',
      'POST',
      expect.any(Object),
      expect.any(Object),
      undefined,
    );
  });

  it('throws descriptive error for invalid GLM base URL', async () => {
    process.env.ZHIPUAI_API_KEY = 'glm-key';
    process.env.BMAD_GLM_BASE_URL = 'ht!tp://invalid url with spaces';

    const client = new LLMClient({ provider: 'glm' });

    await expect(
      client.chatGLM([{ role: 'user', content: 'Test' }], {
        temperature: 0.2,
        maxTokens: 32,
      }),
    ).rejects.toThrow(/Invalid GLM base URL/);
  });

  describe('MCP Server Detection', () => {
    it('detects MCP execution with published package path (Unix)', () => {
      process.argv = ['node', 'node_modules/agilai/dist/mcp/mcp/server.js'];
      const client = new LLMClient({ provider: 'claude' });
      expect(client.isMcpExecution).toBe(true);
    });

    it('detects MCP execution with published package path (Windows)', () => {
      process.argv = ['node', 'C:\\projects\\myapp\\node_modules\\agilai\\dist\\mcp\\mcp\\server.js'];
      const client = new LLMClient({ provider: 'claude' });
      expect(client.isMcpExecution).toBe(true);
    });

    it('detects MCP execution with relative path', () => {
      process.argv = ['node', 'dist/mcp/mcp/server.js'];
      const client = new LLMClient({ provider: 'claude' });
      expect(client.isMcpExecution).toBe(true);
    });

    it('detects MCP execution in development mode', () => {
      process.argv = ['ts-node', '.dev/mcp/server.ts'];
      const client = new LLMClient({ provider: 'claude' });
      expect(client.isMcpExecution).toBe(true);
    });

    it('does not detect MCP execution for similar but different paths', () => {
      process.argv = ['node', 'backup-mcp/server.js'];
      const client = new LLMClient({ provider: 'claude', apiKey: 'test-key' });
      expect(client.isMcpExecution).toBe(false);
    });

    it('does not detect MCP execution for unrelated arguments', () => {
      process.argv = ['node', 'app.js', '--config=mcp/server.json'];
      const client = new LLMClient({ provider: 'claude', apiKey: 'test-key' });
      expect(client.isMcpExecution).toBe(false);
    });

    it('handles non-array argv gracefully', () => {
      const originalArgv = process.argv;
      process.argv = null;
      const client = new LLMClient({ provider: 'claude', apiKey: 'test-key' });
      expect(client.isMcpExecution).toBe(false);
      process.argv = originalArgv;
    });

    it('handles non-string arguments in argv', () => {
      process.argv = ['node', 123, null, 'app.js'];
      const client = new LLMClient({ provider: 'claude', apiKey: 'test-key' });
      expect(client.isMcpExecution).toBe(false);
    });

    it('allows client initialization without API key in MCP mode', () => {
      process.argv = ['node', 'dist/mcp/mcp/server.js'];
      let client;
      expect(() => {
        client = new LLMClient({ provider: 'claude' });
      }).not.toThrow();
      expect(client.isMcpExecution).toBe(true);
      expect(client.apiKey).toBeUndefined();
    });

    it('still requires API key in non-MCP mode', () => {
      process.argv = ['node', 'app.js'];
      expect(() => new LLMClient({ provider: 'claude' })).toThrow(
        'Missing API key for provider "claude". Set the ANTHROPIC_API_KEY environment variable or provide an apiKey option.',
      );
    });
  });
});
