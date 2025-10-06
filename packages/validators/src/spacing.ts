export function validateSpacing(spacingValues: number[], step: number): {
  driftAvgPx: number;
  violations: Array<{ value: number; expectedNearest: number }>;
} {
  const violations: Array<{ value: number; expectedNearest: number }> = [];
  let totalDrift = 0;

  for (const value of spacingValues) {
    const nearest = Math.round(value / step) * step;
    const drift = Math.abs(value - nearest);

    if (drift > 0) {
      violations.push({ value, expectedNearest: nearest });
      totalDrift += drift;
    }
  }

  return {
    driftAvgPx: spacingValues.length > 0 ? totalDrift / spacingValues.length : 0,
    violations,
  };
}
