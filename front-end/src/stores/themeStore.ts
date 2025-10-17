import { create } from 'zustand';
import type { UITheme } from '../api/types';
import { hexToHSL, hslToHex, isValidHex } from '../../../common/utils/colorUtils';
import { DEFAULT_PRESETS } from '../../../common/constants/themePresets';
import type { ThemePreset as SharedThemePreset } from '../../../common/constants/themePresets';

export interface ColorToken {
  name: string;
  value: string;
  category: 'primary' | 'accent' | 'background' | 'semantic' | 'custom';
}

export type ThemePreset = SharedThemePreset;

export interface ThemeHistory {
  id: string;
  theme: UITheme;
  timestamp: number;
  action: string;
}

type PaletteStyle = 'monochromatic' | 'complementary' | 'analogous' | 'triadic';

interface ThemeState {
  currentTheme: UITheme;
  history: ThemeHistory[];
  historyIndex: number;
  presets: ThemePreset[];
  isModified: boolean;

  setColor: (field: keyof UITheme, value: string) => void;
  applyPreset: (presetId: string) => void;
  generatePalette: (baseColor: string, style: PaletteStyle) => void;
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

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: DEFAULT_THEME,
  history: [{ id: `init-${Date.now()}`, theme: DEFAULT_THEME, timestamp: Date.now(), action: 'Initial' }],
  historyIndex: 0,
  presets: DEFAULT_PRESETS,
  isModified: false,

  setColor: (field, value) => {
    const current = get().currentTheme;
    // Validate hex color and skip if unchanged
    if (!isValidHex(value)) {
      console.warn(`Invalid hex color: ${value}`);
      return;
    }
    if (current[field] === value) {
      return; // Skip if no change
    }

    const newTheme = { ...current, [field]: value };
    const history = get().history.slice(0, get().historyIndex + 1);
    const newHistory: ThemeHistory = {
      id: `${Date.now()}-${field}`,
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
    // Validate baseColor and fallback to current primary if invalid
    const theme = get().currentTheme;
    const safeBase = isValidHex(baseColor) ? baseColor : theme.primary;

    const hsl = hexToHSL(safeBase);
    let primary = safeBase;
    let accent = safeBase;
    let background = '#0f172a';

    if (style === 'monochromatic') {
      primary = safeBase;
      accent = hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 90));
      background = hslToHex(hsl.h, hsl.s * 0.3, 8);
    } else if (style === 'complementary') {
      primary = safeBase;
      accent = hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
      background = hslToHex(hsl.h, hsl.s * 0.5, 6);
    } else if (style === 'analogous') {
      primary = safeBase;
      accent = hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
      background = hslToHex((hsl.h - 30 + 360) % 360, hsl.s * 0.4, 7);
    } else if (style === 'triadic') {
      primary = safeBase;
      accent = hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
      background = hslToHex((hsl.h + 240) % 360, hsl.s * 0.3, 8);
    }

    const newTheme: UITheme = { primary, accent, background };
    const history = get().history.slice(0, get().historyIndex + 1);
    const newHistory: ThemeHistory = {
      id: `${Date.now()}-palette`,
      theme: newTheme,
      timestamp: Date.now(),
      action: `Generated ${style} palette from ${safeBase}`,
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
      history: [{ id: `reset-${Date.now()}`, theme: DEFAULT_THEME, timestamp: Date.now(), action: 'Reset' }],
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
