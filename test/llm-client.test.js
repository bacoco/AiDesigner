jest.mock('node:https', () => ({
  request: jest.fn(),
}));

const https = require('node:https');
const { LLMClient } = require('../lib/llm-client');

describe('LLMClient', () => {
  const originalEnv = process.env;

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

  it('uses a configured GLM base URL when making requests', async () => {
    process.env.ZHIPUAI_API_KEY = 'glm-key';
    process.env.BMAD_GLM_BASE_URL = 'https://custom.example.com:9443/custom/api/';

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
            choices: [
              {
                message: {
                  content: 'glm custom response',
                },
              },
            ],
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
    const result = await client.chatGLM([{ role: 'user', content: 'Hello GLM' }], {
      temperature: 0.7,
      maxTokens: 120,
    });

    expect(result).toBe('glm custom response');
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'custom.example.com',
        port: '9443',
        path: '/custom/api/chat/completions',
      }),
      expect.any(Function),
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
});
