import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StructuredLogger } from "./observability.js";
export interface AgentTriggerParseError {
    ok: false;
    errorType: "agent_parse_error";
    agentId: string;
    message: string;
    rawSnippet: string;
    rawResponse: unknown;
    guidance: string;
    cause: {
        name?: string;
        message: string;
        stack?: string;
    };
    contextMetadata?: {
        provided: boolean;
        keys?: string[];
    };
}
export type LaneKey = "default" | "quick" | "complex" | string;
export interface OrchestratorServerOptions {
    serverInfo?: {
        name?: string;
        version?: string;
    };
    transport?: StdioServerTransport;
    createLLMClient?: (lane: LaneKey) => Promise<any> | any;
    ensureOperationAllowed?: (operation: string, metadata?: Record<string, unknown>) => Promise<void> | void;
    log?: (message: string) => void;
    onServerReady?: (server: Server) => void | Promise<void>;
    logger?: StructuredLogger;
}
export declare function runOrchestratorServer(options?: OrchestratorServerOptions): Promise<void>;
