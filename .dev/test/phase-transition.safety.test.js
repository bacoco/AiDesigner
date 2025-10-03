function loadPhaseTransitionModule() {
  let moduleExports;
  jest.isolateModules(() => {
    moduleExports = require('../hooks/phase-transition');
  });
  return moduleExports;
}

describe('phase-transition safety', () => {
  it('returns null when toPhase is falsy', async () => {
    const { executeTransition } = loadPhaseTransitionModule();
    const res = await executeTransition('analyst', '', {});
    expect(res).toBeNull();
  });

  it('throws if required dependencies are missing on first bind', () => {
    const { bindDependencies } = loadPhaseTransitionModule();
    expect(() => bindDependencies({ triggerAgent: jest.fn() })).toThrow(
      'Missing required dependencies for phase transition: saveDeliverable, loadPhaseContext',
    );
  });

  it('allows rebinding once required dependencies were provided', () => {
    const { bindDependencies } = loadPhaseTransitionModule();
    const saveDeliverable = jest.fn();
    const loadPhaseContext = jest.fn();

    expect(() => bindDependencies({ saveDeliverable, loadPhaseContext })).not.toThrow();

    expect(() => bindDependencies({ triggerAgent: jest.fn() })).not.toThrow();
  });
});
