'use strict';

const STORY_CONTEXT_VALIDATION_CHECKPOINT = 'story_context_validation';

function normalizeStoryDeliverable(deliverable) {
  if (!deliverable) {
    return null;
  }

  if (typeof deliverable === 'string') {
    return { content: deliverable };
  }

  if (deliverable.content && typeof deliverable.content === 'string') {
    return {
      ...deliverable,
      content: deliverable.content,
    };
  }

  if (deliverable.content && typeof deliverable.content === 'object') {
    return { ...deliverable.content };
  }

  return { ...deliverable };
}

function findSection(sections = [], pattern) {
  return sections.find((section) => {
    const title = section?.title;
    return typeof title === 'string' && pattern.test(title);
  });
}

function hasBody(section) {
  if (!section) {
    return false;
  }
  const body = section.body;
  if (body == null) {
    return false;
  }
  if (typeof body === 'string') {
    return body.trim().length > 0;
  }
  if (Array.isArray(body)) {
    return body.length > 0;
  }
  if (typeof body === 'object') {
    return Object.keys(body).length > 0;
  }
  return false;
}

async function runStoryContextValidation({
  projectState,
  createLLMClient,
  BMADBridge,
  lane = 'review',
  notes,
  trigger,
  log = () => {},
  checkpointId = STORY_CONTEXT_VALIDATION_CHECKPOINT,
}) {
  if (!projectState || typeof projectState.recordReviewOutcome !== 'function') {
    throw new TypeError('projectState with recordReviewOutcome is required');
  }
  if (typeof createLLMClient !== 'function') {
    throw new TypeError('createLLMClient function is required');
  }
  if (typeof BMADBridge !== 'function') {
    throw new TypeError('BMADBridge constructor is required');
  }

  const llmClient = await createLLMClient(lane);
  const bridge = new BMADBridge({ llmClient });

  if (typeof bridge.initialize === 'function') {
    await bridge.initialize();
  }

  let agent = { id: 'dev' };
  if (typeof bridge.loadAgent === 'function') {
    try {
      agent = await bridge.loadAgent('dev');
    } catch (error) {
      log(
        `[StoryContextValidation] Failed to load dev agent persona: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const storyDeliverable = projectState.getDeliverable
    ? projectState.getDeliverable('sm', 'story')
    : null;
  const normalizedStory = normalizeStoryDeliverable(storyDeliverable);

  const validationContext = {
    projectPath: projectState.projectPath,
    story: normalizedStory,
    requirements: projectState.state?.requirements || {},
    decisions: projectState.state?.decisions || {},
    sprintPlan: projectState.getDeliverable
      ? (projectState.getDeliverable('sm', 'sprint_plan')?.content ?? null)
      : null,
    deliverables: projectState.getPhaseDeliverables ? projectState.getPhaseDeliverables('sm') : {},
  };

  let enrichment = {
    context: validationContext,
    personaFragments: [],
    contextSections: [],
  };

  if (typeof bridge.applyContextEnrichers === 'function') {
    enrichment = await bridge.applyContextEnrichers(agent, validationContext);
  }

  const personaFragments = Array.isArray(enrichment?.personaFragments)
    ? enrichment.personaFragments
    : Array.isArray(enrichment?.persona)
      ? enrichment.persona
      : [];
  const contextSections = Array.isArray(enrichment?.contextSections)
    ? enrichment.contextSections
    : Array.isArray(enrichment?.sections)
      ? enrichment.sections
      : [];

  const issues = [];

  const hasStoryPayload = Boolean(
    normalizedStory &&
      (normalizedStory.content ||
        normalizedStory.path ||
        normalizedStory.summary ||
        normalizedStory.description ||
        (Array.isArray(normalizedStory.acceptanceCriteria) &&
          normalizedStory.acceptanceCriteria.length > 0) ||
        (Array.isArray(normalizedStory.definitionOfDone) &&
          normalizedStory.definitionOfDone.length > 0) ||
        normalizedStory.title),
  );

  if (!hasStoryPayload) {
    issues.push('Story payload is missing content or path for enrichment.');
  }

  const acceptanceSection = findSection(contextSections, /acceptance criteria/i);
  if (!hasBody(acceptanceSection)) {
    issues.push('Acceptance Criteria section missing from enriched context.');
  }

  const definitionOfDoneSection = findSection(contextSections, /definition of done/i);
  if (!hasBody(definitionOfDoneSection)) {
    issues.push('Definition of Done section missing from enriched context.');
  }

  if (personaFragments.length === 0) {
    issues.push('No persona fragments generated for developer lane.');
  }

  const status = issues.length > 0 ? 'block' : 'approve';

  const record = await projectState.recordReviewOutcome(checkpointId, {
    phase: 'sm',
    reviewer: 'story_context_validator',
    lane,
    status,
    summary:
      status === 'approve'
        ? 'Story context enrichment validated successfully.'
        : 'Story context enrichment failed validation.',
    risks: issues,
    followUp: issues,
    additionalNotes: notes ?? undefined,
    trigger,
    enrichment: {
      personaFragments,
      contextSections,
      context: enrichment?.context || validationContext,
    },
  });

  return {
    checkpoint: checkpointId,
    status,
    issues,
    record,
    enrichment,
  };
}

async function ensureStoryContextReadyForDevelopment(options) {
  const result = await runStoryContextValidation(options);

  if (result.status !== 'approve') {
    const message =
      result.issues.length > 0
        ? `Story context validation failed: ${result.issues.join('; ')}`
        : 'Story context validation failed.';
    const error = new Error(message);
    error.validation = result;
    throw error;
  }

  return result;
}

module.exports = {
  STORY_CONTEXT_VALIDATION_CHECKPOINT,
  runStoryContextValidation,
  ensureStoryContextReadyForDevelopment,
};
