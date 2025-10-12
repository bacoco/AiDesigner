import type { InspectionArtifacts, StyleRuleSummary, Tokens } from '@aidesigner/shared-types';

type ColorStat = {
  value: string;
  count: number;
  luminance: number;
  saturation: number;
};

// Default color palette for pages with no discoverable colors
const DEFAULT_PALETTE = {
  background: '#FFFFFF',
  foreground: '#000000',
  brand: '#0070F3',
  muted: '#666666',
};

// Default font stack for pages with no discoverable fonts
const DEFAULT_FONT = {
  family: 'system-ui, -apple-system, sans-serif',
  weights: [400, 700],
};

// Color inference constants
const BACKGROUND_LUMINANCE_PRIMARY = 0.45;
const BACKGROUND_LUMINANCE_FALLBACK = 0.3;
const COLOR_SIMILARITY_THRESHOLD = 15; // RGB distance for "approximately equal"
const MUTED_BLEND_AMOUNT = 0.35;

export function inferTokens(artifacts: InspectionArtifacts): Tokens {
  const now = artifacts.fetchedAt ?? new Date().toISOString();

  const colorStats = extractColorStats(artifacts.computedStyles);
  const palette = colorStats.length > 0 ? resolvePalette(colorStats) : DEFAULT_PALETTE;

  const spacing = buildSpacingScale(artifacts.computedStyles);
  const fonts = buildFontMap(artifacts.computedStyles, artifacts.domSnapshot.html);
  const radii = buildRadiusScale(artifacts.computedStyles);

  const colorTokens: Record<string, string> = {
    'base/fg': palette.foreground,
    'base/bg': palette.background,
    'brand/600': palette.brand,
    'muted/500': palette.muted,
  };

  const spaceTokens: Record<string, number> = {};
  const labels = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  spacing.values.forEach((value, index) => {
    if (index < labels.length) {
      spaceTokens[labels[index]] = value;
    }
  });

  const fontTokens = fonts;

  return {
    meta: { source: 'url', url: artifacts.url, capturedAt: now },
    primitives: {
      color: colorTokens,
      space: spaceTokens,
      font: fontTokens,
      ...(radii.values ? { radius: radii.values } : {}),
    },
    semantic: {
      'text/primary': { ref: 'color.base/fg' },
      'surface/default': { ref: 'color.base/bg' },
      'button/primary/bg': { ref: 'color.brand/600' },
      'text/subtle': { ref: 'color.muted/500', fallback: 'color.base/fg' },
    },
    constraints: {
      spacingStep: spacing.step,
      borderRadiusStep: radii.step,
      contrastMin: 4.5,
    },
  };
}

function extractColorStats(rules: StyleRuleSummary[]): ColorStat[] {
  const candidates = new Map<string, ColorStat>();
  const colorProperties = new Set([
    'color',
    'background',
    'background-color',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'fill',
    'stroke',
  ]);

  for (const rule of rules) {
    for (const [property, rawValue] of Object.entries(rule.declarations)) {
      if (!colorProperties.has(property)) {
        continue;
      }
      // Extract color literals using regex to properly handle rgb()/rgba()/hsl()/hsla()
      const colorMatches =
        rawValue.match(/#(?:[0-9a-f]{3}){1,2}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi) ?? [];
      for (const value of colorMatches) {
        const parsed = parseColor(value.trim());
        if (!parsed) {
          continue;
        }
        const stat = candidates.get(parsed) ?? {
          value: parsed,
          count: 0,
          luminance: calculateLuminance(parsed),
          saturation: calculateSaturation(parsed),
        };
        stat.count += 1;
        candidates.set(parsed, stat);
      }
    }
  }

  return Array.from(candidates.values()).sort((a, b) => b.count - a.count);
}

function resolvePalette(stats: ColorStat[]): {
  background: string;
  foreground: string;
  brand: string;
  muted: string;
} {
  const sorted = [...stats];
  const background =
    sorted.find((color) => color.luminance >= BACKGROUND_LUMINANCE_PRIMARY) ??
    sorted.find((color) => color.luminance >= BACKGROUND_LUMINANCE_FALLBACK) ??
    sorted[0];
  if (!background) {
    throw new Error('Unable to determine background color from captured styles.');
  }

  const remaining = sorted.filter((color) => color.value !== background.value);
  const foregroundCandidate = remaining
    .map((color) => ({ color, contrast: contrastRatioHex(color.value, background.value) }))
    .sort((a, b) => b.contrast - a.contrast)[0]?.color;

  const foreground = foregroundCandidate?.value ?? invertColor(background.value);

  const brandCandidate = remaining
    .filter((candidate) => !approximatelyEqual(candidate.value, foreground))
    .sort((a, b) => b.saturation - a.saturation || b.count - a.count)[0];

  const brand = brandCandidate?.value ?? foreground;

  const mutedCandidate = remaining
    .filter((candidate) => candidate.value !== brand)
    .sort((a, b) => Math.abs(a.luminance - background.luminance) - Math.abs(b.luminance - background.luminance))[0];

  const muted = mutedCandidate?.value ?? blendColors(background.value, foreground, MUTED_BLEND_AMOUNT);

  return { background: background.value, foreground, brand, muted };
}

function buildSpacingScale(rules: StyleRuleSummary[]): { values: number[]; step?: number } {
  const spacingValues = new Set<number>();
  for (const rule of rules) {
    for (const [property, value] of Object.entries(rule.declarations)) {
      if (!isSpacingProperty(property)) {
        continue;
      }
      for (const candidate of extractNumericValues(value)) {
        spacingValues.add(candidate);
      }
    }
  }

  const sorted = Array.from(spacingValues).filter((value) => Number.isFinite(value) && value > 0);
  sorted.sort((a, b) => a - b);
  const step = deriveStep(sorted);
  return { values: sorted, step };
}

function buildRadiusScale(rules: StyleRuleSummary[]): { values?: Record<string, number>; step?: number } {
  const radii = new Set<number>();
  for (const rule of rules) {
    for (const [property, value] of Object.entries(rule.declarations)) {
      if (!property.startsWith('border') || !property.endsWith('radius')) {
        continue;
      }
      for (const candidate of extractNumericValues(value)) {
        radii.add(candidate);
      }
    }
  }

  if (radii.size === 0) {
    return { values: undefined, step: undefined };
  }

  const sorted = Array.from(radii).filter((value) => Number.isFinite(value) && value > 0);
  sorted.sort((a, b) => a - b);
  const labels = ['sm', 'md', 'lg', 'xl'];
  const values: Record<string, number> = {};
  sorted.slice(0, labels.length).forEach((radius, index) => {
    values[labels[index]] = radius;
  });
  const step = deriveStep(sorted);
  return { values, step };
}

function buildFontMap(rules: StyleRuleSummary[], html: string): Record<string, { family: string; weights: number[]; letterSpacing?: number }> {
  const families = new Map<string, { weights: Set<number>; letterSpacing?: number }>();

  const inlineFontRegex = /font-family\s*:\s*([^;"']+)/gi;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = inlineFontRegex.exec(html))) {
    const family = normalizeFontFamily(inlineMatch[1]);
    if (family) {
      const entry = families.get(family) ?? { weights: new Set<number>() };
      families.set(family, entry);
    }
  }

  for (const rule of rules) {
    const declarations = rule.declarations;
    const ruleFamilies = new Set<string>();

    if (declarations['font']) {
      const shorthand = parseFontShorthand(declarations['font']);
      if (shorthand) {
        const entry = families.get(shorthand.family) ?? { weights: new Set<number>() };
        if (shorthand.weight) {
          entry.weights.add(shorthand.weight);
        }
        if (shorthand.letterSpacing !== undefined) {
          entry.letterSpacing = shorthand.letterSpacing;
        }
        families.set(shorthand.family, entry);
        ruleFamilies.add(shorthand.family);
      }
    }

    if (declarations['font-family']) {
      const family = normalizeFontFamily(declarations['font-family']);
      if (family) {
        const entry = families.get(family) ?? { weights: new Set<number>() };
        families.set(family, entry);
        ruleFamilies.add(family);
      }
    }

    if (declarations['font-weight']) {
      const numericWeight = Number.parseInt(declarations['font-weight'], 10);
      if (Number.isFinite(numericWeight)) {
        if (ruleFamilies.size === 0) {
          for (const entry of families.values()) {
            entry.weights.add(numericWeight);
          }
        } else {
          for (const family of ruleFamilies) {
            const entry = families.get(family);
            entry?.weights.add(numericWeight);
          }
        }
      }
    }

    if (declarations['letter-spacing']) {
      const numeric = Number.parseFloat(declarations['letter-spacing']);
      if (Number.isFinite(numeric)) {
        if (ruleFamilies.size === 0) {
          for (const entry of families.values()) {
            entry.letterSpacing = numeric;
          }
        } else {
          for (const family of ruleFamilies) {
            const entry = families.get(family);
            if (entry) {
              entry.letterSpacing = numeric;
            }
          }
        }
      }
    }
  }

  // Return default font stack if no families were discovered
  if (families.size === 0) {
    return {
      sans: {
        family: DEFAULT_FONT.family,
        weights: DEFAULT_FONT.weights,
      },
    };
  }

  const orderedFamilies = Array.from(families.keys());
  const primaryFamily = pickPrimaryFamily(orderedFamilies);
  const fontTokens: Record<string, { family: string; weights: number[]; letterSpacing?: number }> = {};

  fontTokens.sans = {
    family: primaryFamily,
    weights: Array.from(families.get(primaryFamily)?.weights ?? []).sort((a, b) => a - b),
    letterSpacing: families.get(primaryFamily)?.letterSpacing,
  };

  const remainingFamilies = orderedFamilies.filter((family) => family !== primaryFamily);
  if (remainingFamilies.length > 0) {
    const secondary = remainingFamilies[0];
    fontTokens.display = {
      family: secondary,
      weights: Array.from(families.get(secondary)?.weights ?? []).sort((a, b) => a - b),
      letterSpacing: families.get(secondary)?.letterSpacing,
    };
  }

  return fontTokens;
}

function pickPrimaryFamily(families: string[]): string {
  const preferredOrder = ['Inter', 'Roboto', 'Helvetica', 'Arial'];
  for (const preferred of preferredOrder) {
    const match = families.find((family) => family.toLowerCase().includes(preferred.toLowerCase()));
    if (match) {
      return match;
    }
  }
  return families[0];
}

function normalizeFontFamily(value: string): string | undefined {
  const first = value
    .split(',')[0]
    .trim()
    .replace(/^['"]|['"]$/g, '');
  return first || undefined;
}

function parseFontShorthand(value: string): { family: string; weight?: number; letterSpacing?: number } | undefined {
  const sizeMatch = value.match(/(?:^|\s)(\d*\.?\d+(?:px|rem|em|vh|vw|%))(?:\s*\/\s*[^\s]+)?\s*(.+)$/);
  const familySegment = sizeMatch ? sizeMatch[2] : undefined;
  const family = familySegment ? normalizeFontFamily(familySegment) : undefined;
  if (!family) {
    return undefined;
  }

  const parts = value.split(/\s+/);
  const weightPart = parts.find((part) => /^(100|200|300|400|500|600|700|800|900|bold|normal)$/i.test(part));
  let weight: number | undefined;
  if (weightPart) {
    weight = weightPart === 'bold' ? 700 : weightPart === 'normal' ? 400 : Number.parseInt(weightPart, 10);
  }

  return { family, weight };
}

function isSpacingProperty(property: string): boolean {
  return (
    property.startsWith('margin') ||
    property.startsWith('padding') ||
    property === 'gap' ||
    property === 'grid-gap' ||
    property === 'row-gap' ||
    property === 'column-gap' ||
    property === 'line-height'
  );
}

function extractNumericValues(value: string): number[] {
  const results: number[] = [];
  const regex = /(-?\d*\.?\d+)px/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value))) {
    const numeric = Number.parseFloat(match[1]);
    if (Number.isFinite(numeric)) {
      results.push(Number.parseFloat(numeric.toFixed(2)));
    }
  }
  return results;
}

function deriveStep(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  if (values.length === 1) {
    const step = Number.parseFloat(values[0].toFixed(2));
    return step > 0 ? step : undefined;
  }

  let step = values[0];
  for (const value of values.slice(1)) {
    step = gcd(step, value);
  }

  const result = Number.parseFloat(step.toFixed(2));
  // Ensure step is positive and finite to prevent division by zero
  return result > 0 && Number.isFinite(result) ? result : undefined;
}

function gcd(a: number, b: number): number {
  let x = Math.round(Math.abs(a) * 100);
  let y = Math.round(Math.abs(b) * 100);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x / 100;
}

function parseColor(value: string): string | undefined {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned || cleaned.startsWith('var(') || cleaned === 'transparent' || cleaned === 'inherit') {
    return undefined;
  }

  if (cleaned.startsWith('#')) {
    return normalizeHex(cleaned);
  }

  if (cleaned.startsWith('rgb')) {
    const rgbMatch = /rgba?\(([^)]+)\)/.exec(cleaned);
    if (!rgbMatch) {
      return undefined;
    }
    const channels = rgbMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (channels.length < 3 || channels.some((channel) => !Number.isFinite(channel))) {
      return undefined;
    }
    return rgbToHex(channels[0], channels[1], channels[2]);
  }

  if (cleaned.startsWith('hsl')) {
    const hslMatch = /hsla?\(([^)]+)\)/.exec(cleaned);
    if (!hslMatch) {
      return undefined;
    }
    const [h, s, l] = hslMatch[1].split(',').map((part) => part.trim());
    const hue = Number.parseFloat(h);
    const saturation = Number.parseFloat(s);
    const lightness = Number.parseFloat(l);
    if ([hue, saturation, lightness].some((component) => !Number.isFinite(component))) {
      return undefined;
    }
    const { r, g, b } = hslToRgb(hue, saturation / 100, lightness / 100);
    return rgbToHex(r, g, b);
  }

  return undefined;
}

function normalizeHex(value: string): string | undefined {
  const hex = value.replace('#', '');
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  if (hex.length === 6) {
    return `#${hex.toUpperCase()}`;
  }
  return undefined;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) => {
    const bounded = Math.max(0, Math.min(255, Math.round(channel)));
    return bounded.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function calculateLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function calculateSaturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) {
    return 0;
  }
  const l = (max + min) / 2 / 255;
  const s = (max - min) / 255 / (1 - Math.abs(2 * l - 1));
  return Number.isFinite(s) ? s : 0;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return { r: 0, g: 0, b: 0 };
  }
  const value = normalized.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function contrastRatioHex(foreground: string, background: string): number {
  const L1 = calculateLuminance(foreground);
  const L2 = calculateLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return Number.parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function invertColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

function blendColors(base: string, overlay: string, amount: number): string {
  const baseRgb = hexToRgb(base);
  const overlayRgb = hexToRgb(overlay);
  const mix = (from: number, to: number) => Math.round(from + (to - from) * amount);
  return rgbToHex(mix(baseRgb.r, overlayRgb.r), mix(baseRgb.g, overlayRgb.g), mix(baseRgb.b, overlayRgb.b));
}

function approximatelyEqual(hex: string, other: string): boolean {
  const a = hexToRgb(hex);
  const b = hexToRgb(other);
  const distance = Math.sqrt(Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2));
  return distance < COLOR_SIMILARITY_THRESHOLD;
}
