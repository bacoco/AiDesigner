import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

export interface EnsureConfigOptions {
  nonInteractive?: boolean;
}

export interface EnsureConfigResult {
  configPath: string;
  changed: boolean;
  config: Record<string, any>;
}

type TomlTable = Record<string, any>;

const DEFAULT_MODEL = 'GPT-5-Codex';
const DEFAULT_MANUAL_APPROVAL = false;
const SERVER_NAME = 'bmad-mcp';

const DEFAULT_SERVERS: ReadonlyArray<TomlTable> = [
  {
    name: SERVER_NAME,
    displayName: 'Agilai MCP',
    description: 'Agilai MCP server for orchestrating BMAD agents.',
    transport: 'stdio',
    command: 'npx',
    args: ['bmad-invisible', 'mcp'],
    autoStart: true,
    autoApprove: true,
  },
  {
    name: 'chrome-devtools',
    displayName: 'Chrome DevTools MCP',
    description: 'Chrome DevTools automation server for inspecting web apps.',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-chrome-devtools'],
    autoStart: false,
    autoApprove: true,
  },
  {
    name: 'shadcn',
    displayName: 'shadcn/ui MCP',
    description: 'shadcn/ui component scaffolding and documentation helper.',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-shadcn'],
    autoStart: false,
    autoApprove: true,
  },
];

/**
 * Strips inline comments from a TOML line while preserving # characters inside strings.
 * @param line - The TOML line to process
 * @returns The line with comments removed
 */
function stripInlineComments(line: string): string {
  let result = '';
  let inString = false;
  let escape = false;
  let quote: string | null = null;

  for (const char of line) {
    if (escape) {
      result += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escape = true;
      continue;
    }

    if (char === '"' || char === "'") {
      result += char;
      if (inString && quote === char) {
        inString = false;
        quote = null;
      } else if (!inString) {
        inString = true;
        quote = char;
      }
      continue;
    }

    if (char === '#' && !inString) {
      break;
    }

    result += char;
  }

  return result;
}

/**
 * Parses a TOML string value, handling escape sequences.
 * @param value - The quoted string to parse
 * @returns The unescaped string value
 */
function parseString(value: string): string {
  const quote = value[0];
  let result = '';
  let escape = false;

  for (let index = 1; index < value.length; index += 1) {
    const char = value[index];
    if (escape) {
      switch (char) {
        case 'n':
          result += '\n';
          break;
        case 'r':
          result += '\r';
          break;
        case 't':
          result += '\t';
          break;
        case '"':
          result += '"';
          break;
        case "'":
          result += "'";
          break;
        case '\\':
          result += '\\';
          break;
        default:
          result += char;
          break;
      }
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === quote) {
      break;
    }

    result += char;
  }

  return result;
}

function parseArray(value: string): any[] {
  const inner = value.slice(1, -1).trim();
  if (inner === '') {
    return [];
  }

  const elements: string[] = [];
  let buffer = '';
  let inString = false;
  let escape = false;
  let quote: string | null = null;

  for (const char of inner) {
    if (escape) {
      buffer += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      buffer += char;
      escape = true;
      continue;
    }

    if (char === '"' || char === "'") {
      buffer += char;
      if (inString && quote === char) {
        inString = false;
        quote = null;
      } else if (!inString) {
        inString = true;
        quote = char;
      }
      continue;
    }

    if (char === ',' && !inString) {
      elements.push(buffer.trim());
      buffer = '';
      continue;
    }

    buffer += char;
  }

  if (buffer.trim() !== '') {
    elements.push(buffer.trim());
  }

  return elements.map((element) => parseValue(element));
}

function parsePrimitive(value: string): any {
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  if (/^[+-]?\d+(\.\d+)?$/.test(value)) {
    return Number.parseFloat(value);
  }

  return value;
}

function parseValue(value: string): any {
  if (value.startsWith('"') || value.startsWith("'")) {
    return parseString(value);
  }

  if (value.startsWith('[') && value.endsWith(']')) {
    return parseArray(value);
  }

  return parsePrimitive(value);
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(target: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(target, key);
}

function getServerLookupKey(server: TomlTable | undefined): string {
  if (!server) {
    return '';
  }
  const raw =
    typeof server.name === 'string'
      ? server.name
      : typeof server.id === 'string'
        ? server.id
        : '';
  return raw.toLowerCase();
}

function ensureObjectPath(root: TomlTable, pathSegments: string[]): TomlTable {
  let current: TomlTable = root;
  for (const segment of pathSegments) {
    if (!hasOwn(current, segment) || !isPlainObject(current[segment])) {
      current[segment] = {};
    }
    current = current[segment] as TomlTable;
  }
  return current;
}

function parseToml(content: string): TomlTable {
  const root: TomlTable = {};
  let currentTable: TomlTable = root;

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const cleaned = stripInlineComments(rawLine).trim();
    if (!cleaned) continue;

    if (cleaned.startsWith('[')) {
      const isArray = cleaned.startsWith('[[') && cleaned.endsWith(']]');
      const header = isArray ? cleaned.slice(2, -2) : cleaned.slice(1, -1);
      const segments = header
        .split('.')
        .map((segment) => segment.trim())
        .filter(Boolean);
      if (segments.length === 0) continue;

      if (isArray) {
        const parentSegments = segments.slice(0, -1);
        const key = segments.at(-1)!;
        const parent = ensureObjectPath(root, parentSegments);
        if (!Array.isArray(parent[key])) {
          parent[key] = [];
        }
        const container = parent[key] as TomlTable[];
        const table: TomlTable = {};
        container.push(table);
        currentTable = table;
      } else {
        currentTable = ensureObjectPath(root, segments);
      }

      continue;
    }

    const equalsIndex = cleaned.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const keySegment = cleaned.slice(0, equalsIndex).trim();
    const valueSegment = cleaned.slice(equalsIndex + 1).trim();
    if (!keySegment) {
      continue;
    }

    const keyParts = keySegment
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean);
    const target =
      keyParts.length > 1 ? ensureObjectPath(currentTable, keyParts.slice(0, -1)) : currentTable;
    const key = keyParts.at(-1)!;
    target[key] = parseValue(valueSegment);
  }

  return root;
}

function escapeString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function formatPrimitive(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return `"${escapeString(value)}"`;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  return value ? 'true' : 'false';
}

function formatArray(value: any[]): string {
  const parts = value.map((element) => {
    if (Array.isArray(element)) {
      return formatArray(element);
    }
    if (isPlainObject(element)) {
      return JSON.stringify(element);
    }
    return formatPrimitive(element as string | number | boolean);
  });
  return `[${parts.join(', ')}]`;
}

function writeTable(
  pathSegments: string[],
  table: TomlTable,
  lines: string[],
  skipHeader = false,
): void {
  const keys = Object.keys(table);
  keys.sort((a, b) => a.localeCompare(b));

  if (!skipHeader && pathSegments.length > 0) {
    if (lines.length > 0 && lines.at(-1) !== '') {
      lines.push('');
    }
    lines.push(`[${pathSegments.join('.')}]`);
  }

  const scalars: [string, any][] = [];
  const nestedObjects: [string, TomlTable][] = [];
  const arrayTables: [string, TomlTable[]][] = [];

  for (const key of keys) {
    const value = table[key];
    if (Array.isArray(value) && value.every((item) => !isPlainObject(item))) {
      scalars.push([key, value]);
    } else if (Array.isArray(value) && value.some((item) => isPlainObject(item))) {
      arrayTables.push([key, value as TomlTable[]]);
    } else if (isPlainObject(value)) {
      nestedObjects.push([key, value as TomlTable]);
    } else {
      scalars.push([key, value]);
    }
  }

  for (const [key, value] of scalars) {
    if (Array.isArray(value)) {
      lines.push(`${key} = ${formatArray(value)}`);
    } else {
      lines.push(`${key} = ${formatPrimitive(value as string | number | boolean)}`);
    }
  }

  for (const [key, tables] of arrayTables) {
    for (const tableValue of tables) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      lines.push(`[[${[...pathSegments, key].join('.')}]]`);
      writeTable([...pathSegments, key], tableValue, lines, true);
    }
  }

  for (const [key, value] of nestedObjects) {
    writeTable([...pathSegments, key], value, lines);
  }
}

function stringifyToml(table: TomlTable): string {
  const lines: string[] = [];
  writeTable([], table, lines, true);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function getConfigPath(): string {
  const home = os.homedir();
  if (!home) {
    throw new Error('Unable to determine user home directory for Codex configuration.');
  }
  return path.join(home, '.codex', 'config.toml');
}

async function readConfig(
  configPath: string,
  { nonInteractive }: { nonInteractive: boolean },
): Promise<{ raw: string | null; data: TomlTable }> {
  if (!(await fs.pathExists(configPath))) {
    return { raw: null, data: {} };
  }

  const raw = await fs.readFile(configPath, 'utf8');
  try {
    const data = parseToml(raw);
    return { raw, data };
  } catch (error) {
    const backupPath = `${configPath}.invalid-${Date.now()}`;
    await fs.copy(configPath, backupPath);
    const message = `Failed to parse existing Codex config. A backup was created at ${backupPath}. ${(error as Error).message}`;
    if (nonInteractive) {
      console.warn(message);
      return { raw: null, data: {} };
    }
    throw new Error(message);
  }
}

function normaliseCliConfig(cli: TomlTable | undefined): TomlTable {
  const next: TomlTable = { ...(cli ?? {}) };
  if (!hasOwn(next, 'default_model')) {
    next.default_model = DEFAULT_MODEL;
  }
  if (!hasOwn(next, 'require_manual_approval')) {
    next.require_manual_approval = DEFAULT_MANUAL_APPROVAL;
  }
  if (!hasOwn(next, 'auto_approve_tools')) {
    next.auto_approve_tools = !DEFAULT_MANUAL_APPROVAL;
  }
  return next;
}

/**
 * Merges the BMAD MCP server into the existing servers list.
 * Preserves user customizations by only adding missing keys from defaults.
 * Case-insensitive server name matching.
 * @param existingServers - The existing servers array from config
 * @returns Object containing merged servers array and whether changes were made
 */
function mergeServers(existingServers: any): { servers: TomlTable[]; changed: boolean } {
  const servers = Array.isArray(existingServers) ? [...existingServers] : [];
  const materialised: TomlTable[] = servers.filter((server): server is TomlTable =>
    isPlainObject(server),
  );

  let changed = false;

  for (const defaultServer of DEFAULT_SERVERS) {
    const canonical = { ...defaultServer };
    const lookupKey = getServerLookupKey(canonical);
    const index = materialised.findIndex((server) => getServerLookupKey(server) === lookupKey);

    if (index === -1) {
      materialised.push({ ...canonical });
      changed = true;
      continue;
    }

    const existing = materialised[index] ?? {};
    const merged = { ...canonical, ...existing };
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      materialised[index] = merged;
      changed = true;
    }
  }

  return { servers: materialised, changed };
}

function normaliseMcpConfig(mcp: TomlTable | undefined): { value: TomlTable; changed: boolean } {
  const next: TomlTable = { ...(mcp ?? {}) };
  const { servers, changed } = mergeServers(next.servers as any);
  next.servers = servers;
  if (!hasOwn(next, 'require_manual_approval')) {
    next.require_manual_approval = DEFAULT_MANUAL_APPROVAL;
  }
  if (!hasOwn(next, 'auto_approve')) {
    next.auto_approve = !DEFAULT_MANUAL_APPROVAL;
  }
  return { value: next, changed };
}

export async function ensureCodexConfig(
  options: EnsureConfigOptions = {},
): Promise<EnsureConfigResult> {
  const { nonInteractive = false } = options;
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  await fs.ensureDir(configDir);

  const { raw, data } = await readConfig(configPath, { nonInteractive });

  const nextConfig: TomlTable = { ...data };

  const normalisedCli = normaliseCliConfig(nextConfig.cli as TomlTable | undefined);
  const cliChanged = JSON.stringify(nextConfig.cli ?? {}) !== JSON.stringify(normalisedCli);
  nextConfig.cli = normalisedCli;

  const { value: mcpConfig, changed: mcpChanged } = normaliseMcpConfig(
    nextConfig.mcp as TomlTable | undefined,
  );
  const mcpDelta = JSON.stringify(nextConfig.mcp ?? {}) !== JSON.stringify(mcpConfig);
  nextConfig.mcp = mcpConfig;

  const changed = cliChanged || mcpChanged || mcpDelta || raw === null;
  const output = stringifyToml(nextConfig).trimEnd() + '\n';

  if (!changed && raw !== null) {
    return { configPath, changed: false, config: nextConfig };
  }

  await fs.writeFile(configPath, output, 'utf8');

  return { configPath, changed: true, config: nextConfig };
}

export function getCodexConfigPath(): string {
  return getConfigPath();
}
