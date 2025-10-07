/**
 * UI Generator Module
 * Generates HTML dynamically using AI based on design specifications
 * No static templates - pure AI-driven generation
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export interface DesignSpec {
    colors: {
        primary: string;
        secondary?: string;
        accent?: string;
        neutral?: string[];
        background?: string;
        surface?: string;
    };
    typography: {
        fontFamily: string;
        scale?: number;
        headingFont?: string;
        bodyFont?: string;
        monoFont?: string;
    };
    spacing: {
        unit?: string;
        scale?: number[];
    };
    components: {
        borderRadius?: string;
        shadowScale?: string[];
        button?: any;
        input?: any;
        card?: any;
    };
    layout?: {
        maxWidth?: string;
        containerPadding?: string;
        gridGap?: string;
    };
}
export interface UserPreferences {
    style?: 'minimal' | 'modern' | 'playful' | 'professional' | 'bold';
    density?: 'compact' | 'comfortable' | 'spacious';
    colorMode?: 'light' | 'dark' | 'auto';
    animations?: boolean;
    complexity?: 'simple' | 'standard' | 'rich';
}
export interface GenerationRequest {
    screenType: string;
    designSpec: DesignSpec;
    variation?: string;
    userPreferences?: UserPreferences;
    inspirations?: string[];
    components?: string[];
}
/**
 * Build a comprehensive prompt for AI to generate HTML
 */
export declare function buildGenerationPrompt(request: GenerationRequest): string;
/**
 * Generate HTML using AI based on design specifications
 */
export declare function generateUIFromDesignSystem(request: GenerationRequest, aiService: any): Promise<string>;
/**
 * Merge multiple design systems with weighted ratios
 */
export declare function mergeDesignSystems(systems: Array<{
    design: DesignSpec;
    weight: number;
}>): DesignSpec;
/**
 * Extract component patterns from HTML/CSS
 */
export declare function extractComponentPatterns(html: string, css?: string): any;
/**
 * Generate multiple variants of a design
 */
export declare function generateVariants(baseRequest: GenerationRequest, count: number | undefined, aiService: any): Promise<string[]>;
/**
 * Create a meta-prompt for specific screen types
 */
export declare function getScreenTypePrompt(screenType: string): string;
/**
 * Tool definition for MCP
 */
export declare const generateUITool: Tool;
/**
 * Synthesize components from multiple sources
 */
export declare function synthesizeComponent(componentType: string, sources: Array<{
    site: string;
    component: any;
    weight: number;
}>): any;
/**
 * Apply user feedback to refine design
 */
export declare function applyDesignFeedback(currentDesign: DesignSpec, feedback: {
    component?: string;
    adjustment: string;
    value?: any;
}): DesignSpec;
