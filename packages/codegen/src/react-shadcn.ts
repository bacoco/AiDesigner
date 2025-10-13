import type { ComponentMap, Tokens } from '@aidesigner/shared-types';
import fs from 'node:fs/promises';
import path from 'node:path';

type ImportSpec = {
  module: string;
  specifiers: Set<string>;
};

const BASE_SHADCN_IMPORTS: ImportSpec[] = [
  { module: '@/components/ui/button', specifiers: new Set(['Button']) },
  {
    module: '@/components/ui/card',
    specifiers: new Set(['Card', 'CardHeader', 'CardContent', 'CardTitle']),
  },
];

const COMPONENT_IMPORTS: Record<string, ImportSpec[]> = {
  Button: [{ module: '@/components/ui/button', specifiers: new Set(['Button']) }],
  Card: [
    {
      module: '@/components/ui/card',
      specifiers: new Set(['Card', 'CardHeader', 'CardContent', 'CardTitle']),
    },
  ],
  Input: [{ module: '@/components/ui/input', specifiers: new Set(['Input']) }],
};

const PLACEHOLDER_CONTENT: Record<string, string> = {
  slot: 'Click me',
  content: 'Generated with AiDesigner tokens',
  header: 'Card Title',
  title: 'Preview Title',
  description: 'Add supporting copy here.',
  placeholder: 'Enter value',
  label: 'Label',
  intent: 'default',
  size: 'md',
};

export async function buildShadcnPage(tokens: Tokens, comps: ComponentMap, outDir: string) {
  const projectRoot = process.cwd();
  const resolvedOutDir = path.resolve(projectRoot, outDir);
  const relativeOutDir = path.relative(projectRoot, resolvedOutDir);

  if (relativeOutDir && (relativeOutDir.startsWith('..') || path.isAbsolute(relativeOutDir))) {
    throw new Error('Invalid output directory: path traversal detected');
  }

  const imports = collectImports(comps);
  const styles = buildGlobalStyles(tokens);
  const sections = buildComponentSections(comps);
  const page = buildPageSource(imports, sections, tokens);

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

function collectImports(comps: ComponentMap): string {
  const imports = new Map<string, Set<string>>();

  for (const entry of BASE_SHADCN_IMPORTS) {
    imports.set(entry.module, new Set(entry.specifiers));
  }

  for (const [name] of Object.entries(comps)) {
    const moduleSpecs = COMPONENT_IMPORTS[name];
    if (!moduleSpecs) {
      continue;
    }
    for (const spec of moduleSpecs) {
      const existing = imports.get(spec.module) ?? new Set<string>();
      for (const identifier of spec.specifiers) {
        existing.add(identifier);
      }
      imports.set(spec.module, existing);
    }
  }

  return Array.from(imports.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([module, specifiers]) =>
        `import { ${Array.from(specifiers).sort().join(', ')} } from "${module}";`,
    )
    .join('\n');
}

function buildGlobalStyles(tokens: Tokens): string {
  const fg = tokens.primitives.color['base/fg'] ?? '#111827';
  const bg = tokens.primitives.color['base/bg'] ?? '#ffffff';
  const primaryFont =
    tokens.primitives.font.sans?.family ?? firstFontFamily(tokens.primitives.font) ?? 'Inter';

  return `:root {\n  --fg: ${fg};\n  --bg: ${bg};\n}\nbody {\n  background: var(--bg);\n  color: var(--fg);\n  font-family: ${primaryFont}, sans-serif;\n}`;
}

function firstFontFamily(fonts: Tokens['primitives']['font']): string | undefined {
  for (const entry of Object.values(fonts)) {
    if (entry?.family) {
      return entry.family;
    }
  }
  return undefined;
}

function buildComponentSections(comps: ComponentMap): string[] {
  const sections: string[] = [];
  for (const [name, definition] of Object.entries(comps)) {
    const template = definition.mappings?.shadcn;
    if (!template) {
      continue;
    }
    const metadata = buildMetadata(definition);
    const instantiated = instantiateTemplate(template);
    const block = [
      `      <section className="space-y-3">`,
      `        <h2 className="text-xl font-semibold">${name}</h2>`,
    ];
    if (metadata) {
      block.push(`        <p className="text-sm text-muted-foreground">${metadata}</p>`);
    }
    for (const line of instantiated.split('\n')) {
      block.push(`        ${line}`);
    }
    block.push('      </section>');
    sections.push(block.join('\n'));
  }
  return sections;
}

function buildMetadata(definition: ComponentMap[string]): string | undefined {
  const parts: string[] = [];
  if (definition.detect?.role?.length) {
    parts.push(`Roles: ${definition.detect.role.join(', ')}`);
  }
  if (definition.detect?.classesLike?.length) {
    parts.push(`Classes: ${definition.detect.classesLike.slice(0, 3).join(', ')}`);
  }
  if (definition.states?.length) {
    parts.push(`States: ${definition.states.join(', ')}`);
  }
  if (definition.variants) {
    const variantEntries = Object.entries(definition.variants)
      .map(([variant, values]) => `${variant}: ${values.join(', ')}`)
      .join(' • ');
    if (variantEntries) {
      parts.push(`Variants → ${variantEntries}`);
    }
  }
  return parts.length > 0 ? parts.join(' • ') : undefined;
}

function instantiateTemplate(template: string): string {
  return template.replace(
    /\{(\w+)\}/g,
    (_match, key: string) => PLACEHOLDER_CONTENT[key] ?? `{{${key}}}`,
  );
}

function buildPageSource(imports: string, sections: string[], tokens: Tokens): string {
  const spacingStep = tokens.constraints?.spacingStep;
  const borderRadiusStep = tokens.constraints?.borderRadiusStep;
  const constraintsSummary = [
    spacingStep ? `Spacing step: ${spacingStep}px` : undefined,
    borderRadiusStep ? `Radius step: ${borderRadiusStep}px` : undefined,
  ]
    .filter(Boolean)
    .join(' • ');

  const summaryLine = constraintsSummary
    ? `        <p className="text-sm text-muted-foreground">${constraintsSummary}</p>`
    : '';

  const composedSections = [
    '      <section className="space-y-4">',
    '        <h1 className="text-2xl font-semibold">AiDesigner Preview</h1>',
    '        <p className="text-sm text-muted-foreground">Token-driven UI preview scaffold.</p>',
    summaryLine,
    '        <div className="flex flex-wrap gap-3">',
    '          <Button variant="default">Primary action</Button>',
    '          <Button variant="outline">Secondary action</Button>',
    '        </div>',
    '      </section>',
    '      <Card>',
    '        <CardHeader>',
    '          <CardTitle>Theme snapshot</CardTitle>',
    '        </CardHeader>',
    '        <CardContent className="space-y-2">',
    `          <p><strong>Foreground:</strong> ${tokens.primitives.color['base/fg'] ?? '#111827'}</p>`,
    `          <p><strong>Background:</strong> ${tokens.primitives.color['base/bg'] ?? '#ffffff'}</p>`,
    '        </CardContent>',
    '      </Card>',
    ...sections,
  ].filter(Boolean);

  return `import React from "react";\n${imports}\n\nexport default function Page() {\n  return (\n    <main className="grid gap-6 p-6 md:grid-cols-2">\n${composedSections.join('\n')}\n    </main>\n  );\n}`;
}
