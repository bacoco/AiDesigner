import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
export interface BMADRuntimeOptions {
    projectPath?: string;
    llmClientOptions?: Record<string, unknown>;
    createLLMClient?: (LLMClient: any) => any;
}
export interface BMADRuntimeContext {
    projectState: any;
    bmadBridge: any;
    deliverableGen: any;
    brownfieldAnalyzer: any;
    quickLane: any;
    laneSelector: any;
    phaseTransitionHooks: any;
    contextPreservation: any;
}
export interface ModelRouterInput {
    tool: string;
    args: unknown;
    meta?: unknown;
    runtime: BMADRuntime;
    context: BMADRuntimeContext;
}
export type ModelRouter = (input: ModelRouterInput) => string | null | undefined;
export interface ApprovalCheckResult {
    approved: boolean;
    message?: string;
}
export type ApprovalChecker = (input: ModelRouterInput) => Promise<ApprovalCheckResult> | ApprovalCheckResult;
export interface StateBridgeHooks {
    beforeCall?: (input: ModelRouterInput) => Promise<void> | void;
    afterCall?: (input: ModelRouterInput & {
        result: CallToolResult;
    }) => Promise<void> | void;
}
export interface CallToolOptions {
    meta?: unknown;
    modelRouter?: ModelRouter;
    approvalChecker?: ApprovalChecker;
    stateBridge?: StateBridgeHooks;
}
export declare class BMADRuntime {
    private readonly options;
    private dependenciesLoaded;
    private hooksBound;
    private modules;
    private instances;
    constructor(options?: BMADRuntimeOptions);
    get projectPath(): string;
    listTools(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                includeConversation: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                conversationLimit: {
                    type: string;
                    description: string;
                    default: number;
                };
                userMessage?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                context?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                userMessage: {
                    type: string;
                    description: string;
                };
                conversationHistory: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                    };
                    default: never[];
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                context?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                phase: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                toPhase?: undefined;
                context?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                toPhase: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                userValidated: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                type: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                userValidated?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                key: {
                    type: string;
                    description: string;
                };
                value: {
                    type: string;
                    description: string;
                };
                rationale: {
                    type: string;
                    description: string;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                context?: undefined;
                userValidated?: undefined;
                type?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                role: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                content: {
                    type: string;
                    description: string;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                context?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                userRequest?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                context?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                phase: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                toPhase?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                userMessage: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
                userRequest?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                userRequest: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
                includeConversation?: undefined;
                conversationLimit?: undefined;
                userMessage?: undefined;
                conversationHistory?: undefined;
                phase?: undefined;
                toPhase?: undefined;
                userValidated?: undefined;
                type?: undefined;
                key?: undefined;
                value?: undefined;
                rationale?: undefined;
                role?: undefined;
                content?: undefined;
            };
            required: string[];
        };
    })[];
    getContext(): BMADRuntimeContext;
    ensureReady(): Promise<BMADRuntimeContext>;
    callTool(name: string, args: unknown, options?: CallToolOptions): Promise<{
        [x: string]: unknown;
        content: ({
            [x: string]: unknown;
            type: "text";
            text: string;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            [x: string]: unknown;
            type: "image";
            data: string;
            mimeType: string;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            [x: string]: unknown;
            type: "audio";
            data: string;
            mimeType: string;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            [x: string]: unknown;
            type: "resource_link";
            name: string;
            uri: string;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
            mimeType?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            icons?: {
                [x: string]: unknown;
                src: string;
                mimeType?: string | undefined;
                sizes?: string | undefined;
            }[] | undefined;
        } | {
            [x: string]: unknown;
            type: "resource";
            resource: {
                [x: string]: unknown;
                text: string;
                uri: string;
                _meta?: {
                    [x: string]: unknown;
                } | undefined;
                mimeType?: string | undefined;
            } | {
                [x: string]: unknown;
                uri: string;
                blob: string;
                _meta?: {
                    [x: string]: unknown;
                } | undefined;
                mimeType?: string | undefined;
            };
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        })[];
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        structuredContent?: {
            [x: string]: unknown;
        } | undefined;
        isError?: boolean | undefined;
    }>;
    private withModelOverride;
    private loadDependencies;
}
