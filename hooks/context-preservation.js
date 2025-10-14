/**
 * Context Preservation Module
 * Handles preserving context when transitioning between phases
 */

/**
 * Preserve context during phase transitions
 * @param {string} fromPhase - The phase transitioning from
 * @param {string} toPhase - The phase transitioning to
 * @param {Object} context - The context to preserve
 * @returns {Promise<Object>} Preserved context
 */
async function preserveContext(fromPhase, toPhase, context) {
  // Basic context preservation - can be extended
  const preservedContext = {
    ...context,
    preservedFrom: fromPhase,
    preservedTo: toPhase,
    preservedAt: new Date().toISOString(),
  };

  // Add phase-specific preservation logic
  if (fromPhase === 'analyst' && toPhase === 'pm') {
    // Preserve analysis results for PM phase
    preservedContext.analysisResults = context.analysisResults || {};
  } else if (fromPhase === 'pm' && toPhase === 'architect') {
    // Preserve planning results for architecture phase
    preservedContext.planningResults = context.planningResults || {};
  } else if (fromPhase === 'architect' && toPhase === 'sm') {
    // Preserve architecture decisions for story management
    preservedContext.architectureDecisions = context.architectureDecisions || {};
  }

  return preservedContext;
}

/**
 * Restore preserved context
 * @param {Object} preservedContext - The preserved context
 * @returns {Object} Restored context
 */
function restoreContext(preservedContext) {
  const { preservedFrom, preservedTo, preservedAt, ...restoredContext } = preservedContext;

  return {
    ...restoredContext,
    restoredFrom: preservedFrom,
    restoredTo: preservedTo,
    restoredAt: new Date().toISOString(),
    originalPreservationTime: preservedAt,
  };
}

module.exports = {
  preserveContext,
  restoreContext,
};
