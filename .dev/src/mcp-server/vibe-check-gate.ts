import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";
import type { ToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface VibeCheckGateOptions {
  projectState: {
    getAllDeliverables: () => Record<string, Record<string, DeliverableRecord>>;
    recordDecision: (key: string, value: string, rationale?: string) => Promise<void> | void;
  };
  logger: Pick<Logger, "info" | "warn" | "error"> & Partial<Logger>;
  minScore?: number;
  audience?: string;
  temperature?: number;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  timeoutMs?: number;
  clientFactory?: () => ClientHandle;
}

export interface VibeCheckGateResult {
  passed: boolean;
  score?: number;
  verdict?: string;
  suggestions?: string[];
  server?: { name?: string; version?: string };
  raw?: unknown;
}

interface DeliverableRecord {
  content?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

interface Logger {
  info(event: string, payload?: Record<string, unknown>): void;
  warn(event: string, payload?: Record<string, unknown>): void;
  error(event: string, payload?: Record<string, unknown>): void;
  recordTiming?(metric: string, value: number, tags?: Record<string, unknown>): void;
}

interface ClientHandle {
  client: Pick<Client, "connect" | "callTool" | "close" | "getServerVersion">;
  transport: Pick<StdioClientTransport, "close"> & { stderr?: NodeJS.ReadableStream | null };
}

const DEFAULT_COMMAND = "npx";
const DEFAULT_ARGS = ["-y", "vibe-check-mcp-server"];
const DEFAULT_TIMEOUT_MS = 30_000;
const TEXT_DELIVERABLE_TYPES = new Set(["brief", "prd", "copy", "narrative", "messaging"]);

function parseArgs(raw?: string | null): string[] | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
      return parsed as string[];
    }
  } catch {
    // fall through to shell-like parsing
  }

  const matches = raw.match(/(?:"[^"]*"|'[^']*'|[^\s"'])+/g);
  if (!matches) {
    return undefined;
  }

  return matches.map((token) => {
    const trimmed = token.trim();
    if (
      (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  });
}

function buildClient(options: VibeCheckGateOptions): ClientHandle {
  if (options.clientFactory) {
    return options.clientFactory();
  }

  const command = options.command ?? process.env.AIDESIGNER_VIBE_CHECK_COMMAND ?? DEFAULT_COMMAND;
  const envArgs =
    options.args ??
    parseArgs(process.env.AIDESIGNER_VIBE_CHECK_ARGS) ??
    DEFAULT_ARGS;

  const envOverrides = options.env ?? {};
  const mergedEnv = { ...process.env, ...envOverrides } as Record<string, string>;

  const transport = new StdioClientTransport({ command, args: envArgs, env: mergedEnv, stderr: "pipe" });
  const client = new Client({ name: "AiDesigner Vibe Check Gate", version: "1.0.0" });
  return { client, transport };
}

function collectCopy(projectState: VibeCheckGateOptions["projectState"]): string {
  const deliverables = projectState.getAllDeliverables();
  const sections: string[] = [];

  for (const [phase, records] of Object.entries(deliverables)) {
    if (!records || typeof records !== "object") {
      continue;
    }

    for (const [type, record] of Object.entries(records)) {
      if (!TEXT_DELIVERABLE_TYPES.has(type)) {
        continue;
      }

      const text = normalizeContent((record as DeliverableRecord)?.content);
      if (!text) {
        continue;
      }

      sections.push(`# Phase: ${phase} — ${type}\n\n${text}`);
    }
  }

  return sections.join("\n\n---\n\n");
}

function normalizeContent(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (value == null) {
    return undefined;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function extractScore(result: unknown): number | undefined {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const score = (result as Record<string, unknown>).score;
  if (typeof score !== "number" || Number.isNaN(score) || !Number.isFinite(score)) {
    return undefined;
  }

  if (score > 1 && score <= 100) {
    return score / 100;
  }

  return Math.max(0, Math.min(1, score));
}

function extractVerdict(result: unknown): string | undefined {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const verdict = (result as Record<string, unknown>).verdict;
  return typeof verdict === "string" ? verdict : undefined;
}

function extractSuggestions(result: unknown): string[] | undefined {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const suggestions = (result as Record<string, unknown>).suggestions;
  if (!Array.isArray(suggestions)) {
    return undefined;
  }

  return suggestions.filter((entry) => typeof entry === "string");
}

function parseToolResult(result: ToolResult): unknown {
  const content = Array.isArray(result.content) ? result.content : [];
  for (const item of content) {
    if (!item) {
      continue;
    }

    if ((item as any).type === "json" && typeof (item as any).data === "object") {
      return (item as any).data;
    }

    if ((item as any).type === "text" && typeof (item as any).text === "string") {
      const text = (item as any).text.trim();
      if (!text) {
        continue;
      }
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    }
  }

  return undefined;
}

async function closeClient(handle: ClientHandle): Promise<void> {
  try {
    await handle.client.close();
  } catch {
    // ignore close errors
  }

  try {
    await handle.transport.close();
  } catch {
    // ignore close errors
  }

  if (handle.transport.stderr) {
    handle.transport.stderr.removeAllListeners?.("data");
  }
}

export async function runVibeCheckGate(options: VibeCheckGateOptions): Promise<VibeCheckGateResult> {
  const { projectState, logger } = options;
  const enabled = (process.env.AIDESIGNER_VIBE_CHECK_ENABLED ?? "true").toLowerCase();
  if (enabled === "false" || enabled === "0") {
    logger.warn("vibe_check_skipped", { reason: "disabled" });
    return { passed: true, raw: { skipped: true } };
  }

  const copyText = collectCopy(projectState);
  if (!copyText) {
    throw new Error("Vibe Check gate could not find copy to evaluate. Ensure PM deliverables are stored before invoking the gate.");
  }

  const handle = buildClient(options);
  const stderrBuffer: string[] = [];
  handle.transport.stderr?.on("data", (chunk: Buffer | string) => {
    const value = chunk.toString().trim();
    if (value) {
      stderrBuffer.push(value);
    }
  });

  const minScore = options.minScore ?? parseFloat(process.env.AIDESIGNER_VIBE_CHECK_MIN_SCORE ?? "0.65");
  if (Number.isNaN(minScore) || !Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
    throw new Error(`Invalid AIDESIGNER_VIBE_CHECK_MIN_SCORE: must be a number between 0 and 1, got ${minScore}`);
  }

  const audience = options.audience ?? process.env.AIDESIGNER_VIBE_CHECK_AUDIENCE ?? "founder";

  const temperature = options.temperature ?? (process.env.AIDESIGNER_VIBE_CHECK_TEMPERATURE ? Number(process.env.AIDESIGNER_VIBE_CHECK_TEMPERATURE) : undefined);
  if (temperature !== undefined && (Number.isNaN(temperature) || !Number.isFinite(temperature))) {
    throw new Error(`Invalid AIDESIGNER_VIBE_CHECK_TEMPERATURE: must be a valid number, got ${temperature}`);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  logger.info("vibe_check_call_started", { audience, minScore, temperature });

  let connected = false;
  try {
    await handle.client.connect(handle.transport, { timeout: timeoutMs });
    connected = true;

    const toolResult = await handle.client.callTool({
      name: "vibe_check",
      arguments: {
        text: copyText,
        audience,
        ...(typeof temperature === "number" && !Number.isNaN(temperature) ? { temperature } : {}),
      },
    });

    const parsed = parseToolResult(toolResult);
    const score = extractScore(parsed);
    const verdict = extractVerdict(parsed);
    const suggestions = extractSuggestions(parsed);
    const serverInfo = handle.client.getServerVersion?.();

    if (score == null) {
      throw new Error("Vibe Check response did not include a numeric score.");
    }

    const passed = score >= minScore && verdict !== "negative";

    const summary = {
      score,
      verdict,
      minScore,
      suggestions,
      server: serverInfo,
    };

    if (passed) {
      logger.info("vibe_check_pass", summary);
    } else {
      logger.error("vibe_check_fail", summary);
    }

    if (typeof projectState.recordDecision === "function") {
      const verdictLabel = passed ? "pass" : verdict ?? "fail";
      const rationaleParts = [`score=${score.toFixed(2)}`, `threshold=${minScore.toFixed(2)}`];
      if (verdict) {
        rationaleParts.push(`verdict=${verdict}`);
      }
      if (suggestions && suggestions.length > 0) {
        rationaleParts.push(`suggestions=${suggestions.join(" | ")}`);
      }
      await projectState.recordDecision("vibe_check", verdictLabel, rationaleParts.join("; "));
    }

    if (!passed) {
      const suggestionText = suggestions && suggestions.length > 0 ? ` Suggestions: ${suggestions.join("; ")}` : "";
      throw new Error(`Vibe Check gate failed (score ${score.toFixed(2)} < ${minScore.toFixed(2)} or verdict=${verdict ?? "unknown"}).${suggestionText}`);
    }

    return {
      passed,
      score,
      verdict,
      suggestions,
      server: serverInfo ?? undefined,
      raw: parsed,
    };
  } catch (error) {
    const stderrNote = stderrBuffer.length > 0 ? `\nVibe Check stderr: ${stderrBuffer.join("\n")}` : "";
    if (error instanceof Error) {
      error.message = `${error.message}${stderrNote}`;
    }
    throw error;
  } finally {
    await closeClient(handle);
  }
}
