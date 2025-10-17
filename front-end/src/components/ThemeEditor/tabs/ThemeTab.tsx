import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import type { ThemeConfiguration } from '../../../types/theme';

const PRESET_THEMES: Partial<ThemeConfiguration>[] = [
  {
    name: 'Default Light',
    mode: 'light',
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
  },
  {
    name: 'Dark Blue',
    mode: 'dark',
    colors: {
      background: '#0a0e27',
      foreground: '#e0e7ff',
      card: '#12172e',
      cardForeground: '#e0e7ff',
      popover: '#12172e',
      popoverForeground: '#e0e7ff',
      primary: '#6366f1',
      primaryForeground: '#ffffff',
      secondary: '#1e293b',
      secondaryForeground: '#e0e7ff',
      muted: '#1e293b',
      mutedForeground: '#94a3b8',
      accent: '#3730a3',
      accentForeground: '#e0e7ff',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      border: '#1e293b',
      input: '#1e293b',
      ring: '#6366f1',
      chart1: '#6366f1',
      chart2: '#22d3ee',
      chart3: '#f59e0b',
      chart4: '#ef4444',
      chart5: '#a855f7',
    },
  },
  {
    name: 'Forest Green',
    mode: 'light',
    colors: {
      background: '#f0fdf4',
      foreground: '#14532d',
      card: '#ffffff',
      cardForeground: '#14532d',
      popover: '#ffffff',
      popoverForeground: '#14532d',
      primary: '#16a34a',
      primaryForeground: '#ffffff',
      secondary: '#dcfce7',
      secondaryForeground: '#14532d',
      muted: '#dcfce7',
      mutedForeground: '#15803d',
      accent: '#bbf7d0',
      accentForeground: '#14532d',
      destructive: '#dc2626',
      destructiveForeground: '#ffffff',
      border: '#bbf7d0',
      input: '#bbf7d0',
      ring: '#16a34a',
      chart1: '#16a34a',
      chart2: '#84cc16',
      chart3: '#eab308',
      chart4: '#f59e0b',
      chart5: '#06b6d4',
    },
  },
  {
    name: 'Purple Dream',
    mode: 'dark',
    colors: {
      background: '#1a0b2e',
      foreground: '#f3e8ff',
      card: '#2d1b4e',
      cardForeground: '#f3e8ff',
      popover: '#2d1b4e',
      popoverForeground: '#f3e8ff',
      primary: '#a855f7',
      primaryForeground: '#ffffff',
      secondary: '#3b1e5f',
      secondaryForeground: '#f3e8ff',
      muted: '#3b1e5f',
      mutedForeground: '#c4b5fd',
      accent: '#7c3aed',
      accentForeground: '#ffffff',
      destructive: '#f43f5e',
      destructiveForeground: '#ffffff',
      border: '#3b1e5f',
      input: '#3b1e5f',
      ring: '#a855f7',
      chart1: '#a855f7',
      chart2: '#ec4899',
      chart3: '#f59e0b',
      chart4: '#3b82f6',
      chart5: '#10b981',
    },
  },
  {
    name: 'Ocean Breeze',
    mode: 'light',
    colors: {
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      card: '#ffffff',
      cardForeground: '#0c4a6e',
      popover: '#ffffff',
      popoverForeground: '#0c4a6e',
      primary: '#0284c7',
      primaryForeground: '#ffffff',
      secondary: '#e0f2fe',
      secondaryForeground: '#0c4a6e',
      muted: '#e0f2fe',
      mutedForeground: '#0369a1',
      accent: '#bae6fd',
      accentForeground: '#0c4a6e',
      destructive: '#dc2626',
      destructiveForeground: '#ffffff',
      border: '#bae6fd',
      input: '#bae6fd',
      ring: '#0284c7',
      chart1: '#0284c7',
      chart2: '#06b6d4',
      chart3: '#14b8a6',
      chart4: '#10b981',
      chart5: '#84cc16',
    },
  },
  {
    name: 'Sunset',
    mode: 'dark',
    colors: {
      background: '#1c1917',
      foreground: '#fef3c7',
      card: '#292524',
      cardForeground: '#fef3c7',
      popover: '#292524',
      popoverForeground: '#fef3c7',
      primary: '#f97316',
      primaryForeground: '#ffffff',
      secondary: '#44403c',
      secondaryForeground: '#fef3c7',
      muted: '#44403c',
      mutedForeground: '#fde68a',
      accent: '#dc2626',
      accentForeground: '#ffffff',
      destructive: '#dc2626',
      destructiveForeground: '#ffffff',
      border: '#44403c',
      input: '#44403c',
      ring: '#f97316',
      chart1: '#f97316',
      chart2: '#ef4444',
      chart3: '#f59e0b',
      chart4: '#eab308',
      chart5: '#84cc16',
    },
  },
];

export function ThemeTab() {
  const { setTheme, currentTheme } = useThemeEditorStore();

  const handleApplyPreset = (preset: Partial<ThemeConfiguration>) => {
    const newTheme: ThemeConfiguration = {
      ...currentTheme,
      ...preset,
      id: currentTheme.id,
      projectId: currentTheme.projectId,
      version: currentTheme.version,
      createdAt: currentTheme.createdAt,
      updatedAt: new Date(),
      isDefault: false,
      tags: [...currentTheme.tags],
    };
    setTheme(newTheme);
  };

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-2">Current Theme</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {currentTheme.name} - {currentTheme.mode}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">Preset Themes</h3>
          <div className="grid grid-cols-1 gap-4">
            {PRESET_THEMES.map((preset, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{preset.name}</CardTitle>
                  <CardDescription className="text-xs capitalize">
                    {preset.mode} theme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-5 gap-1">
                    {preset.colors && (
                      <>
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: preset.colors.primary }}
                          title="Primary"
                        />
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: preset.colors.secondary }}
                          title="Secondary"
                        />
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: preset.colors.accent }}
                          title="Accent"
                        />
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: preset.colors.muted }}
                          title="Muted"
                        />
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: preset.colors.destructive }}
                          title="Destructive"
                        />
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => handleApplyPreset(preset)}
                    size="sm"
                    className="w-full"
                  >
                    Apply Theme
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
