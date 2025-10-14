/**
 * Variation Generator
 * Generates UI variations from any prompt while maintaining design system
 */
import type { DesignSession } from './session-manager.js';
export interface GenerationOptions {
    count?: number;
    style?: 'minimal' | 'modern' | 'playful' | 'professional' | 'elegant';
    framework?: 'html' | 'react' | 'vue';
    includeAnimations?: boolean;
    responsive?: boolean;
}
export declare class VariationGenerator {
    /**
     * Generate HTML from a prompt using the session's design system
     */
    generateFromPrompt(prompt: string, session: DesignSession, options?: GenerationOptions): Promise<string[]>;
    /**
     * Analyze prompt to extract UI requirements
     */
    private analyzePrompt;
    /**
     * Generate a single variation
     */
    private generateVariation;
    private getLayoutApproach;
    private generateDashboard;
    private generateLanding;
    private generateAuth;
    private generatePricing;
    private generateEcommerce;
    private generateGeneric;
}
export declare const variationGenerator: VariationGenerator;
