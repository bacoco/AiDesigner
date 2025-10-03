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
  error?: { message: string };
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

const V6_TO_LEGACY_TOOL_MAP: Record<string, string> = {
  "project.context": "get_project_context",
  "phase.detect": "detect_phase",
  "persona.load": "load_agent_persona",
  "phase.transition": "transition_phase",
  "deliverable.generate": "generate_deliverable",
  "decision.record": "record_decision",
  "conversation.append": "add_conversation_message",
  "project.summary": "get_project_summary",
  "agents.list": "list_bmad_agents",
  "workflow.phase.run": "execute_bmad_workflow",
  "codebase.scan": "scan_codebase",
  "documents.detect": "detect_existing_docs",
  "state.resume": "load_previous_state",
  "codebase.summary": "get_codebase_summary",
  "lane.select": "select_development_lane",
  "workflow.dev.execute": "execute_workflow",
};

const LEGACY_TO_V6_TOOL_MAP: Record<string, string> = Object.entries(
  V6_TO_LEGACY_TOOL_MAP
).reduce<Record<string, string>>((acc, [v6, legacy]) => {
  acc[legacy] = v6;
  return acc;
}, {});

/**
 * Translate a V6 invocation into the `CallTool` parameters expected by the
 * MCP server. Unknown tools are passed through so upstream error handling can
 * surface a clear unsupported-tool response.
 */
export function mapV6InvocationToLegacy(
  invocation: V6ToolInvocationRequest
): { name: string; args: Record<string, unknown> } {
  const legacyName = V6_TO_LEGACY_TOOL_MAP[invocation.tool] ?? invocation.tool;

  const args: Record<string, unknown> = {
    ...(invocation.payload ?? {}),
  };

  if (invocation.context?.phase && !args.phase) {
    args.phase = invocation.context.phase;
  }

  if (invocation.context?.lane && !args.context) {
    args.context = { lane: invocation.context.lane };
  } else if (invocation.context?.lane && args.context) {
    const context = args.context as Record<string, unknown>;
    if (typeof context === "object" && context !== null) {
      context.lane ??= invocation.context.lane;
    }
  }

  return { name: legacyName, args };
}

/**
 * Wrap an MCP tool response so it matches the V6 contract. The adapter embeds
 * the original data payload which lets V6 continue processing without custom
 * parsing logic on the V6 side.
 */
export function mapLegacyResultToV6(
  tool: string,
  data: unknown,
  error?: Error | string
): V6ToolInvocationResponse {
  const v6Tool = LEGACY_TO_V6_TOOL_MAP[tool] ?? tool;

  return {
    tool: v6Tool,
    data,
    ...(error
      ? { error: { message: typeof error === "string" ? error : error.message } }
      : {}),
  };
}

const TOOL_METADATA: Record<string, Partial<V6ToolDefinition>> = {
  "get_project_context": {
    metadata: { scope: "project", phase: "any" },
  },
  detect_phase: {
    metadata: { scope: "phase", tags: ["classification"] },
  },
  load_agent_persona: {
    metadata: { scope: "agent", tags: ["persona"] },
  },
  transition_phase: {
    metadata: { scope: "phase", tags: ["mutation"] },
  },
  generate_deliverable: {
    metadata: { scope: "artifact" },
  },
  record_decision: {
    metadata: { scope: "project", tags: ["audit"] },
  },
  add_conversation_message: {
    metadata: { scope: "conversation" },
  },
  get_project_summary: {
    metadata: { scope: "project" },
  },
  list_bmad_agents: {
    metadata: { scope: "agent", tags: ["discovery"] },
  },
  execute_bmad_workflow: {
    metadata: { scope: "workflow", phase: "explicit" },
  },
  scan_codebase: {
    metadata: { scope: "codebase" },
  },
  detect_existing_docs: {
    metadata: { scope: "codebase", tags: ["discovery"] },
  },
  load_previous_state: {
    metadata: { scope: "state" },
  },
  get_codebase_summary: {
    metadata: { scope: "codebase", tags: ["summary"] },
  },
  select_development_lane: {
    metadata: { scope: "workflow", tags: ["routing"] },
  },
  execute_workflow: {
    metadata: { scope: "workflow", tags: ["automation"] },
  },
};

/**
 * Convert the legacy tool listing into the richer metadata-oriented catalog
 * format used by V6. The adapter preserves descriptions and JSON schemas so we
 * can expose them through the new discovery APIs without re-writing every
 * handler.
 */
export function projectLegacyToolsToV6Catalog(
  tools: LegacyToolDefinition[],
  {
    defaultVersion = "1.0.0",
    titlePrefix = "Invisible",
  }: { defaultVersion?: string; titlePrefix?: string } = {}
): V6ToolDefinition[] {
  return tools.map((tool) => {
    const v6Id = LEGACY_TO_V6_TOOL_MAP[tool.name] ?? tool.name;
    const metadata = TOOL_METADATA[tool.name]?.metadata;

    return {
      id: v6Id,
      title: `${titlePrefix} :: ${tool.description ?? tool.name}`,
      summary: tool.description,
      version: defaultVersion,
      input: tool.inputSchema,
      metadata,
    } satisfies V6ToolDefinition;
  });
}

/**
 * Utility to surface the adapter mappings for diagnostics or documentation.
 */
export function describeToolBridging(): string {
  return Object.entries(LEGACY_TO_V6_TOOL_MAP)
    .map(([legacy, v6]) => `${legacy} -> ${v6}`)
    .join("\n");
}
