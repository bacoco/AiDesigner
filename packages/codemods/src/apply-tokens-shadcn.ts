// ts-node codemod: inject classes/props consistent with tokens (e.g., radii/spacing via tailwind config)
import { Project, SyntaxKind } from 'ts-morph';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(pathGlob: string, tokensPath: string) {
  // Validate and sanitize tokens path
  const resolvedTokensPath = path.resolve(process.cwd(), tokensPath);
  if (!resolvedTokensPath.startsWith(process.cwd()) || !resolvedTokensPath.endsWith('.json')) {
    throw new Error('Invalid tokens path: must be a JSON file within project directory');
  }

  const project = new Project();
  project.addSourceFilesAtPaths(pathGlob);

  let tokens;
  try {
    const tokensContent = await fs.readFile(resolvedTokensPath, 'utf-8');
    tokens = JSON.parse(tokensContent);
  } catch (error) {
    throw new Error(`Failed to load tokens: ${(error as Error).message}`);
  }

  project.getSourceFiles().forEach((sf) => {
    sf.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.JsxOpeningElement) {
        const el = node.asKind(SyntaxKind.JsxOpeningElement)!;
        const name = el.getTagNameNode().getText();
        if (name === 'Button') {
          const size = el.getAttribute('size');
          if (!size) {
            el.addAttribute({ name: 'size', initializer: '"default"' });
          }
        }
      }
    });
  });
  await project.save();
}
