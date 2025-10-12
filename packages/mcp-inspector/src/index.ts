import { Client } from '@modelcontextprotocol/sdk/client';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket';

export type InspectCaptureOptions = {
  domSnapshot?: boolean;
  accessibilityTree?: boolean;
  cssom?: boolean;
  console?: boolean;
  computedStyles?: boolean;
};

export type InspectOptions = {
  /**
   * WebSocket URL for the MCP server.
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
  | 'disconnect';

export type InspectionError = {
  stage: InspectionErrorStage;
  message: string;
  toolName?: string;
};

export type InspectCapture = {
  domSnapshot?: unknown;
  accessibilityTree?: unknown;
  cssom?: unknown;
  console?: unknown;
  computedStyles?: unknown[];
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

const CLIENT_INFO = {
  name: 'AiDesigner MCP Inspector',
  version: '1.0.0',
};

export async function analyzeWithMCP(opts: InspectOptions): Promise<InspectResult> {
  const errors: InspectionError[] = [];
  const client = new Client(CLIENT_INFO);
  const transport = new WebSocketClientTransport(new URL(opts.url));
  let connected = false;

  try {
    await client.connect(transport);
    connected = true;
  } catch (error) {
    errors.push({ stage: 'connect', message: formatErrorMessage(error) });
    await safeClose(transport, errors, connected);
    return { tools: [], errors };
  }

  let toolResponse: Awaited<ReturnType<Client['listTools']>>;
  try {
    toolResponse = await client.listTools();
  } catch (error) {
    errors.push({ stage: 'list-tools', message: formatErrorMessage(error) });
    await safeClose(transport, errors, connected);
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

  await safeClose(transport, errors, connected);

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

function getServerInfo(client: Client): InspectResult['server'] {
  const serverVersion = client.getServerVersion();
  if (!serverVersion) {
    return undefined;
  }

  return {
    name: serverVersion.name,
    version: serverVersion.version,
  };
}

async function safeClose(
  transport: WebSocketClientTransport,
  errors: InspectionError[],
  connected: boolean,
): Promise<void> {
  if (!connected) {
    return;
  }

  try {
    await transport.close();
  } catch (error) {
    errors.push({ stage: 'disconnect', message: formatErrorMessage(error) });
  }
}

type JsonSchema = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  const?: unknown;
  format?: string;
  items?: JsonSchema | JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
};

function formatToolSignature(
  name: string,
  inputSchema: JsonSchema | undefined,
  outputSchema: JsonSchema | undefined,
): string {
  const parameters = formatParameterObject(inputSchema);
  const returnType = outputSchema ? describeSchema(outputSchema) : 'void';
  return `${name}(${parameters}) => ${returnType}`;
}

function formatParameterObject(schema: JsonSchema | undefined): string {
  if (!schema || schema.type !== 'object') {
    return '{}';
  }

  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const entries = Object.entries(properties);

  if (entries.length === 0) {
    return '{}';
  }

  const parts = entries.map(([key, definition]) => {
    const isRequired = required.has(key);
    const typeDescription = describeSchema(definition);
    return `${key}${isRequired ? '' : '?'}: ${typeDescription}`;
  });

  return `{ ${parts.join('; ')} }`;
}

function describeSchema(schema: JsonSchema | undefined): string {
  if (!schema) {
    return 'unknown';
  }

  if (schema.const !== undefined) {
    return JSON.stringify(schema.const);
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  }

  if (schema.anyOf?.length) {
    return schema.anyOf.map(describeSchema).join(' | ');
  }

  if (schema.oneOf?.length) {
    return schema.oneOf.map(describeSchema).join(' | ');
  }

  if (schema.allOf?.length) {
    return schema.allOf.map(describeSchema).join(' & ');
  }

  if (schema.type === 'array') {
    if (Array.isArray(schema.items)) {
      const types = schema.items.map(describeSchema).join(' | ');
      return `Array<${types}>`;
    }
    return `Array<${describeSchema(schema.items)}>`;
  }

  if (schema.type === 'object') {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    const keys = Object.keys(properties);

    if (keys.length === 0) {
      return 'object';
    }

    const fields = keys.map((key) => {
      const isRequired = required.has(key);
      const typeDescription = describeSchema(properties[key]);
      return `${key}${isRequired ? '' : '?'}: ${typeDescription}`;
    });

    return `{ ${fields.join('; ')} }`;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.map((type) => describePrimitive(type)).join(' | ');
  }

  if (typeof schema.type === 'string') {
    return describePrimitive(schema.type, schema.format);
  }

  return 'unknown';
}

function describePrimitive(type: string, format?: string): string {
  switch (type) {
    case 'integer':
      return 'number';
    case 'number':
    case 'boolean':
    case 'string':
      return format ? `${type}(${format})` : type;
    case 'null':
      return 'null';
    default:
      return type;
  }
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : JSON.stringify(error);
}
