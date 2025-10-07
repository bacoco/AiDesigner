/**
 * HTML Template Generator Type Definitions
 */

/**
 * Generate HTML for a specific screen type and variation
 * @param screenType - Type of screen (login, signup, dashboard, etc.)
 * @param specs - Design specifications
 * @param variationName - Name of the variation
 * @returns Generated HTML string
 */
export function generateHTML(
  screenType: string,
  specs: any,
  variationName: string
): string;

/**
 * Get variation names for a screen type
 * @param screenType - Type of screen
 * @returns Array of variation names
 */
export function getVariationNames(screenType: string): string[];

/**
 * Get all supported screen types
 * @returns Array of screen type names
 */
export function getSupportedScreenTypes(): string[];

/**
 * Check if a screen type is supported
 * @param screenType - Type of screen to check
 * @returns True if supported
 */
export function isScreenTypeSupported(screenType: string): boolean;

/**
 * Generate login HTML
 * @param specs - Design specifications
 * @param variationName - Variation name
 * @returns HTML string
 */
export function generateLoginHTML(specs: any, variationName: string): string;

/**
 * Generate dashboard HTML
 * @param specs - Design specifications
 * @param variationName - Variation name
 * @returns HTML string
 */
export function generateDashboardHTML(specs: any, variationName: string): string;

/**
 * Generate settings HTML
 * @param specs - Design specifications
 * @param variationName - Variation name
 * @returns HTML string
 */
export function generateSettingsHTML(specs: any, variationName: string): string;

/**
 * Generate signup HTML
 * @param specs - Design specifications
 * @param variationName - Variation name
 * @returns HTML string
 */
export function generateSignupHTML(specs: any, variationName: string): string;

/**
 * Generate pricing HTML
 * @param specs - Design specifications
 * @param variationName - Variation name
 * @returns HTML string
 */
export function generatePricingHTML(specs: any, variationName: string): string;
