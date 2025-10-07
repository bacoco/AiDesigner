/**
 * Flash Command Surface Definition
 * Maps Quick Designer agent commands to MCP server implementations
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DesignSpec } from "./ui-generator.js";
export interface FlashCommand {
    name: string;
    description: string;
    handler: (params: any) => Promise<any>;
    inputSchema?: any;
}
export interface DesignSession {
    id: string;
    designSystem?: DesignSpec;
    pages: Array<{
        name: string;
        type: string;
        variations: Array<{
            name: string;
            html: string;
            specs?: DesignSpec;
            validated?: boolean;
        }>;
    }>;
    currentPage?: string;
    lastGeneration?: {
        prompt: string;
        timestamp: Date;
        variations: string[];
    };
}
/**
 * Flash Command Handlers
 */
export declare const flashCommands: Record<string, FlashCommand>;
/**
 * Export Flash commands as MCP tools
 */
export declare function getFlashTools(): Tool[];
export default flashCommands;
