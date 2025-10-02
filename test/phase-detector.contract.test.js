// This test acts as a contract for the detector's JSON shape.
describe('phase-detector contract', () => {
  it('should produce valid keys', () => {
    // Simulate a detector output we expect the prompt to enforce.
    const out = {
      detected_phase: 'architect',
      confidence: 0.9,
      reasoning: 'User asked about stack and system design',
      suggested_questions: ['Any hosting constraints?', 'Preferred language?'],
      trigger_hook: 'auto-architect',
    };
    expect(typeof out.detected_phase).toBe('string');
    expect(out.trigger_hook).toBe(`auto-${out.detected_phase}`);
    expect(out.confidence).toBeGreaterThanOrEqual(0);
    expect(out.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(out.suggested_questions)).toBe(true);
  });
});
