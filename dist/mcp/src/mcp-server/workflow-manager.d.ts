/**
 * Workflow Manager Module
 * Handles interactive design conversations and progressive UI building
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DesignSpec, UserPreferences } from "./ui-generator.js";
import type { ExtractedDesign } from "./design-extractor.js";
export declare enum WorkflowState {
    INITIAL_BRIEF = "initial_brief",
    COLLECTING_REFERENCES = "collecting_references",
    ANALYZING_DESIGN = "analyzing_design",
    GENERATING_VARIANTS = "generating_variants",
    REFINING_OUTPUT = "refining_output",
    BUILDING_PAGES = "building_pages",
    EXPORT_READY = "export_ready"
}
export interface WorkflowSession {
    id: string;
    state: WorkflowState;
    startTime: Date;
    lastUpdate: Date;
    designSpec: DesignSpec | null;
    references: DesignReference[];
    generatedPages: GeneratedPage[];
    userPreferences: UserPreferences;
    conversationHistory: ConversationEntry[];
    currentFocus?: string;
}
export interface DesignReference {
    source: string;
    type: 'url' | 'image' | 'description';
    extractedDesign?: ExtractedDesign;
    weight?: number;
    components?: string[];
    timestamp: Date;
}
export interface GeneratedPage {
    id: string;
    type: string;
    variation: string;
    html: string;
    designSpec: DesignSpec;
    approved: boolean;
    feedback?: string[];
    timestamp: Date;
}
export interface ConversationEntry {
    role: 'user' | 'assistant';
    content: string;
    action?: WorkflowAction;
    timestamp: Date;
}
export interface WorkflowAction {
    type: 'extract_url' | 'analyze_image' | 'generate_variant' | 'apply_feedback' | 'merge_designs';
    params: any;
    result?: any;
}
export declare class DesignWorkflow {
    private session;
    private designLibrary;
    private componentLibrary;
    constructor(sessionId?: string);
    /**
     * Initialize a new workflow session
     */
    private initializeSession;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Process user input and determine next action
     */
    processUserInput(input: string): Promise<{
        response: string;
        action?: WorkflowAction;
        suggestions?: string[];
    }>;
    /**
     * Analyze user input to determine intent
     */
    private analyzeIntent;
    /**
     * Handle initial brief state
     */
    private handleInitialBrief;
    /**
     * Handle reference collection state
     */
    private handleReferenceCollection;
    /**
     * Handle design analysis state
     */
    private handleDesignAnalysis;
    /**
     * Handle variant generation state
     */
    private handleVariantGeneration;
    /**
     * Handle refinement state
     */
    private handleRefinement;
    /**
     * Handle page building state
     */
    private handlePageBuilding;
    /**
     * Get suggestions for current state
     */
    getSuggestionsForState(state: WorkflowState): string[];
    /**
     * Apply user feedback to current design
     */
    applyFeedback(feedback: {
        component?: string;
        adjustment: string;
        value?: any;
    }): DesignSpec | null;
    /**
     * Merge multiple design references
     */
    mergeReferences(): DesignSpec | null;
    /**
     * Add conversation entry
     */
    private addConversationEntry;
    /**
     * Extract URLs from text
     */
    private extractURLs;
    /**
     * Extract variant number from text
     */
    private extractVariantNumber;
    /**
     * Extract page type from text
     */
    private extractPageType;
    /**
     * Get current session state
     */
    getSession(): WorkflowSession;
    /**
     * Reset workflow to start
     */
    reset(): void;
    /**
     * Export generated pages
     */
    exportPages(format: 'html' | 'react' | 'tokens'): any;
    /**
     * Convert HTML to React component (placeholder)
     */
    private convertToReact;
}
/**
 * Tool definition for capturing user preferences
 */
export declare const capturePreferenceTool: Tool;
/**
 * Tool definition for applying design feedback
 */
export declare const applyFeedbackTool: Tool;
/**
 * Tool definition for merging design systems
 */
export declare const mergeDesignSystemsTool: Tool;
