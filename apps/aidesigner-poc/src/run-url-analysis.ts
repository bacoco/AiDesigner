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
        path.join(evidenceDir, 'accessibility.json'),
        JSON.stringify(res.accessibility, null, 2),
      ),
      fs.writeFile(path.join(evidenceDir, 'cssom.json'), JSON.stringify(res.cssom, null, 2)),
      fs.writeFile(path.join(evidenceDir, 'console.json'), JSON.stringify(res.console, null, 2)),
      fs.writeFile(path.join(evidenceDir, 'errors.json'), JSON.stringify(res.errors, null, 2)),
      fs.writeFile(path.join(dataDir, 'tokens.json'), JSON.stringify(tokens, null, 2)),
      fs.writeFile(path.join(dataDir, 'components.map.json'), JSON.stringify(comps, null, 2)),
    ]);

    return { tokens, comps, evidence: evidenceDir };
  } catch (error) {
    throw new Error(`URL analysis failed: ${(error as Error).message}`);
  }
}
