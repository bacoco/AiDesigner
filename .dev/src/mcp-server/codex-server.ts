#!/usr/bin/env node
import {
  LaneKey,
  OrchestratorServerOptions,
  runOrchestratorServer,
} from "./runtime.js";
import { OperationPolicyEnforcer } from "./operation-policy.js";
import { loadModelRoutingConfig } from "./codex-config.js";
import { StructuredLogger, createStructuredLogger } from "./observability.js";
import { requireLibModule } from "./lib-resolver.js";

type LLMClientModule = typeof import("../../lib/llm-client.js");
type LLMClientCtor = LLMClientModule["LLMClient"];
type LLMClientInstance = InstanceType<LLMClientCtor>;

const { LLMClient } = requireLibModule<LLMClientModule>("llm-client.js");

interface ModelRoute {
  provider: string;
  model: string;
  maxTokens?: number;
}

function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value == null) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized)
    ? true
    : ["0", "false", "no", "off"].includes(normalized)
    ? false
    : defaultValue;
}

function normalizeOperation(operation: string, metadata?: Record<string, unknown>): string[] {
  const base = operation.toLowerCase();
  const keys = [base];

  const type = metadata?.type;
  if (typeof type === "string" && type.trim() !== "") {
    keys.push(`${base}:${type.toLowerCase()}`);
  }

  const lane = (metadata as { decision?: { lane?: string } } | undefined)?.decision?.lane;
  if (typeof lane === "string" && lane.trim() !== "") {
    keys.push(`${base}@${lane.toLowerCase()}`);
  }

  return keys;
}

class ModelRouter {
  private readonly defaultRoute: ModelRoute;
  private readonly routes: Map<string, ModelRoute> = new Map();

  constructor(defaultRoute: ModelRoute, overrides: Record<string, Partial<ModelRoute>>) {
    this.defaultRoute = defaultRoute;
    this.routes.set("default", defaultRoute);

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
    const quickRoute = this.routes.get("quick");
    if (quickRoute) {
      this.routes.set("fast", quickRoute);
      this.routes.set("rapid", quickRoute);
    }

    const complexRoute = this.routes.get("complex");
    if (complexRoute) {
      this.routes.set("full", complexRoute);
      this.routes.set("orchestrator", complexRoute);
    }

    const reviewRoute = this.routes.get("review");
    if (reviewRoute) {
      this.routes.set("reviewer", reviewRoute);
      this.routes.set("audit", reviewRoute);
      this.routes.set("governance", reviewRoute);
    }
  }

  resolve(lane?: LaneKey): ModelRoute {
    if (!lane) {
      return this.defaultRoute;
    }

    const key = lane.toLowerCase();

    if (this.routes.has(key)) {
      return this.routes.get(key)!;
    }

    if (key.includes("quick")) {
      const quick = this.routes.get("quick");
      if (quick) {
        return quick;
      }
    }

    if (key.includes("complex") || key.includes("full")) {
      const complex = this.routes.get("complex");
      if (complex) {
        return complex;
      }
    }

    if (key.includes("review") || key.includes("audit") || key.includes("governance")) {
      const review = this.routes.get("review");
      if (review) {
        return review;
      }
    }

    return this.defaultRoute;
  }

  snapshot(): Array<ModelRoute & { key: string }> {
    return Array.from(this.routes.entries()).map(([key, route]) => ({
      key,
      provider: route.provider,
      model: route.model,
      maxTokens: route.maxTokens,
    }));
  }

  describe(): string {
    const routes = this.snapshot();
    return routes
      .map((route) => `  ${route.key}: ${route.provider}/${route.model}${route.maxTokens ? ` (max: ${route.maxTokens})` : ""}`)
      .join("\n");
  }
}

export class CodexClient {
  private readonly router: ModelRouter;
  private readonly approvalMode: boolean;
  private readonly autoApprove: boolean;
  private readonly approvedOperations: Set<string>;
  private readonly llmCache: Map<string, LLMClientInstance> = new Map();
  private readonly policyEnforcer?: OperationPolicyEnforcer;
  private readonly logger: StructuredLogger;

  constructor(
    router: ModelRouter,
    approvalMode: boolean,
    autoApprove: boolean,
    approvedOps: Set<string>,
    policyEnforcer?: OperationPolicyEnforcer,
    logger?: StructuredLogger
  ) {
    this.router = router;
    this.approvalMode = approvalMode;
    this.autoApprove = autoApprove;
    this.approvedOperations = approvedOps;
    this.policyEnforcer = policyEnforcer;
    this.logger = logger || createStructuredLogger({ name: "codex-client" });
  }

  static fromEnvironment(): CodexClient {
    const { defaultRoute, overrides } = loadModelRoutingConfig(process.env);

    const normalizedOverrides: Record<string, Partial<ModelRoute>> = {};
    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        normalizedOverrides[key] = value;
      }
    }

    const router = new ModelRouter(defaultRoute, normalizedOverrides);
    const approvalMode = parseBoolean(process.env.CODEX_APPROVAL_MODE, false);
    const autoApprove = parseBoolean(process.env.CODEX_AUTO_APPROVE, false);
    const approvedOps = new Set(
      (process.env.CODEX_APPROVED_OPERATIONS || "")
        .split(/[;,]/)
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 0)
    );

    const policyPath = process.env.CODEX_POLICY_PATH || process.env.CODEX_POLICY_FILE;
    let policyEnforcer: OperationPolicyEnforcer | undefined;

    if (policyPath) {
      try {
        policyEnforcer = OperationPolicyEnforcer.fromFile(policyPath);
      } catch (error) {
        console.error(`[Codex] FATAL: Failed to load policy from ${policyPath}:`, error);
        console.error('[Codex] Server will run WITHOUT policy enforcement');
      }
    }

    return new CodexClient(router, approvalMode, autoApprove, approvedOps, policyEnforcer);
  }

  createLLMClient(lane?: LaneKey): LLMClientInstance {
    const key = (lane || "default").toLowerCase();

    if (!this.llmCache.has(key)) {
      const stopTimer = this.logger.startTimer();
      const route = this.router.resolve(lane);
      this.llmCache.set(key, new LLMClient({ provider: route.provider, model: route.model }));

      const durationMs = stopTimer();
      this.logger.info("llm_client_initialized", {
        operation: "create_llm_client",
        lane: key,
        provider: route.provider,
        model: route.model,
        durationMs,
      });
      this.logger.recordTiming("codex.llm_client.init_ms", durationMs, {
        operation: "create_llm_client",
        lane: key,
      });
    } else {
      this.logger.debug("llm_client_cache_hit", {
        operation: "create_llm_client",
        lane: key,
      });
    }

    return this.llmCache.get(key)!;
  }

  async ensureOperationAllowed(operation: string, metadata?: Record<string, unknown>): Promise<void> {
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
        : "the configured policy";

      throw new Error(
        `[Codex] Operation "${operation}" requires escalation per ${ruleDescription}. ` +
          `Request approval or add a matching key to CODEX_APPROVED_OPERATIONS.`
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

    this.logger.error("approval_blocked", {
      operation,
      keys,
    });

    throw new Error(
      `Operation "${operation}" blocked by Codex approval mode. ` +
        `Add it to CODEX_APPROVED_OPERATIONS or set CODEX_AUTO_APPROVE=1 to proceed.`
    );
  }

  getLogger(): StructuredLogger {
    return this.logger;
  }

  logStartup(): void {
    const approvalMode = this.approvalMode
      ? this.autoApprove
        ? "auto"
        : "manual"
      : "disabled";

    this.logger.info("codex_startup", {
      approvalMode,
      approvedOperations: Array.from(this.approvedOperations),
      routes: this.router.snapshot(),
    });

    if (this.policyEnforcer?.getSource()) {
      console.error(`[Codex] Operation policy loaded from ${this.policyEnforcer.getSource()}`);
    }

    console.error("[Codex] Model routing:");
    console.error(this.router.describe());
  }
}

async function main(): Promise<void> {
  const codexClient = CodexClient.fromEnvironment();
  codexClient.logStartup();

  const baseLogger = codexClient.getLogger();
  const orchestratorLogger = baseLogger.child({ component: "mcp-orchestrator" });

  const options: OrchestratorServerOptions = {
    serverInfo: {
      name: "aidesigner-codex",
      version: "1.0.0",
    },
    createLLMClient: (lane) => codexClient.createLLMClient(lane),
    ensureOperationAllowed: (operation, metadata) =>
      codexClient.ensureOperationAllowed(operation, metadata),
    logger: orchestratorLogger,
    log: (message) => {
      orchestratorLogger.info("legacy_log", { message });
    },
    onServerReady: () => {
      orchestratorLogger.info("server_ready", {
        event: "server_ready",
        transport: "stdio",
      });
    },
  };

  await runOrchestratorServer(options);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[Codex] Server error:", error);
    process.exit(1);
  });
}
