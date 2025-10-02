#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const llm_client_js_1 = require('../../lib/llm-client.js');
const runtime_js_1 = require('./runtime.js');
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
function parseNumber(value) {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
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
    return this.defaultRoute;
  }
  describe() {
    const entries = Array.from(this.routes.entries())
      .map(
        ([key, route]) =>
          `- ${key}: ${route.provider}/${route.model}${route.maxTokens ? ` (maxTokens=${route.maxTokens})` : ''}`,
      )
      .join('\n');
    return entries;
  }
}
class CodexClient {
  constructor(router, approvalMode, autoApprove, approvedOps) {
    this.llmCache = new Map();
    this.router = router;
    this.approvalMode = approvalMode;
    this.autoApprove = autoApprove;
    this.approvedOperations = approvedOps;
  }
  static fromEnvironment() {
    const defaultProvider =
      process.env.CODEX_DEFAULT_PROVIDER ||
      process.env.CODEX_PROVIDER ||
      process.env.LLM_PROVIDER ||
      'claude';
    const defaultModel =
      process.env.CODEX_DEFAULT_MODEL ||
      process.env.CODEX_MODEL ||
      process.env.LLM_MODEL ||
      'claude-3-5-sonnet-20241022';
    const defaultRoute = {
      provider: defaultProvider,
      model: defaultModel,
      maxTokens: parseNumber(process.env.CODEX_MAX_TOKENS),
    };
    const overrides = {
      quick: {
        provider: process.env.CODEX_QUICK_PROVIDER || undefined,
        model: process.env.CODEX_QUICK_MODEL || undefined,
        maxTokens: parseNumber(process.env.CODEX_QUICK_MAX_TOKENS),
      },
      complex: {
        provider: process.env.CODEX_COMPLEX_PROVIDER || undefined,
        model: process.env.CODEX_COMPLEX_MODEL || undefined,
        maxTokens: parseNumber(process.env.CODEX_COMPLEX_MAX_TOKENS),
      },
    };
    const router = new ModelRouter(defaultRoute, overrides);
    const approvalMode = parseBoolean(process.env.CODEX_APPROVAL_MODE, false);
    const autoApprove = parseBoolean(process.env.CODEX_AUTO_APPROVE, false);
    const approvedOps = new Set(
      (process.env.CODEX_APPROVED_OPERATIONS || '')
        .split(/[;,]/)
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 0),
    );
    return new CodexClient(router, approvalMode, autoApprove, approvedOps);
  }
  createLLMClient(lane) {
    const key = (lane || 'default').toLowerCase();
    if (!this.llmCache.has(key)) {
      const route = this.router.resolve(lane);
      this.llmCache.set(
        key,
        new llm_client_js_1.LLMClient({ provider: route.provider, model: route.model }),
      );
    }
    return this.llmCache.get(key);
  }
  async ensureOperationAllowed(operation, metadata) {
    if (!this.approvalMode) {
      return;
    }
    if (this.autoApprove) {
      return;
    }
    const keys = normalizeOperation(operation, metadata);
    const hasApproval = keys.some((key) => this.approvedOperations.has(key));
    if (hasApproval) {
      return;
    }
    throw new Error(
      `Operation "${operation}" blocked by Codex approval mode. ` +
        `Add it to CODEX_APPROVED_OPERATIONS or set CODEX_AUTO_APPROVE=1 to proceed.`,
    );
  }
  logStartup() {
    if (this.approvalMode) {
      if (this.autoApprove) {
        console.error('[Codex] Approval mode enabled with auto-approval');
      } else {
        console.error(
          '[Codex] Approval mode enabled. Blocked operations must be explicitly allowed via CODEX_APPROVED_OPERATIONS',
        );
      }
    } else {
      console.error('[Codex] Approval mode disabled');
    }
    console.error('[Codex] Model routing:');
    console.error(this.router.describe());
  }
}
async function main() {
  const codexClient = CodexClient.fromEnvironment();
  codexClient.logStartup();
  const options = {
    serverInfo: {
      name: 'bmad-invisible-codex',
      version: '1.0.0',
    },
    createLLMClient: (lane) => codexClient.createLLMClient(lane),
    ensureOperationAllowed: (operation, metadata) =>
      codexClient.ensureOperationAllowed(operation, metadata),
    log: (message) => {
      console.error(message.startsWith('[MCP]') ? message : `[MCP] ${message}`);
    },
    onServerReady: () => {
      console.error('[Codex] BMAD Codex MCP bridge ready on stdio');
    },
  };
  await (0, runtime_js_1.runOrchestratorServer)(options);
}
main().catch((error) => {
  console.error('[Codex] Server error:', error);
  process.exit(1);
});
