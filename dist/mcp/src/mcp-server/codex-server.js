#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CodexClient = void 0;
const runtime_js_1 = require('./runtime.js');
const operation_policy_js_1 = require('./operation-policy.js');
const codex_config_js_1 = require('./codex-config.js');
const observability_js_1 = require('./observability.js');
const lib_resolver_js_1 = require('./lib-resolver.js');
const { LLMClient } = (0, lib_resolver_js_1.requireLibModule)('llm-client.js');
function parseBoolean(value, defaultValue = false) {
  if (value == null) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized)
    ? true
    : ['0', 'false', 'no', 'off'].includes(normalized)
      ? false
      : defaultValue;
}
function normalizeOperation(operation, metadata) {
  const base = operation.toLowerCase();
  const keys = [base];
  const type = metadata?.type;
  if (typeof type === 'string' && type.trim() !== '') {
    keys.push(`${base}:${type.toLowerCase()}`);
  }
  const lane = metadata?.decision?.lane;
  if (typeof lane === 'string' && lane.trim() !== '') {
    keys.push(`${base}@${lane.toLowerCase()}`);
  }
  return keys;
}
class ModelRouter {
  constructor(defaultRoute, overrides) {
    this.routes = new Map();
    this.defaultRoute = defaultRoute;
    this.routes.set('default', defaultRoute);
    for (const [key, override] of Object.entries(overrides)) {
      if (!override.provider && !override.model && !override.maxTokens) {
        continue;
      }
      this.routes.set(key.toLowerCase(), {
        provider: override.provider ?? defaultRoute.provider,
        model: override.model ?? defaultRoute.model,
        maxTokens: override.maxTokens ?? defaultRoute.maxTokens,
      });
    }
    // Friendly aliases
    const quickRoute = this.routes.get('quick');
    if (quickRoute) {
      this.routes.set('fast', quickRoute);
      this.routes.set('rapid', quickRoute);
    }
    const complexRoute = this.routes.get('complex');
    if (complexRoute) {
      this.routes.set('full', complexRoute);
      this.routes.set('orchestrator', complexRoute);
    }
    const reviewRoute = this.routes.get('review');
    if (reviewRoute) {
      this.routes.set('reviewer', reviewRoute);
      this.routes.set('audit', reviewRoute);
      this.routes.set('governance', reviewRoute);
    }
  }
  resolve(lane) {
    if (!lane) {
      return this.defaultRoute;
    }
    const key = lane.toLowerCase();
    if (this.routes.has(key)) {
      return this.routes.get(key);
    }
    if (key.includes('quick')) {
      const quick = this.routes.get('quick');
      if (quick) {
        return quick;
      }
    }
    if (key.includes('complex') || key.includes('full')) {
      const complex = this.routes.get('complex');
      if (complex) {
        return complex;
      }
    }
    if (key.includes('review') || key.includes('audit') || key.includes('governance')) {
      const review = this.routes.get('review');
      if (review) {
        return review;
      }
    }
    return this.defaultRoute;
  }
  snapshot() {
    return Array.from(this.routes.entries()).map(([key, route]) => ({
      key,
      provider: route.provider,
      model: route.model,
      maxTokens: route.maxTokens,
    }));
  }
  describe() {
    const routes = this.snapshot();
    return routes
      .map(
        (route) =>
          `  ${route.key}: ${route.provider}/${route.model}${route.maxTokens ? ` (max: ${route.maxTokens})` : ''}`,
      )
      .join('\n');
  }
}
class CodexClient {
  constructor(router, approvalMode, autoApprove, approvedOps, policyEnforcer, logger) {
    this.llmCache = new Map();
    this.router = router;
    this.approvalMode = approvalMode;
    this.autoApprove = autoApprove;
    this.approvedOperations = approvedOps;
    this.policyEnforcer = policyEnforcer;
    this.logger =
      logger || (0, observability_js_1.createStructuredLogger)({ name: 'codex-client' });
  }
  static fromEnvironment() {
    const { defaultRoute, overrides } = (0, codex_config_js_1.loadModelRoutingConfig)(process.env);
    const normalizedOverrides = {};
    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        normalizedOverrides[key] = value;
      }
    }
    const router = new ModelRouter(defaultRoute, normalizedOverrides);
    const approvalMode = parseBoolean(process.env.CODEX_APPROVAL_MODE, false);
    const autoApprove = parseBoolean(process.env.CODEX_AUTO_APPROVE, false);
    const approvedOps = new Set(
      (process.env.CODEX_APPROVED_OPERATIONS || '')
        .split(/[;,]/)
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 0),
    );
    const policyPath = process.env.CODEX_POLICY_PATH || process.env.CODEX_POLICY_FILE;
    let policyEnforcer;
    if (policyPath) {
      try {
        policyEnforcer = operation_policy_js_1.OperationPolicyEnforcer.fromFile(policyPath);
      } catch (error) {
        console.error(`[Codex] FATAL: Failed to load policy from ${policyPath}:`, error);
        console.error('[Codex] Server will run WITHOUT policy enforcement');
      }
    }
    return new CodexClient(router, approvalMode, autoApprove, approvedOps, policyEnforcer);
  }
  createLLMClient(lane) {
    const key = (lane || 'default').toLowerCase();
    if (!this.llmCache.has(key)) {
      const stopTimer = this.logger.startTimer();
      const route = this.router.resolve(lane);
      this.llmCache.set(key, new LLMClient({ provider: route.provider, model: route.model }));
      const durationMs = stopTimer();
      this.logger.info('llm_client_initialized', {
        operation: 'create_llm_client',
        lane: key,
        provider: route.provider,
        model: route.model,
        durationMs,
      });
      this.logger.recordTiming('codex.llm_client.init_ms', durationMs, {
        operation: 'create_llm_client',
        lane: key,
      });
    } else {
      this.logger.debug('llm_client_cache_hit', {
        operation: 'create_llm_client',
        lane: key,
      });
    }
    return this.llmCache.get(key);
  }
  async ensureOperationAllowed(operation, metadata) {
    const keys = normalizeOperation(operation, metadata);
    const hasApproval = keys.some((key) => this.approvedOperations.has(key));
    const assessment = this.policyEnforcer?.assess(operation, keys);
    if (assessment?.violation) {
      throw assessment.violation;
    }
    const requiresEscalation = assessment?.requiresEscalation ?? false;
    if (requiresEscalation && !hasApproval) {
      const ruleDescription = assessment?.matchedKey
        ? `policy rule "${assessment.matchedKey}"`
        : 'the configured policy';
      throw new Error(
        `[Codex] Operation "${operation}" requires escalation per ${ruleDescription}. ` +
          `Request approval or add a matching key to CODEX_APPROVED_OPERATIONS.`,
      );
    }
    if (!this.approvalMode) {
      assessment?.commit?.();
      return;
    }
    if (this.autoApprove && !requiresEscalation) {
      assessment?.commit?.();
      return;
    }
    if (hasApproval) {
      assessment?.commit?.();
      return;
    }
    this.logger.error('approval_blocked', {
      operation,
      keys,
    });
    throw new Error(
      `Operation "${operation}" blocked by Codex approval mode. ` +
        `Add it to CODEX_APPROVED_OPERATIONS or set CODEX_AUTO_APPROVE=1 to proceed.`,
    );
  }
  getLogger() {
    return this.logger;
  }
  logStartup() {
    const approvalMode = this.approvalMode ? (this.autoApprove ? 'auto' : 'manual') : 'disabled';
    this.logger.info('codex_startup', {
      approvalMode,
      approvedOperations: Array.from(this.approvedOperations),
      routes: this.router.snapshot(),
    });
    if (this.policyEnforcer?.getSource()) {
      console.error(`[Codex] Operation policy loaded from ${this.policyEnforcer.getSource()}`);
    }
    console.error('[Codex] Model routing:');
    console.error(this.router.describe());
  }
}
exports.CodexClient = CodexClient;
async function main() {
  const codexClient = CodexClient.fromEnvironment();
  codexClient.logStartup();
  const baseLogger = codexClient.getLogger();
  const orchestratorLogger = baseLogger.child({ component: 'mcp-orchestrator' });
  const options = {
    serverInfo: {
      name: 'agilai-codex',
      version: '1.0.0',
    },
    createLLMClient: (lane) => codexClient.createLLMClient(lane),
    ensureOperationAllowed: (operation, metadata) =>
      codexClient.ensureOperationAllowed(operation, metadata),
    logger: orchestratorLogger,
    log: (message) => {
      orchestratorLogger.info('legacy_log', { message });
    },
    onServerReady: () => {
      orchestratorLogger.info('server_ready', {
        event: 'server_ready',
        transport: 'stdio',
      });
    },
  };
  await (0, runtime_js_1.runOrchestratorServer)(options);
}
if (require.main === module) {
  main().catch((error) => {
    console.error('[Codex] Server error:', error);
    process.exit(1);
  });
}
