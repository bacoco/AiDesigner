'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ensureCodexConfig = ensureCodexConfig;
exports.getCodexConfigPath = getCodexConfigPath;
const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');
const DEFAULT_MODEL = 'GPT-5-Codex';
const DEFAULT_MANUAL_APPROVAL = false;
const SERVER_NAME = 'bmad-mcp';
const DEFAULT_SERVER = {
  name: SERVER_NAME,
  displayName: 'BMAD Invisible MCP',
  description: 'BMAD Invisible MCP server for orchestrating BMAD agents.',
  transport: 'stdio',
  command: 'npx',
  args: ['bmad-invisible', 'mcp'],
  autoStart: true,
  autoApprove: false,
};
/**
 * Strips inline comments from a TOML line while preserving # characters inside strings.
 * @param line - The TOML line to process
 * @returns The line with comments removed
 */
function stripInlineComments(line) {
  let result = '';
  let inString = false;
  let escape = false;
  let quote = null;
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
function parseString(value) {
  const quote = value[0];
  let result = '';
  let escape = false;
  for (let index = 1; index < value.length; index += 1) {
    const char = value[index];
    if (escape) {
      switch (char) {
        case 'n': {
          result += '\n';
          break;
        }
        case 'r': {
          result += '\r';
          break;
        }
        case 't': {
          result += '\t';
          break;
        }
        case '"': {
          result += '"';
          break;
        }
        case "'": {
          result += "'";
          break;
        }
        case '\\': {
          result += '\\';
          break;
        }
        default: {
          result += char;
          break;
        }
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
function parseArray(value) {
  const inner = value.slice(1, -1).trim();
  if (inner === '') {
    return [];
  }
  const elements = [];
  let buffer = '';
  let inString = false;
  let escape = false;
  let quote = null;
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
function parsePrimitive(value) {
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  if (/^[+-]?\d+(\.\d+)?$/.test(value)) {
    return Number.parseFloat(value);
  }
  return value;
}
function parseValue(value) {
  if (value.startsWith('"') || value.startsWith("'")) {
    return parseString(value);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return parseArray(value);
  }
  return parsePrimitive(value);
}
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function hasOwn(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}
function ensureObjectPath(root, pathSegments) {
  let current = root;
  for (const segment of pathSegments) {
    if (!hasOwn(current, segment) || !isPlainObject(current[segment])) {
      current[segment] = {};
    }
    current = current[segment];
  }
  return current;
}
function parseToml(content) {
  const root = {};
  let currentTable = root;
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
        const key = segments.at(-1);
        const parent = ensureObjectPath(root, parentSegments);
        if (!Array.isArray(parent[key])) {
          parent[key] = [];
        }
        const container = parent[key];
        const table = {};
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
    const key = keyParts.at(-1);
    target[key] = parseValue(valueSegment);
  }
  return root;
}
function escapeString(value) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', String.raw`\"`)
    .replaceAll('\n', String.raw`\n`)
    .replaceAll('\r', String.raw`\r`)
    .replaceAll('\t', String.raw`\t`);
}
function formatPrimitive(value) {
  if (typeof value === 'string') {
    return `"${escapeString(value)}"`;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  return value ? 'true' : 'false';
}
function formatArray(value) {
  const parts = value.map((element) => {
    if (Array.isArray(element)) {
      return formatArray(element);
    }
    if (isPlainObject(element)) {
      return JSON.stringify(element);
    }
    return formatPrimitive(element);
  });
  return `[${parts.join(', ')}]`;
}
function writeTable(pathSegments, table, lines, skipHeader = false) {
  const keys = Object.keys(table);
  keys.sort((a, b) => a.localeCompare(b));
  if (!skipHeader && pathSegments.length > 0) {
    if (lines.length > 0 && lines.at(-1) !== '') {
      lines.push('');
    }
    lines.push(`[${pathSegments.join('.')}]`);
  }
  const scalars = [];
  const nestedObjects = [];
  const arrayTables = [];
  for (const key of keys) {
    const value = table[key];
    if (Array.isArray(value) && value.every((item) => !isPlainObject(item))) {
      scalars.push([key, value]);
    } else if (Array.isArray(value) && value.some((item) => isPlainObject(item))) {
      arrayTables.push([key, value]);
    } else if (isPlainObject(value)) {
      nestedObjects.push([key, value]);
    } else {
      scalars.push([key, value]);
    }
  }
  for (const [key, value] of scalars) {
    if (Array.isArray(value)) {
      lines.push(`${key} = ${formatArray(value)}`);
    } else {
      lines.push(`${key} = ${formatPrimitive(value)}`);
    }
  }
  for (const [key, tables] of arrayTables) {
    for (const tableValue of tables) {
      if (lines.length > 0 && lines.at(-1) !== '') {
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
function stringifyToml(table) {
  const lines = [];
  writeTable([], table, lines, true);
  return lines.join('\n').replaceAll(/\n{3,}/g, '\n\n');
}
function getConfigPath() {
  const home = os.homedir();
  if (!home) {
    throw new Error('Unable to determine user home directory for Codex configuration.');
  }
  return path.join(home, '.codex', 'config.toml');
}
async function readConfig(configPath, { nonInteractive }) {
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
    const message = `Failed to parse existing Codex config. A backup was created at ${backupPath}. ${error.message}`;
    if (nonInteractive) {
      console.warn(message);
      return { raw: null, data: {} };
    }
    throw new Error(message);
  }
}
function normaliseCliConfig(cli) {
  const next = { ...(cli !== null && cli !== void 0 ? cli : {}) };
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
function mergeServers(existingServers) {
  var _a;
  const servers = Array.isArray(existingServers) ? [...existingServers] : [];
  const materialised = servers.filter((server) => isPlainObject(server));
  const index = materialised.findIndex((server) => {
    var _a, _b;
    const name =
      (_b =
        (_a = server === null || server === void 0 ? void 0 : server.name) !== null && _a !== void 0
          ? _a
          : server === null || server === void 0
            ? void 0
            : server.id) !== null && _b !== void 0
        ? _b
        : '';
    return typeof name === 'string' && name.toLowerCase() === SERVER_NAME.toLowerCase();
  });
  const canonical = { ...DEFAULT_SERVER };
  if (index === -1) {
    materialised.push(canonical);
    return { servers: materialised, changed: true };
  }
  const existing = (_a = materialised[index]) !== null && _a !== void 0 ? _a : {};
  const merged = { ...canonical, ...existing };
  const changed = JSON.stringify(existing) !== JSON.stringify(merged);
  materialised[index] = merged;
  return { servers: materialised, changed };
}
function normaliseMcpConfig(mcp) {
  const next = { ...(mcp !== null && mcp !== void 0 ? mcp : {}) };
  const { servers, changed } = mergeServers(next.servers);
  next.servers = servers;
  if (!hasOwn(next, 'require_manual_approval')) {
    next.require_manual_approval = DEFAULT_MANUAL_APPROVAL;
  }
  if (!hasOwn(next, 'auto_approve')) {
    next.auto_approve = !DEFAULT_MANUAL_APPROVAL;
  }
  return { value: next, changed };
}
async function ensureCodexConfig(options = {}) {
  var _a, _b;
  const { nonInteractive = false } = options;
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  await fs.ensureDir(configDir);
  const { raw, data } = await readConfig(configPath, { nonInteractive });
  const nextConfig = { ...data };
  const normalisedCli = normaliseCliConfig(nextConfig.cli);
  const cliChanged =
    JSON.stringify((_a = nextConfig.cli) !== null && _a !== void 0 ? _a : {}) !==
    JSON.stringify(normalisedCli);
  nextConfig.cli = normalisedCli;
  const { value: mcpConfig, changed: mcpChanged } = normaliseMcpConfig(nextConfig.mcp);
  const mcpDelta =
    JSON.stringify((_b = nextConfig.mcp) !== null && _b !== void 0 ? _b : {}) !==
    JSON.stringify(mcpConfig);
  nextConfig.mcp = mcpConfig;
  const changed = cliChanged || mcpChanged || mcpDelta || raw === null;
  const output = stringifyToml(nextConfig).trimEnd() + '\n';
  if (!changed && raw !== null) {
    return { configPath, changed: false, config: nextConfig };
  }
  await fs.writeFile(configPath, output, 'utf8');
  return { configPath, changed: true, config: nextConfig };
}
function getCodexConfigPath() {
  return getConfigPath();
}
