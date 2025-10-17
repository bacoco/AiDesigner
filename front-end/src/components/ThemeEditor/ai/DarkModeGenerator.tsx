import { useState } from 'react';
import { apiClient } from '../../../api/client';
import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Moon, Loader2, Check } from 'lucide-react';
import { colord } from 'colord';
import type { ThemeConfiguration } from '../../../types/theme';

export function DarkModeGenerator() {
  const { currentTheme, setTheme } = useThemeEditorStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [darkTheme, setDarkTheme] = useState<ThemeConfiguration | null>(null);

  const generateDarkMode = async () => {
    setIsGenerating(true);
    try {
      const result = await apiClient.generateDarkModeVariant(currentTheme);
      setDarkTheme(result.darkTheme);
    } catch (error) {
      console.warn('AI service unavailable, using local generation:', error);
      setDarkTheme(generateDarkModeLocally(currentTheme));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDarkModeLocally = (theme: ThemeConfiguration): ThemeConfiguration => {
    const colors = theme.colors;
    
    const invertLightness = (color: string) => {
      const c = colord(color);
      const hsl = c.toHsl();
      return colord({
        h: hsl.h,
        s: hsl.s,
        l: 100 - hsl.l,
      }).toHex();
    };

    const darkColors = {
      background: colord(colors.background).isDark() 
        ? colors.background 
        : invertLightness(colors.background),
      foreground: colord(colors.foreground).isDark()
        ? invertLightness(colors.foreground)
        : colors.foreground,
      card: colord(colors.card || colors.background).darken(0.05).toHex(),
      cardForeground: colord(colors.cardForeground || colors.foreground).lighten(0.1).toHex(),
      popover: colord(colors.popover || colors.background).darken(0.03).toHex(),
      popoverForeground: colord(colors.popoverForeground || colors.foreground).lighten(0.1).toHex(),
      primary: colors.primary,
      primaryForeground: colors.primaryForeground,
      secondary: colord(colors.secondary).darken(0.3).toHex(),
      secondaryForeground: colord(colors.secondaryForeground).lighten(0.3).toHex(),
      muted: colord(colors.muted).darken(0.35).toHex(),
      mutedForeground: colord(colors.mutedForeground).lighten(0.2).toHex(),
      accent: colord(colors.accent).darken(0.2).saturate(0.1).toHex(),
      accentForeground: colord(colors.accentForeground).lighten(0.3).toHex(),
      destructive: colors.destructive,
      destructiveForeground: colors.destructiveForeground,
      border: colord(colors.border).darken(0.4).toHex(),
      input: colord(colors.input).darken(0.4).toHex(),
      ring: colors.ring,
      chart1: colors.chart1,
      chart2: colors.chart2,
      chart3: colors.chart3,
      chart4: colors.chart4,
      chart5: colors.chart5,
    };

    return {
      ...theme,
      id: `${theme.id}-dark`,
      name: `${theme.name} (Dark)`,
      mode: 'dark',
      colors: darkColors,
      updatedAt: new Date(),
    };
  };

  const applyDarkTheme = () => {
    if (darkTheme) {
      setTheme(darkTheme);
      setDarkTheme(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="w-4 h-4" />
            Auto-Generate Dark Mode
          </CardTitle>
          <CardDescription className="text-xs">
            Automatically create a dark mode variant of your current theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Current theme: <span className="font-medium">{currentTheme.name}</span> ({currentTheme.mode})
          </div>
          
          <Button
            onClick={generateDarkMode}
            disabled={isGenerating || currentTheme.mode === 'dark'}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Dark Variant...
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" />
                Generate Dark Mode
              </>
            )}
          </Button>

          {currentTheme.mode === 'dark' && (
            <p className="text-xs text-muted-foreground">
              Current theme is already in dark mode
            </p>
          )}
        </CardContent>
      </Card>

      {darkTheme && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Dark Mode Generated
            </CardTitle>
            <CardDescription className="text-xs">
              {darkTheme.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-2">Color Preview:</p>
              <div className="grid grid-cols-6 gap-1">
                {Object.entries(darkTheme.colors).slice(0, 12).map(([key, color]) => (
                  <div key={key} className="space-y-1">
                    <div
                      className="h-8 rounded border"
                      style={{ backgroundColor: color }}
                      title={key}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                onClick={applyDarkTheme}
                className="w-full"
              >
                Apply Dark Theme
              </Button>
              <Button
                onClick={() => setDarkTheme(null)}
                variant="outline"
                className="w-full"
              >
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
