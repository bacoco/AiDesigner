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
    delete process.env.ANTHROPIC_BASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws a descriptive error when initialized without credentials', () => {
    expect(() => new LLMClient({ provider: 'claude' })).toThrow(
      'Missing API key for provider "claude". Set the ANTHROPIC_API_KEY environment variable or provide an apiKey option.',
    );
  });

  it('throws a helpful error for glm when credentials are missing', () => {
    expect(() => new LLMClient({ provider: 'glm' })).toThrow(
      'Missing API key for provider "glm". Set the GLM_API_KEY or ANTHROPIC_AUTH_TOKEN environment variable or provide an apiKey option.',
    );
  });

  it('constructs anthropic-style requests using the configured base URL for glm', async () => {
    process.env.GLM_API_KEY = 'glm-key';
    process.env.ANTHROPIC_AUTH_TOKEN = 'glm-auth';
    process.env.ANTHROPIC_BASE_URL = 'https://example.com/api/anthropic';

    const client = new LLMClient({ provider: 'glm', model: undefined });
    const requestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ content: [{ text: 'hello' }] });

    const response = await client.chat([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'response' },
    ]);

    expect(response).toBe('hello');
    expect(requestSpy).toHaveBeenCalledWith(
      'example.com',
      '/api/anthropic/v1/messages',
      'POST',
      expect.objectContaining({ model: 'glm-4.6' }),
      expect.objectContaining({
        'x-api-key': 'glm-key',
        Authorization: 'Bearer glm-auth',
        'anthropic-version': '2023-06-01',
      }),
      undefined,
    );

    requestSpy.mockRestore();
  });
});
