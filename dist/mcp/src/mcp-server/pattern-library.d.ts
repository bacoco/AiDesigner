/**
 * Pattern Library for Quick Designer v4
 * Provides deterministic HTML generation without LLM calls
 */
import type { DesignSpec } from "./ui-generator.js";
export interface Pattern {
    id: string;
    name: string;
    category: string;
    style: string;
    html: string;
    variables: string[];
}
export interface PatternVariation {
    base: string;
    modifiers: Record<string, string>;
}
/**
 * Apply design system to pattern HTML
 */
export declare function applyDesignSystem(html: string, design: DesignSpec): string;
/**
 * Pattern Library Database
 */
export declare const patternLibrary: Record<string, Pattern[]>;
/**
 * Get patterns for a specific screen type
 */
export declare function getPatternsForScreen(screenType: string): Pattern[];
/**
 * Select pattern based on style preference
 */
export declare function selectPatternByStyle(patterns: Pattern[], style: string, index?: number): Pattern;
/**
 * Generate variation by modifying pattern
 */
export declare function generateVariation(basePattern: Pattern, variationType: "layout" | "density" | "style"): Pattern;
/**
 * Validate that pattern HTML is well-formed
 */
export declare function validatePattern(html: string): boolean;
export default patternLibrary;
