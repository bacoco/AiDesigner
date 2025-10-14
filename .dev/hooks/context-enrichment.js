/**
 * Context Enrichment Module
 * Provides context enrichers for different phases and scenarios
 */

/**
 * Get available context enrichers
 * @returns {Array} Array of context enrichers
 */
function getContextEnrichers() {
  return [
    {
      name: 'default',
      description: 'Default context enricher',
      enrich: async (context) => context,
    },
    {
      name: 'phase-aware',
      description: 'Phase-aware context enricher',
      enrich: async (context, phase) => ({
        ...context,
        currentPhase: phase,
        enrichedAt: new Date().toISOString(),
      }),
    },
  ];
}

/**
 * Enrich context with additional information
 * @param {Object} context - Base context
 * @param {string} enricherName - Name of enricher to use
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Enriched context
 */
async function enrichContext(context, enricherName = 'default', options = {}) {
  const enrichers = getContextEnrichers();
  const enricher = enrichers.find((e) => e.name === enricherName);

  if (!enricher) {
    throw new Error(`Context enricher '${enricherName}' not found`);
  }

  return await enricher.enrich(context, options.phase, options);
}

module.exports = {
  getContextEnrichers,
  enrichContext,
};
