import { Tokens } from './types';
import { contrastRatio } from '../../../packages/validators/src/contrast';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function generateDriftReport(tokens: Tokens, outRoot: string) {
  // Validate output directory
  const resolvedOutRoot = path.resolve(process.cwd(), outRoot);
  if (!resolvedOutRoot.startsWith(process.cwd())) {
    throw new Error('Invalid output directory: path traversal detected');
  }

  // Demo: minimal drift = contrast + spacing step
  const fg = tokens.primitives.color['base/fg'];
  const bg = tokens.primitives.color['base/bg'];
  const ratio = contrastRatio(fg, bg);
  const spacingStep = tokens.constraints?.spacingStep;
  const spacingValues = Object.values(tokens.primitives.space ?? {});
  const spacingDrift =
    spacingStep && spacingValues.length > 0
      ? calculateSpacingDrift(spacingValues, spacingStep)
      : undefined;

  const report = {
    contrast: { fg, bg, ratio, ok: ratio >= (tokens.constraints?.contrastMin ?? 4.5) },
    spacing: { step: spacingStep, driftAvgPx: spacingDrift ?? null },
    summary: ratio >= (tokens.constraints?.contrastMin ?? 4.5) ? 'OK' : 'Issues detected',
  };

  try {
    const reportsDir = path.join(resolvedOutRoot, 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    await fs.writeFile(path.join(reportsDir, 'drift.json'), JSON.stringify(report, null, 2));
  } catch (error) {
    throw new Error(`Failed to generate drift report: ${(error as Error).message}`);
  }
}

function calculateSpacingDrift(values: number[], step: number): number {
  if (step <= 0) {
    return 0;
  }
  const total = values.reduce((sum, value) => {
    const remainder = value % step;
    const drift = Math.min(remainder, Math.abs(step - remainder));
    return sum + drift;
  }, 0);
  return Number.parseFloat((total / values.length).toFixed(2));
}
