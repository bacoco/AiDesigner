export type JSONSchema = Record<string, unknown>;
/**
 * Snapshot of the V6 tool invocation envelope. V6 exposes tools through
 * "toolsets" (e.g. `orchestrator`, `analysis`) and each invocation supplies
 * the tool identifier plus a strongly-typed payload.
 */
export interface V6ToolInvocationRequest {
    /** Tool identifier, typically `<toolset>.<tool>` */
    tool: string;
    /** Optional semantic version exposed by V6 tool registry */
    version?: string;
    /** Arbitrary payload forwarded to the tool */
    payload?: Record<string, unknown>;
    /**
     * Contextual metadata passed from the V6 runtime. Includes routing hints
     * such as the active phase, lane, or workflow scope.
     */
    context?: {
        projectId?: string;
        phase?: string;
        lane?: string;
        /**
         * V6 workflows attach correlation identifiers so downstream systems can
         * stitch responses back to orchestration logs.
         */
        correlationId?: string;
        [key: string]: unknown;
    };
}
export interface V6ToolInvocationResponse {
    tool: string;
    version?: string;
    /**
     * V6 returns the raw MCP payload as `data`. We surface the original MCP
     * structure so the caller can forward it back to the V6 runtime without
     * additional massaging.
     */
    data: unknown;
    error?: {
        message: string;
    };
}
export interface LegacyToolDefinition {
    name: string;
    description?: string;
    inputSchema?: JSONSchema;
}
export interface V6ToolDefinition {
    id: string;
    title: string;
    summary?: string;
    version: string;
    input: JSONSchema | undefined;
    output?: JSONSchema;
    metadata?: Record<string, unknown>;
}
/**
 * Translate a V6 invocation into the `CallTool` parameters expected by the
 * MCP server. Unknown tools are passed through so upstream error handling can
 * surface a clear unsupported-tool response.
 */
export declare function mapV6InvocationToLegacy(invocation: V6ToolInvocationRequest): {
    name: string;
    args: Record<string, unknown>;
};
/**
 * Wrap an MCP tool response so it matches the V6 contract. The adapter embeds
 * the original data payload which lets V6 continue processing without custom
 * parsing logic on the V6 side.
 */
export declare function mapLegacyResultToV6(tool: string, data: unknown, error?: Error | string): V6ToolInvocationResponse;
/**
 * Convert the legacy tool listing into the richer metadata-oriented catalog
 * format used by V6. The adapter preserves descriptions and JSON schemas so we
 * can expose them through the new discovery APIs without re-writing every
 * handler.
 */
export declare function projectLegacyToolsToV6Catalog(tools: LegacyToolDefinition[], { defaultVersion, titlePrefix, }?: {
    defaultVersion?: string;
    titlePrefix?: string;
}): V6ToolDefinition[];
/**
 * Utility to surface the adapter mappings for diagnostics or documentation.
 */
export declare function describeToolBridging(): string;
