'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.runVibeCheckGate = runVibeCheckGate;
const index_js_1 = require('@modelcontextprotocol/sdk/client/index.js');
const stdio_js_1 = require('@modelcontextprotocol/sdk/client/stdio.js');
const DEFAULT_COMMAND = 'npx';
const DEFAULT_ARGS = ['-y', 'vibe-check-mcp-server'];
const DEFAULT_TIMEOUT_MS = 30000;
const TEXT_DELIVERABLE_TYPES = new Set(['brief', 'prd', 'copy', 'narrative', 'messaging']);
function parseArgs(raw) {
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
      return parsed;
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
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  });
}
function buildClient(options) {
  if (options.clientFactory) {
    return options.clientFactory();
  }
  const command = options.command ?? process.env.AIDESIGNER_VIBE_CHECK_COMMAND ?? DEFAULT_COMMAND;
  const envArgs = options.args ?? parseArgs(process.env.AIDESIGNER_VIBE_CHECK_ARGS) ?? DEFAULT_ARGS;
  const envOverrides = options.env ?? {};
  const mergedEnv = { ...process.env, ...envOverrides };
  const transport = new stdio_js_1.StdioClientTransport({
    command,
    args: envArgs,
    env: mergedEnv,
    stderr: 'pipe',
  });
  const client = new index_js_1.Client({ name: 'AiDesigner Vibe Check Gate', version: '1.0.0' });
  return { client, transport };
}
function collectCopy(projectState) {
  const deliverables = projectState.getAllDeliverables();
  const sections = [];
  for (const [phase, records] of Object.entries(deliverables)) {
    if (!records || typeof records !== 'object') {
      continue;
    }
    for (const [type, record] of Object.entries(records)) {
      if (!TEXT_DELIVERABLE_TYPES.has(type)) {
        continue;
      }
      const text = normalizeContent(record?.content);
      if (!text) {
        continue;
      }
      sections.push(`# Phase: ${phase} — ${type}\n\n${text}`);
    }
  }
  return sections.join('\n\n---\n\n');
}
function normalizeContent(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
function extractScore(result) {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  const score = result.score;
  if (typeof score !== 'number' || Number.isNaN(score) || !Number.isFinite(score)) {
    return undefined;
  }
  if (score > 1 && score <= 100) {
    return score / 100;
  }
  return Math.max(0, Math.min(1, score));
}
function extractVerdict(result) {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  const verdict = result.verdict;
  return typeof verdict === 'string' ? verdict : undefined;
}
function extractSuggestions(result) {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  const suggestions = result.suggestions;
  if (!Array.isArray(suggestions)) {
    return undefined;
  }
  return suggestions.filter((entry) => typeof entry === 'string');
}
function parseToolResult(result) {
  const content = result.content || [];
  for (const item of content) {
    if (!item) {
      continue;
    }
    if (item.type === 'text' && typeof item.text === 'string') {
      const text = item.text.trim();
      if (!text) {
        continue;
      }
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    }
    // Handle other content types if needed
    if (item.type === 'json' && typeof item.data === 'object') {
      return item.data;
    }
  }
  return undefined;
}
async function closeClient(handle) {
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
    handle.transport.stderr.removeAllListeners?.('data');
  }
}
async function runVibeCheckGate(options) {
  const { projectState, logger } = options;
  const enabled = (process.env.AIDESIGNER_VIBE_CHECK_ENABLED ?? 'true').toLowerCase();
  if (enabled === 'false' || enabled === '0') {
    logger.warn('vibe_check_skipped', { reason: 'disabled' });
    return { passed: true, raw: { skipped: true } };
  }
  const copyText = collectCopy(projectState);
  if (!copyText) {
    throw new Error(
      'Vibe Check gate could not find copy to evaluate. Ensure PM deliverables are stored before invoking the gate.',
    );
  }
  const handle = buildClient(options);
  const stderrBuffer = [];
  handle.transport.stderr?.on('data', (chunk) => {
    const value = chunk.toString().trim();
    if (value) {
      stderrBuffer.push(value);
    }
  });
  const minScore =
    options.minScore ?? parseFloat(process.env.AIDESIGNER_VIBE_CHECK_MIN_SCORE ?? '0.65');
  if (Number.isNaN(minScore) || !Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
    throw new Error(
      `Invalid AIDESIGNER_VIBE_CHECK_MIN_SCORE: must be a number between 0 and 1, got ${minScore}`,
    );
  }
  const audience = options.audience ?? process.env.AIDESIGNER_VIBE_CHECK_AUDIENCE ?? 'founder';
  const temperature =
    options.temperature ??
    (process.env.AIDESIGNER_VIBE_CHECK_TEMPERATURE
      ? Number(process.env.AIDESIGNER_VIBE_CHECK_TEMPERATURE)
      : undefined);
  if (temperature !== undefined && (Number.isNaN(temperature) || !Number.isFinite(temperature))) {
    throw new Error(
      `Invalid AIDESIGNER_VIBE_CHECK_TEMPERATURE: must be a valid number, got ${temperature}`,
    );
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  logger.info('vibe_check_call_started', { audience, minScore, temperature });
  let connected = false;
  try {
    await handle.client.connect(handle.transport);
    connected = true;
    const toolResult = await handle.client.callTool({
      name: 'vibe_check',
      arguments: {
        text: copyText,
        audience,
        ...(typeof temperature === 'number' && !Number.isNaN(temperature) ? { temperature } : {}),
      },
    });
    const parsed = parseToolResult(toolResult);
    const score = extractScore(parsed);
    const verdict = extractVerdict(parsed);
    const suggestions = extractSuggestions(parsed);
    const serverInfo = handle.client.getServerVersion?.();
    if (score == null) {
      throw new Error('Vibe Check response did not include a numeric score.');
    }
    const passed = score >= minScore && verdict !== 'negative';
    const summary = {
      score,
      verdict,
      minScore,
      suggestions,
      server: serverInfo,
    };
    if (passed) {
      logger.info('vibe_check_pass', summary);
    } else {
      logger.error('vibe_check_fail', summary);
    }
    if (typeof projectState.recordDecision === 'function') {
      const verdictLabel = passed ? 'pass' : (verdict ?? 'fail');
      const rationaleParts = [`score=${score.toFixed(2)}`, `threshold=${minScore.toFixed(2)}`];
      if (verdict) {
        rationaleParts.push(`verdict=${verdict}`);
      }
      if (suggestions && suggestions.length > 0) {
        rationaleParts.push(`suggestions=${suggestions.join(' | ')}`);
      }
      await projectState.recordDecision('vibe_check', verdictLabel, rationaleParts.join('; '));
    }
    if (!passed) {
      const suggestionText =
        suggestions && suggestions.length > 0 ? ` Suggestions: ${suggestions.join('; ')}` : '';
      throw new Error(
        `Vibe Check gate failed (score ${score.toFixed(2)} < ${minScore.toFixed(2)} or verdict=${verdict ?? 'unknown'}).${suggestionText}`,
      );
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
    const stderrNote =
      stderrBuffer.length > 0 ? `\nVibe Check stderr: ${stderrBuffer.join('\n')}` : '';
    if (error instanceof Error) {
      error.message = `${error.message}${stderrNote}`;
    }
    throw error;
  } finally {
    await closeClient(handle);
  }
}
