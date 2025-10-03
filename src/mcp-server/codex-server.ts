#!/usr/bin/env node
import { LLMClient } from "../../lib/llm-client.js";
import {
  LaneKey,
  OrchestratorServerOptions,
  runOrchestratorServer,
} from "./runtime.js";

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

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
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

  describe(): string {
    const entries = Array.from(this.routes.entries())
      .map(([key, route]) => `- ${key}: ${route.provider}/${route.model}${
        route.maxTokens ? ` (maxTokens=${route.maxTokens})` : ""
      }`)
      .join("\n");

    return entries;
  }
}

class CodexClient {
  private readonly router: ModelRouter;
  private readonly approvalMode: boolean;
  private readonly autoApprove: boolean;
  private readonly approvedOperations: Set<string>;
  private readonly llmCache: Map<string, LLMClient> = new Map();

  constructor(router: ModelRouter, approvalMode: boolean, autoApprove: boolean, approvedOps: Set<string>) {
    this.router = router;
    this.approvalMode = approvalMode;
    this.autoApprove = autoApprove;
    this.approvedOperations = approvedOps;
  }

  static fromEnvironment(): CodexClient {
    const defaultProvider =
      process.env.CODEX_DEFAULT_PROVIDER ||
      process.env.CODEX_PROVIDER ||
      process.env.LLM_PROVIDER ||
      "claude";
    const defaultModel =
      process.env.CODEX_DEFAULT_MODEL ||
      process.env.CODEX_MODEL ||
      process.env.LLM_MODEL ||
      "claude-3-5-sonnet-20241022";

    const defaultRoute: ModelRoute = {
      provider: defaultProvider,
      model: defaultModel,
      maxTokens: parseNumber(process.env.CODEX_MAX_TOKENS),
    };

    const overrides: Record<string, Partial<ModelRoute>> = {
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
      review: {
        provider: process.env.CODEX_REVIEW_PROVIDER || undefined,
        model: process.env.CODEX_REVIEW_MODEL || undefined,
        maxTokens: parseNumber(process.env.CODEX_REVIEW_MAX_TOKENS),
      },
    };

    const router = new ModelRouter(defaultRoute, overrides);
    const approvalMode = parseBoolean(process.env.CODEX_APPROVAL_MODE, false);
    const autoApprove = parseBoolean(process.env.CODEX_AUTO_APPROVE, false);
    const approvedOps = new Set(
      (process.env.CODEX_APPROVED_OPERATIONS || "")
        .split(/[;,]/)
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 0)
    );

    return new CodexClient(router, approvalMode, autoApprove, approvedOps);
  }

  createLLMClient(lane?: LaneKey): LLMClient {
    const key = (lane || "default").toLowerCase();

    if (!this.llmCache.has(key)) {
      const route = this.router.resolve(lane);
      this.llmCache.set(key, new LLMClient({ provider: route.provider, model: route.model }));
    }

    return this.llmCache.get(key)!;
  }

  async ensureOperationAllowed(operation: string, metadata?: Record<string, unknown>): Promise<void> {
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
        `Add it to CODEX_APPROVED_OPERATIONS or set CODEX_AUTO_APPROVE=1 to proceed.`
    );
  }

  logStartup(): void {
    if (this.approvalMode) {
      if (this.autoApprove) {
        console.error("[Codex] Approval mode enabled with auto-approval");
      } else {
        console.error(
          "[Codex] Approval mode enabled. Blocked operations must be explicitly allowed via CODEX_APPROVED_OPERATIONS"
        );
      }
    } else {
      console.error("[Codex] Approval mode disabled");
    }

    console.error("[Codex] Model routing:");
    console.error(this.router.describe());
  }
}

async function main(): Promise<void> {
  const codexClient = CodexClient.fromEnvironment();
  codexClient.logStartup();

  const options: OrchestratorServerOptions = {
    serverInfo: {
      name: "bmad-invisible-codex",
      version: "1.0.0",
    },
    createLLMClient: (lane) => codexClient.createLLMClient(lane),
    ensureOperationAllowed: (operation, metadata) =>
      codexClient.ensureOperationAllowed(operation, metadata),
    log: (message) => {
      console.error(message.startsWith("[MCP]") ? message : `[MCP] ${message}`);
    },
    onServerReady: () => {
      console.error("[Codex] BMAD Codex MCP bridge ready on stdio");
    },
  };

  await runOrchestratorServer(options);
}

main().catch((error) => {
  console.error("[Codex] Server error:", error);
  process.exit(1);
});
