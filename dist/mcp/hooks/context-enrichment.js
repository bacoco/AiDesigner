/**
 * Context Enrichment Module
 * Provides context enhancement for aidesigner operations
 */

module.exports = {
  /**
   * Enrich context with additional metadata
   */
  enrichContext: function (context) {
    return {
      ...context,
      timestamp: new Date().toISOString(),
      source: 'aidesigner-bridge',
      version: '3.2.0',
    };
  },

  /**
   * Extract relevant context from request
   */
  extractContext: function (request) {
    return {
      prompt: request.prompt || '',
      parameters: request.parameters || {},
      sessionId: request.sessionId || generateSessionId(),
      metadata: request.metadata || {},
    };
  },

  /**
   * Merge multiple contexts
   */
  mergeContexts: function (...contexts) {
    return contexts.reduce(
      (acc, ctx) => ({
        ...acc,
        ...ctx,
        metadata: {
          ...(acc.metadata || {}),
          ...(ctx.metadata || {}),
        },
      }),
      {},
    );
  },
};

/**
 * Generate a simple session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
