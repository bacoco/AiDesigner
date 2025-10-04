// hooks/context-preservation.js
// Maintain context across phases invisibly; avoid 'this' pitfalls from earlier drafts.  [oai_citation:4‡phase_transition_hooks.js](file-service://file-JrapDFzkdDxUqv5pq36LZf)

function consolidateRequirements(context = {}) {
  return {
    userNeeds: context?.analyst?.userNeeds || [],
    businessRequirements: context?.pm?.businessRequirements || [],
    technicalRequirements: context?.architect?.technicalRequirements || [],
    functionalRequirements: context?.sm?.functionalRequirements || [],
  };
}

function consolidateDecisions(context = {}) {
  return {
    marketingDecisions: context?.analyst?.decisions || [],
    planningDecisions: context?.pm?.decisions || [],
    architecturalDecisions: context?.architect?.decisions || [],
    implementationDecisions: context?.dev?.decisions || [],
  };
}

async function preserveContext(fromPhase, toPhase, projectContext, getPhaseDeliverables) {
  const delivered = getPhaseDeliverables ? await getPhaseDeliverables(fromPhase) : [];
  return {
    ...projectContext,
    phaseHistory: [
      ...(projectContext?.phaseHistory || []),
      { phase: fromPhase, completedAt: new Date().toISOString(), deliverables: delivered },
    ],
    currentPhase: toPhase,
    allRequirements: consolidateRequirements(projectContext),
    allDecisions: consolidateDecisions(projectContext),
  };
}

module.exports = { consolidateRequirements, consolidateDecisions, preserveContext };
