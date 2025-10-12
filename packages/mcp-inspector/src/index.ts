import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import { Stream } from 'node:stream';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket';
import type {
  AccessibilitySummary,
  ConsoleMessage,
  StyleRuleSummary,
  StylesheetSummary,
} from '@aidesigner/shared-types';

const DEFAULT_STDIO_COMMAND = 'npx';
const DEFAULT_STDIO_ARGS = ['-y', 'chrome-devtools-mcp'];
const MCP_CONNECT_TIMEOUT_MS = 30_000;
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_HTML_SIZE_FOR_REGEX = 1 * 1024 * 1024; // 1MB guard for regex scanning
const MAX_REGEX_MATCHES = 2_000;

type ActiveTransport = StdioClientTransport | WebSocketClientTransport;

type TransportInit = {
  transport: ActiveTransport;
  stderrStream?: Stream | null;
};

export type ScreenshotPayload = {
  data: string;
  mimeType?: string;
  encoding?: string;
};

export type InspectCaptureOptions = {
  domSnapshot?: boolean;
  accessibilityTree?: boolean;
  cssom?: boolean;
  console?: boolean;
  computedStyles?: boolean;
  screenshot?: boolean;
};

export type InspectOptions = {
  /**
   * URL to capture.
   */
  url: string;
  /**
   * Optional list of UI states to capture. Defaults to `['default']` when
   * capture options are provided but no explicit states are set.
   */
  states?: string[];
  /**
   * Capture configuration. When omitted, no capture calls are made unless
   * states are provided.
   */
  capture?: InspectCaptureOptions;
};

export type ToolInventoryItem = {
  name: string;
  signature: string;
  description?: string;
};

export type InspectionErrorStage =
  | 'connect'
  | 'list-tools'
  | 'format'
  | 'capture'
  | 'disconnect'
  | 'fetch-html'
  | 'fetch-stylesheet';

export type InspectionError = {
  stage: InspectionErrorStage;
  message: string;
  resource?: string;
  toolName?: string;
};

export type InspectCapture = {
  domSnapshot?: unknown;
  accessibilityTree?: unknown;
  cssom?: unknown;
  console?: unknown;
  computedStyles?: unknown[];
  screenshot?: ScreenshotPayload;
};

export type InspectResult = {
  tools: ToolInventoryItem[];
  errors: InspectionError[];
  server?: {
    name?: string;
    version?: string;
  };
  captures?: Record<string, InspectCapture>;
};

function isAllowedUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  const ipVersion = isIP(hostname);

  if (!hostname || hostname === 'localhost') {
    return false;
  }

  // Block private IPv4 ranges
  if (
    hostname.startsWith('127.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)
  ) {
    return false;
  }

  // Block cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname === '[::ffff:169.254.169.254]') {
    return false;
  }

  // Block IPv6 loopback, link-local, ULA, and IPv4-mapped private
  if (ipVersion === 6) {
    if (
      hostname === '::1' ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fc') ||
      hostname.startsWith('fd') ||
      hostname.startsWith('::ffff:127.') ||
      hostname.startsWith('::ffff:10.') ||
      hostname.startsWith('::ffff:192.168.') ||
      /^::ffff:172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)
    ) {
      return false;
    }
  }

  if (ipVersion === 4) {
    return true;
  }

  // Only allow HTTP(S) protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  return true;
}

export async function analyzeWithMCP(opts: InspectOptions): Promise<InspectResult> {
  const errors: InspectionError[] = [];

  let targetUrl: URL;
  try {
    targetUrl = new URL(opts.url);
  } catch (error) {
    errors.push({ stage: 'connect', message: formatErrorMessage(error) });
    return { tools: [], errors };
  }

  if (!isAllowedUrl(targetUrl)) {
    errors.push({ stage: 'connect', message: `URL not allowed for capture: ${targetUrl.href}` });
    return { tools: [], errors };
  }

  const client = new Client({ name: 'AiDesigner MCP Inspector', version: '1.0.0' });
  let transportInit: TransportInit;
  try {
    transportInit = createTransport();
  } catch (error) {
    errors.push({ stage: 'connect', message: formatErrorMessage(error) });
    return { tools: [], errors };
  }

  const { transport, stderrStream } = transportInit;
  const stderrBuffer: string[] = [];
  if (stderrStream) {
    stderrStream.on('data', (chunk: Buffer | string) => {
      const text = chunk.toString().trim();
      if (text) {
        stderrBuffer.push(text);
      }
    });
  }

  let connected = false;

  try {
    await client.connect(transport, { timeout: MCP_CONNECT_TIMEOUT_MS });
    connected = true;
  } catch (error) {
    const stderrNote = stderrBuffer.length > 0 ? ` | stderr: ${truncate(stderrBuffer.join('\n'))}` : '';
    errors.push({ stage: 'connect', message: `${formatErrorMessage(error)}${stderrNote}` });
    await safeClose(transport, client, errors, connected);
    return { tools: [], errors };
  }

  let toolResponse: Awaited<ReturnType<Client['listTools']>>;
  try {
    toolResponse = await client.listTools();
  } catch (error) {
    errors.push({ stage: 'list-tools', message: formatErrorMessage(error) });
    await safeClose(transport, client, errors, connected);
    return { tools: [], errors, server: getServerInfo(client) };
  }

  const tools: ToolInventoryItem[] = [];
  for (const tool of toolResponse.tools) {
    try {
      tools.push({
        name: tool.name,
        description: tool.description || undefined,
        signature: formatToolSignature(tool.name, tool.inputSchema, tool.outputSchema),
      });
    } catch (error) {
      errors.push({
        stage: 'format',
        message: formatErrorMessage(error),
        toolName: tool.name,
      });
    }
  }

  const captures = await captureStates(client, opts, errors);

  await safeClose(transport, client, errors, connected);

  return {
    tools,
    errors,
    server: getServerInfo(client),
    captures: Object.keys(captures).length > 0 ? captures : undefined,
  };
}

const DEFAULT_CAPTURE_OPTIONS: Required<InspectCaptureOptions> = {
  domSnapshot: true,
  accessibilityTree: true,
  cssom: true,
  console: true,
  computedStyles: true,
  screenshot: true,
};

async function captureStates(
  client: Client,
  opts: InspectOptions,
  errors: InspectionError[],
): Promise<Record<string, InspectCapture>> {
  const shouldCapture = Boolean(opts.capture) || (opts.states?.length ?? 0) > 0;
  if (!shouldCapture) {
    return {};
  }

  const captureOptions = { ...DEFAULT_CAPTURE_OPTIONS, ...(opts.capture ?? {}) };
  const states = (opts.states && opts.states.length > 0 ? opts.states : ['default']).map(
    (state) => state?.trim() || 'default',
  );

  const captures: Record<string, InspectCapture> = {};

  for (const state of states) {
    const stateArgs: Record<string, unknown> = { url: opts.url };
    if (state !== 'default') {
      stateArgs.state = state;
    }

    const errorCountBeforeOpen = errors.length;
    await callToolSafely(client, 'browser.open', stateArgs, errors, state);
    const openFailed = errors.length > errorCountBeforeOpen;

    const capture: InspectCapture = {};
    const toolArgs = state !== 'default' ? { state, url: opts.url } : { url: opts.url };

    if (openFailed) {
      continue;
    }

    if (captureOptions.domSnapshot) {
      const domSnapshot = await callToolSafely(
        client,
        'devtools.dom_snapshot',
        toolArgs,
        errors,
        state,
      );
      if (domSnapshot !== undefined) {
        capture.domSnapshot = domSnapshot;
      }
    }

    if (captureOptions.accessibilityTree) {
      const accessibilityTree = await callToolSafely(
        client,
        'devtools.accessibility_tree',
        toolArgs,
        errors,
        state,
      );
      if (accessibilityTree !== undefined) {
        capture.accessibilityTree = accessibilityTree;
      }
    }

    if (captureOptions.cssom) {
      const cssom = await callToolSafely(client, 'devtools.cssom_dump', toolArgs, errors, state);
      if (cssom !== undefined) {
        capture.cssom = cssom;
      }
    }

    if (captureOptions.console) {
      const consoleMessages = await callToolSafely(
        client,
        'devtools.console_get_messages',
        toolArgs,
        errors,
        state,
      );
      if (consoleMessages !== undefined) {
        capture.console = consoleMessages;
      }
    }

    if (captureOptions.computedStyles) {
      const computedStyles = await callToolSafely(
        client,
        'devtools.computed_styles',
        toolArgs,
        errors,
        state,
      );
      if (Array.isArray(computedStyles)) {
        capture.computedStyles = computedStyles;
      } else if (computedStyles !== undefined) {
        capture.computedStyles = [computedStyles];
      }
    }

    if (captureOptions.screenshot) {
      const screenshot = await callToolSafely(
        client,
        'browser.screenshot',
        toolArgs,
        errors,
        state,
      );
      const normalizedScreenshot = normalizeScreenshot(screenshot);
      if (normalizedScreenshot) {
        capture.screenshot = normalizedScreenshot;
      }
    }

    if (Object.keys(capture).length > 0) {
      captures[state] = capture;
    }
  }

  return captures;
}

type ToolCallResult = Awaited<ReturnType<Client['callTool']>>;

async function callToolSafely(
  client: Client,
  toolName: string,
  args: Record<string, unknown>,
  errors: InspectionError[],
  state: string,
): Promise<unknown> {
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    if (!result) {
      return undefined;
    }

    if ('isError' in result && result.isError) {
      const payload = extractToolPayload(result);
      const message = payload !== undefined ? stringifyPayload(payload) : 'Unknown tool error';
      errors.push({
        stage: 'capture',
        message: `Tool ${toolName} reported an error for state '${state}': ${message}`,
        toolName,
      });
      return undefined;
    }

    return extractToolPayload(result);
  } catch (error) {
    errors.push({
      stage: 'capture',
      message: `Failed to call tool ${toolName} for state '${state}': ${formatErrorMessage(error)}`,
      toolName,
    });
    return undefined;
  }
}

function normalizeScreenshot(value: unknown): ScreenshotPayload | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return { data: value };
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizeScreenshot(entry);
      if (normalized) {
        return normalized;
      }
    }
    return undefined;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const dataCandidate =
      typeof record.data === 'string'
        ? record.data
        : typeof record.base64 === 'string'
          ? record.base64
          : typeof record.content === 'string'
            ? record.content
            : typeof record.text === 'string'
              ? record.text
              : undefined;
    if (dataCandidate) {
      const mimeType = typeof record.mimeType === 'string' ? record.mimeType : undefined;
      const encoding = typeof record.encoding === 'string' ? record.encoding : 'base64';
      return { data: dataCandidate, mimeType, encoding };
    }
  }

  return undefined;
}

function createTransport(): TransportInit {
  const urlEnv =
    process.env.AIDESIGNER_CHROME_MCP_URL ??
    process.env.CHROME_DEVTOOLS_MCP_URL ??
    process.env.CHROME_MCP_SERVER_URL;

  if (urlEnv) {
    try {
      return { transport: new WebSocketClientTransport(new URL(urlEnv)) };
    } catch (error) {
      throw new Error(`Invalid MCP server URL '${urlEnv}': ${formatErrorMessage(error)}`);
    }
  }

  const command =
    process.env.AIDESIGNER_CHROME_MCP_COMMAND ??
    process.env.CHROME_MCP_COMMAND ??
    DEFAULT_STDIO_COMMAND;
  const args =
    parseArgList(process.env.AIDESIGNER_CHROME_MCP_ARGS ?? process.env.CHROME_MCP_ARGS) ?? DEFAULT_STDIO_ARGS;
  const env = parseEnv(process.env.AIDESIGNER_CHROME_MCP_ENV ?? process.env.CHROME_MCP_ENV);

  const transport = new StdioClientTransport({ command, args, env, stderr: 'pipe' });
  return { transport, stderrStream: transport.stderr };
}

function parseArgList(raw?: string | null): string[] | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed as string[];
    }
  } catch {
    // Ignore JSON parse failures and fall back to shell-style parsing
  }

  const matches = raw.match(/(?:"[^"]*"|'[^']*'|[^\s"'])+/g);
  if (!matches) {
    return undefined;
  }

  return matches.map((token) => {
    const trimmed = token.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  });
}

function parseEnv(raw?: string | null): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          env[key] = value;
        } else if (value !== undefined && value !== null) {
          env[key] = JSON.stringify(value);
        }
      }
      return Object.keys(env).length > 0 ? env : undefined;
    }
  } catch {
    // Fall back to parsing KEY=VALUE pairs
  }

  const env: Record<string, string> = {};
  for (const pair of raw.split(/[,;\n]+/)) {
    const trimmed = pair.trim();
    if (!trimmed) {
      continue;
    }
    const [key, ...rest] = trimmed.split('=');
    if (!key) {
      continue;
    }
    env[key.trim()] = rest.join('=').trim();
  }

  return Object.keys(env).length > 0 ? env : undefined;
}

async function safeClose(
  transport: ActiveTransport | undefined,
  client: Client,
  errors: InspectionError[],
  connected: boolean,
): Promise<void> {
  try {
    await client.close();
  } catch (error) {
    errors.push({
      stage: connected ? 'disconnect' : 'connect',
      message: `Failed to close MCP client: ${formatErrorMessage(error)}`,
    });
  }

  if (transport) {
    await transport.close().catch(() => undefined);
  }
}

function getServerInfo(client: Client): InspectResult['server'] {
  const info = client.getServerVersion?.();
  if (!info) {
    return undefined;
  }
  const server = { name: info.name, version: info.version };
  if (!server.name && !server.version) {
    return undefined;
  }
  return server;
}

function truncate(value: string, maxLength = 500): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}…`;
}

function formatToolSignature(name: string, inputSchema: unknown, outputSchema: unknown): string {
  const args = formatSchemaArguments(inputSchema);
  const returnType = describeJsonSchema(outputSchema);
  return `${name}(${args}) => ${returnType}`;
}

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema | JsonSchema[];
  enum?: unknown[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  $ref?: string;
};

function asJsonSchema(value: unknown): JsonSchema | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return value as JsonSchema;
}

function formatSchemaArguments(schema: unknown): string {
  const json = asJsonSchema(schema);
  if (!json) {
    return '';
  }

  if (json.type === 'object' && json.properties && Object.keys(json.properties).length > 0) {
    const required = new Set(json.required ?? []);
    return Object.entries(json.properties)
      .map(([key, value]) => `${key}${required.has(key) ? '' : '?'}: ${describeJsonSchema(value)}`)
      .join(', ');
  }

  if (json.type === 'array') {
    return `items: ${describeJsonSchema(json.items)}`;
  }

  if (Array.isArray(json.type)) {
    return json.type.join(' | ');
  }

  return typeof json.type === 'string' ? json.type : '';
}

function describeJsonSchema(schema: unknown): string {
  const json = asJsonSchema(schema);
  if (!json) {
    return 'unknown';
  }

  if (json.enum && json.enum.length > 0) {
    return json.enum.map((value) => JSON.stringify(value)).join(' | ');
  }

  if (json.anyOf && json.anyOf.length > 0) {
    return json.anyOf.map(describeJsonSchema).join(' | ');
  }

  if (json.oneOf && json.oneOf.length > 0) {
    return json.oneOf.map(describeJsonSchema).join(' | ');
  }

  if (json.allOf && json.allOf.length > 0) {
    return json.allOf.map(describeJsonSchema).join(' & ');
  }

  if (json.type === 'object' && json.properties) {
    const entries = Object.entries(json.properties);
    if (entries.length === 0) {
      return 'object';
    }
    const required = new Set(json.required ?? []);
    const formatted = entries
      .slice(0, 5)
      .map(([key, value]) => `${key}${required.has(key) ? '' : '?'}: ${describeJsonSchema(value)}`)
      .join(', ');
    const suffix = entries.length > 5 ? ', …' : '';
    return `{ ${formatted}${suffix} }`;
  }

  if (json.type === 'array') {
    if (Array.isArray(json.items)) {
      const variants = json.items.map(describeJsonSchema).join(' | ');
      return `${variants}[]`;
    }
    return `${describeJsonSchema(json.items)}[]`;
  }

  if (Array.isArray(json.type)) {
    return json.type.join(' | ');
  }

  if (typeof json.type === 'string' && json.type) {
    return json.type;
  }

  if (json.$ref) {
    return json.$ref;
  }

  return 'unknown';
}

function extractToolPayload(result: ToolCallResult): unknown {
  if (!result) {
    return undefined;
  }

  if ('structuredContent' in result && result.structuredContent !== undefined) {
    return result.structuredContent;
  }

  if (Array.isArray((result as { content?: unknown }).content)) {
    for (const item of (result as { content: unknown[] }).content) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const content = item as Record<string, unknown>;
      const type = typeof content.type === 'string' ? (content.type as string) : undefined;

      if (type === 'json' && content.json !== undefined) {
        return content.json;
      }

      if (type === 'text' && typeof content.text === 'string') {
        const text = content.text.trim();
        if (!text) {
          continue;
        }
        try {
          return JSON.parse(text);
        } catch {
          return content.text;
        }
      }
    }
  }

  return undefined;
}

function stringifyPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return formatErrorMessage(error);
  }
}

async function fetchText(url: URL, timeoutMs: number, redirectCount = 0): Promise<string> {
  if (redirectCount > 5) {
    throw new Error('Too many redirects while fetching resource');
  }

  // Validate URL for SSRF protection
  if (!isAllowedUrl(url)) {
    throw new Error('URL not allowed: potential SSRF risk');
  }

  const client = url.protocol === 'https:' ? https : http;

  return new Promise<string>((resolve, reject) => {
    const request = client.request(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'AiDesigner-MCP-Inspector/1.0',
          'Accept-Encoding': 'identity',
        },
      },
      (response) => {
        const { statusCode = 0, headers } = response;

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          response.resume();
          const nextUrl = new URL(headers.location, url);
          fetchText(nextUrl, timeoutMs, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`Unexpected status ${statusCode}`));
          return;
        }

        let body = '';
        let size = 0;
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          size += Buffer.byteLength(chunk, 'utf8');
          if (size > MAX_CONTENT_SIZE) {
            request.destroy(new Error(`Content too large (max ${MAX_CONTENT_SIZE / 1024 / 1024}MB)`));
            return;
          }
          body += chunk;
        });
        response.on('end', () => resolve(body));
        response.on('error', reject);
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error('Request timed out'));
    });

    request.on('error', reject);
    request.end();
  });
}

async function extractStylesheets(
  html: string,
  baseUrl: URL,
  timeoutMs: number,
  errors: InspectionError[],
): Promise<StylesheetSummary[]> {
  const stylesheets: StylesheetSummary[] = [];

  // Guard against ReDoS attacks on very large HTML
  if (html.length > MAX_HTML_SIZE_FOR_REGEX) {
    errors.push({
      stage: 'fetch-html',
      message: `HTML too large (${html.length} bytes) for safe regex parsing, skipping inline styles`,
    });
    return stylesheets;
  }

  const inlineRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let inlineMatch: RegExpExecArray | null;
  let matchCount = 0;
  while ((inlineMatch = inlineRegex.exec(html)) && matchCount < MAX_REGEX_MATCHES) {
    matchCount++;
    const content = inlineMatch[1]?.trim() ?? '';
    if (content) {
      stylesheets.push({ href: null, content });
    }
  }

  const linkRegex = /<link[^>]+rel=(?:"|')?stylesheet(?:"|')?[^>]*>/gi;
  const fetches: Promise<void>[] = [];
  let linkMatch: RegExpExecArray | null;
  matchCount = 0;
  while ((linkMatch = linkRegex.exec(html)) && matchCount < MAX_REGEX_MATCHES) {
    matchCount++;
    const tag = linkMatch[0];
    const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    if (!hrefMatch) {
      continue;
    }

    const rawHref = hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3];
    try {
      const resolved = new URL(rawHref, baseUrl);
      const fetchPromise = fetchText(resolved, timeoutMs)
        .then((content) => {
          if (content.trim()) {
            stylesheets.push({ href: resolved.href, content });
          }
        })
        .catch((error) => {
          errors.push({
            stage: 'fetch-stylesheet',
            resource: resolved.href,
            message: formatErrorMessage(error),
          });
        });
      fetches.push(fetchPromise);
    } catch (error) {
      errors.push({
        stage: 'fetch-stylesheet',
        resource: rawHref,
        message: `Invalid stylesheet URL: ${formatErrorMessage(error)}`,
      });
    }
  }

  await Promise.all(fetches);
  return stylesheets;
}

function buildComputedStyles(css: string, html: string): StyleRuleSummary[] {
  const cleanedCss = stripCssComments(css);
  const rules: StyleRuleSummary[] = [];

  const walker = createCssWalker(cleanedCss);
  for (const block of walker) {
    if (block.selector.startsWith('@')) {
      const nested = buildComputedStyles(block.declarationsText, html);
      rules.push(...nested);
      continue;
    }

    const declarations = parseDeclarations(block.declarationsText);
    if (Object.keys(declarations).length > 0) {
      rules.push({ selector: block.selector, declarations });
    }
  }

  const inlineRules = extractInlineStyles(html);
  rules.push(...inlineRules);

  return rules;
}

type CssBlock = { selector: string; declarationsText: string };

function* createCssWalker(css: string): Generator<CssBlock> {
  let index = 0;
  const length = css.length;

  while (index < length) {
    const openIndex = css.indexOf('{', index);
    if (openIndex === -1) {
      break;
    }

    const selector = css.slice(index, openIndex).trim();
    let depth = 1;
    let cursor = openIndex + 1;

    while (cursor < length && depth > 0) {
      const char = css[cursor];
      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      }
      cursor += 1;
    }

    const declarationsText = css.slice(openIndex + 1, cursor - 1).trim();
    if (selector) {
      yield { selector, declarationsText };
    }

    index = cursor;
  }
}

function stripCssComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseDeclarations(block: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const segments = block.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) {
      continue;
    }
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }
    const prop = trimmed.slice(0, colonIndex).trim();
    const val = trimmed.slice(colonIndex + 1).trim();
    if (prop && val) {
      declarations[prop] = val;
    }
  }
  return declarations;
}

function extractInlineStyles(html: string): StyleRuleSummary[] {
  const results: StyleRuleSummary[] = [];

  // Guard against ReDoS on very large HTML
  if (html.length > MAX_HTML_SIZE_FOR_REGEX) {
    return results;
  }

  const regex = /<([a-zA-Z0-9-]+)([^>]*?)style\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match: RegExpExecArray | null;
  let matchCount = 0;
  while ((match = regex.exec(html)) && matchCount < MAX_REGEX_MATCHES) {
    matchCount++;
    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2] ?? '');
    const styleText = match[3] ?? match[4] ?? '';
    const declarations = parseDeclarations(styleText);
    if (Object.keys(declarations).length === 0) {
      continue;
    }

    const classTokens = (attrs.class ?? '')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    const selectorParts = [tag];
    if (attrs.id) {
      selectorParts.push(`#${attrs.id}`);
    }
    for (const cls of classTokens) {
      selectorParts.push(`.${cls}`);
    }
    const selector = selectorParts.join('');
    results.push({ selector: selector || tag, declarations });
  }
  return results;
}

function parseAttributes(input: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attrRegex = /([\w-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(input))) {
    const name = match[1].toLowerCase(); // Normalize to lowercase for consistent role detection
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (name) {
      attributes[name] = value;
    }
  }
  return attributes;
}

function buildAccessibilitySummaries(html: string): AccessibilitySummary[] {
  const summaries = new Map<string, { count: number; tagNames: Set<string> }>();

  // Guard against ReDoS on very large HTML
  if (html.length > MAX_HTML_SIZE_FOR_REGEX) {
    return [];
  }

  const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>/g;
  let match: RegExpExecArray | null;
  let matchCount = 0;
  while ((match = tagRegex.exec(html)) && matchCount < MAX_REGEX_MATCHES) {
    matchCount++;
    const rawTag = match[0];
    if (rawTag.startsWith('</')) {
      continue;
    }

    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2] ?? '');
    const role = attrs.role || inferImplicitRole(tag, attrs);
    if (!role) {
      continue;
    }
    const entry = summaries.get(role) ?? { count: 0, tagNames: new Set<string>() };
    entry.count += 1;
    entry.tagNames.add(tag);
    summaries.set(role, entry);
  }

  return Array.from(summaries.entries())
    .map<AccessibilitySummary>(([role, data]) => ({
      role,
      count: data.count,
      tagNames: Array.from(data.tagNames).sort(),
    }))
    .sort((a, b) => b.count - a.count);
}

function inferImplicitRole(tag: string, attrs: Record<string, string>): string | undefined {
  if (tag === 'button') {
    return 'button';
  }
  if (tag === 'a' && typeof attrs.href === 'string' && attrs.href.length > 0) {
    return 'link';
  }
  if (tag === 'img') {
    return 'img';
  }
  if (tag === 'input') {
    const type = (attrs.type ?? '').toLowerCase();
    if (type === 'button' || type === 'submit' || type === 'reset') {
      return 'button';
    }
    if (type === 'checkbox') {
      return 'checkbox';
    }
    if (type === 'radio') {
      return 'radio';
    }
    if (type === 'text' || type === 'email' || type === 'search' || type === 'tel' || type === 'url') {
      return 'textbox';
    }
  }
  if (tag === 'textarea') {
    return 'textbox';
  }
  if (tag === 'select') {
    return 'listbox';
  }
  if (tag === 'nav') {
    return 'navigation';
  }
  if (tag === 'header') {
    return 'banner';
  }
  if (tag === 'footer') {
    return 'contentinfo';
  }
  if (tag === 'main') {
    return 'main';
  }
  if (tag === 'form') {
    return 'form';
  }
  if (tag === 'aside') {
    return 'complementary';
  }
  if (tag === 'section') {
    return 'region';
  }
  return undefined;
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : JSON.stringify(error);
}
