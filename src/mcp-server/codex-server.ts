import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as path from "path";
import * as fs from "fs/promises";
import {
  BMADRuntime,
  ModelRouter,
  ApprovalChecker,
  StateBridgeHooks,
} from "../../mcp/runtime.js";

interface CodexConfig {
  codex?: {
    name?: string;
  };
  models?: {
    provider?: string;
    default?: string;
    apiKey?: string;
    overrides?: Record<string, string>;
    phases?: Record<string, string>;
  };
  approvals?: {
    require?: string[];
    auto?: string[];
    default?: "auto" | "require" | "prompt";
    message?: string;
  };
  state?: {
    projectRoot?: string;
    conversationSync?: boolean;
    conversationLimit?: number;
    conversationTag?: string;
    persistAssistantResponses?: boolean;
  };
}

interface CodexMeta {
  approved?: boolean;
  approval?: boolean;
  approvalToken?: string;
  conversation?: Array<{
    role?: string;
    content?: string;
    timestamp?: string;
    id?: string;
  }>;
  userMessage?: string;
  stateUpdates?: Record<string, unknown>;
  preferredModel?: string;
  model?: string;
}

function stripInlineComment(line: string): string {
  let inString = false;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === "\\" && !escaped) {
      escaped = true;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
    }

    if (char === "#" && !inString) {
      return line.slice(0, index).trimEnd();
    }

    escaped = false;
  }

  return line.trimEnd();
}

function parseTomlValue(raw: string): any {
  const trimmed = raw.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }

    const segments: string[] = [];
    let buffer = "";
    let inString = false;
    let escaped = false;

    for (const char of inner) {
      if (char === "\\" && !escaped) {
        escaped = true;
        buffer += char;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
      }

      if (char === "," && !inString) {
        segments.push(buffer.trim());
        buffer = "";
      } else {
        buffer += char;
      }

      escaped = false;
    }

    if (buffer.trim().length > 0) {
      segments.push(buffer.trim());
    }

    return segments.map((segment) => parseTomlValue(segment));
  }

  return trimmed;
}

function parseToml(content: string): CodexConfig {
  const result: Record<string, any> = {};
  let current: Record<string, any> = result;

  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const withoutComment = stripInlineComment(rawLine).trim();

    if (!withoutComment) {
      continue;
    }

    if (withoutComment.startsWith("[") && withoutComment.endsWith("]")) {
      const tablePath = withoutComment.slice(1, -1).trim();
      const segments = tablePath.split(".");
      current = result;

      for (const segment of segments) {
        if (!segment) {
          continue;
        }

        if (typeof current[segment] !== "object" || current[segment] === null) {
          current[segment] = {};
        }

        current = current[segment];
      }

      continue;
    }

    const equalsIndex = withoutComment.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = withoutComment.slice(0, equalsIndex).trim();
    const value = withoutComment.slice(equalsIndex + 1).trim();

    if (!key) {
      continue;
    }

    current[key] = parseTomlValue(value);
  }

  return result as CodexConfig;
}

async function loadCodexConfig(): Promise<CodexConfig> {
  const candidates: string[] = [];

  if (process.env.CODEX_CONFIG && process.env.CODEX_CONFIG.trim().length > 0) {
    candidates.push(path.resolve(process.cwd(), process.env.CODEX_CONFIG));
  }

  candidates.push(
    path.resolve(process.cwd(), "codex-config.toml"),
    path.resolve(process.cwd(), ".codex", "config.toml"),
  );

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (!stat.isFile()) {
        continue;
      }

      const raw = await fs.readFile(candidate, "utf8");
      const parsed = parseToml(raw) as CodexConfig;
      console.error(`[Codex] Loaded configuration from ${candidate}`);
      return parsed;
    } catch (error) {
      // Ignore missing files or parse errors, fall back to defaults
    }
  }

  console.error("[Codex] No codex-config.toml found. Using default settings.");
  return {};
}

function resolveProjectRoot(config: CodexConfig): string | undefined {
  if (!config.state?.projectRoot) {
    return undefined;
  }

  return path.resolve(process.cwd(), config.state.projectRoot);
}

function buildLLMOptions(config: CodexConfig): Record<string, unknown> {
  const options: Record<string, unknown> = {};

  if (config.models?.provider) {
    options.provider = config.models.provider;
  }

  if (config.models?.default) {
    options.model = config.models.default;
  }

  if (config.models?.apiKey) {
    options.apiKey = config.models.apiKey;
  }

  return options;
}

function extractCodexMeta(value: unknown): { meta?: CodexMeta; args: unknown } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { args: value };
  }

  const record = value as Record<string, unknown>;

  if (!Object.prototype.hasOwnProperty.call(record, "__codex")) {
    return { args: value };
  }

  const { __codex, ...rest } = record;
  const cleanedArgs = Object.keys(rest).length > 0 ? rest : undefined;

  return { meta: (__codex ?? undefined) as CodexMeta | undefined, args: cleanedArgs };
}

function buildModelRouter(config: CodexConfig): ModelRouter {
  const overrides = new Map(
    Object.entries(config.models?.overrides ?? {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
  const phaseOverrides = config.models?.phases ?? {};

  return ({ tool, meta, context }) => {
    const metaObj = meta as CodexMeta | undefined;

    if (metaObj?.preferredModel) {
      return metaObj.preferredModel;
    }

    if (metaObj?.model) {
      return metaObj.model;
    }

    const override = overrides.get(tool.toLowerCase());
    if (override) {
      return override;
    }

    const currentPhase = context.projectState?.state?.currentPhase;
    if (currentPhase && phaseOverrides[currentPhase]) {
      return phaseOverrides[currentPhase];
    }

    return null;
  };
}

function buildApprovalChecker(config: CodexConfig): ApprovalChecker {
  const requireSet = new Set(
    (config.approvals?.require ?? []).map((name) => name.toLowerCase()),
  );
  const autoSet = new Set((config.approvals?.auto ?? []).map((name) => name.toLowerCase()));
  const mode = config.approvals?.default ?? "prompt";
  const fallbackMessage =
    config.approvals?.message ??
    "Codex requires approval for this action. Re-run the tool with __codex.approved set to true to continue.";

  return ({ tool, meta }) => {
    const normalized = tool.toLowerCase();
    const metaObj = (meta as CodexMeta | undefined) ?? {};

    if (autoSet.has(normalized) || (mode === "auto" && !requireSet.has(normalized))) {
      return { approved: true };
    }

    const shouldRequire =
      requireSet.has(normalized) ||
      (mode === "prompt" && !autoSet.has(normalized));

    if (!shouldRequire && mode !== "require") {
      return { approved: true };
    }

    if (
      metaObj.approved === true ||
      metaObj.approval === true ||
      metaObj.approvalToken === "approved"
    ) {
      return { approved: true };
    }

    return {
      approved: false,
      message: fallbackMessage,
    };
  };
}

function buildStateBridge(
  config: CodexConfig,
  conversationCache: Set<string>,
): StateBridgeHooks {
  const conversationEnabled = config.state?.conversationSync !== false;
  const limit = config.state?.conversationLimit ?? 50;
  const tag = config.state?.conversationTag ?? "codex";
  const persistAssistant = config.state?.persistAssistantResponses !== false;

  function rememberSignature(message: { role?: string; content?: string; timestamp?: string }) {
    const role = message.role ?? "unknown";
    const content = message.content ?? "";
    const stamp = message.timestamp ?? "";
    return `${role}:${content}:${stamp}`;
  }

  function trimCache() {
    if (conversationCache.size > 2048) {
      conversationCache.clear();
    }
  }

  return {
    beforeCall: async ({ meta, context }) => {
      if (!conversationEnabled || !context.projectState) {
        return;
      }

      const metaObj = meta as CodexMeta | undefined;
      if (!metaObj) {
        return;
      }

      const conversation = Array.isArray(metaObj.conversation)
        ? metaObj.conversation.slice(-limit)
        : [];

      for (const message of conversation) {
        if (!message?.content || !message?.role) {
          continue;
        }

        const signature = rememberSignature(message);
        if (conversationCache.has(signature)) {
          continue;
        }

        try {
          await context.projectState.addMessage(message.role, message.content, {
            source: tag,
            codexTimestamp: message.timestamp,
          });
          conversationCache.add(signature);
        } catch (error) {
          console.error(
            `[Codex] Failed to sync conversation message: ${
              error instanceof Error ? error.message : error
            }`,
          );
        }
      }

      if (typeof metaObj.userMessage === "string" && metaObj.userMessage.trim().length > 0) {
        const signature = rememberSignature({ role: "user", content: metaObj.userMessage });
        if (!conversationCache.has(signature)) {
          try {
            await context.projectState.addMessage("user", metaObj.userMessage, {
              source: tag,
              codexInjected: true,
            });
            conversationCache.add(signature);
          } catch (error) {
            console.error(
              `[Codex] Failed to record user message: ${
                error instanceof Error ? error.message : error
              }`,
            );
          }
        }
      }

      if (metaObj.stateUpdates && typeof metaObj.stateUpdates === "object") {
        try {
          await context.projectState.updateState(metaObj.stateUpdates);
        } catch (error) {
          console.error(
            `[Codex] Failed to merge state updates: ${
              error instanceof Error ? error.message : error
            }`,
          );
        }
      }

      trimCache();
    },
    afterCall: async ({ tool, result, context }) => {
      if (!persistAssistant || !context.projectState) {
        return;
      }

      const message = extractPrimaryText(result);
      if (!message) {
        return;
      }

      try {
        await context.projectState.addMessage("assistant", message, {
          source: `${tag}:${tool}`,
        });
      } catch (error) {
        console.error(
          `[Codex] Failed to persist tool response: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    },
  };
}

function extractPrimaryText(result: any): string | null {
  if (!result || !Array.isArray(result.content)) {
    return null;
  }

  for (const item of result.content) {
    if (item && item.type === "text" && typeof item.text === "string") {
      return item.text.length > 2000 ? `${item.text.slice(0, 2000)}…` : item.text;
    }
  }

  return null;
}

async function main() {
  const config = await loadCodexConfig();
  const conversationCache = new Set<string>();

  const runtime = new BMADRuntime({
    projectPath: resolveProjectRoot(config),
    llmClientOptions: buildLLMOptions(config),
  });

  const modelRouter = buildModelRouter(config);
  const approvalChecker = buildApprovalChecker(config);
  const stateBridge = buildStateBridge(config, conversationCache);

  const server = new Server(
    {
      name: config.codex?.name ?? "bmad-invisible-codex", // surfaced to Codex CLI
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: runtime.listTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const { meta, args } = extractCodexMeta(rawArgs);

    return runtime.callTool(name, args, {
      meta,
      modelRouter,
      approvalChecker,
      stateBridge,
    });
  });

  await runtime.ensureReady();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    "BMAD Codex MCP server running with project root",
    runtime.projectPath,
  );
}

main().catch((error) => {
  console.error("[Codex] Server error:", error);
  process.exit(1);
});
