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
});
