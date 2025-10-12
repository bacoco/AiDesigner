import { analyzeWithMCP } from '../../../packages/mcp-inspector/src';
import { inferTokens } from '../../../packages/inference/src/tokens';
import { detectComponents } from '../../../packages/inference/src/components';
import { Tokens, ComponentMap } from './types';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Analyzes a URL and extracts design tokens and components.
 *
 * @param url - The URL to analyze
 * @param outRoot - Output directory path (must be within project root, no symlinks allowed)
 * @returns Object containing tokens, components, and evidence directory path
 * @throws {Error} If path traversal is detected, symlinks are found, or analysis fails
 */
export async function runUrlAnalysis(
  url: string,
  outRoot: string,
): Promise<{ tokens: Tokens; comps: ComponentMap; evidence: string }> {
  // Validate and sanitize output directory
  const projectRoot = process.cwd();
  const resolvedOutRoot = path.resolve(projectRoot, outRoot);
  const relativeOutRoot = path.relative(projectRoot, resolvedOutRoot);

  // Reject paths that escape the project root
  if (!relativeOutRoot || relativeOutRoot.startsWith('..') || path.isAbsolute(relativeOutRoot)) {
    throw new Error('Invalid output directory: path traversal detected or empty path');
  }

  // Also, disallow symbolic links in the path to prevent writing outside the project root
  const pathSegments = relativeOutRoot.split(path.sep);
  let currentPath = projectRoot;
  for (const segment of pathSegments) {
    if (!segment || segment === '.') {
      continue;
    }
    currentPath = path.join(currentPath, segment);
    try {
      const stats = await fs.lstat(currentPath);
      if (stats.isSymbolicLink()) {
        throw new Error(
          `Invalid output directory: path contains symbolic link at '${currentPath}'`,
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // This part of the path doesn't exist yet, which is fine.
        // We've checked all existing parts for symlinks.
        break;
      }
      throw error; // rethrow other errors
    }
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
        const stateDir = path.join(evidenceDir, state);
        const writes: Array<{ filename: string; payload: unknown }> = [];

        if (capture.domSnapshot !== undefined) {
          writes.push({ filename: 'domSnapshot.json', payload: capture.domSnapshot });
        }
        if (capture.accessibilityTree !== undefined) {
          writes.push({
            filename: 'accessibilityTree.json',
            payload: capture.accessibilityTree,
          });
        }
        if (capture.cssom !== undefined) {
          writes.push({ filename: 'cssom.json', payload: capture.cssom });
        }
        if (capture.console !== undefined) {
          writes.push({ filename: 'console.json', payload: capture.console });
        }
        if (capture.computedStyles !== undefined) {
          writes.push({
            filename: 'computedStyles.json',
            payload: capture.computedStyles,
          });
        }

        if (writes.length === 0) {
          return;
        }

        await fs.mkdir(stateDir, { recursive: true });
        await Promise.all(
          writes.map(({ filename, payload }) =>
            fs.writeFile(
              path.join(stateDir, filename),
              JSON.stringify(payload, null, 2),
            ),
          ),
        );
      }),
    );

    return { tokens, comps, evidence: evidenceDir };
  } catch (error) {
    throw new Error(`URL analysis failed: ${(error as Error).message}`);
  }
}
