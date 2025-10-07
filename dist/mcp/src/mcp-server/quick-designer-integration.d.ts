/**
 * Quick Designer Integration Module
 * Bridges the new AI-driven system with the existing runtime
 */
import { generateUIFromDesignSystem, generateVariants, type DesignSpec } from "./ui-generator.js";
import { extractFromURL, extractFromImage, normalizeDesignSystem } from "./design-extractor.js";
import { DesignWorkflow } from "./workflow-manager.js";
declare class SimpleAIService {
    generate(prompt: string, designSpec?: DesignSpec): Promise<string>;
    private buildAIPrompt;
    private generateAIResponse;
    private generateDefaultHTML;
}
/**
 * Generate mockup HTML with interactive design system
 */
export declare function generateInteractiveMockup(pages: any[], designSystem: DesignSpec): Promise<string>;
/**
 * Export for use in existing runtime
 */
export declare const QuickDesignerV4: {
    generateUIFromDesignSystem: typeof generateUIFromDesignSystem;
    generateVariants: typeof generateVariants;
    extractFromURL: typeof extractFromURL;
    extractFromImage: typeof extractFromImage;
    normalizeDesignSystem: typeof normalizeDesignSystem;
    generateInteractiveMockup: typeof generateInteractiveMockup;
    DesignWorkflow: typeof DesignWorkflow;
    SimpleAIService: typeof SimpleAIService;
};
export {};
