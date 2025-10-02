import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
}
export declare function runOrchestratorServer(options?: OrchestratorServerOptions): Promise<void>;
