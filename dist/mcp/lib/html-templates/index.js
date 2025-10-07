/**
 * HTML Template Generator - Central Export
 *
 * Provides HTML generation functions for different screen types.
 * Each template generates 3 variations with inline styles based on design specs.
 */

const { generateLoginHTML } = require('./login-template');
const { generateDashboardHTML } = require('./dashboard-template');
const { generateSettingsHTML } = require('./settings-template');
const { generateSignupHTML } = require('./signup-template');
const { generatePricingHTML } = require('./pricing-template');

/**
 * Screen type to template mapping
 */
const SCREEN_TEMPLATES = {
  login: generateLoginHTML,
  signup: generateSignupHTML,
  dashboard: generateDashboardHTML,
  settings: generateSettingsHTML,
  pricing: generatePricingHTML,
};

/**
 * Variation names by screen type
 */
const VARIATION_NAMES = {
  login: ['Minimal', 'Friendly', 'Professional'],
  signup: ['Minimal', 'Social', 'Progressive'],
  dashboard: ['Minimal', 'Analytics', 'DataRich'],
  settings: ['Minimal', 'Tabbed', 'Sidebar'],
  pricing: ['Simple', 'Featured', 'Detailed'],
};

/**
 * Generate HTML for a specific screen type and variation
 * @param {string} screenType - Type of screen (login, signup, dashboard, etc.)
 * @param {Object} specs - Design specifications
 * @param {string} variationName - Name of the variation
 * @returns {string} Generated HTML
 */
function generateHTML(screenType, specs, variationName) {
  const generator = SCREEN_TEMPLATES[screenType];

  if (!generator) {
    throw new Error(`No template found for screen type: ${screenType}`);
  }

  return generator(specs, variationName);
}

/**
 * Get variation names for a screen type
 * @param {string} screenType - Type of screen
 * @returns {string[]} Array of variation names
 */
function getVariationNames(screenType) {
  return VARIATION_NAMES[screenType] || ['Minimal', 'Standard', 'Advanced'];
}

/**
 * Get all supported screen types
 * @returns {string[]} Array of screen type names
 */
function getSupportedScreenTypes() {
  return Object.keys(SCREEN_TEMPLATES);
}

/**
 * Check if a screen type is supported
 * @param {string} screenType - Type of screen to check
 * @returns {boolean} True if supported
 */
function isScreenTypeSupported(screenType) {
  return screenType in SCREEN_TEMPLATES;
}

module.exports = {
  generateHTML,
  getVariationNames,
  getSupportedScreenTypes,
  isScreenTypeSupported,

  // Direct exports for specific use cases
  generateLoginHTML,
  generateDashboardHTML,
  generateSettingsHTML,
  generateSignupHTML,
  generatePricingHTML,
};
