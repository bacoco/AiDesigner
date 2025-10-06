export interface ModelRoute {
    provider: string;
    model: string;
    maxTokens?: number;
}
export type ModelRouteOverride = Partial<ModelRoute>;
type CanonicalRouteKey = keyof typeof ROUTE_ALIAS_GROUPS;
declare const ROUTE_ALIAS_GROUPS: {
    readonly quick: readonly ["quick", "fast", "rapid"];
    readonly complex: readonly ["complex", "full", "orchestrator"];
    readonly review: readonly ["review", "reviewer", "audit", "governance"];
};
export interface CodexRoutingConfig {
    defaultRoute: ModelRoute;
    overrides: Partial<Record<CanonicalRouteKey, ModelRouteOverride>>;
}
export declare function loadModelRoutingConfig(env: NodeJS.ProcessEnv): CodexRoutingConfig;
export declare const ROUTE_ALIASES: Record<CanonicalRouteKey, readonly string[]>;
export {};
