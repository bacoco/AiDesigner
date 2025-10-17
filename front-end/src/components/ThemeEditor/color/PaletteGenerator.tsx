import { useState } from 'react';
import { generatePalette, generateShades, randomColor } from '../../../lib/colorUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Shuffle, Wand2 } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

interface PaletteGeneratorProps {
  onPaletteGenerate?: (palette: Record<string, string>) => void;
}

export function PaletteGenerator({ onPaletteGenerate }: PaletteGeneratorProps) {
  const [baseColor, setBaseColor] = useState('#7c3aed');
  const [generatedPalette, setGeneratedPalette] = useState<Record<string, string> | null>(null);

  const handleGenerateRandom = () => {
    const newBaseColor = randomColor();
    setBaseColor(newBaseColor);
    const palette = generatePalette(newBaseColor);
    setGeneratedPalette(palette);
  };

  const handleGenerateFromBase = () => {
    const palette = generatePalette(baseColor);
    setGeneratedPalette(palette);
  };

  const handleApplyPalette = () => {
    if (generatedPalette) {
      onPaletteGenerate?.(generatedPalette);
    }
  };

  const renderShades = (color: string) => {
    const shades = generateShades(color, 5);
    return (
      <div className="flex gap-1">
        {shades.map((shade, idx) => (
          <div
            key={idx}
            className="flex-1 h-8 rounded"
            style={{ backgroundColor: shade }}
            title={shade}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Palette Generator</CardTitle>
        <CardDescription className="text-xs">
          Auto-generate harmonious color palettes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Color Picker */}
        <ColorPicker
          label="Base Color"
          value={baseColor}
          onChange={setBaseColor}
          description="Starting point for palette generation"
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFromBase}
            className="flex-1"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRandom}
            className="flex-1"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Random
          </Button>
        </div>

        {/* Generated Palette Preview */}
        {generatedPalette && (
          <div className="space-y-3 p-3 bg-slate-900/50 rounded-md">
            <div className="text-xs font-semibold text-muted-foreground">
              Generated Palette
            </div>

            {/* Primary */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Primary</div>
              {renderShades(generatedPalette.primary)}
            </div>

            {/* Secondary */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Secondary</div>
              {renderShades(generatedPalette.secondary)}
            </div>

            {/* Accent */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Accent</div>
              {renderShades(generatedPalette.accent)}
            </div>

            {/* Apply Button */}
            <Button
              onClick={handleApplyPalette}
              className="w-full"
              size="sm"
            >
              Apply to Theme
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
