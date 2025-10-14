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
      description: 'Default story context enricher',
      enrich: async (context) => {
        const story = context.context?.story;
        if (!story) {
          return context;
        }

        const structured = story.structured;
        if (!structured) {
          return context;
        }

        const sections = [
          {
            title: 'Story Overview',
            body: `Story: ${structured.title}\nSequence: ${structured.storyId}\nPersona: ${structured.persona || 'Not specified'}\nSummary: ${structured.summary || 'Not provided'}`,
          },
          {
            title: 'Acceptance Criteria',
            body: Array.isArray(structured.acceptanceCriteria)
              ? structured.acceptanceCriteria.join('\n')
              : structured.acceptanceCriteria || 'Not specified',
          },
        ];

        return {
          sections,
          persona: structured.persona || 'Not specified',
          contextUpdates: {
            story: {
              summary: structured.summary,
              acceptanceCriteria: structured.acceptanceCriteria,
            },
          },
        };
      },
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
