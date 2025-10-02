const { executeTransition } = require('../hooks/phase-transition');

// Mock bindings
jest.mock('../hooks/phase-transition', () => {
  const actual = jest.requireActual('../hooks/phase-transition');
  return {
    ...actual,
    __esModule: true,
  };
});

describe('phase-transition safety', () => {
  it('returns null when toPhase is falsy', async () => {
    const res = await executeTransition('analyst', '', {});
    expect(res).toBeNull();
  });
});
