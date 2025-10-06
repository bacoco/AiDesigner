# AiDesigner NG — POC Kit (Chrome MCP × Shadcn/MUI)

## Scope livré (MVP prêt à cloner dans `bacoco/AiDesigner`)

1. Mini **POC** “**URL → tokens → page HTML/React (Shadcn)**” avec **evidence pack** et **rapport de drift**.
2. **Templates de prompts** Nano Banana / Gemini **design-locked**.
3. **Registry de mapping** (Shadcn & MUI) + **3 codemods** types (ts-node / jscodeshift/ts-morph).

> ⚠️ Tout est pensé pour **Chrome DevTools MCP** exclusivement (jamais Playwright). Les appels MCP sont encapsulés pour que tu puisses mapper aux noms d’outils de ton serveur MCP actuel.

---

## 0) Arborescence proposée (monorepo)

```
/ (racine du repo AiDesigner)
├─ apps/
│  └─ aidesigner-poc/
│     ├─ README.md
│     ├─ package.json
│     ├─ src/
│     │  ├─ cli.ts
│     │  ├─ run-url-analysis.ts
│     │  ├─ build-react-page.ts
│     │  ├─ generate-reports.ts
│     │  └─ types.ts
│     └─ out/ (généré)
│        ├─ evidence/
│        ├─ reports/
│        └─ generated/
├─ packages/
│  ├─ mcp-inspector/
│  │  ├─ package.json
│  │  └─ src/index.ts
│  ├─ inference/
│  │  ├─ package.json
│  │  └─ src/{tokens.ts,components.ts}
│  ├─ canonical-spec/
│  │  ├─ package.json
│  │  └─ schemas/{tokens.schema.json,components-map.schema.json}
│  ├─ validators/
│  │  ├─ package.json
│  │  └─ src/{contrast.ts,spacing.ts,grid.ts,index.ts}
│  ├─ mappers/
│  │  ├─ package.json
│  │  └─ registry/{shadcn.json,mui.json}
│  ├─ codegen/
│  │  ├─ package.json
│  │  └─ src/{canonical.ts,react-shadcn.ts,react-mui.ts,stories.ts,tests.ts}
│  └─ codemods/
│     ├─ package.json
│     └─ src/{apply-tokens-shadcn.ts,replace-inline-styles.ts,mui-intent-size.ts}
└─ prompts/
   ├─ nano-banana-design-locked.txt
   └─ gemini-2.5-design-locked.txt
```

---

## 1) POC URL → Tokens → Page React (Shadcn)

### 1.1 `apps/aidesigner-poc/src/types.ts`

```ts
export type Tokens = {
  meta: { source: 'url' | 'image'; url?: string; capturedAt: string; commit?: string };
  primitives: {
    color: Record<string, string>;
    font: Record<string, { family: string; weights: number[]; letterSpacing?: number }>;
    space: Record<string, number>;
    radius?: Record<string, number>;
  };
  semantic: Record<string, { ref: string; fallback?: string }>;
  modes?: Record<string, Record<string, { ref: string }>>;
  constraints?: { spacingStep?: number; borderRadiusStep?: number; contrastMin?: number };
};

export type ComponentMap = {
  [componentName: string]: {
    detect: { role?: string[]; classesLike?: string[]; patterns?: string[] };
    variants?: Record<string, string[]>;
    states?: string[];
    a11y?: { minHit?: number; focusRing?: boolean; ariaPressedIfToggle?: boolean };
    mappings: { [targetLib: string]: string }; // e.g. shadcn/mui templates
  };
};

export type EvidencePack = {
  screenshots: string[];
  cssDumps: string[];
  console: string[];
  perf: string[];
  diffs: string[];
};

export type ValidationReport = {
  contrastIssues: number;
  spacingDriftAvgPx: number;
  gridAlignScore: number; // 0..1
  tokenViolations: string[];
};
```

### 1.2 `packages/mcp-inspector/src/index.ts`

```ts
// Wrapper minimal pour Chrome DevTools MCP.
// Adapte les noms d'outils à ton serveur MCP Chrome (voir README MCP Chrome).

export type InspectOptions = {
  url: string;
  states?: Array<'default' | 'hover' | 'focus' | 'dark' | 'md' | 'lg'>;
};

export type InspectResult = {
  domSnapshot: any;
  accessibilityTree: any;
  cssom: any;
  computedStyles: any[]; // par node
  console: { logs: any[]; warnings: any[]; errors: any[] };
  perfTracePath?: string;
  screenshots: string[]; // chemins sauvegardés
};

export async function analyzeWithMCP(opts: InspectOptions): Promise<InspectResult> {
  // TODO: brancher sur ton client MCP existant.
  // Pseudo-calls:
  // await mcp.browser.open(opts.url)
  // const domSnapshot = await mcp.devtools.dom_snapshot()
  // const accessibilityTree = await mcp.devtools.accessibility_tree()
  // const cssom = await mcp.devtools.cssom_dump()
  // const computedStyles = await mcp.devtools.get_computed_styles({ nodes: 'all' })
  // const console = await mcp.devtools.console_get_messages({ levels: ['log','warn','error'] })
  // await mcp.devtools.performance_start_trace({ preset: 'navigation' })
  // ... navigate/idle ...
  // const perfTracePath = await mcp.devtools.performance_stop_trace()
  // const screenshots = await mcp.devtools.capture_screenshot({ states: opts.states || ['default'] })

  return {
    domSnapshot: {},
    accessibilityTree: {},
    cssom: {},
    computedStyles: [],
    console: { logs: [], warnings: [], errors: [] },
    perfTracePath: undefined,
    screenshots: [],
  };
}
```

### 1.3 `packages/inference/src/tokens.ts`

```ts
import { Tokens } from '../../../apps/aidesigner-poc/src/types';

export function inferTokens(input: {
  domSnapshot: any;
  computedStyles: any[];
  cssom: any;
}): Tokens {
  // Heuristiques: clustering couleurs (k-medoids simplifié), steps d’espacement (GCD-like), familles de fonts.
  const now = new Date().toISOString();

  // TODO: extraire des valeurs réelles depuis computedStyles
  const colors = {
    'base/fg': '#0A0A0A',
    'base/bg': '#FFFFFF',
    'brand/600': '#635BFF',
    'muted/500': '#6B7280',
  };
  const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32 };
  const font = { sans: { family: 'Inter, system-ui, sans-serif', weights: [400, 600] } };

  return {
    meta: { source: 'url', capturedAt: now },
    primitives: { color: colors, space, font },
    semantic: {
      'text/primary': { ref: 'color.base/fg' },
      'surface/default': { ref: 'color.base/bg' },
      'button/primary/bg': { ref: 'color.brand/600' },
    },
    constraints: { spacingStep: 4, borderRadiusStep: 2, contrastMin: 4.5 },
  };
}
```

### 1.4 `packages/inference/src/components.ts`

```ts
import { ComponentMap } from '../../../apps/aidesigner-poc/src/types';

export function detectComponents(input: {
  domSnapshot: any;
  accessibilityTree: any;
  cssom: any;
}): ComponentMap {
  // Heuristiques: rôle ARIA, classes, patterns CSS récurrents
  return {
    Button: {
      detect: { role: ['button'], classesLike: ['btn', 'button'], patterns: ['rounded'] },
      variants: { intent: ['primary', 'secondary', 'danger'], size: ['sm', 'md', 'lg'] },
      states: ['default', 'hover', 'focus', 'disabled'],
      a11y: { minHit: 44, focusRing: true },
      mappings: {
        shadcn: '<Button variant="{intent}" size="{size}">{slot}</Button>',
        mui: '<Button color="{intent}" size="{size}">{slot}</Button>',
      },
    },
    Card: {
      detect: { role: [], classesLike: ['card'], patterns: ['shadow', 'rounded'] },
      mappings: {
        shadcn:
          '<Card><CardHeader>{header}</CardHeader><CardContent>{content}</CardContent></Card>',
        mui: '<Card><CardHeader title={header}/><CardContent>{content}</CardContent></Card>',
      },
    },
  };
}
```

### 1.5 `packages/validators/src/contrast.ts`

```ts
export function contrastRatio(hex1: string, hex2: string): number {
  const L = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const f = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
    const [R, G, B] = [f(r), f(g), f(b)];
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const l1 = L(hex1),
    l2 = L(hex2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
```

### 1.6 `packages/mappers/registry/shadcn.json`

```json
{
  "Button": {
    "component": "Button",
    "props": {
      "intent->variant": {
        "primary": "default",
        "secondary": "secondary",
        "danger": "destructive"
      },
      "size": { "sm": "sm", "md": "default", "lg": "lg" }
    },
    "imports": {
      "@/components/ui/button": ["Button"]
    }
  },
  "Card": {
    "component": "Card",
    "imports": {
      "@/components/ui/card": [
        "Card",
        "CardHeader",
        "CardContent",
        "CardFooter",
        "CardTitle",
        "CardDescription"
      ]
    }
  }
}
```

### 1.7 `packages/mappers/registry/mui.json`

```json
{
  "Button": {
    "component": "Button",
    "props": {
      "intent->color": { "primary": "primary", "secondary": "secondary", "danger": "error" },
      "size": { "sm": "small", "md": "medium", "lg": "large" }
    },
    "imports": { "@mui/material": ["Button"] }
  },
  "Card": {
    "component": "Card",
    "imports": { "@mui/material": ["Card", "CardHeader", "CardContent"] }
  }
}
```

### 1.8 `packages/codegen/src/react-shadcn.ts`

```ts
import { Tokens, ComponentMap } from '../../../apps/aidesigner-poc/src/types';
import fs from 'node:fs';

export function buildShadcnPage(tokens: Tokens, comps: ComponentMap, outDir: string) {
  const imports = `import { Button } from "@/components/ui/button"\nimport { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"`;
  const styles = `:root{ --fg:${tokens.primitives.color['base/fg']}; --bg:${tokens.primitives.color['base/bg']}; } body{ background:var(--bg); color:var(--fg); font-family:${tokens.primitives.font.sans.family}; }`;

  const page = `\n${imports}\n\nexport default function Page(){\n  return (\n    <main className="p-6 grid gap-6 md:grid-cols-2">\n      <section>\n        <h1 className="text-2xl font-semibold mb-4">AiDesigner POC</h1>\n        <Button variant="default" size="default">Primary</Button>\n      </section>\n      <Card>\n        <CardHeader><CardTitle>Card</CardTitle></CardHeader>\n        <CardContent>Generated with tokens</CardContent>\n      </Card>\n    </main>\n  )\n}`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/page.tsx`, page, 'utf-8');
  fs.writeFileSync(`${outDir}/globals.css`, styles, 'utf-8');
}
```

### 1.9 `apps/aidesigner-poc/src/run-url-analysis.ts`

```ts
import { analyzeWithMCP } from '../../..//packages/mcp-inspector/src';
import { inferTokens } from '../../..//packages/inference/src/tokens';
import { detectComponents } from '../../..//packages/inference/src/components';
import { Tokens, ComponentMap } from './types';
import fs from 'node:fs';

export async function runUrlAnalysis(
  url: string,
  outRoot: string,
): Promise<{ tokens: Tokens; comps: ComponentMap; evidence: string }> {
  const res = await analyzeWithMCP({ url, states: ['default', 'hover', 'dark', 'md'] });
  const tokens = inferTokens(res);
  const comps = detectComponents(res);

  const evidenceDir = `${outRoot}/evidence`;
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(`${evidenceDir}/domSnapshot.json`, JSON.stringify(res.domSnapshot, null, 2));
  fs.writeFileSync(
    `${evidenceDir}/accessibilityTree.json`,
    JSON.stringify(res.accessibilityTree, null, 2),
  );
  fs.writeFileSync(`${evidenceDir}/cssom.json`, JSON.stringify(res.cssom, null, 2));
  fs.writeFileSync(`${evidenceDir}/console.json`, JSON.stringify(res.console, null, 2));

  const dataDir = `${outRoot}/data`;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(`${dataDir}/tokens.json`, JSON.stringify(tokens, null, 2));
  fs.writeFileSync(`${dataDir}/components.map.json`, JSON.stringify(comps, null, 2));

  return { tokens, comps, evidence: evidenceDir };
}
```

### 1.10 `apps/aidesigner-poc/src/build-react-page.ts`

```ts
import { buildShadcnPage } from '../../../packages/codegen/src/react-shadcn';
import { Tokens, ComponentMap } from './types';

export async function buildReact(tokens: Tokens, comps: ComponentMap, outRoot: string) {
  const outDir = `${outRoot}/generated/shadcn-app/src/app`;
  buildShadcnPage(tokens, comps, outDir);
}
```

### 1.11 `apps/aidesigner-poc/src/generate-reports.ts`

```ts
import { Tokens } from './types';
import { contrastRatio } from '../../../packages/validators/src/contrast';
import fs from 'node:fs';

export function generateDriftReport(tokens: Tokens, outRoot: string) {
  // Demo: drift minimal = contraste + spacing step
  const fg = tokens.primitives.color['base/fg'];
  const bg = tokens.primitives.color['base/bg'];
  const ratio = contrastRatio(fg, bg);
  const spacingStep = tokens.constraints?.spacingStep ?? 4;

  const report = {
    contrast: { fg, bg, ratio, ok: ratio >= (tokens.constraints?.contrastMin ?? 4.5) },
    spacing: { step: spacingStep, driftAvgPx: 0 },
    summary: ratio >= 4.5 ? 'OK' : 'Issues detected',
  };
  const reportsDir = `${outRoot}/reports`;
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(`${reportsDir}/drift.json`, JSON.stringify(report, null, 2));
}
```

### 1.12 `apps/aidesigner-poc/src/cli.ts`

```ts
#!/usr/bin/env node
import { runUrlAnalysis } from './run-url-analysis';
import { buildReact } from './build-react-page';
import { generateDriftReport } from './generate-reports';

const url = process.argv[2];
if (!url) {
  console.error('Usage: aidesigner-poc <url>');
  process.exit(1);
}

(async () => {
  const outRoot = `./out/${Date.now()}`;
  const { tokens, comps } = await runUrlAnalysis(url, outRoot);
  await buildReact(tokens, comps, outRoot);
  generateDriftReport(tokens, outRoot);
  console.log(`✅ Done. See ${outRoot}/evidence, ${outRoot}/generated, ${outRoot}/reports`);
})();
```

### 1.13 `apps/aidesigner-poc/README.md`

````md
# AiDesigner POC — URL → Tokens → Shadcn

## Prérequis

- Node 18+
- Chrome DevTools MCP server opérationnel + variables d’environnement pointant dessus

## Run

```bash
pnpm -w install
pnpm -w --filter aidesigner-poc dev https://stripe.com
```

Sorties:

- `out/<ts>/evidence/*` (snapshots DOM/CSS/console)
- `out/<ts>/data/tokens.json`, `components.map.json`
- `out/<ts>/generated/shadcn-app/src/app/page.tsx`
- `out/<ts>/reports/drift.json`

```

```

---

## 2) Templates de prompts — Nano Banana / Gemini (Design-Locked)

### 2.1 `prompts/nano-banana-design-locked.txt`

```
SYSTEM
You are an expert UI visual editor that performs pixel-accurate, constrained edits. Always respect the provided design tokens and constraints.

CONSTRAINTS (hard)
- Palette: {{tokens.primitives.color | json}}
- Typography: {{tokens.primitives.font | json}}
- Spacing steps: {{tokens.constraints.spacingStep}} px increments
- Min contrast ratio: {{tokens.constraints.contrastMin}}
- Grid: 12 columns, 4px baseline grid, gutter 24px
- Do not introduce colors, fonts, shadows, radii outside tokens.

GOAL
Generate N coherent UI concept(s) for: {{brief}}.
Respect the information architecture and component patterns: {{components.map | json}}.

OUTPUTS
1) Image(s) concept
2) TEXT FACTS (markdown):
   - Components detected (by type)
   - Hierarchy (H1/H2/body)
   - Primary actions, secondary actions
   - Token usage (color refs, spacing steps)
   - Violations (if any)
```

### 2.2 `prompts/gemini-2.5-design-locked.txt`

```
ROLE
You are a UI system designer that generates layouts strictly bound to given tokens and component contracts.

INPUTS
- tokens.json (hard constraints)
- components.map.json (component contracts)
- brief: {{brief}}

TASK
Produce: (1) structured UI description (JSON spec) aligned to tokens & components; (2) remedial suggestions for any constraint violations found.

JSON SPEC FORMAT (canonical)
{
  "page": {
    "title": "...",
    "layout": { "grid": {"columns": 12, "gap": 24} },
    "sections": [
      { "type": "hero", "spacingY": 32, "components": [ {"type":"Button","props":{"intent":"primary","size":"md"}} ] }
    ]
  }
}

VALIDATION
- Quantize all spacing to {{tokens.constraints.spacingStep}}px
- Ensure contrast >= {{tokens.constraints.contrastMin}}
- Use only semantic token refs
```

---

## 3) Registry de mapping (Shadcn/MUI) + 3 codemods

### 3.1 Codemod 1 — `apply-tokens-shadcn.ts`

```ts
// ts-node codemod: injecte classes/props cohérentes avec tokens (ex. radii/spacing via tailwind config)
import { Project, SyntaxKind } from 'ts-morph';

export async function run(pathGlob: string, tokensPath: string) {
  const project = new Project();
  project.addSourceFilesAtPaths(pathGlob);
  const tokens = require(tokensPath);

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
```

### 3.2 Codemod 2 — `replace-inline-styles.ts`

```ts
// Remplace styles inline (backgroundColor, color, borderRadius) par classes/props mappées aux tokens
import { Project, SyntaxKind } from 'ts-morph';

export async function run(glob: string, tokensPath: string) {
  const project = new Project();
  project.addSourceFilesAtPaths(glob);
  const tokens = require(tokensPath);

  const colorMap = {
    [tokens.primitives.color['brand/600']]: 'bg-brand-600',
    [tokens.primitives.color['base/bg']]: 'bg-background',
  };

  project.getSourceFiles().forEach((sf) => {
    sf.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.JsxAttribute) {
        const attr = node.asKind(SyntaxKind.JsxAttribute)!;
        if (attr.getName() === 'style') {
          // Simplifié: supprime style inline
          attr.remove();
        }
      }
    });
  });

  await project.save();
}
```

### 3.3 Codemod 3 — `mui-intent-size.ts`

```ts
// Convertit des props canoniques intent/size vers MUI color/size
import { Project, SyntaxKind } from 'ts-morph';

const intentToColor: Record<string, string> = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'error',
};
const sizeMap: Record<string, string> = { sm: 'small', md: 'medium', lg: 'large' };

export async function run(glob: string) {
  const project = new Project();
  project.addSourceFilesAtPaths(glob);

  project.getSourceFiles().forEach((sf) => {
    sf.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.JsxOpeningElement) {
        const el = node.asKind(SyntaxKind.JsxOpeningElement)!;
        if (el.getTagNameNode().getText() === 'Button') {
          const intent = el.getAttribute('intent');
          if (intent) {
            el.addAttribute({
              name: 'color',
              initializer: `"${intentToColor[(intent as any).getInitializer()?.getText()?.replace(/\"/g, '') || 'primary']}"`,
            });
            (intent as any).remove();
          }
          const size = el.getAttribute('size');
          if (size) {
            el.addAttribute({
              name: 'size',
              initializer: `"${sizeMap[(size as any).getInitializer()?.getText()?.replace(/\"/g, '') || 'md']}"`,
            });
            (size as any).remove();
          }
        }
      }
    });
  });
  await project.save();
}
```

---

## 4) Schémas JSON (canonical)

### 4.1 `packages/canonical-spec/schemas/tokens.schema.json`

```json
{
  "$id": "https://aidesigner.dev/schemas/tokens.v1.json",
  "type": "object",
  "properties": {
    "meta": { "type": "object" },
    "primitives": { "type": "object" },
    "semantic": { "type": "object" },
    "modes": { "type": "object" },
    "constraints": { "type": "object" }
  },
  "required": ["meta", "primitives", "semantic"]
}
```

### 4.2 `packages/canonical-spec/schemas/components-map.schema.json`

```json
{
  "$id": "https://aidesigner.dev/schemas/components-map.v1.json",
  "type": "object",
  "additionalProperties": {
    "type": "object",
    "properties": {
      "detect": { "type": "object" },
      "variants": { "type": "object" },
      "states": { "type": "array" },
      "a11y": { "type": "object" },
      "mappings": { "type": "object" }
    },
    "required": ["mappings"]
  }
}
```

---

## 5) Rapports

### 5.1 Format `reports/drift.json`

```json
{
  "contrast": { "fg": "#0A0A0A", "bg": "#FFFFFF", "ratio": 18.2, "ok": true },
  "spacing": { "step": 4, "driftAvgPx": 1.2 },
  "summary": "OK"
}
```

### 5.2 Evidence Pack (manifeste)

```json
{
  "screenshots": ["desktop-default.png", "mobile-default.png"],
  "cssDumps": ["cssom.json", "styles.computed.json"],
  "console": ["console.json"],
  "perf": ["trace.json"],
  "diffs": ["html.patch", "css.patch"]
}
```

---

## 6) Notes d’intégration & bonnes pratiques

- **MCP Chrome only**: centralise les appels dans `packages/mcp-inspector`. Tu pourras mapper aux noms des tools exposés par ton serveur (DOM snapshot, a11y tree, CSSOM, screenshots, console, performance trace).
- **Design-Locked**: toute génération (image/HTML/React) doit passer par `tokens.json` + validateurs (contrast/spacing/grid).
- **Registry extensible**: ajoute d’autres libs UI en créant des fichiers `.json` dans `packages/mappers/registry`.
- **Codemods**: exécutables via `ts-node` dans CI pour imposer la parité (intent/size, retirer styles inline, appliquer tokens).
- **Sécurité/IP**: si pages propriétaires, activer un mode “Legal-Safe” (pas d’export d’actifs, distillation de style abstraite, provenance des sources).

---

## 7) Prochaines extensions (faciles à brancher ensuite)

- **Overlay d’annotations à la Drawbridge** côté app → génère patches AST + `diffs/*.patch`.
- **Graphe interne** (Tokens⇄Components⇄Pages⇄Tests) pour impact analysis & journey checks.
- **Génération MUI en parallèle** (switch de target).
- **Prompts “describe UI Facts”** Nano Banana/Gemini pour croiser vision ↔ DOM.

---

**Fin du kit.** Copie-colle ces fichiers dans ton repo et branche `mcp-inspector` sur ton serveur MCP Chrome. Puis lance `apps/aidesigner-poc` sur une URL cible pour obtenir `tokens.json`, une page Shadcn basique, et les rapports.
````
