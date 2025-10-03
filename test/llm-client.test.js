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

    const client = new LLMClient({ provider: 'glm' });
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
        Authorization: 'Bearer glm-auth',
        'anthropic-version': '2023-06-01',
      }),
      undefined,
    );

    // Verify x-api-key is NOT sent for GLM
    const headers = requestSpy.mock.calls[0][4];
    expect(headers['x-api-key']).toBeUndefined();

    requestSpy.mockRestore();
  });

  it('uses only x-api-key for claude provider (not Authorization)', async () => {
    process.env.ANTHROPIC_API_KEY = 'claude-key';
    process.env.ANTHROPIC_AUTH_TOKEN = 'should-not-be-used';

    const client = new LLMClient({ provider: 'claude' });
    const requestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ content: [{ text: 'response' }] });

    await client.chat([{ role: 'user', content: 'test' }]);

    const headers = requestSpy.mock.calls[0][4];
    expect(headers['x-api-key']).toBe('claude-key');
    expect(headers['Authorization']).toBeUndefined();
    expect(headers['anthropic-version']).toBe('2023-06-01');

    requestSpy.mockRestore();
  });

  it('uses custom base URL for claude provider', async () => {
    process.env.ANTHROPIC_API_KEY = 'claude-key';
    process.env.ANTHROPIC_BASE_URL = 'https://custom.anthropic.com';

    const client = new LLMClient({ provider: 'claude' });
    const requestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ content: [{ text: 'response' }] });

    await client.chat([{ role: 'user', content: 'test' }]);

    expect(requestSpy).toHaveBeenCalledWith(
      'custom.anthropic.com',
      '/v1/messages',
      'POST',
      expect.any(Object),
      expect.any(Object),
      undefined,
    );

    requestSpy.mockRestore();
  });

  it('handles base URL with path prefix', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    process.env.ANTHROPIC_BASE_URL = 'https://api.example.com/anthropic/v2';

    const client = new LLMClient({ provider: 'claude' });
    const requestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ content: [{ text: 'response' }] });

    await client.chat([{ role: 'user', content: 'test' }]);

    expect(requestSpy).toHaveBeenCalledWith(
      'api.example.com',
      '/anthropic/v2/v1/messages',
      'POST',
      expect.any(Object),
      expect.any(Object),
      undefined,
    );

    requestSpy.mockRestore();
  });

  it('handles base URL with trailing slash', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    process.env.ANTHROPIC_BASE_URL = 'https://api.example.com/';

    const client = new LLMClient({ provider: 'claude' });
    const requestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ content: [{ text: 'response' }] });

    await client.chat([{ role: 'user', content: 'test' }]);

    expect(requestSpy).toHaveBeenCalledWith(
      'api.example.com',
      '/v1/messages',
      'POST',
      expect.any(Object),
      expect.any(Object),
      undefined,
    );

    requestSpy.mockRestore();
  });

  it('throws error for invalid base URL', () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    process.env.ANTHROPIC_BASE_URL = 'not-a-valid-url';

    const client = new LLMClient({ provider: 'claude' });

    expect(() => client.getAnthropicRequestTarget('/v1/messages')).toThrow('Invalid ANTHROPIC_BASE_URL');
  });

  it('uses GLM_API_KEY when ANTHROPIC_AUTH_TOKEN is not set for GLM', async () => {
    process.env.GLM_API_KEY = 'glm-only-key';

    const client = new LLMClient({ provider: 'glm' });
    const requestSpy = jest
      .spyOn(client, 'makeRequest')
      .mockResolvedValue({ content: [{ text: 'response' }] });

    await client.chat([{ role: 'user', content: 'test' }]);

    const headers = requestSpy.mock.calls[0][4];
    expect(headers['Authorization']).toBe('Bearer glm-only-key');
    expect(headers['x-api-key']).toBeUndefined();

    requestSpy.mockRestore();
  });
});
