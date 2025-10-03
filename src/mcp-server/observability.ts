import { Writable } from "node:stream";

type LogLevel = "debug" | "info" | "warn" | "error";

type Primitive = string | number | boolean | null;

type FieldValue = Primitive | Primitive[] | Record<string, Primitive | Primitive[]>;

export interface MetricEvent {
  name: string;
  value: number;
  type?: "counter" | "gauge" | "timing";
  unit?: string;
  attributes?: Record<string, Primitive>;
}

export type MetricsSink = (event: MetricEvent) => void | Promise<void>;

export interface StructuredLoggerOptions {
  name?: string;
  stream?: Writable;
  base?: Record<string, FieldValue>;
  metrics?: MetricsSink | MetricsSink[];
}

const DEFAULT_STREAM = process.stderr as Writable;

function normalizeFields(fields?: Record<string, unknown>): Record<string, FieldValue> {
  if (!fields) {
    return {};
  }

  const normalized: Record<string, FieldValue> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value == null) {
      normalized[key] = null;
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      normalized[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      normalized[key] = value
        .map((item) => {
          if (item == null) {
            return null;
          }

          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean"
          ) {
            return item;
          }

          return JSON.stringify(item);
        })
        .filter((item) => item !== undefined) as Primitive[];
      continue;
    }

    if (typeof value === "object") {
      const objectValue = value as Record<string, unknown>;
      const nested: Record<string, Primitive | Primitive[]> = {};

      for (const [nestedKey, nestedValue] of Object.entries(objectValue)) {
        if (nestedValue == null) {
          nested[nestedKey] = null;
        } else if (
          typeof nestedValue === "string" ||
          typeof nestedValue === "number" ||
          typeof nestedValue === "boolean"
        ) {
          nested[nestedKey] = nestedValue;
        } else if (Array.isArray(nestedValue)) {
          nested[nestedKey] = nestedValue
            .map((item) => {
              if (item == null) {
                return null;
              }

              if (
                typeof item === "string" ||
                typeof item === "number" ||
                typeof item === "boolean"
              ) {
                return item;
              }

              return JSON.stringify(item);
            })
            .filter((item) => item !== undefined) as Primitive[];
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

function toMetricAttributes(
  fields?: Record<string, unknown>
): Record<string, Primitive> | undefined {
  if (!fields) {
    return undefined;
  }

  const attributes: Record<string, Primitive> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value == null) {
      attributes[key] = null;
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      attributes[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      attributes[key] = value
        .map((item) => {
          if (item == null) {
            return null;
          }

          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean"
          ) {
            return item;
          }

          return JSON.stringify(item);
        })
        .join(",");
      continue;
    }

    if (typeof value === "object") {
      attributes[key] = JSON.stringify(value);
      continue;
    }

    attributes[key] = String(value);
  }

  return attributes;
}

function toMetricsArray(metrics?: MetricsSink | MetricsSink[]): MetricsSink[] {
  if (!metrics) {
    return [];
  }

  return Array.isArray(metrics) ? metrics : [metrics];
}

export class StructuredLogger {
  private readonly stream: Writable;
  private readonly base: Record<string, FieldValue>;
  private readonly metricsSinks: MetricsSink[];

  constructor(options: StructuredLoggerOptions = {}) {
    this.stream = options.stream ?? DEFAULT_STREAM;
    this.base = options.base ? { ...normalizeFields(options.base) } : {};
    this.metricsSinks = toMetricsArray(options.metrics);

    if (options.name && !this.base.service) {
      this.base.service = options.name;
    }
  }

  child(fields: Record<string, unknown>): StructuredLogger {
    return new StructuredLogger({
      stream: this.stream,
      base: { ...this.base, ...normalizeFields(fields) },
      metrics: this.metricsSinks,
    });
  }

  log(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    const entry = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...this.base,
      ...normalizeFields(fields),
    };

    this.stream.write(`${JSON.stringify(entry)}\n`);
  }

  debug(message: string, fields?: Record<string, unknown>): void {
    this.log("debug", message, fields);
  }

  info(message: string, fields?: Record<string, unknown>): void {
    this.log("info", message, fields);
  }

  warn(message: string, fields?: Record<string, unknown>): void {
    this.log("warn", message, fields);
  }

  error(message: string, fields?: Record<string, unknown>): void {
    this.log("error", message, fields);
  }

  startTimer(): () => number {
    const start = process.hrtime.bigint();
    return () => Number(process.hrtime.bigint() - start) / 1_000_000;
  }

  recordMetric(event: MetricEvent): void {
    for (const sink of this.metricsSinks) {
      Promise.resolve()
        .then(() => sink(event))
        .catch((error) => {
          const details = error instanceof Error ? error.message : String(error);
          this.stream.write(
            `${JSON.stringify({
              ts: new Date().toISOString(),
              level: "warn",
              msg: "metric_sink_error",
              service: this.base.service,
              error: details,
            })}\n`
          );
        });
    }
  }

  recordTiming(
    name: string,
    durationMs: number,
    attributes?: Record<string, Primitive>
  ): void {
    this.recordMetric({
      name,
      value: durationMs,
      type: "timing",
      unit: "ms",
      attributes,
    });
  }

  async time<T>(
    message: string,
    fn: () => Promise<T> | T,
    fields?: Record<string, unknown>,
    metricName?: string
  ): Promise<T> {
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
          error: "true",
        });
      }
      throw error;
    }
  }
}

export function createStructuredLogger(
  options: StructuredLoggerOptions = {}
): StructuredLogger {
  return new StructuredLogger(options);
}
