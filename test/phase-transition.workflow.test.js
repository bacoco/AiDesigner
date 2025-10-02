const { bindDependencies, executeTransition } = require('../hooks/phase-transition');
const { executeAutoCommand } = require('../lib/auto-commands');

describe('executeTransition workflow integration', () => {
  const updateProjectState = jest.fn();
  const loadPhaseContext = jest.fn();
  const saveDeliverable = jest.fn();
  const executePhaseWorkflow = jest.fn();

  beforeEach(() => {
    updateProjectState.mockResolvedValue();
    saveDeliverable.mockResolvedValue();
    executePhaseWorkflow.mockResolvedValue({ ok: true });
    loadPhaseContext.mockImplementation(async (phase, context) => ({
      ...context,
      enrichedBy: phase,
    }));

    bindDependencies({
      triggerCommand: (command, context) =>
        executeAutoCommand(command, context, { executePhaseWorkflow }),
      updateProjectState,
      loadPhaseContext,
      saveDeliverable,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('invokes executePhaseWorkflow with derived phase and enriched context', async () => {
    const context = { input: true };
    const result = await executeTransition('analyst', 'dev', context);

    expect(loadPhaseContext).toHaveBeenCalledWith('dev', context);
    expect(executePhaseWorkflow).toHaveBeenCalledWith('dev', {
      input: true,
      enrichedBy: 'dev',
    });
    expect(updateProjectState).toHaveBeenCalledWith(
      expect.objectContaining({ currentPhase: 'dev', previousPhase: 'analyst' }),
    );
    expect(result.workflowResult).toEqual({ ok: true });
  });
});
