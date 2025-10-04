describe('handleTransition', () => {
  let phaseTransition;
  let projectState;
  let dependencies;

  beforeEach(() => {
    jest.resetModules();
    phaseTransition = require('../hooks/phase-transition');
    projectState = {
      transitionPhase: jest.fn().mockResolvedValue(undefined),
      getState: jest.fn(() => ({ currentPhase: 'analyst' })),
    };
    dependencies = {
      triggerCommand: jest.fn().mockResolvedValue({ ok: true }),
      updateProjectState: jest.fn().mockResolvedValue(undefined),
      saveDeliverable: jest.fn().mockResolvedValue(undefined),
      loadPhaseContext: jest.fn(async (phase, ctx) => ({ ...ctx, enrichedBy: phase })),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws when attempting to move into a gated phase without validation', async () => {
    await expect(
      phaseTransition.handleTransition(projectState, 'pm', { plan: true }, false),
    ).rejects.toThrow(/requires user validation/);

    expect(projectState.transitionPhase).not.toHaveBeenCalled();
  });

  it('delegates to executeTransition and syncs project history', async () => {
    phaseTransition.bindDependencies(dependencies);

    const result = await phaseTransition.handleTransition(projectState, 'pm', { plan: true }, true);

    expect(dependencies.loadPhaseContext).toHaveBeenCalledWith('pm', { plan: true });
    expect(dependencies.triggerCommand).toHaveBeenCalledWith('auto-pm', {
      plan: true,
      enrichedBy: 'pm',
    });
    expect(projectState.transitionPhase).toHaveBeenCalledWith('pm', {
      plan: true,
      enrichedBy: 'pm',
    });
    expect(result).toEqual(
      expect.objectContaining({
        newPhase: 'pm',
        context: {
          plan: true,
          enrichedBy: 'pm',
        },
      }),
    );
  });
});
