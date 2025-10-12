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
    const res = await analyzeWithMCP({
      url,
      states: ['default', 'hover', 'dark', 'md'],
      capture: {
        domSnapshot: true,
        accessibilityTree: true,
        cssom: true,
        console: true,
        computedStyles: true,
      },
    });

    const captureEntries = Object.entries(res.captures ?? {});
    const primaryCapture =
      res.captures?.default ??
      res.captures?.light ??
      (captureEntries.length > 0 ? captureEntries[0][1] : undefined);

    if (!primaryCapture) {
      throw new Error('MCP capture returned no usable state data');
    }

    const tokens = inferTokens(primaryCapture);
    const comps = detectComponents(primaryCapture);

    const evidenceDir = path.join(resolvedOutRoot, 'evidence');
    const dataDir = path.join(resolvedOutRoot, 'data');

    // Create directories and write files in parallel
    await Promise.all([
      fs.mkdir(evidenceDir, { recursive: true }),
      fs.mkdir(dataDir, { recursive: true }),
    ]);

    await Promise.all([
      fs.writeFile(path.join(dataDir, 'tokens.json'), JSON.stringify(tokens, null, 2)),
      fs.writeFile(path.join(dataDir, 'components.map.json'), JSON.stringify(comps, null, 2)),
    ]);

    await Promise.all(
      captureEntries.map(async ([state, capture]) => {
        const writes: Promise<void>[] = [];
        if (capture.domSnapshot !== undefined) {
          writes.push(
            fs.writeFile(
              path.join(evidenceDir, state, 'domSnapshot.json'),
              JSON.stringify(capture.domSnapshot, null, 2),
            ),
          );
        }
        if (capture.accessibilityTree !== undefined) {
          writes.push(
            fs.writeFile(
              path.join(evidenceDir, state, 'accessibilityTree.json'),
              JSON.stringify(capture.accessibilityTree, null, 2),
            ),
          );
        }
        if (capture.cssom !== undefined) {
          writes.push(
            fs.writeFile(
              path.join(evidenceDir, state, 'cssom.json'),
              JSON.stringify(capture.cssom, null, 2),
            ),
          );
        }
        if (capture.console !== undefined) {
          writes.push(
            fs.writeFile(
              path.join(evidenceDir, state, 'console.json'),
              JSON.stringify(capture.console, null, 2),
            ),
          );
        }
        if (capture.computedStyles !== undefined) {
          writes.push(
            fs.writeFile(
              path.join(evidenceDir, state, 'computedStyles.json'),
              JSON.stringify(capture.computedStyles, null, 2),
            ),
          );
        }

        if (writes.length === 0) {
          return;
        }

        await fs.mkdir(path.join(evidenceDir, state), { recursive: true });
        await Promise.all(writes);
      }),
    );

    return { tokens, comps, evidence: evidenceDir };
  } catch (error) {
    throw new Error(`URL analysis failed: ${(error as Error).message}`);
  }
}
