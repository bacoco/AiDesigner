/**
 * LLM Client Integration
 * Supports Claude (Anthropic), GLM, GPT (OpenAI), and Gemini (Google)
 */

const https = require('node:https');

class LLMClient {
  constructor(options = {}) {
    this.isMcpExecution = this.detectMcpExecution();
    this.provider = options.provider || process.env.LLM_PROVIDER || 'claude';
    this.apiKey = options.apiKey || this.getApiKeyFromEnv();
    this.model = options.model || this.getDefaultModel();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    if (!this.apiKey && !this.isMcpExecution) {
      const envVar = this.getApiKeyEnvVarName();
      throw new Error(
        `Missing API key for provider "${this.provider}". Set the ${envVar} environment variable or provide an apiKey option.`,
      );
    }
  }

  /**
   * Detects if the current process is running as part of the MCP server.
   * Checks process.argv[1] (the script being executed) for MCP server entry points
   * to allow bypassing API key validation.
   * @returns {boolean} True if running in MCP server context, false otherwise
   */
  detectMcpExecution() {
    const { argv } = process;
    if (!Array.isArray(argv) || argv.length < 2) {
      return false;
    }

    const scriptPath = argv[1];
    if (typeof scriptPath !== 'string') {
      return false;
    }

    // Normalize path separators for cross-platform compatibility (Windows uses backslashes)
    const normalizedPath = scriptPath.replace(/\\/g, '/');

    // Match the actual MCP server paths:
    // - dist/mcp/mcp/server.js (published package, absolute or relative)
    // - .dev/mcp/server.ts (development mode)
    return (
      normalizedPath.endsWith('/dist/mcp/mcp/server.js') ||
      normalizedPath.endsWith('/.dev/mcp/server.ts') ||
      normalizedPath === 'dist/mcp/mcp/server.js' ||
      normalizedPath === '.dev/mcp/server.ts'
    );
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
          process.env.aidesigner_GLM_API_KEY ||
          process.env.BMAD_GLM_API_KEY ||
          process.env.GLM_API_KEY ||
          process.env.ZHIPUAI_API_KEY
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
        return 'aidesigner_GLM_API_KEY';
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
        return 'glm-4-plus';
      }
      default: {
        return 'claude-3-5-sonnet-20241022';
      }
    }
  }

  /**
   * Validates that an API key is present before making API calls.
   * Throws a descriptive error if no API key is available.
   * @throws {Error} When API key is missing
   */
  validateApiKey() {
    if (!this.apiKey) {
      throw new Error(
        `Cannot call chat methods without an API key. Provider: "${this.provider}". ` +
          `Set the ${this.getApiKeyEnvVarName()} environment variable or provide an apiKey option.`,
      );
    }
  }

  /**
   * Main chat interface - send messages and get responses
   * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - LLM response
   */
  async chat(messages, options = {}) {
    this.validateApiKey();

    const systemPrompt = options.systemPrompt || '';
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 4096;

    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        switch (this.provider) {
          case 'claude': {
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
          case 'glm': {
            return await this.chatGLM(messages, {
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

  /**
   * Send messages to Anthropic's Claude API
   * Messages are formatted with content blocks according to the Claude Messages API specification
   * @see https://docs.anthropic.com/en/api/messages
   * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
   * @param {Object} options - Configuration options (systemPrompt, temperature, maxTokens)
   * @returns {Promise<string>} - Response text from Claude
   */
  async chatAnthropic(messages, options) {
    this.validateApiKey();

    const payload = {
      model: this.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: [
          {
            type: 'text',
            text: msg.content,
          },
        ],
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
    this.validateApiKey();

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
    this.validateApiKey();

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

  async chatGLM(messages, options) {
    this.validateApiKey();

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

    const baseUrl =
      process.env.aidesigner_GLM_BASE_URL ||
      process.env.BMAD_GLM_BASE_URL ||
      process.env.GLM_BASE_URL ||
      'https://open.bigmodel.cn';

    const normalizedBaseUrl = /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`;

    let endpointUrl;
    try {
      endpointUrl = new URL(
        'api/paas/v4/chat/completions',
        normalizedBaseUrl.endsWith('/') ? normalizedBaseUrl : `${normalizedBaseUrl}/`,
      );
    } catch (error) {
      throw new Error(`Invalid GLM base URL: ${error.message}`);
    }

    const response = await this.makeRequest(
      endpointUrl.hostname,
      `${endpointUrl.pathname}${endpointUrl.search}`,
      'POST',
      payload,
      {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      endpointUrl.port ? parseInt(endpointUrl.port, 10) : undefined,
    );

    const choice = response?.choices?.[0];
    if (!choice) {
      throw new Error('GLM response did not include any choices.');
    }

    if (typeof choice.message?.content === 'string') {
      return choice.message.content;
    }

    if (Array.isArray(choice.message?.content)) {
      return choice.message.content.map((part) => part.text || part).join('');
    }

    if (choice.message?.text) {
      return choice.message.text;
    }

    throw new Error('Unable to extract content from GLM response.');
  }

  makeRequest(hostname, path, method, body, headers, port) {
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
