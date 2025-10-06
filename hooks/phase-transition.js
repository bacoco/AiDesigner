// hooks/phase-transition.js
// Safely transition between invisible phases based on conversation
// Notes: replaces fragile patterns (double exports, 'this' binding issues) in early drafts.  [oai_citation:2‡phase_transition_hooks.js](file-service://file-JrapDFzkdDxUqv5pq36LZf)

const unboundTriggerCommand = async () => {
  throw new Error('triggerCommand not bound');
};
const unboundUpdateProjectState = async () => {
  throw new Error('updateProjectState not bound');
};
const unboundSaveDeliverable = async () => {
  throw new Error('saveDeliverable not bound');
};
const unboundLoadPhaseContext = async () => {
  throw new Error('loadPhaseContext not bound');
};

let triggerCommand = unboundTriggerCommand;
let updateProjectState = unboundUpdateProjectState;
let saveDeliverable = unboundSaveDeliverable;
let loadPhaseContext = unboundLoadPhaseContext;

const GATED_PHASES = new Set(['pm', 'architect', 'sm', 'dev', 'qa', 'ux', 'po']);

function bindDependencies(deps = {}) {
  const missing = [];

  if (deps.saveDeliverable) {
    saveDeliverable = deps.saveDeliverable;
  } else if (saveDeliverable === unboundSaveDeliverable) {
    missing.push('saveDeliverable');
  }

  if (deps.loadPhaseContext) {
    loadPhaseContext = deps.loadPhaseContext;
  } else if (loadPhaseContext === unboundLoadPhaseContext) {
    missing.push('loadPhaseContext');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required dependencies for phase transition: ${missing.join(', ')}`);
  }

  // triggerAgent removed - using heuristic phase detection now
  if (deps.triggerCommand) triggerCommand = deps.triggerCommand;
  if (deps.updateProjectState) updateProjectState = deps.updateProjectState;
}

async function getTransitionMessage(phase) {
  const messages = {
    analyst: 'Let me understand your requirements better…',
    pm: 'Now let me create a plan for this…',
    architect: 'Let me think about the technical approach…',
    sm: 'Let me break this down into actionable steps…',
    dev: 'Time to focus on implementation details…',
    qa: 'Let me help you test and validate this…',
    ux: "Let's make sure this works well for users…",
    po: "Let's do a final review and plan next steps…",
  };
  return messages[phase] || 'Continuing with your project…';
}

async function savePhaseDeliverables(phase, context) {
  const map = {
    analyst: ['user_personas', 'market_research', 'requirements'],
    pm: ['project_plan', 'timeline', 'milestones'],
    architect: ['tech_stack', 'system_design', 'architecture'],
    sm: ['user_stories', 'epics', 'sprint_plan'],
    dev: ['implementation_notes', 'code_guidelines'],
    qa: ['test_results', 'quality_metrics'],
    ux: ['ux_feedback', 'design_improvements'],
    po: ['final_review', 'launch_plan'],
  };
  for (const k of map[phase] || []) {
    if (context?.[k]) await saveDeliverable(k, context[k]);
  }
}

async function executeTransition(fromPhase, toPhase, context) {
  // guardrail: don't thrash phases on weak signal
  if (!toPhase) return null;
  console.log(`[INVISIBLE] Transitioning ${fromPhase} → ${toPhase}`);

  await savePhaseDeliverables(fromPhase, context);

  const newContext = await loadPhaseContext(toPhase, context);
  const workflowResult = await triggerCommand(`auto-${toPhase}`, newContext);
  await updateProjectState({
    currentPhase: toPhase,
    previousPhase: fromPhase,
    transitionTime: new Date().toISOString(),
    context: newContext,
  });
  return {
    newPhase: toPhase,
    context: newContext,
    workflowResult,
    message: await getTransitionMessage(toPhase),
  };
}

async function handleTransition(projectState, toPhase, context = {}, userValidated = false) {
  if (!projectState || typeof projectState !== 'object') {
    throw new Error('A valid projectState instance is required to handle transitions');
  }

  if (typeof projectState.transitionPhase !== 'function') {
    throw new TypeError('projectState.transitionPhase must be a function');
  }

  if (!toPhase) {
    throw new Error('toPhase is required for a phase transition');
  }

  if (GATED_PHASES.has(toPhase) && !userValidated) {
    throw new Error(`Phase transition to ${toPhase} requires user validation`);
  }

  const currentPhase =
    typeof projectState.getState === 'function'
      ? projectState.getState()?.currentPhase
      : projectState.state?.currentPhase;

  if (!currentPhase) {
    throw new Error('Unable to determine current project phase for transition');
  }

  const transitionResult = await executeTransition(currentPhase, toPhase, context);

  if (transitionResult) {
    const historyContext = transitionResult.context ?? context ?? {};
    await projectState.transitionPhase(toPhase, historyContext);
  }

  return transitionResult;
}

/**
 * Heuristic-based phase detection without LLM API calls.
 * Uses keyword matching and file system state to infer appropriate phase.
 *
 * @param {Object} conversationContext - Conversation history and context
 * @param {string} userMessage - Current user message
 * @param {string} currentPhase - Current project phase
 * @returns {Promise<Object|null>} Transition result or null if no transition needed
 */
async function checkTransition(conversationContext, userMessage, currentPhase) {
  // Simple keyword-based phase detection
  const message = userMessage.toLowerCase();

  const phaseKeywords = {
    analyst: ['research', 'market', 'analyze', 'brainstorm', 'understand requirements'],
    pm: ['requirements', 'features', 'plan', 'epic', 'product spec', 'prd'],
    architect: ['technical', 'architecture', 'tech stack', 'design system', 'infrastructure'],
    ux: ['user experience', 'screens', 'ui', 'design', 'visual', 'mockup', 'prototype'],
    sm: ['stories', 'tasks', 'breakdown', 'sprint', 'user story'],
    dev: ['implement', 'code', 'build', 'develop', 'programming'],
    qa: ['test', 'review', 'validate', 'quality', 'bug'],
    po: ['validate', 'acceptance', 'review plan', 'sign off'],
  };

  // Calculate match scores for each phase
  let bestMatch = null;
  let bestScore = 0;

  for (const [phase, keywords] of Object.entries(phaseKeywords)) {
    if (phase === currentPhase) continue; // Skip current phase

    const score = keywords.reduce((acc, keyword) => {
      return acc + (message.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = phase;
    }
  }

  // Only transition if we have a reasonable confidence (at least 2 keyword matches)
  if (bestScore < 2) {
    return null;
  }

  const confidence = Math.min(bestScore / 5, 1); // Cap at 1.0

  console.log(
    `[INVISIBLE] Phase detection: ${currentPhase} → ${bestMatch} (confidence: ${confidence})`,
  );

  // Execute transition if confidence is high enough
  if (confidence >= 0.4 && bestMatch) {
    return executeTransition(currentPhase, bestMatch, conversationContext);
  }

  return null;
}

module.exports = { bindDependencies, checkTransition, executeTransition, handleTransition };
