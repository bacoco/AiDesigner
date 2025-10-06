import { analyzeWithMCP } from '../../../packages/mcp-inspector/src';
import { inferTokens } from '../../../packages/inference/src/tokens';
import { detectComponents } from '../../../packages/inference/src/components';
import { Tokens, ComponentMap } from './types';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function runUrlAnalysis(
  url: string,
  outRoot: string,
): Promise<{ tokens: Tokens; comps: ComponentMap; evidence: string }> {
  // Validate and sanitize output directory
  const resolvedOutRoot = path.resolve(process.cwd(), outRoot);
  if (!resolvedOutRoot.startsWith(process.cwd())) {
    throw new Error('Invalid output directory: path traversal detected');
  }

  try {
    const res = await analyzeWithMCP({ url, states: ['default', 'hover', 'dark', 'md'] });
    const tokens = inferTokens(res);
    const comps = detectComponents(res);

    const evidenceDir = path.join(resolvedOutRoot, 'evidence');
    const dataDir = path.join(resolvedOutRoot, 'data');

    // Create directories and write files in parallel
    await Promise.all([
      fs.mkdir(evidenceDir, { recursive: true }),
      fs.mkdir(dataDir, { recursive: true }),
    ]);

    await Promise.all([
      fs.writeFile(
        path.join(evidenceDir, 'domSnapshot.json'),
        JSON.stringify(res.domSnapshot, null, 2),
      ),
      fs.writeFile(
        path.join(evidenceDir, 'accessibilityTree.json'),
        JSON.stringify(res.accessibilityTree, null, 2),
      ),
      fs.writeFile(path.join(evidenceDir, 'cssom.json'), JSON.stringify(res.cssom, null, 2)),
      fs.writeFile(path.join(evidenceDir, 'console.json'), JSON.stringify(res.console, null, 2)),
      fs.writeFile(path.join(dataDir, 'tokens.json'), JSON.stringify(tokens, null, 2)),
      fs.writeFile(path.join(dataDir, 'components.map.json'), JSON.stringify(comps, null, 2)),
    ]);

    return { tokens, comps, evidence: evidenceDir };
  } catch (error) {
    throw new Error(`URL analysis failed: ${(error as Error).message}`);
  }
}
