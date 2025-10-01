// hooks/phase-transition.js
// Safely transition between invisible phases based on conversation
// Notes: replaces fragile patterns (double exports, 'this' binding issues) in early drafts.  [oai_citation:2‡phase_transition_hooks.js](file-service://file-JrapDFzkdDxUqv5pq36LZf)

let triggerAgent = async () => { throw new Error('triggerAgent not bound'); };
let triggerCommand = async () => { throw new Error('triggerCommand not bound'); };
let updateProjectState = async () => { throw new Error('updateProjectState not bound'); };
let saveDeliverable = async () => { /* no-op default */ };
let loadPhaseContext = async () => ({});

function bindDependencies(deps = {}) {
  if (deps.triggerAgent) triggerAgent = deps.triggerAgent;
  if (deps.triggerCommand) triggerCommand = deps.triggerCommand;
  if (deps.updateProjectState) updateProjectState = deps.updateProjectState;
  if (deps.saveDeliverable) saveDeliverable = deps.saveDeliverable;
  if (deps.loadPhaseContext) loadPhaseContext = deps.loadPhaseContext;
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
    po: "Let's do a final review and plan next steps…"
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
    po: ['final_review', 'launch_plan']
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
    context: newContext
  });
  return {
    newPhase: toPhase,
    context: newContext,
    workflowResult,
    message: await getTransitionMessage(toPhase)
  };
}

async function checkTransition(conversationContext, userMessage, currentPhase) {
  const detected = await triggerAgent('phase-detector', {
    context: conversationContext,
    userMessage,
    currentPhase
  });
  // Expect JSON shape guaranteed by the detector prompt.  [oai_citation:3‡phase_detector_agent.md](file-service://file-PCqsBDyx6LqYNBC2Dit6x1)
  if (!detected || !detected.detected_phase) return null;
  if (detected.confidence != null && detected.confidence < 0.6) return null;
  if (detected.detected_phase === currentPhase) return null;
  return executeTransition(currentPhase, detected.detected_phase, conversationContext);
}

module.exports = { bindDependencies, checkTransition, executeTransition };

