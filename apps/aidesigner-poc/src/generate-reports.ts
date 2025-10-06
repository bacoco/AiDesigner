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
  const spacingStep = tokens.constraints?.spacingStep ?? 4;

  const report = {
    contrast: { fg, bg, ratio, ok: ratio >= (tokens.constraints?.contrastMin ?? 4.5) },
    spacing: { step: spacingStep, driftAvgPx: 0 },
    summary: ratio >= 4.5 ? 'OK' : 'Issues detected',
  };

  try {
    const reportsDir = path.join(resolvedOutRoot, 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    await fs.writeFile(path.join(reportsDir, 'drift.json'), JSON.stringify(report, null, 2));
  } catch (error) {
    throw new Error(`Failed to generate drift report: ${(error as Error).message}`);
  }
}
