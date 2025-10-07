/**
 * Quick Designer Integration Module v4
 * Pattern-based UI generation without external LLM calls
 */
import { type DesignSpec } from "./ui-generator.js";
import { extractFromURL, extractFromImage, normalizeDesignSystem } from "./design-extractor.js";
import { DesignWorkflow } from "./workflow-manager.js";
/**
 * Pattern-based generation service (no LLM required)
 */
export declare class PatternRemixService {
    private patterns;
    constructor();
    private loadPatterns;
    /**
     * Generate HTML using pattern remix approach
     */
    generate(screenType: string, designSpec: DesignSpec, style?: string, variationIndex?: number): Promise<string>;
    /**
     * Generate multiple variations
     */
    generateVariations(screenType: string, designSpec: DesignSpec, count?: number): Promise<string[]>;
}
/**
 * Generate interactive mockup with multi-variation support
 */
export declare function generateInteractiveMockup(pages: any[], designSystem: DesignSpec): Promise<string>;
/**
 * Export for MCP integration
 */
export declare const QuickDesignerV4: {
    PatternRemixService: typeof PatternRemixService;
    generateInteractiveMockup: typeof generateInteractiveMockup;
    extractFromURL: typeof extractFromURL;
    extractFromImage: typeof extractFromImage;
    normalizeDesignSystem: typeof normalizeDesignSystem;
    DesignWorkflow: typeof DesignWorkflow;
};
export default QuickDesignerV4;
