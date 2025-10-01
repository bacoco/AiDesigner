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

  it('returns null and avoids transition when the detector response is malformed', async () => {
    const executeTransitionSpy = jest.spyOn(phaseTransition, 'executeTransition');
    const triggerAgent = jest.fn().mockResolvedValue({
      error: 'Failed to parse response',
      rawResponse: 'not-json',
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
    expect(result).toBeNull();
  });
});
