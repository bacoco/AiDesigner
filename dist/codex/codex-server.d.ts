#!/usr/bin/env node
import { LLMClient } from "../../lib/llm-client.js";
import { LaneKey } from "./runtime.js";
import { OperationPolicyEnforcer } from "./operation-policy.js";
import { StructuredLogger } from "./observability.js";
interface ModelRoute {
    provider: string;
    model: string;
    maxTokens?: number;
}
declare class ModelRouter {
    private readonly defaultRoute;
    private readonly routes;
    constructor(defaultRoute: ModelRoute, overrides: Record<string, Partial<ModelRoute>>);
    resolve(lane?: LaneKey): ModelRoute;
    snapshot(): Array<ModelRoute & {
        key: string;
    }>;
    describe(): string;
}
export declare class CodexClient {
    private readonly router;
    private readonly approvalMode;
    private readonly autoApprove;
    private readonly approvedOperations;
    private readonly llmCache;
    private readonly policyEnforcer?;
    private readonly logger;
    constructor(router: ModelRouter, approvalMode: boolean, autoApprove: boolean, approvedOps: Set<string>, policyEnforcer?: OperationPolicyEnforcer, logger?: StructuredLogger);
    static fromEnvironment(): CodexClient;
    createLLMClient(lane?: LaneKey): LLMClient;
    ensureOperationAllowed(operation: string, metadata?: Record<string, unknown>): Promise<void>;
    getLogger(): StructuredLogger;
    logStartup(): void;
}
export {};
