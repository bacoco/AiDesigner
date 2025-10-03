/**
 * Assistant Environment Configuration
 * Manages environment variables for different AI assistant providers (GLM, etc.)
 */

/**
 * Get the configured assistant provider from environment
 * @returns {string} Provider name (normalized to lowercase)
 */
const getAssistantProvider = () =>
  (process.env.BMAD_ASSISTANT_PROVIDER || '').trim().toLowerCase();

/**
 * Build spawn environment for assistant CLI with GLM support
 * @returns {{ env: NodeJS.ProcessEnv, isGlm: boolean }} Environment and GLM flag
 */
const buildAssistantSpawnEnv = () => {
  const provider = getAssistantProvider();
  if (provider !== 'glm') {
    return { env: process.env, isGlm: false };
  }

  // Helper to find first available environment variable value
  const preferEnvValue = (...keys) => {
    for (const key of keys) {
      const value = process.env[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
    return undefined;
  };

  const env = { ...process.env };
  const baseUrl = preferEnvValue('BMAD_GLM_BASE_URL', 'GLM_BASE_URL', 'ANTHROPIC_BASE_URL');
  const authToken = preferEnvValue('BMAD_GLM_AUTH_TOKEN', 'GLM_AUTH_TOKEN', 'ANTHROPIC_AUTH_TOKEN');
  const apiKey = preferEnvValue('BMAD_GLM_API_KEY', 'GLM_API_KEY', 'ANTHROPIC_API_KEY');

  // Validate that at least one required credential is present
  if (!baseUrl && !apiKey) {
    console.error(
      '❌ GLM mode requires at least one of: BMAD_GLM_BASE_URL, GLM_BASE_URL, BMAD_GLM_API_KEY, or GLM_API_KEY',
    );
    process.exit(1);
  }

  // Set Anthropic-compatible environment variables for GLM
  if (baseUrl !== undefined) {
    env.ANTHROPIC_BASE_URL = baseUrl;
  } else {
    delete env.ANTHROPIC_BASE_URL;
  }

  if (authToken !== undefined) {
    env.ANTHROPIC_AUTH_TOKEN = authToken;
  } else {
    delete env.ANTHROPIC_AUTH_TOKEN;
  }

  if (apiKey !== undefined) {
    env.ANTHROPIC_API_KEY = apiKey;
  } else {
    delete env.ANTHROPIC_API_KEY;
  }

  env.LLM_PROVIDER = 'glm';

  return { env, isGlm: true };
};

module.exports = { getAssistantProvider, buildAssistantSpawnEnv };
