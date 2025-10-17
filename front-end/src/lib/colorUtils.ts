import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import lchPlugin from 'colord/plugins/lch';
import mixPlugin from 'colord/plugins/mix';

extend([a11yPlugin, lchPlugin, mixPlugin]);

export interface ColorHarmony {
  name: string;
  colors: string[];
}

export interface ContrastResult {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
}

export function getLuminance(color: string): number {
  return colord(color).luminance();
}

export function getContrastRatio(foreground: string, background: string): ContrastResult {
  const fg = colord(foreground);
  const bg = colord(background);
  const ratio = fg.contrast(bg);

  return {
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  };
}

export function lighten(color: string, amount: number): string {
  return colord(color).lighten(amount).toHex();
}

export function darken(color: string, amount: number): string {
  return colord(color).darken(amount).toHex();
}

export function saturate(color: string, amount: number): string {
  return colord(color).saturate(amount).toHex();
}

export function desaturate(color: string, amount: number): string {
  return colord(color).desaturate(amount).toHex();
}

export function rotate(color: string, degrees: number): string {
  return colord(color).rotate(degrees).toHex();
}

export function getComplementary(color: string): string {
  return rotate(color, 180);
}

export function getAnalogous(color: string): string[] {
  return [
    rotate(color, -30),
    color,
    rotate(color, 30),
  ];
}

export function getTriadic(color: string): string[] {
  return [
    color,
    rotate(color, 120),
    rotate(color, 240),
  ];
}

export function getTetradic(color: string): string[] {
  return [
    color,
    rotate(color, 90),
    rotate(color, 180),
    rotate(color, 270),
  ];
}

export function getSplitComplementary(color: string): string[] {
  return [
    color,
    rotate(color, 150),
    rotate(color, 210),
  ];
}

export function getMonochromatic(color: string, steps: number = 5): string[] {
  const baseColor = colord(color);
  const colors: string[] = [];
  
  for (let i = 0; i < steps; i++) {
    const factor = (i / (steps - 1)) * 0.8 - 0.4;
    if (factor < 0) {
      colors.push(baseColor.darken(Math.abs(factor)).toHex());
    } else {
      colors.push(baseColor.lighten(factor).toHex());
    }
  }
  
  return colors;
}

export function getColorHarmonies(color: string): ColorHarmony[] {
  return [
    {
      name: 'Monochromatic',
      colors: getMonochromatic(color, 5),
    },
    {
      name: 'Complementary',
      colors: [color, getComplementary(color)],
    },
    {
      name: 'Analogous',
      colors: getAnalogous(color),
    },
    {
      name: 'Triadic',
      colors: getTriadic(color),
    },
    {
      name: 'Tetradic',
      colors: getTetradic(color),
    },
    {
      name: 'Split Complementary',
      colors: getSplitComplementary(color),
    },
  ];
}

export function generateShades(color: string, count: number = 10): string[] {
  const shades: string[] = [];
  const baseColor = colord(color);
  
  for (let i = 0; i < count; i++) {
    const factor = i / (count - 1);
    if (factor < 0.5) {
      shades.push(baseColor.darken(0.5 - factor).toHex());
    } else {
      shades.push(baseColor.lighten((factor - 0.5) * 0.8).toHex());
    }
  }
  
  return shades;
}

export function generateTints(color: string, count: number = 5): string[] {
  const tints: string[] = [];
  const baseColor = colord(color);
  
  for (let i = 0; i < count; i++) {
    const mixAmount = (i / (count - 1)) * 100;
    tints.push(baseColor.mix('#ffffff', mixAmount / 100).toHex());
  }
  
  return tints;
}

export function generateTones(color: string, count: number = 5): string[] {
  const tones: string[] = [];
  const baseColor = colord(color);
  
  for (let i = 0; i < count; i++) {
    const mixAmount = (i / (count - 1)) * 50;
    tones.push(baseColor.mix('#808080', mixAmount / 100).toHex());
  }
  
  return tones;
}

export function findAccessibleForeground(background: string): string {
  const bg = colord(background);
  const isDark = bg.isDark();
  
  if (isDark) {
    return '#ffffff';
  } else {
    return '#000000';
  }
}

export function generateAccessiblePair(baseColor: string, targetRatio: number = 4.5): {
  foreground: string;
  background: string;
  ratio: number;
} {
  const base = colord(baseColor);
  let foreground: string;
  
  if (base.isDark()) {
    let amount = 0;
    foreground = base.lighten(amount).toHex();
    
    while (getContrastRatio(foreground, baseColor).ratio < targetRatio && amount < 1) {
      amount += 0.05;
      foreground = base.lighten(amount).toHex();
    }
  } else {
    let amount = 0;
    foreground = base.darken(amount).toHex();
    
    while (getContrastRatio(foreground, baseColor).ratio < targetRatio && amount < 1) {
      amount += 0.05;
      foreground = base.darken(amount).toHex();
    }
  }
  
  return {
    foreground,
    background: baseColor,
    ratio: getContrastRatio(foreground, baseColor).ratio,
  };
}

export interface ColorScheme {
  name: string;
  colors: Record<string, string>;
}

export function exportColorScheme(colors: Record<string, string>, name: string): ColorScheme {
  return {
    name,
    colors,
  };
}

export function importColorScheme(scheme: ColorScheme): Record<string, string> {
  return scheme.colors;
}

export function exportToCSS(colors: Record<string, string>): string {
  let css = ':root {\n';
  
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    css += `  ${cssVarName}: ${value};\n`;
  });
  
  css += '}\n';
  
  return css;
}

export function exportToJSON(colors: Record<string, string>): string {
  return JSON.stringify(colors, null, 2);
}

export function exportToTailwind(colors: Record<string, string>): string {
  let config = 'module.exports = {\n';
  config += '  theme: {\n';
  config += '    extend: {\n';
  config += '      colors: {\n';
  
  Object.entries(colors).forEach(([key, value]) => {
    const tailwindKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    config += `        '${tailwindKey}': '${value}',\n`;
  });
  
  config += '      },\n';
  config += '    },\n';
  config += '  },\n';
  config += '}\n';
  
  return config;
}

export function randomColor(): string {
  return colord({
    h: Math.random() * 360,
    s: Math.random() * 50 + 50,
    l: Math.random() * 30 + 35,
  }).toHex();
}

export function generatePalette(baseColor?: string): Record<string, string> {
  const primary = baseColor || randomColor();
  const primaryColor = colord(primary);
  
  const secondary = rotate(primary, 180);
  const accent = rotate(primary, 60);
  
  return {
    primary,
    primaryForeground: primaryColor.isDark() ? '#ffffff' : '#000000',
    secondary,
    secondaryForeground: colord(secondary).isDark() ? '#ffffff' : '#000000',
    accent,
    accentForeground: colord(accent).isDark() ? '#ffffff' : '#000000',
  };
}
