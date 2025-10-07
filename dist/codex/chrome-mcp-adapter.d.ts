/**
 * Chrome MCP Adapter for Quick Designer v4
 * Integrates with chrome-devtools-mcp server for design extraction
 */
import type { ExtractedDesign } from "./design-extractor.js";
export interface ChromeMCPConfig {
    serverUrl?: string;
    timeout?: number;
    retryAttempts?: number;
}
export interface ExtractedStyles {
    colors: {
        primary?: string;
        secondary?: string;
        background?: string;
        text?: string;
        border?: string;
        [key: string]: string | undefined;
    };
    typography: {
        fontFamilies: string[];
        fontSizes: string[];
        lineHeights: string[];
    };
    spacing: {
        paddings: string[];
        margins: string[];
        gaps: string[];
    };
    borders: {
        radii: string[];
        widths: string[];
        styles: string[];
    };
    shadows: string[];
}
export declare class ChromeMCPAdapter {
    private config;
    constructor(config?: ChromeMCPConfig);
    /**
     * Extract design tokens from a URL using Chrome MCP
     */
    extractFromURL(url: string): Promise<ExtractedDesign>;
    /**
     * Build extraction script for Chrome DevTools
     */
    private buildExtractionScript;
    /**
     * Execute Chrome MCP command
     */
    private executeChromeMCP;
    /**
     * Simulate extraction for testing (replace with actual Chrome MCP call)
     */
    private simulateExtraction;
    /**
     * Convert extracted data to DesignSpec format
     */
    private convertToDesignSpec;
    /**
     * Extract components from the page
     */
    private extractComponents;
    /**
     * Check if color is an accent color (bright/saturated)
     */
    private isAccentColor;
    /**
     * Check if color is neutral (grayscale)
     */
    private isNeutralColor;
    /**
     * Find most common value in array
     */
    private findMostCommonValue;
    /**
     * Calculate confidence score for extraction
     */
    private calculateConfidence;
    /**
     * Get fallback design if extraction fails
     */
    private getFallbackDesign;
    /**
     * Check if Chrome MCP is available
     */
    checkAvailability(): Promise<boolean>;
    /**
     * Extract design tokens from screenshot
     */
    extractFromScreenshot(imagePath: string): Promise<ExtractedDesign>;
}
export declare function getChromeMCPAdapter(): ChromeMCPAdapter;
export default ChromeMCPAdapter;
