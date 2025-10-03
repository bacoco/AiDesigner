const { createLaneSelectionModule } = require('../lib/v6/lane-selection-module');

describe('v6 lane selection module prototype', () => {
  const module = createLaneSelectionModule();

  it('routes quick work to rapid phase progression', () => {
    const result = module.planPhaseProgression({
      description: 'Fix typo in README and remove console log',
    });

    expect(result.lane).toBe('quick');
    expect(result.phases).toHaveLength(2);
    expect(result.phases[0]).toMatchObject({
      id: 'analysis',
      variant: 'lite',
      order: 1,
    });
    expect(result.phases[1]).toMatchObject({
      id: 'development',
      variant: 'single-pass-story',
      order: 2,
    });
  });

  it('routes complex work to full phase progression', () => {
    const result = module.planPhaseProgression({
      description: 'Implement new authentication feature touching API and database',
    });

    expect(result.lane).toBe('complex');
    expect(result.phases).toHaveLength(3);
    expect(result.phases[0]).toMatchObject({
      id: 'analysis',
      variant: 'deep-dive',
      order: 1,
    });
    expect(result.phases[1]).toMatchObject({
      id: 'planning',
      variant: 'full-stack',
      order: 2,
    });
    expect(result.phases[2]).toMatchObject({
      id: 'development',
      variant: 'iterative-epic-cycle',
      order: 3,
    });
  });

  it('throws if work item description missing', () => {
    expect(() => module.planPhaseProgression({})).toThrow(/workItem\.description/);
  });
});
