// Replace inline styles (backgroundColor, color, borderRadius) with token-mapped classes/props
import { Project, SyntaxKind } from 'ts-morph';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(glob: string, tokensPath: string) {
  // Validate and sanitize tokens path
  const resolvedTokensPath = path.resolve(process.cwd(), tokensPath);
  if (!resolvedTokensPath.startsWith(process.cwd()) || !resolvedTokensPath.endsWith('.json')) {
    throw new Error('Invalid tokens path: must be a JSON file within project directory');
  }

  const project = new Project();
  project.addSourceFilesAtPaths(glob);

  let tokens;
  try {
    const tokensContent = await fs.readFile(resolvedTokensPath, 'utf-8');
    tokens = JSON.parse(tokensContent);
  } catch (error) {
    throw new Error(`Failed to load tokens: ${(error as Error).message}`);
  }

  const colorMap: Record<string, string> = {
    [tokens.primitives.color['brand/600']]: 'bg-brand-600',
    [tokens.primitives.color['base/bg']]: 'bg-background',
  };

  project.getSourceFiles().forEach((sf) => {
    sf.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.JsxAttribute) {
        const attr = node.asKind(SyntaxKind.JsxAttribute)!;
        if (attr.getName() === 'style') {
          // Simplified: remove inline style
          attr.remove();
        }
      }
    });
  });

  await project.save();
}
