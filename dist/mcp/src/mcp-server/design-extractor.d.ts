/**
 * Design Extractor Module
 * Extracts design systems from various sources (URLs, images, HTML)
 * Uses Chrome MCP for web scraping and Vision AI for image analysis
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DesignSpec } from "./ui-generator.js";
export interface ExtractedDesign {
    source: string;
    type: 'url' | 'image' | 'html';
    timestamp: string;
    designSpec: DesignSpec;
    components: ComponentLibrary;
    metadata: {
        title?: string;
        description?: string;
        framework?: string;
        confidence: number;
    };
}
export interface ComponentLibrary {
    navigation?: any[];
    buttons?: any[];
    forms?: any[];
    cards?: any[];
    modals?: any[];
    tables?: any[];
    layouts?: any[];
}
export interface ColorPalette {
    primary: string;
    secondary?: string;
    accent?: string;
    neutral: string[];
    semantic?: {
        success?: string;
        warning?: string;
        error?: string;
        info?: string;
    };
}
export interface TypographySystem {
    fontFamily: string[];
    fontSizes: {
        xs?: string;
        sm?: string;
        base: string;
        lg?: string;
        xl?: string;
        '2xl'?: string;
        '3xl'?: string;
    };
    fontWeights: {
        light?: number;
        regular: number;
        medium?: number;
        semibold?: number;
        bold: number;
    };
    lineHeights: {
        tight?: number;
        normal: number;
        relaxed?: number;
    };
}
/**
 * Extract design system from a URL using Chrome MCP
 */
export declare function extractFromURL(url: string, chromeMCP?: any): Promise<ExtractedDesign>;
/**
 * Extract design system from an image using Vision AI
 */
export declare function extractFromImage(imagePath: string, visionAI?: any): Promise<ExtractedDesign>;
/**
 * Extract design patterns from raw HTML/CSS
 */
export declare function extractFromHTML(html: string, css?: string): ExtractedDesign;
/**
 * Normalize extracted design to standard format
 */
export declare function normalizeDesignSystem(rawData: any): DesignSpec;
/**
 * Extract specific element style using selector
 */
export declare function extractElementStyle(url: string, selector: string, chromeMCP?: any): Promise<any>;
/**
 * Tool definition for extracting design from URL
 */
export declare const extractDesignFromURLTool: Tool;
/**
 * Tool definition for analyzing design from image
 */
export declare const analyzeDesignFromImageTool: Tool;
/**
 * Tool definition for extracting component style
 */
export declare const extractComponentStyleTool: Tool;
