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
export declare class StructuredLogger {
    private readonly stream;
    private readonly base;
    private readonly metricsSinks;
    constructor(options?: StructuredLoggerOptions);
    child(fields: Record<string, unknown>): StructuredLogger;
    log(level: LogLevel, message: string, fields?: Record<string, unknown>): void;
    debug(message: string, fields?: Record<string, unknown>): void;
    info(message: string, fields?: Record<string, unknown>): void;
    warn(message: string, fields?: Record<string, unknown>): void;
    error(message: string, fields?: Record<string, unknown>): void;
    startTimer(): () => number;
    recordMetric(event: MetricEvent): void;
    recordTiming(name: string, durationMs: number, attributes?: Record<string, Primitive>): void;
    time<T>(message: string, fn: () => Promise<T> | T, fields?: Record<string, unknown>, metricName?: string): Promise<T>;
}
export declare function createStructuredLogger(options?: StructuredLoggerOptions): StructuredLogger;
export {};
