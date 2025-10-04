const { normalizeConfigTarget } = require('../tools/shared/mcp-config');

describe('normalizeConfigTarget', () => {
  test('normalizes bmad to agilai', () => {
    expect(normalizeConfigTarget('bmad')).toBe('agilai');
  });

  test('normalizes BMAD to agilai', () => {
    expect(normalizeConfigTarget('BMAD')).toBe('agilai');
  });

  test('keeps claude as is', () => {
    expect(normalizeConfigTarget('claude')).toBe('claude');
    expect(normalizeConfigTarget('CLAUDE')).toBe('claude');
  });

  test('keeps both as is', () => {
    expect(normalizeConfigTarget('both')).toBe('both');
  });

  test('handles null and undefined', () => {
    expect(normalizeConfigTarget(null)).toBeNull();
    expect(normalizeConfigTarget(undefined)).toBeUndefined();
  });
});
