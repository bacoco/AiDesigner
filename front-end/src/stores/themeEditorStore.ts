import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  ThemeConfiguration,
  ThemeColors,
  ThemeTypography,
  ThemeTab,
  PreviewViewport,
} from '../types/theme';
import { apiClient } from '../api/client';

interface ThemeEditorState {
  currentTheme: ThemeConfiguration;
  activeTab: ThemeTab;
  previewMode: 'light' | 'dark';
  previewViewport: PreviewViewport;
  history: ThemeConfiguration[];
  historyIndex: number;
  isSaving: boolean;
  isExporting: boolean;
  savedThemes: ThemeConfiguration[];
  
  updateColors: (colors: Partial<ThemeColors>) => void;
  updateTypography: (typography: Partial<ThemeTypography>) => void;
  updateBorderRadius: (borderRadius: Partial<ThemeConfiguration['borderRadius']>) => void;
  updateSpacing: (spacing: Partial<ThemeConfiguration['spacing']>) => void;
  updateShadows: (shadows: Partial<ThemeConfiguration['shadows']>) => void;
  updateAnimations: (animations: Partial<ThemeConfiguration['animations']>) => void;
  setActiveTab: (tab: ThemeTab) => void;
  setPreviewMode: (mode: 'light' | 'dark') => void;
  setPreviewViewport: (viewport: PreviewViewport) => void;
  setTheme: (theme: ThemeConfiguration) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  saveTheme: (projectId: string) => Promise<void>;
  loadThemes: (projectId: string) => Promise<void>;
  deleteTheme: (projectId: string, themeId: string) => Promise<void>;
}

const defaultTheme: ThemeConfiguration = {
  id: 'default',
  projectId: '',
  name: 'Default Theme',
  version: '1.0.0',
  mode: 'light',
  baseTheme: 'default',
  colors: {
    background: '#ffffff',
    foreground: '#020817',
    card: '#ffffff',
    cardForeground: '#020817',
    popover: '#ffffff',
    popoverForeground: '#020817',
    primary: '#0f172a',
    primaryForeground: '#f8fafc',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ef4444',
    destructiveForeground: '#f8fafc',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#020817',
    chart1: '#3b82f6',
    chart2: '#10b981',
    chart3: '#f59e0b',
    chart4: '#ef4444',
    chart5: '#8b5cf6',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'serif'],
      mono: ['Fira Code', 'monospace'],
    },
    fontSize: {
      base: '16px',
      scale: 1.25,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },
  borderRadius: {
    default: '0.5rem',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  spacing: {
    base: '4px',
    scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96],
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    xxl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isDefault: true,
  tags: [],
};

/**
 * Prunes redo history and pushes a new history entry.
 * Removes all history entries after the current index before adding the new state.
 * This ensures the redo stack is cleared when new changes are made after an undo.
 * Also enforces a maximum history size to prevent memory leaks.
 */
const pushHistoryEntry = (state: ThemeEditorState) => {
  const MAX_HISTORY_SIZE = 50;

  // Remove all redo history (more idiomatic with immer)
  state.history.splice(state.historyIndex + 1);

  // Add new history entry
  state.history.push({ ...state.currentTheme });

  // Limit history size
  if (state.history.length > MAX_HISTORY_SIZE) {
    const overflow = state.history.length - MAX_HISTORY_SIZE;
    state.history.splice(0, overflow);
  }

  state.historyIndex = state.history.length - 1;
};

export const useThemeEditorStore = create<ThemeEditorState>()(
  immer((set, get) => ({
    currentTheme: defaultTheme,
    activeTab: 'colors',
    previewMode: 'light',
    previewViewport: 'desktop',
    history: [defaultTheme],
    historyIndex: 0,
    isSaving: false,
    isExporting: false,
    savedThemes: [],

    updateColors: (colors) =>
      set((state) => {
        state.currentTheme.colors = { ...state.currentTheme.colors, ...colors };
        state.currentTheme.updatedAt = new Date();
        pushHistoryEntry(state);
      }),

    updateTypography: (typography) =>
      set((state) => {
        state.currentTheme.typography = { ...state.currentTheme.typography, ...typography };
        state.currentTheme.updatedAt = new Date();
        pushHistoryEntry(state);
      }),

    updateBorderRadius: (borderRadius) =>
      set((state) => {
        state.currentTheme.borderRadius = { ...state.currentTheme.borderRadius, ...borderRadius };
        state.currentTheme.updatedAt = new Date();
        pushHistoryEntry(state);
      }),

    updateSpacing: (spacing) =>
      set((state) => {
        state.currentTheme.spacing = { ...state.currentTheme.spacing, ...spacing };
        state.currentTheme.updatedAt = new Date();
        pushHistoryEntry(state);
      }),

    updateShadows: (shadows) =>
      set((state) => {
        state.currentTheme.shadows = { ...state.currentTheme.shadows, ...shadows };
        state.currentTheme.updatedAt = new Date();
        pushHistoryEntry(state);
      }),

    updateAnimations: (animations) =>
      set((state) => {
        state.currentTheme.animations = { ...state.currentTheme.animations, ...animations };
        state.currentTheme.updatedAt = new Date();
        pushHistoryEntry(state);
      }),

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    setPreviewMode: (mode) =>
      set((state) => {
        state.previewMode = mode;
      }),

    setPreviewViewport: (viewport) =>
      set((state) => {
        state.previewViewport = viewport;
      }),

    setTheme: (theme) =>
      set((state) => {
        state.currentTheme = theme;
        state.history = [theme];
        state.historyIndex = 0;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.currentTheme = state.history[state.historyIndex];
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.currentTheme = state.history[state.historyIndex];
        }
      }),

    reset: () =>
      set((state) => {
        state.currentTheme = defaultTheme;
        state.history = [defaultTheme];
        state.historyIndex = 0;
      }),

    saveTheme: async (projectId: string) => {
      set((state) => {
        state.isSaving = true;
      });

      try {
        const theme = get().currentTheme;
        const result = await apiClient.saveThemeConfiguration(projectId, theme);
        
        set((state) => {
          state.currentTheme.id = result.id;
          state.isSaving = false;
        });
      } catch (error) {
        console.error('Failed to save theme:', error);
        set((state) => {
          state.isSaving = false;
        });
        throw error;
      }
    },

    loadThemes: async (projectId: string) => {
      try {
        const result = await apiClient.listThemeConfigurations(projectId);
        set((state) => {
          state.savedThemes = result.themes;
        });
      } catch (error) {
        console.error('Failed to load themes:', error);
        throw error;
      }
    },

    deleteTheme: async (projectId: string, themeId: string) => {
      try {
        await apiClient.deleteThemeConfiguration(projectId, themeId);
        set((state) => {
          state.savedThemes = state.savedThemes.filter(t => t.id !== themeId);
        });
      } catch (error) {
        console.error('Failed to delete theme:', error);
        throw error;
      }
    },
  }))
);
