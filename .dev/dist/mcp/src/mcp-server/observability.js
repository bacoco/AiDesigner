'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.StructuredLogger = void 0;
exports.createStructuredLogger = createStructuredLogger;
const DEFAULT_STREAM = process.stderr;
function normalizeFields(fields) {
  if (!fields) {
    return {};
  }
  const normalized = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) {
      normalized[key] = null;
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      normalized[key] = value
        .map((item) => {
          if (item == null) {
            return null;
          }
          if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
            return item;
          }
          return JSON.stringify(item);
        })
        .filter((item) => item !== undefined);
      continue;
    }
    if (typeof value === 'object') {
      const objectValue = value;
      const nested = {};
      for (const [nestedKey, nestedValue] of Object.entries(objectValue)) {
        if (nestedValue == null) {
          nested[nestedKey] = null;
        } else if (
          typeof nestedValue === 'string' ||
          typeof nestedValue === 'number' ||
          typeof nestedValue === 'boolean'
        ) {
          nested[nestedKey] = nestedValue;
        } else if (Array.isArray(nestedValue)) {
          nested[nestedKey] = nestedValue
            .map((item) => {
              if (item == null) {
                return null;
              }
              if (
                typeof item === 'string' ||
                typeof item === 'number' ||
                typeof item === 'boolean'
              ) {
                return item;
              }
              return JSON.stringify(item);
            })
            .filter((item) => item !== undefined);
        } else {
          nested[nestedKey] = JSON.stringify(nestedValue);
        }
      }
      normalized[key] = nested;
      continue;
    }
    normalized[key] = JSON.stringify(value);
  }
  return normalized;
}
function toMetricAttributes(fields) {
  if (!fields) {
    return undefined;
  }
  const attributes = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) {
      attributes[key] = null;
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      attributes[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      attributes[key] = value
        .map((item) => {
          if (item == null) {
            return null;
          }
          if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
            return item;
          }
          return JSON.stringify(item);
        })
        .join(',');
      continue;
    }
    if (typeof value === 'object') {
      attributes[key] = JSON.stringify(value);
      continue;
    }
    attributes[key] = String(value);
  }
  return attributes;
}
function toMetricsArray(metrics) {
  if (!metrics) {
    return [];
  }
  return Array.isArray(metrics) ? metrics : [metrics];
}
class StructuredLogger {
  constructor(options = {}) {
    this.stream = options.stream ?? DEFAULT_STREAM;
    this.base = options.base ? { ...normalizeFields(options.base) } : {};
    this.metricsSinks = toMetricsArray(options.metrics);
    if (options.name && !this.base.service) {
      this.base.service = options.name;
    }
  }
  child(fields) {
    return new StructuredLogger({
      stream: this.stream,
      base: { ...this.base, ...normalizeFields(fields) },
      metrics: this.metricsSinks,
    });
  }
  log(level, message, fields) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...this.base,
      ...normalizeFields(fields),
    };
    this.stream.write(`${JSON.stringify(entry)}\n`);
  }
  debug(message, fields) {
    this.log('debug', message, fields);
  }
  info(message, fields) {
    this.log('info', message, fields);
  }
  warn(message, fields) {
    this.log('warn', message, fields);
  }
  error(message, fields) {
    this.log('error', message, fields);
  }
  startTimer() {
    const start = process.hrtime.bigint();
    return () => Number(process.hrtime.bigint() - start) / 1000000;
  }
  recordMetric(event) {
    for (const sink of this.metricsSinks) {
      Promise.resolve()
        .then(() => sink(event))
        .catch((error) => {
          const details = error instanceof Error ? error.message : String(error);
          this.stream.write(
            `${JSON.stringify({
              ts: new Date().toISOString(),
              level: 'warn',
              msg: 'metric_sink_error',
              service: this.base.service,
              error: details,
            })}\n`,
          );
        });
    }
  }
  recordTiming(name, durationMs, attributes) {
    this.recordMetric({
      name,
      value: durationMs,
      type: 'timing',
      unit: 'ms',
      attributes,
    });
  }
  async time(message, fn, fields, metricName) {
    const stopTimer = this.startTimer();
    try {
      const result = await fn();
      const durationMs = stopTimer();
      this.info(message, { ...fields, durationMs });
      if (metricName) {
        this.recordTiming(metricName, durationMs, toMetricAttributes(fields));
      }
      return result;
    } catch (error) {
      const durationMs = stopTimer();
      this.error(message, {
        ...fields,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      if (metricName) {
        this.recordTiming(metricName, durationMs, {
          ...toMetricAttributes(fields),
          error: 'true',
        });
      }
      throw error;
    }
  }
}
exports.StructuredLogger = StructuredLogger;
function createStructuredLogger(options = {}) {
  return new StructuredLogger(options);
}
