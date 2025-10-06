import type { Tokens, ComponentMap } from '@aidesigner/shared-types';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function buildShadcnPage(tokens: Tokens, comps: ComponentMap, outDir: string) {
  // Validate and sanitize output directory
  const resolvedOutDir = path.resolve(process.cwd(), outDir);
  if (!resolvedOutDir.startsWith(process.cwd())) {
    throw new Error('Invalid output directory: path traversal detected');
  }
  const imports = `import { Button } from "@/components/ui/button"\nimport { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"`;
  const styles = `:root{ --fg:${tokens.primitives.color['base/fg']}; --bg:${tokens.primitives.color['base/bg']}; } body{ background:var(--bg); color:var(--fg); font-family:${tokens.primitives.font.sans.family}; }`;

  const page = `\n${imports}\n\nexport default function Page(){\n  return (\n    <main className="p-6 grid gap-6 md:grid-cols-2">\n      <section>\n        <h1 className="text-2xl font-semibold mb-4">AiDesigner POC</h1>\n        <Button variant="default" size="default">Primary</Button>\n      </section>\n      <Card>\n        <CardHeader><CardTitle>Card</CardTitle></CardHeader>\n        <CardContent>Generated with tokens</CardContent>\n      </Card>\n    </main>\n  )\n}`;

  try {
    await fs.mkdir(resolvedOutDir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(resolvedOutDir, 'page.tsx'), page, 'utf-8'),
      fs.writeFile(path.join(resolvedOutDir, 'globals.css'), styles, 'utf-8'),
    ]);
  } catch (error) {
    throw new Error(`Failed to write generated files: ${(error as Error).message}`);
  }
}
