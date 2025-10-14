/**
 * Phase Transition Module
 * Handles transitions between different phases in the AiDesigner workflow
 */

let boundDependencies = null;
let hasBeenBoundWithRequiredDeps = false;

/**
 * Bind dependencies for phase transitions
 * @param {Object} deps - Dependencies object
 */
function bindDependencies(deps) {
  // Check for required dependencies on first bind
  if (!hasBeenBoundWithRequiredDeps) {
    const requiredDeps = ['saveDeliverable', 'loadPhaseContext'];
    const missing = requiredDeps.filter((dep) => !deps[dep]);

    if (missing.length > 0) {
      throw new Error(`Missing required dependencies for phase transition: ${missing.join(', ')}`);
    }

    hasBeenBoundWithRequiredDeps = true;
  }

  boundDependencies = deps;
}

/**
 * Execute a phase transition
 * @param {string} fromPhase - The phase to transition from
 * @param {string} toPhase - The phase to transition to
 * @param {Object} context - Context for the transition
 * @returns {Promise<Object|null>} Result of the transition or null if invalid
 */
async function executeTransition(fromPhase, toPhase, context = {}) {
  // Return null for falsy toPhase (safety requirement)
  if (!toPhase) {
    return null;
  }

  if (!boundDependencies) {
    throw new Error('Dependencies not bound. Call bindDependencies() first.');
  }

  const { updateProjectState, loadPhaseContext, triggerCommand } = boundDependencies;

  try {
    // Load context for the target phase
    const enrichedContext = await loadPhaseContext(toPhase, context);

    // Trigger the command for the phase
    const commandResult = await triggerCommand(`auto-${toPhase}`, enrichedContext);

    // Update project state
    await updateProjectState({
      currentPhase: toPhase,
      previousPhase: fromPhase,
    });

    return {
      fromPhase,
      toPhase,
      context: enrichedContext,
      workflowResult: commandResult,
    };
  } catch (error) {
    throw new Error(`Phase transition from ${fromPhase} to ${toPhase} failed: ${error.message}`);
  }
}

/**
 * Check if a transition should occur based on conversation context
 * @param {Object} conversationContext - The conversation context
 * @param {string} userMessage - The user message
 * @param {string} currentPhase - Current phase
 * @returns {Promise<Object|null>} Transition result or null
 */
async function checkTransition(conversationContext, userMessage, currentPhase) {
  if (!boundDependencies) {
    return null;
  }

  const { triggerAgent, triggerCommand, updateProjectState, loadPhaseContext } = boundDependencies;

  try {
    // Use phase detector agent to determine if transition is needed
    const detectorResult = await triggerAgent('phase-detector', {
      context: conversationContext,
      userMessage,
      currentPhase,
    });

    // Handle parse errors
    if (
      detectorResult &&
      detectorResult.ok === false &&
      detectorResult.errorType === 'agent_parse_error'
    ) {
      return {
        error: detectorResult,
        shouldTransition: false,
      };
    }

    // Handle null/undefined responses
    if (!detectorResult || typeof detectorResult !== 'object') {
      return null;
    }

    // Handle partial error objects (missing required fields)
    if (
      detectorResult.errorType === 'agent_parse_error' &&
      (!detectorResult.agentId || detectorResult.ok !== false)
    ) {
      return null;
    }

    // Check if we have a valid phase detection
    if (detectorResult.detected_phase && detectorResult.confidence) {
      const newPhase = detectorResult.detected_phase;

      // Load context and execute transition
      const enrichedContext = await loadPhaseContext(newPhase, conversationContext);
      const commandResult = await triggerCommand(`auto-${newPhase}`, enrichedContext);
      await updateProjectState();

      return {
        newPhase,
        context: enrichedContext,
        workflowResult: commandResult,
      };
    }

    return null;
  } catch (error) {
    return {
      error: { message: error.message },
      shouldTransition: false,
    };
  }
}

/**
 * Handle a phase transition with validation
 * @param {Object} projectState - Current project state
 * @param {string} toPhase - The phase to transition to
 * @param {Object} context - Context for the transition
 * @param {boolean} validated - Whether the transition is validated
 * @returns {Promise<Object>} Result of the transition
 */
async function handleTransition(projectState, toPhase, context = {}, validated = false) {
  // Check for gated phases that require validation
  const gatedPhases = ['pm', 'architect', 'dev'];
  if (gatedPhases.includes(toPhase) && !validated) {
    throw new Error(`Transition to ${toPhase} requires user validation`);
  }

  if (!boundDependencies) {
    throw new Error('Dependencies not bound. Call bindDependencies() first.');
  }

  const { loadPhaseContext, triggerCommand } = boundDependencies;

  try {
    // Load context for the target phase
    const enrichedContext = await loadPhaseContext(toPhase, context);

    // Trigger the command for the phase
    await triggerCommand(`auto-${toPhase}`, enrichedContext);

    // Update project state
    await projectState.transitionPhase(toPhase, enrichedContext);

    return {
      newPhase: toPhase,
      context: enrichedContext,
    };
  } catch (error) {
    throw new Error(`Phase transition to ${toPhase} failed: ${error.message}`);
  }
}

module.exports = {
  bindDependencies,
  executeTransition,
  checkTransition,
  handleTransition,
};
