const os = require('node:os');
const path = require('node:path');
const fs = require('fs-extra');

const DEFAULT_CLI_SETTINGS = {
  default_model: 'GPT-5-Codex',
  reasoning_level: 'medium',
  approval_mode: 'auto',
};

const SERVER_KEY = 'bmad_invisible';

const DEFAULT_MCP_SERVER = {
  type: 'command',
  command: 'npx',
  args: ['bmad-invisible', 'mcp'],
  auto_start: true,
  description: 'BMAD Invisible Orchestrator MCP server',
};

const TRUE_VALUES = new Set(['1', 'true', 'yes']);

class CodexConfigManager {
  constructor(options = {}) {
    this.fs = options.fs ?? fs;
    this.logger = options.logger ?? console;
    this.homeDir = options.homeDir ?? os.homedir();
    this.configDir = options.configDir ?? path.join(this.homeDir, '.codex');
    this.configPath = options.configPath ?? path.join(this.configDir, 'config.toml');
  }

  getConfigPath() {
    return this.configPath;
  }

  async ensureDirectory() {
    await this.fs.ensureDir(this.configDir);
  }

  async loadConfig() {
    const exists = await this.fs.pathExists(this.configPath);
    if (!exists) {
      return { config: {}, existed: false };
    }

    const raw = await this.fs.readFile(this.configPath, 'utf8');
    try {
      const parsed = parseToml(raw);
      return { config: parsed ?? {}, existed: true };
    } catch (error) {
      const backupPath = `${this.configPath}.bak-${Date.now()}`;
      await this.fs.writeFile(backupPath, raw);
      this.logger?.warn?.(
        `Codex config at ${this.configPath} was invalid and has been backed up to ${backupPath}: ${error.message}`,
      );
      return {
        config: {},
        existed: true,
        backupPath,
        parseError: error,
      };
    }
  }

  applyDefaults(config) {
    const merged = { ...config };
    let changed = false;

    if (!merged.cli || typeof merged.cli !== 'object' || Array.isArray(merged.cli)) {
      merged.cli = {};
      changed = true;
    }

    for (const [key, value] of Object.entries(DEFAULT_CLI_SETTINGS)) {
      if (merged.cli[key] === undefined) {
        merged.cli[key] = value;
        changed = true;
      }
    }

    if (
      !merged.mcp_servers ||
      typeof merged.mcp_servers !== 'object' ||
      Array.isArray(merged.mcp_servers)
    ) {
      merged.mcp_servers = {};
      changed = true;
    }

    const existingServer =
      merged.mcp_servers[SERVER_KEY] && typeof merged.mcp_servers[SERVER_KEY] === 'object'
        ? { ...merged.mcp_servers[SERVER_KEY] }
        : {};

    if (existingServer.type === undefined) {
      existingServer.type = DEFAULT_MCP_SERVER.type;
      changed = true;
    }

    if (existingServer.command === undefined) {
      existingServer.command = DEFAULT_MCP_SERVER.command;
      changed = true;
    }

    if (existingServer.args === undefined) {
      existingServer.args = [...DEFAULT_MCP_SERVER.args];
      changed = true;
    }

    if (existingServer.auto_start === undefined) {
      existingServer.auto_start = DEFAULT_MCP_SERVER.auto_start;
      changed = true;
    }

    if (existingServer.description === undefined) {
      existingServer.description = DEFAULT_MCP_SERVER.description;
      changed = true;
    }

    if (
      !existingServer.env ||
      typeof existingServer.env !== 'object' ||
      Array.isArray(existingServer.env)
    ) {
      existingServer.env = {};
      changed = true;
    }

    merged.mcp_servers[SERVER_KEY] = existingServer;

    return { config: merged, changed };
  }

  async saveConfig(config) {
    const serialized = stringifyToml(config);
    await this.fs.writeFile(this.configPath, `${serialized.trim()}\n`);
  }

  async ensureConfig() {
    await this.ensureDirectory();
    const loadResult = await this.loadConfig();
    const { config: mergedConfig, changed } = this.applyDefaults(loadResult.config);

    const needsWrite = changed || !loadResult.existed || loadResult.parseError;

    if (needsWrite) {
      await this.saveConfig(mergedConfig);
    }

    return {
      config: mergedConfig,
      configPath: this.configPath,
      updated: needsWrite,
      parseError: loadResult.parseError ?? null,
      backupPath: loadResult.backupPath ?? null,
    };
  }
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function isNonInteractiveEnvironment() {
  if (typeof process === 'undefined') return false;
  if (!process.stdout || typeof process.stdout.isTTY !== 'boolean') return false;

  const ci = process.env.CI;
  const envFlag = process.env.BMAD_NON_INTERACTIVE ?? process.env.BMAD_INSTALLER_NON_INTERACTIVE;

  if (ci && TRUE_VALUES.has(ci.toLowerCase())) return true;
  if (envFlag && TRUE_VALUES.has(envFlag.toLowerCase())) return true;

  return !process.stdout.isTTY;
}

async function ensureCodexConfig(options = {}) {
  const manager = new CodexConfigManager(options);
  return manager.ensureConfig();
}

function parseToml(input) {
  if (!input) return {};

  const result = {};
  let currentPath = [];
  const lines = input.split(/\r?\n/);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const section = trimmed.slice(1, -1).trim();
      if (!section) {
        currentPath = [];
        continue;
      }

      currentPath = section
        .split('.')
        .map((part) => part.trim())
        .filter(Boolean);

      let target = result;
      for (const segment of currentPath) {
        if (!isPlainObject(target[segment])) {
          target[segment] = {};
        }
        target = target[segment];
      }

      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key) continue;

    let valuePortion = trimmed.slice(equalsIndex + 1).trim();
    valuePortion = stripInlineComment(valuePortion);

    const value = parseTomlValue(valuePortion);

    let target = result;
    for (const segment of currentPath) {
      if (!isPlainObject(target[segment])) {
        target[segment] = {};
      }
      target = target[segment];
    }

    target[key] = value;
  }

  return result;
}

function stripInlineComment(value) {
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === '"' && !escaped) {
      inString = !inString;
    }

    if (char === '#' && !inString) {
      return value.slice(0, index).trim();
    }

    escaped = char === '\\' && !escaped;
  }

  return value.trim();
}

function parseTomlValue(rawValue) {
  if (rawValue === '') return '';
  if (rawValue === 'true' || rawValue === 'false') {
    return rawValue === 'true';
  }

  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue.slice(1, -1);
    }
  }

  if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
    try {
      return JSON.parse(rawValue);
    } catch {
      const inner = rawValue.slice(1, -1).trim();
      if (!inner) return [];
      return inner
        .split(',')
        .map((entry) => parseTomlValue(entry.trim()))
        .filter((entry) => entry !== undefined);
    }
  }

  if (!Number.isNaN(Number(rawValue))) {
    return Number(rawValue);
  }

  return rawValue;
}

function stringifyToml(obj) {
  const tables = [];
  collectTables([], obj ?? {}, tables);

  const lines = [];
  const rootTable = tables.find((entry) => entry.path.length === 0);

  if (rootTable) {
    const keys = Object.keys(rootTable.values).sort();
    for (const key of keys) {
      lines.push(`${key} = ${formatTomlValue(rootTable.values[key])}`);
    }
  }

  const otherTables = tables
    .filter((entry) => entry.path.length > 0 && Object.keys(entry.values).length > 0)
    .sort((a, b) => a.path.join('.').localeCompare(b.path.join('.')));

  for (const table of otherTables) {
    if (lines.length > 0 && lines.at(-1) !== '') {
      lines.push('');
    }

    lines.push(`[${table.path.join('.')}]`);

    const keys = Object.keys(table.values).sort();
    for (const key of keys) {
      lines.push(`${key} = ${formatTomlValue(table.values[key])}`);
    }
  }

  return lines.join('\n');
}

function collectTables(pathSegments, data, tables) {
  const values = {};
  const nested = [];

  for (const [key, value] of Object.entries(data || {})) {
    if (isPlainObject(value)) {
      nested.push([key, value]);
    } else if (value !== undefined) {
      values[key] = value;
    }
  }

  tables.push({ path: pathSegments, values });

  for (const [key, value] of nested) {
    collectTables([...pathSegments, key], value, tables);
  }
}

function formatTomlValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => formatTomlValue(entry)).join(', ')}]`;
  }

  if (typeof value === 'string') {
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`)}"`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value === null || value === undefined) {
    return '""';
  }

  if (isPlainObject(value)) {
    return '""';
  }

  return `"${String(value)}"`;
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

module.exports = {
  CodexConfigManager,
  ensureCodexConfig,
  isNonInteractiveEnvironment,
  DEFAULT_CLI_SETTINGS,
  DEFAULT_MCP_SERVER,
  SERVER_KEY,
};
