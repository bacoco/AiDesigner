import { Client } from '@modelcontextprotocol/sdk/client';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket';

export type InspectOptions = {
  /**
   * WebSocket URL for the MCP server.
   */
  url: string;
  /**
   * Legacy option preserved for compatibility with callers that previously
   * controlled which visual states to capture during analysis.
   */
  states?: string[];
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
  | 'disconnect';

export type InspectionError = {
  stage: InspectionErrorStage;
  message: string;
  toolName?: string;
};

type LegacyInspectionArtifacts = {
  /**
   * Maintained for compatibility with existing AiDesigner inference helpers.
   * These are currently populated with empty structures because the runtime
   * inspection workflow has not yet been re-implemented on top of MCP.
   */
  domSnapshot: Record<string, unknown>;
  accessibilityTree: Record<string, unknown>;
  cssom: Record<string, unknown>;
  computedStyles: unknown[];
  console: unknown[];
};

export type InspectResult = {
  tools: ToolInventoryItem[];
  errors: InspectionError[];
  server?: {
    name?: string;
    version?: string;
  };
} & LegacyInspectionArtifacts;

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
    return withLegacyArtifacts({ tools: [], errors });
  }

  let toolResponse: Awaited<ReturnType<Client['listTools']>>;
  try {
    toolResponse = await client.listTools();
  } catch (error) {
    errors.push({ stage: 'list-tools', message: formatErrorMessage(error) });
    await safeClose(transport, errors, connected);
    return withLegacyArtifacts({ tools: [], errors, server: getServerInfo(client) });
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

  await safeClose(transport, errors, connected);

  return withLegacyArtifacts({
    tools,
    errors,
    server: getServerInfo(client),
  });
}

function withLegacyArtifacts(
  result: Omit<InspectResult, keyof LegacyInspectionArtifacts>,
): InspectResult {
  return {
    domSnapshot: {},
    accessibilityTree: {},
    cssom: {},
    computedStyles: [],
    console: [],
    ...result,
  };
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
