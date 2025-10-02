'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
const index_js_1 = require('@modelcontextprotocol/sdk/server/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const path = __importStar(require('path'));
const fs = __importStar(require('fs/promises'));
const runtime_js_1 = require('../../mcp/runtime.js');
function stripInlineComment(line) {
  let inString = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '\\' && !escaped) {
      escaped = true;
      continue;
    }
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    if (char === '#' && !inString) {
      return line.slice(0, index).trimEnd();
    }
    escaped = false;
  }
  return line.trimEnd();
}
function parseTomlValue(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    const segments = [];
    let buffer = '';
    let inString = false;
    let escaped = false;
    for (const char of inner) {
      if (char === '\\' && !escaped) {
        escaped = true;
        buffer += char;
        continue;
      }
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      if (char === ',' && !inString) {
        segments.push(buffer.trim());
        buffer = '';
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
function parseToml(content) {
  const result = {};
  let current = result;
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const withoutComment = stripInlineComment(rawLine).trim();
    if (!withoutComment) {
      continue;
    }
    if (withoutComment.startsWith('[') && withoutComment.endsWith(']')) {
      const tablePath = withoutComment.slice(1, -1).trim();
      const segments = tablePath.split('.');
      current = result;
      for (const segment of segments) {
        if (!segment) {
          continue;
        }
        if (typeof current[segment] !== 'object' || current[segment] === null) {
          current[segment] = {};
        }
        current = current[segment];
      }
      continue;
    }
    const equalsIndex = withoutComment.indexOf('=');
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
  return result;
}
async function loadCodexConfig() {
  const candidates = [];
  if (process.env.CODEX_CONFIG && process.env.CODEX_CONFIG.trim().length > 0) {
    candidates.push(path.resolve(process.cwd(), process.env.CODEX_CONFIG));
  }
  candidates.push(
    path.resolve(process.cwd(), 'codex-config.toml'),
    path.resolve(process.cwd(), '.codex', 'config.toml'),
  );
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (!stat.isFile()) {
        continue;
      }
      const raw = await fs.readFile(candidate, 'utf8');
      const parsed = parseToml(raw);
      console.error(`[Codex] Loaded configuration from ${candidate}`);
      return parsed;
    } catch (error) {
      // Ignore missing files or parse errors, fall back to defaults
    }
  }
  console.error('[Codex] No codex-config.toml found. Using default settings.');
  return {};
}
function resolveProjectRoot(config) {
  if (!config.state?.projectRoot) {
    return undefined;
  }
  return path.resolve(process.cwd(), config.state.projectRoot);
}
function buildLLMOptions(config) {
  const options = {};
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
function extractCodexMeta(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { args: value };
  }
  const record = value;
  if (!Object.prototype.hasOwnProperty.call(record, '__codex')) {
    return { args: value };
  }
  const { __codex, ...rest } = record;
  const cleanedArgs = Object.keys(rest).length > 0 ? rest : undefined;
  return { meta: __codex ?? undefined, args: cleanedArgs };
}
function buildModelRouter(config) {
  const overrides = new Map(
    Object.entries(config.models?.overrides ?? {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
  const phaseOverrides = config.models?.phases ?? {};
  return ({ tool, meta, context }) => {
    const metaObj = meta;
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
function buildApprovalChecker(config) {
  const requireSet = new Set((config.approvals?.require ?? []).map((name) => name.toLowerCase()));
  const autoSet = new Set((config.approvals?.auto ?? []).map((name) => name.toLowerCase()));
  const mode = config.approvals?.default ?? 'prompt';
  const fallbackMessage =
    config.approvals?.message ??
    'Codex requires approval for this action. Re-run the tool with __codex.approved set to true to continue.';
  return ({ tool, meta }) => {
    const normalized = tool.toLowerCase();
    const metaObj = meta ?? {};
    if (autoSet.has(normalized) || (mode === 'auto' && !requireSet.has(normalized))) {
      return { approved: true };
    }
    const shouldRequire =
      requireSet.has(normalized) || (mode === 'prompt' && !autoSet.has(normalized));
    if (!shouldRequire && mode !== 'require') {
      return { approved: true };
    }
    if (
      metaObj.approved === true ||
      metaObj.approval === true ||
      metaObj.approvalToken === 'approved'
    ) {
      return { approved: true };
    }
    return {
      approved: false,
      message: fallbackMessage,
    };
  };
}
function buildStateBridge(config, conversationCache) {
  const conversationEnabled = config.state?.conversationSync !== false;
  const limit = config.state?.conversationLimit ?? 50;
  const tag = config.state?.conversationTag ?? 'codex';
  const persistAssistant = config.state?.persistAssistantResponses !== false;
  function rememberSignature(message) {
    const role = message.role ?? 'unknown';
    const content = message.content ?? '';
    const stamp = message.timestamp ?? '';
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
      const metaObj = meta;
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
            `[Codex] Failed to sync conversation message: ${error instanceof Error ? error.message : error}`,
          );
        }
      }
      if (typeof metaObj.userMessage === 'string' && metaObj.userMessage.trim().length > 0) {
        const signature = rememberSignature({ role: 'user', content: metaObj.userMessage });
        if (!conversationCache.has(signature)) {
          try {
            await context.projectState.addMessage('user', metaObj.userMessage, {
              source: tag,
              codexInjected: true,
            });
            conversationCache.add(signature);
          } catch (error) {
            console.error(
              `[Codex] Failed to record user message: ${error instanceof Error ? error.message : error}`,
            );
          }
        }
      }
      if (metaObj.stateUpdates && typeof metaObj.stateUpdates === 'object') {
        try {
          await context.projectState.updateState(metaObj.stateUpdates);
        } catch (error) {
          console.error(
            `[Codex] Failed to merge state updates: ${error instanceof Error ? error.message : error}`,
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
        await context.projectState.addMessage('assistant', message, {
          source: `${tag}:${tool}`,
        });
      } catch (error) {
        console.error(
          `[Codex] Failed to persist tool response: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
  };
}
function extractPrimaryText(result) {
  if (!result || !Array.isArray(result.content)) {
    return null;
  }
  for (const item of result.content) {
    if (item && item.type === 'text' && typeof item.text === 'string') {
      return item.text.length > 2000 ? `${item.text.slice(0, 2000)}…` : item.text;
    }
  }
  return null;
}
async function main() {
  const config = await loadCodexConfig();
  const conversationCache = new Set();
  const runtime = new runtime_js_1.BMADRuntime({
    projectPath: resolveProjectRoot(config),
    llmClientOptions: buildLLMOptions(config),
  });
  const modelRouter = buildModelRouter(config);
  const approvalChecker = buildApprovalChecker(config);
  const stateBridge = buildStateBridge(config, conversationCache);
  const server = new index_js_1.Server(
    {
      name: config.codex?.name ?? 'bmad-invisible-codex', // surfaced to Codex CLI
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: runtime.listTools(),
  }));
  server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
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
  const transport = new stdio_js_1.StdioServerTransport();
  await server.connect(transport);
  console.error('BMAD Codex MCP server running with project root', runtime.projectPath);
}
main().catch((error) => {
  console.error('[Codex] Server error:', error);
  process.exit(1);
});
