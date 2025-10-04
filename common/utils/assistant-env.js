/**
 * Assistant Environment Configuration
 * Manages environment variables for different AI assistant providers (GLM, etc.)
 */

/**
 * Get the configured assistant provider from environment
 * @returns {string} Provider name (normalized to lowercase)
 */
const normalizeProvider = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

/**
 * Determines the active assistant provider with fallback logic.
 *
 * Precedence:
 * 1. BMAD_ASSISTANT_PROVIDER (if not 'anthropic')
 * 2. LLM_PROVIDER (fallback when BMAD_ASSISTANT_PROVIDER is unset or 'anthropic')
 * 3. BMAD_ASSISTANT_PROVIDER value (if it was 'anthropic')
 *
 * This allows GLM credentials to propagate via LLM_PROVIDER when the assistant
 * provider is explicitly set to 'anthropic' or left unset, enabling --glm flag
 * to override the default Anthropic provider.
 */
const getAssistantProvider = () => {
  const directCandidates = [
    normalizeProvider(process.env.AGILAI_ASSISTANT_PROVIDER),
    normalizeProvider(process.env.BMAD_ASSISTANT_PROVIDER),
  ];

  for (const provider of directCandidates) {
    if (provider && provider !== 'anthropic') {
      return provider;
    }
  }

  const fallbackProvider = normalizeProvider(process.env.LLM_PROVIDER);
  if (fallbackProvider) {
    return fallbackProvider;
  }

  for (const provider of directCandidates) {
    if (provider) {
      return provider;
    }
  }

  return '';
};

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
    return;
  };

  const env = { ...process.env };

  // Check if any GLM-specific variables are set
  const hasGlmVars = !!(
    process.env.AGILAI_GLM_BASE_URL ||
    process.env.BMAD_GLM_BASE_URL ||
    process.env.GLM_BASE_URL ||
    process.env.AGILAI_GLM_AUTH_TOKEN ||
    process.env.BMAD_GLM_AUTH_TOKEN ||
    process.env.GLM_AUTH_TOKEN ||
    process.env.AGILAI_GLM_API_KEY ||
    process.env.BMAD_GLM_API_KEY ||
    process.env.GLM_API_KEY ||
    process.env.ZHIPUAI_API_KEY
  );

  // Only use ANTHROPIC_* as fallback if NO GLM-specific variables are set
  const baseUrl = hasGlmVars
    ? preferEnvValue('AGILAI_GLM_BASE_URL', 'BMAD_GLM_BASE_URL', 'GLM_BASE_URL')
    : preferEnvValue(
        'AGILAI_GLM_BASE_URL',
        'BMAD_GLM_BASE_URL',
        'GLM_BASE_URL',
        'ANTHROPIC_BASE_URL',
      );
  const authToken = hasGlmVars
    ? preferEnvValue('AGILAI_GLM_AUTH_TOKEN', 'BMAD_GLM_AUTH_TOKEN', 'GLM_AUTH_TOKEN')
    : preferEnvValue(
        'AGILAI_GLM_AUTH_TOKEN',
        'BMAD_GLM_AUTH_TOKEN',
        'GLM_AUTH_TOKEN',
        'ANTHROPIC_AUTH_TOKEN',
      );
  const apiKey = hasGlmVars
    ? preferEnvValue('AGILAI_GLM_API_KEY', 'BMAD_GLM_API_KEY', 'GLM_API_KEY', 'ZHIPUAI_API_KEY')
    : preferEnvValue(
        'AGILAI_GLM_API_KEY',
        'BMAD_GLM_API_KEY',
        'GLM_API_KEY',
        'ZHIPUAI_API_KEY',
        'ANTHROPIC_API_KEY',
      );

  // Validate that at least one required credential is present
  if (!baseUrl && !apiKey) {
    console.error(
      '❌ GLM mode requires at least one of: AGILAI_GLM_BASE_URL, BMAD_GLM_BASE_URL, GLM_BASE_URL, AGILAI_GLM_API_KEY, BMAD_GLM_API_KEY, GLM_API_KEY, or ZHIPUAI_API_KEY',
    );
    // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit -- CLI utility needs to exit on invalid config
    process.exit(1);
  }

  // Ensure Agilai-prefixed environment variables are propagated
  if (baseUrl === undefined) {
    delete env.AGILAI_GLM_BASE_URL;
  } else {
    env.AGILAI_GLM_BASE_URL = baseUrl;
  }

  if (authToken === undefined) {
    delete env.AGILAI_GLM_AUTH_TOKEN;
  } else {
    env.AGILAI_GLM_AUTH_TOKEN = authToken;
  }

  if (apiKey === undefined) {
    delete env.AGILAI_GLM_API_KEY;
  } else {
    env.AGILAI_GLM_API_KEY = apiKey;
  }

  // Set Anthropic-compatible environment variables for GLM
  if (baseUrl === undefined) {
    delete env.ANTHROPIC_BASE_URL;
  } else {
    env.ANTHROPIC_BASE_URL = baseUrl;
  }

  if (authToken === undefined) {
    delete env.ANTHROPIC_AUTH_TOKEN;
  } else {
    env.ANTHROPIC_AUTH_TOKEN = authToken;
  }

  if (apiKey === undefined) {
    delete env.ANTHROPIC_API_KEY;
  } else {
    env.ANTHROPIC_API_KEY = apiKey;
  }

  env.LLM_PROVIDER = 'glm';
  env.AGILAI_ASSISTANT_PROVIDER = 'glm';
  if (process.env.BMAD_ASSISTANT_PROVIDER) {
    env.BMAD_ASSISTANT_PROVIDER = 'glm';
  }

  return { env, isGlm: true };
};

// eslint-disable-next-line unicorn/prefer-module -- CommonJS module for compatibility with existing tooling
module.exports = { getAssistantProvider, buildAssistantSpawnEnv };
