import { create } from 'zustand';
import type { UITheme } from '../api/types';

export interface ColorToken {
  name: string;
  value: string;
  category: 'primary' | 'accent' | 'background' | 'semantic' | 'custom';
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: Partial<UITheme>;
  tags?: string[];
}

export interface ThemeHistory {
  id: string;
  theme: UITheme;
  timestamp: number;
  action: string;
}

interface ThemeState {
  currentTheme: UITheme;
  history: ThemeHistory[];
  historyIndex: number;
  presets: ThemePreset[];
  isModified: boolean;
  
  setColor: (field: keyof UITheme, value: string) => void;
  applyPreset: (presetId: string) => void;
  generatePalette: (baseColor: string, style: string) => void;
  generateDarkMode: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  setTheme: (theme: UITheme) => void;
  exportTheme: (format: 'css' | 'json' | 'tailwind') => string;
}

const DEFAULT_THEME: UITheme = {
  primary: '#7c3aed',
  accent: '#ec4899',
  background: '#0f172a',
};

const DEFAULT_PRESETS: ThemePreset[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool, calming ocean-inspired palette',
    colors: { primary: '#0077be', accent: '#00d4ff', background: '#001f3f' },
    tags: ['blue', 'professional', 'calm'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm, vibrant sunset colors',
    colors: { primary: '#ff6b35', accent: '#fdc830', background: '#1a0b2e' },
    tags: ['warm', 'vibrant', 'energetic'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural, earthy forest tones',
    colors: { primary: '#2d6a4f', accent: '#74c69d', background: '#081c15' },
    tags: ['green', 'natural', 'calm'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep, mysterious midnight blues',
    colors: { primary: '#6366f1', accent: '#a855f7', background: '#020617' },
    tags: ['purple', 'dark', 'modern'],
  },
  {
    id: 'coral',
    name: 'Coral Reef',
    description: 'Vibrant coral and teal combination',
    colors: { primary: '#ff6f61', accent: '#2ec4b6', background: '#011627' },
    tags: ['coral', 'teal', 'vibrant'],
  },
];

const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: DEFAULT_THEME,
  history: [{ id: '0', theme: DEFAULT_THEME, timestamp: Date.now(), action: 'Initial' }],
  historyIndex: 0,
  presets: DEFAULT_PRESETS,
  isModified: false,

  setColor: (field, value) => {
    const current = get().currentTheme;
    const newTheme = { ...current, [field]: value };
    const history = get().history.slice(0, get().historyIndex + 1);
    const newHistory: ThemeHistory = {
      id: Date.now().toString(),
      theme: newTheme,
      timestamp: Date.now(),
      action: `Set ${field} to ${value}`,
    };
    
    set({
      currentTheme: newTheme,
      history: [...history, newHistory],
      historyIndex: history.length,
      isModified: true,
    });
  },

  applyPreset: (presetId) => {
    const preset = get().presets.find(p => p.id === presetId);
    if (!preset) return;

    const current = get().currentTheme;
    const newTheme = { ...current, ...preset.colors };
    const history = get().history.slice(0, get().historyIndex + 1);
    const newHistory: ThemeHistory = {
      id: Date.now().toString(),
      theme: newTheme,
      timestamp: Date.now(),
      action: `Applied preset: ${preset.name}`,
    };
    
    set({
      currentTheme: newTheme,
      history: [...history, newHistory],
      historyIndex: history.length,
      isModified: true,
    });
  },

  generatePalette: (baseColor, style) => {
    const hsl = hexToHSL(baseColor);
    let primary = baseColor;
    let accent = baseColor;
    let background = '#0f172a';

    if (style === 'monochromatic') {
      primary = baseColor;
      accent = hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 90));
      background = hslToHex(hsl.h, hsl.s * 0.3, 8);
    } else if (style === 'complementary') {
      primary = baseColor;
      accent = hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
      background = hslToHex(hsl.h, hsl.s * 0.5, 6);
    } else if (style === 'analogous') {
      primary = baseColor;
      accent = hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
      background = hslToHex((hsl.h - 30 + 360) % 360, hsl.s * 0.4, 7);
    } else if (style === 'triadic') {
      primary = baseColor;
      accent = hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
      background = hslToHex((hsl.h + 240) % 360, hsl.s * 0.3, 8);
    }

    const newTheme: UITheme = { primary, accent, background };
    const history = get().history.slice(0, get().historyIndex + 1);
    const newHistory: ThemeHistory = {
      id: Date.now().toString(),
      theme: newTheme,
      timestamp: Date.now(),
      action: `Generated ${style} palette from ${baseColor}`,
    };
    
    set({
      currentTheme: newTheme,
      history: [...history, newHistory],
      historyIndex: history.length,
      isModified: true,
    });
  },

  generateDarkMode: () => {
    const current = get().currentTheme;
    const primaryHSL = hexToHSL(current.primary);
    const accentHSL = hexToHSL(current.accent);
    
    const newTheme: UITheme = {
      primary: hslToHex(primaryHSL.h, primaryHSL.s * 0.9, Math.max(primaryHSL.l - 10, 40)),
      accent: hslToHex(accentHSL.h, accentHSL.s * 0.85, Math.max(accentHSL.l - 5, 45)),
      background: '#020617',
    };
    
    const history = get().history.slice(0, get().historyIndex + 1);
    const newHistory: ThemeHistory = {
      id: Date.now().toString(),
      theme: newTheme,
      timestamp: Date.now(),
      action: 'Generated dark mode version',
    };
    
    set({
      currentTheme: newTheme,
      history: [...history, newHistory],
      historyIndex: history.length,
      isModified: true,
    });
  },

  undo: () => {
    const index = get().historyIndex;
    if (index > 0) {
      const newIndex = index - 1;
      set({
        currentTheme: get().history[newIndex].theme,
        historyIndex: newIndex,
        isModified: newIndex > 0,
      });
    }
  },

  redo: () => {
    const index = get().historyIndex;
    const history = get().history;
    if (index < history.length - 1) {
      const newIndex = index + 1;
      set({
        currentTheme: history[newIndex].theme,
        historyIndex: newIndex,
        isModified: true,
      });
    }
  },

  reset: () => {
    set({
      currentTheme: DEFAULT_THEME,
      history: [{ id: '0', theme: DEFAULT_THEME, timestamp: Date.now(), action: 'Reset' }],
      historyIndex: 0,
      isModified: false,
    });
  },

  setTheme: (theme) => {
    set({ currentTheme: theme, isModified: false });
  },

  exportTheme: (format) => {
    const theme = get().currentTheme;
    
    if (format === 'json') {
      return JSON.stringify(theme, null, 2);
    } else if (format === 'css') {
      return `:root {
  --theme-primary: ${theme.primary};
  --theme-accent: ${theme.accent};
  --theme-background: ${theme.background};
}`;
    } else if (format === 'tailwind') {
      return `module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${theme.primary}',
        accent: '${theme.accent}',
        background: '${theme.background}',
      },
    },
  },
};`;
    }
    
    return '';
  },
}));
