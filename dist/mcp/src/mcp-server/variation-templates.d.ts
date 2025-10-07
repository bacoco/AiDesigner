/**
 * Variation Templates for Different Screen Layouts
 * Each variation has a unique layout but uses CSS variables for theming
 */
import { type DesignSpec } from "./ui-generator.js";
export interface VariationTemplate {
    name: string;
    description: string;
    generateHTML: (designSpec: DesignSpec) => string;
}
export declare const dashboardVariations: VariationTemplate[];
export declare const loginVariations: VariationTemplate[];
export declare const pricingVariations: VariationTemplate[];
export declare function getVariationHTML(screenType: string, variationIndex: number): string;
export declare const cssVariableDefinitions = "\n  :root {\n    /* Core Colors */\n    --primary: #3B82F6;\n    --primary-dark: #2563EB;\n    --primary-light: #DBEAFE;\n    --accent: #10B981;\n    --accent-dark: #059669;\n    --accent-light: #D1FAE5;\n    --neutral: #6B7280;\n    --bg: #F9FAFB;\n    --surface: #FFFFFF;\n\n    /* Semantic Colors */\n    --success: #10B981;\n    --success-dark: #059669;\n    --success-light: #D1FAE5;\n    --warning: #F59E0B;\n    --warning-dark: #D97706;\n    --warning-light: #FEF3C7;\n    --error: #EF4444;\n    --error-dark: #DC2626;\n    --error-light: #FEE2E2;\n\n    /* Text Colors */\n    --text-primary: #111827;\n    --text-secondary: #6B7280;\n\n    /* Border */\n    --border: #E5E7EB;\n\n    /* Typography */\n    --font-family: 'Inter', system-ui, sans-serif;\n\n    /* Spacing */\n    --border-radius: 8px;\n  }\n\n  /* Dark mode support */\n  @media (prefers-color-scheme: dark) {\n    :root {\n      --bg: #111827;\n      --surface: #1F2937;\n      --text-primary: #F9FAFB;\n      --text-secondary: #9CA3AF;\n      --border: #374151;\n    }\n  }\n";
