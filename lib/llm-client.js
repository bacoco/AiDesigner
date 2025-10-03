/**
 * LLM Client Integration
 * Supports Claude (Anthropic), GLM, GPT (OpenAI), and Gemini (Google)
 */

const https = require('node:https');

class LLMClient {
  constructor(options = {}) {
    this.provider = options.provider || process.env.LLM_PROVIDER || 'claude';
    this.apiKey = options.apiKey || this.getApiKeyFromEnv();
    this.model = options.model || this.getDefaultModel();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    if (!this.apiKey) {
      const envVar = this.getApiKeyEnvVarName();
      throw new Error(
        `Missing API key for provider "${this.provider}". Set the ${envVar} environment variable or provide an apiKey option.`,
      );
    }
  }

  getApiKeyFromEnv() {
    switch (this.provider) {
      case 'claude': {
        return process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
      }
      case 'openai':
      case 'gpt': {
        return process.env.OPENAI_API_KEY;
      }
      case 'gemini':
      case 'google': {
        return process.env.GOOGLE_API_KEY;
      }
      case 'glm': {
        return (
          process.env.GLM_API_KEY ||
          process.env.ANTHROPIC_AUTH_TOKEN ||
          process.env.ANTHROPIC_API_KEY
        );
      }
      default: {
        throw new Error(`Unknown LLM provider: ${this.provider}`);
      }
    }
  }

  getApiKeyEnvVarName() {
    switch (this.provider) {
      case 'claude': {
        return 'ANTHROPIC_API_KEY';
      }
      case 'openai':
      case 'gpt': {
        return 'OPENAI_API_KEY';
      }
      case 'gemini':
      case 'google': {
        return 'GOOGLE_API_KEY';
      }
      case 'glm': {
        return 'GLM_API_KEY or ANTHROPIC_AUTH_TOKEN';
      }
      default: {
        return 'LLM_API_KEY';
      }
    }
  }

  getDefaultModel() {
    switch (this.provider) {
      case 'claude': {
        return 'claude-3-5-sonnet-20241022';
      }
      case 'openai':
      case 'gpt': {
        return 'gpt-4-turbo-preview';
      }
      case 'gemini':
      case 'google': {
        return 'gemini-1.5-pro';
      }
      case 'glm': {
        return 'glm-4.6';
      }
      default: {
        return 'claude-3-5-sonnet-20241022';
      }
    }
  }

  /**
   * Main chat interface - send messages and get responses
   * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - LLM response
   */
  async chat(messages, options = {}) {
    const systemPrompt = options.systemPrompt || '';
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 4096;

    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        switch (this.provider) {
          case 'claude':
          case 'glm': {
            return await this.chatAnthropic(messages, {
              systemPrompt,
              temperature,
              maxTokens,
            });
          }
          case 'openai':
          case 'gpt': {
            return await this.chatOpenAI(messages, {
              systemPrompt,
              temperature,
              maxTokens,
            });
          }
          case 'gemini':
          case 'google': {
            return await this.chatGemini(messages, {
              systemPrompt,
              temperature,
              maxTokens,
            });
          }
          default: {
            throw new Error(`Unsupported provider: ${this.provider}`);
          }
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries - 1) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  async chatAnthropic(messages, options) {
    const payload = {
      model: this.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    if (options.systemPrompt) {
      payload.system = options.systemPrompt;
    }

    const { hostname, path, port } = this.getAnthropicRequestTarget('/v1/messages');

    const response = await this.makeRequest(
      hostname,
      path,
      'POST',
      payload,
      this.getAnthropicHeaders(),
      port,
    );

    return response.content[0].text;
  }

  async chatOpenAI(messages, options) {
    const apiMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (options.systemPrompt) {
      apiMessages.unshift({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    const payload = {
      model: this.model,
      messages: apiMessages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    };

    const response = await this.makeRequest(
      'api.openai.com',
      '/v1/chat/completions',
      'POST',
      payload,
      {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    );

    return response.choices[0].message.content;
  }

  async chatGemini(messages, options) {
    // Format messages for Gemini
    const contents = [];

    // Add system prompt as first user message if provided
    if (options.systemPrompt) {
      contents.push(
        {
          role: 'user',
          parts: [{ text: options.systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will follow these instructions.' }],
        },
      );
    }

    // Add conversation messages
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const payload = {
      contents,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    };

    const response = await this.makeRequest(
      'generativelanguage.googleapis.com',
      `/v1/models/${this.model}:generateContent?key=${this.apiKey}`,
      'POST',
      payload,
      {
        'Content-Type': 'application/json',
      },
    );

    return response.candidates[0].content.parts[0].text;
  }

  makeRequest(hostname, path, method, body, headers = {}, port) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      };

      if (port) {
        options.port = port;
      }

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || data}`));
            } else {
              resolve(parsed);
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getAnthropicHeaders() {
    if (this.provider === 'glm') {
      const authToken = process.env.ANTHROPIC_AUTH_TOKEN || process.env.GLM_API_KEY || this.apiKey;
      return {
        Authorization: `Bearer ${authToken}`,
        'anthropic-version': '2023-06-01',
      };
    }

    return {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  getAnthropicRequestTarget(pathSuffix) {
    const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
    let parsedUrl;

    try {
      parsedUrl = new URL(baseUrl);
    } catch (error) {
      throw new Error(`Invalid ANTHROPIC_BASE_URL: ${error.message}`);
    }

    const normalizedBasePath =
      parsedUrl.pathname === '/' ? '' : parsedUrl.pathname.replace(/\/$/, '');
    const normalizedSuffix = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;

    return {
      hostname: parsedUrl.hostname,
      path: `${normalizedBasePath}${normalizedSuffix}` || '/',
      port: parsedUrl.port || undefined,
    };
  }
}

module.exports = { LLMClient };
