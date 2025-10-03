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

  it('uses the current OpenAI production model by default', () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    const client = new LLMClient({ provider: 'openai' });
    expect(client.model).toBe('gpt-4.1');
  });
});
