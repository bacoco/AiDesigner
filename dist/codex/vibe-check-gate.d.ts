import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
export interface VibeCheckGateOptions {
    projectState: {
        getAllDeliverables: () => Record<string, Record<string, DeliverableRecord>>;
        recordDecision: (key: string, value: string, rationale?: string) => Promise<void> | void;
    };
    logger: Pick<Logger, "info" | "warn" | "error"> & Partial<Logger>;
    minScore?: number;
    audience?: string;
    temperature?: number;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    timeoutMs?: number;
    clientFactory?: () => ClientHandle;
}
export interface VibeCheckGateResult {
    passed: boolean;
    score?: number;
    verdict?: string;
    suggestions?: string[];
    server?: {
        name?: string;
        version?: string;
    };
    raw?: unknown;
}
interface DeliverableRecord {
    content?: unknown;
    timestamp?: string;
    [key: string]: unknown;
}
interface Logger {
    info(event: string, payload?: Record<string, unknown>): void;
    warn(event: string, payload?: Record<string, unknown>): void;
    error(event: string, payload?: Record<string, unknown>): void;
    recordTiming?(metric: string, value: number, tags?: Record<string, unknown>): void;
}
interface ClientHandle {
    client: Pick<Client, "connect" | "callTool" | "close" | "getServerVersion">;
    transport: StdioClientTransport;
}
export declare function runVibeCheckGate(options: VibeCheckGateOptions): Promise<VibeCheckGateResult>;
export {};
