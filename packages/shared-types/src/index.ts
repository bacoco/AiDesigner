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
