'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.OperationPolicyEnforcer = void 0;
const node_fs_1 = require('node:fs');
const node_path_1 = __importDefault(require('node:path'));
const js_yaml_1 = require('js-yaml');
const HOUR_IN_MS = 60 * 60 * 1000;
class OperationPolicyEnforcer {
  constructor(config, options = {}) {
    this.usage = new Map();
    this.config = normalizeConfig(config);
    this.now = options.now ?? (() => Date.now());
    this.source = options.source;
  }
  static fromFile(filePath) {
    const absolutePath = node_path_1.default.resolve(filePath);
    const raw = (0, node_fs_1.readFileSync)(absolutePath, 'utf8');
    const parsed = (0, js_yaml_1.load)(raw);
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(
        `[Codex] Policy file "${absolutePath}" must contain a YAML or JSON object at the top level.`,
      );
    }
    return new OperationPolicyEnforcer(parsed, { source: absolutePath });
  }
  assess(operation, keys) {
    const resolved = this.resolve(keys);
    if (!resolved) {
      return undefined;
    }
    const { key, policy } = resolved;
    const limit = policy.maxExecutionsPerHour;
    const requiresEscalation = Boolean(policy.escalate);
    if (limit != null) {
      if (limit <= 0) {
        const error = new Error(
          `[Codex] Operation "${operation}" blocked by policy rule "${key}". This operation is disabled (maxExecutionsPerHour=0).`,
        );
        error.name = 'OperationPolicyError';
        return {
          matchedKey: key,
          requiresEscalation,
          violation: error,
        };
      }
      const assessNow = this.now();
      const state = this.usage.get(key);
      const withinWindow = Boolean(state && assessNow - state.windowStart < HOUR_IN_MS);
      const usedCount = withinWindow && state ? state.count : 0;
      // Memory leak mitigation: clean up stale entries when map grows large
      if (this.usage.size > 1000) {
        const cutoff = assessNow - HOUR_IN_MS;
        for (const [mapKey, window] of this.usage.entries()) {
          if (window.windowStart < cutoff) {
            this.usage.delete(mapKey);
          }
        }
      }
      if (usedCount >= limit) {
        const windowEndsAt =
          withinWindow && state ? state.windowStart + HOUR_IN_MS : assessNow + HOUR_IN_MS;
        const waitMs = Math.max(0, windowEndsAt - assessNow);
        const waitDescription = formatDuration(waitMs);
        const error = new Error(
          `[Codex] Operation "${operation}" blocked by policy rule "${key}". Limit of ${limit} executions per hour exceeded. Retry in ${waitDescription}.`,
        );
        error.name = 'OperationPolicyError';
        return {
          matchedKey: key,
          requiresEscalation,
          violation: error,
        };
      }
      return {
        matchedKey: key,
        requiresEscalation,
        commit: () => {
          const current = this.usage.get(key);
          if (!current || assessNow - current.windowStart >= HOUR_IN_MS) {
            this.usage.set(key, { windowStart: assessNow, count: 1 });
          } else {
            current.count += 1;
          }
        },
      };
    }
    return {
      matchedKey: key,
      requiresEscalation,
      commit: undefined,
    };
  }
  getSource() {
    return this.source;
  }
  resolve(keys) {
    const searchKeys = Array.from(new Set(keys.map((key) => key.toLowerCase()))).reverse();
    for (const key of searchKeys) {
      const policy = this.config.operations[key];
      if (policy) {
        return { key, policy };
      }
    }
    const wildcard = this.config.operations['*'];
    if (wildcard) {
      return { key: '*', policy: wildcard };
    }
    if (this.config.defaults) {
      // Use the base operation name as the key so each operation has its own quota bucket
      const baseKey = searchKeys.length > 0 ? searchKeys[searchKeys.length - 1] : 'defaults';
      return { key: baseKey, policy: this.config.defaults };
    }
    return undefined;
  }
}
exports.OperationPolicyEnforcer = OperationPolicyEnforcer;
function normalizeConfig(input) {
  const operations = {};
  const defaultsRaw = input.defaults ?? input.default;
  const operationsInput = input.operations;
  if (operationsInput != null) {
    if (typeof operationsInput !== 'object' || Array.isArray(operationsInput)) {
      throw new Error('[Codex] "operations" must be an object keyed by normalized operation name.');
    }
    for (const [rawKey, value] of Object.entries(operationsInput)) {
      const key = rawKey.trim().toLowerCase();
      if (key.length === 0) {
        continue;
      }
      operations[key] = normalizePolicyEntry(value, `operations.${rawKey}`);
    }
  }
  const defaults = defaultsRaw ? normalizePolicyEntry(defaultsRaw, 'defaults') : undefined;
  return { operations, defaults };
}
function normalizePolicyEntry(value, context) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`[Codex] Policy entry "${context}" must be an object.`);
  }
  const candidate = value;
  const normalized = {};
  if ('maxExecutionsPerHour' in candidate && candidate.maxExecutionsPerHour != null) {
    const rawLimit = candidate.maxExecutionsPerHour;
    const parsedLimit = parseInteger(rawLimit);
    if (parsedLimit < 0) {
      throw new Error(
        `[Codex] Policy entry "${context}.maxExecutionsPerHour" cannot be negative (received ${rawLimit}).`,
      );
    }
    normalized.maxExecutionsPerHour = parsedLimit;
  }
  if ('escalate' in candidate && candidate.escalate != null) {
    const rawEscalate = candidate.escalate;
    normalized.escalate = parseBoolean(rawEscalate);
  }
  return normalized;
}
function parseInteger(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error(`[Codex] Expected a numeric value, received ${JSON.stringify(value)}.`);
}
function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  throw new Error(`[Codex] Expected a boolean value, received ${JSON.stringify(value)}.`);
}
function formatDuration(ms) {
  if (ms <= 0) {
    return '0 minutes';
  }
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.ceil(ms / 3600000);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}
