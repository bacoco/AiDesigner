describe('checkTransition', () => {
  let phaseTransition;

  beforeEach(() => {
    jest.resetModules();
    phaseTransition = require('../hooks/phase-transition');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('executes a transition when the detector returns a valid payload', async () => {
    const triggerAgent = jest.fn().mockResolvedValue({ detected_phase: 'pm', confidence: 0.95 });
    const triggerCommand = jest.fn().mockResolvedValue({ workflowResult: { success: true } });
    const updateProjectState = jest.fn().mockResolvedValue();
    const saveDeliverable = jest.fn().mockResolvedValue();
    const loadPhaseContext = jest.fn().mockResolvedValue({ enriched: true });

    phaseTransition.bindDependencies({
      triggerAgent,
      triggerCommand,
      updateProjectState,
      saveDeliverable,
      loadPhaseContext,
    });

    const conversationContext = { history: [] };
    const result = await phaseTransition.checkTransition(
      conversationContext,
      "Let's plan",
      'analyst',
    );

    expect(triggerAgent).toHaveBeenCalledWith('phase-detector', {
      context: conversationContext,
      userMessage: "Let's plan",
      currentPhase: 'analyst',
    });
    expect(triggerCommand).toHaveBeenCalledWith('auto-pm', { enriched: true });
    expect(updateProjectState).toHaveBeenCalled();
    expect(result).toBeTruthy();
    expect(result.newPhase).toBe('pm');
  });

  it('returns structured error details and avoids transition when the detector response is malformed', async () => {
    const executeTransitionSpy = jest.spyOn(phaseTransition, 'executeTransition');
    const triggerAgent = jest.fn().mockResolvedValue({
      ok: false,
      errorType: 'agent_parse_error',
      agentId: 'phase-detector',
      message: 'Failed to parse response from agent phase-detector',
      rawSnippet: 'not-json',
      rawResponse: 'not-json',
      guidance:
        'Ensure the agent returns valid JSON matching the documented contract before attempting a phase transition.',
      cause: { message: 'Unexpected token n in JSON at position 0' },
      contextMetadata: { provided: true, keys: ['context'] },
    });
    const triggerCommand = jest.fn().mockResolvedValue({ success: true });
    const updateProjectState = jest.fn().mockResolvedValue();
    const saveDeliverable = jest.fn().mockResolvedValue();
    const loadPhaseContext = jest.fn().mockResolvedValue({ newContext: true });

    phaseTransition.bindDependencies({
      triggerAgent,
      triggerCommand,
      updateProjectState,
      saveDeliverable,
      loadPhaseContext,
    });

    const conversationContext = { history: [] };
    const result = await phaseTransition.checkTransition(
      conversationContext,
      'Still in analyst',
      'analyst',
    );

    expect(triggerAgent).toHaveBeenCalled();
    expect(executeTransitionSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: expect.objectContaining({
        errorType: 'agent_parse_error',
        agentId: 'phase-detector',
        rawSnippet: 'not-json',
        guidance: expect.stringContaining('valid JSON'),
      }),
      shouldTransition: false,
    });
  });

  it('returns null when detector returns null or undefined', async () => {
    const executeTransitionSpy = jest.spyOn(phaseTransition, 'executeTransition');
    const triggerAgent = jest.fn().mockResolvedValue(null);
    const triggerCommand = jest.fn().mockResolvedValue({ success: true });
    const updateProjectState = jest.fn().mockResolvedValue();
    const saveDeliverable = jest.fn().mockResolvedValue();
    const loadPhaseContext = jest.fn().mockResolvedValue({ newContext: true });

    phaseTransition.bindDependencies({
      triggerAgent,
      triggerCommand,
      updateProjectState,
      saveDeliverable,
      loadPhaseContext,
    });

    const conversationContext = { history: [] };
    const result = await phaseTransition.checkTransition(
      conversationContext,
      'Some message',
      'analyst',
    );

    expect(triggerAgent).toHaveBeenCalled();
    expect(executeTransitionSpy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when detector returns a partial error object (missing required fields)', async () => {
    const executeTransitionSpy = jest.spyOn(phaseTransition, 'executeTransition');
    const triggerAgent = jest.fn().mockResolvedValue({
      errorType: 'agent_parse_error',
      // Missing agentId and ok fields - should not be recognized as parse error
    });
    const triggerCommand = jest.fn().mockResolvedValue({ success: true });
    const updateProjectState = jest.fn().mockResolvedValue();
    const saveDeliverable = jest.fn().mockResolvedValue();
    const loadPhaseContext = jest.fn().mockResolvedValue({ newContext: true });

    phaseTransition.bindDependencies({
      triggerAgent,
      triggerCommand,
      updateProjectState,
      saveDeliverable,
      loadPhaseContext,
    });

    const conversationContext = { history: [] };
    const result = await phaseTransition.checkTransition(
      conversationContext,
      'Some message',
      'analyst',
    );

    expect(triggerAgent).toHaveBeenCalled();
    expect(executeTransitionSpy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('handles non-object detector responses gracefully', async () => {
    const executeTransitionSpy = jest.spyOn(phaseTransition, 'executeTransition');
    const triggerAgent = jest.fn().mockResolvedValue('invalid-string-response');
    const triggerCommand = jest.fn().mockResolvedValue({ success: true });
    const updateProjectState = jest.fn().mockResolvedValue();
    const saveDeliverable = jest.fn().mockResolvedValue();
    const loadPhaseContext = jest.fn().mockResolvedValue({ newContext: true });

    phaseTransition.bindDependencies({
      triggerAgent,
      triggerCommand,
      updateProjectState,
      saveDeliverable,
      loadPhaseContext,
    });

    const conversationContext = { history: [] };
    const result = await phaseTransition.checkTransition(
      conversationContext,
      'Some message',
      'analyst',
    );

    expect(triggerAgent).toHaveBeenCalled();
    expect(executeTransitionSpy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
