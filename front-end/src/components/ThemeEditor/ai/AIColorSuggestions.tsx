import { useState } from 'react';
import { apiClient } from '../../../api/client';
import type { ColorSuggestion } from '../../../api/client';
import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { colord } from 'colord';

export function AIColorSuggestions() {
  const { updateColors } = useThemeEditorStore();
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ColorSuggestion[]>([]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.generateColorSuggestions(baseColor);
      setSuggestions(result.suggestions || getMockSuggestions(baseColor));
    } catch (error) {
      console.warn('AI service unavailable, using local generation:', error);
      setSuggestions(getMockSuggestions(baseColor));
    } finally {
      setIsLoading(false);
    }
  };

  const getMockSuggestions = (base: string): ColorSuggestion[] => {
    const baseColord = colord(base);
    
    return [
      {
        name: 'Vibrant Energy',
        description: 'Bold and energetic with high contrast',
        colors: {
          primary: base,
          secondary: baseColord.rotate(30).saturate(0.2).toHex(),
          accent: baseColord.rotate(-60).saturate(0.3).toHex(),
          background: baseColord.lighten(0.45).desaturate(0.5).toHex(),
          foreground: baseColord.darken(0.4).toHex(),
        },
      },
      {
        name: 'Calm Professional',
        description: 'Subdued and professional palette',
        colors: {
          primary: baseColord.desaturate(0.2).toHex(),
          secondary: baseColord.desaturate(0.4).lighten(0.1).toHex(),
          accent: baseColord.rotate(180).desaturate(0.3).toHex(),
          background: baseColord.lighten(0.48).desaturate(0.6).toHex(),
          foreground: baseColord.darken(0.45).desaturate(0.3).toHex(),
        },
      },
      {
        name: 'Modern Minimal',
        description: 'Clean and minimal with subtle accents',
        colors: {
          primary: baseColord.desaturate(0.15).toHex(),
          secondary: baseColord.desaturate(0.5).lighten(0.2).toHex(),
          accent: baseColord.rotate(90).saturate(0.1).toHex(),
          background: '#ffffff',
          foreground: '#1a1a1a',
        },
      },
      {
        name: 'Dark Elegance',
        description: 'Sophisticated dark theme with rich colors',
        colors: {
          primary: baseColord.saturate(0.2).toHex(),
          secondary: baseColord.darken(0.2).desaturate(0.1).toHex(),
          accent: baseColord.rotate(45).saturate(0.3).toHex(),
          background: baseColord.darken(0.45).desaturate(0.6).toHex(),
          foreground: baseColord.lighten(0.45).desaturate(0.3).toHex(),
        },
      },
    ];
  };

  const applySuggestion = (suggestion: ColorSuggestion) => {
    updateColors({
      primary: suggestion.colors.primary,
      secondary: suggestion.colors.secondary,
      accent: suggestion.colors.accent,
      background: suggestion.colors.background,
      foreground: suggestion.colors.foreground,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Base Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            className="w-16 h-10 p-1"
          />
          <Input
            type="text"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            className="flex-1 font-mono"
            placeholder="#6366f1"
          />
        </div>
      </div>

      <Button
        onClick={generateSuggestions}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate AI Suggestions
          </>
        )}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3 pt-2">
          {suggestions.map((suggestion, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  {suggestion.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {suggestion.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(suggestion.colors).map(([key, color]) => (
                    <div key={key} className="space-y-1">
                      <div
                        className="h-10 rounded border"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                      <p className="text-[10px] text-center text-muted-foreground capitalize truncate">
                        {key}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => applySuggestion(suggestion)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Apply This Palette
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
