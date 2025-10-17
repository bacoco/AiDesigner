import { useState } from 'react';
import { getColorHarmonies, type ColorHarmony } from '../../../lib/colorUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Copy, Check } from 'lucide-react';
import copy from 'copy-to-clipboard';

interface ColorHarmonyGeneratorProps {
  baseColor: string;
  onColorSelect?: (color: string) => void;
}

export function ColorHarmonyGenerator({ baseColor, onColorSelect }: ColorHarmonyGeneratorProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const harmonies = getColorHarmonies(baseColor);

  const handleCopyColor = (color: string) => {
    copy(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const renderHarmonyColors = (harmony: ColorHarmony) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {harmony.colors.map((color, idx) => (
          <div key={idx} className="space-y-1">
            <button
              onClick={() => onColorSelect?.(color)}
              className="w-full h-16 rounded-md border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
              style={{ backgroundColor: color }}
              title={`Click to use ${color}`}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">{color}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyColor(color);
                }}
                title="Copy color"
              >
                {copiedColor === color ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Color Harmonies</CardTitle>
        <CardDescription className="text-xs">
          Generate harmonious color schemes based on color theory
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monochromatic" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="monochromatic" className="text-xs">
              Mono
            </TabsTrigger>
            <TabsTrigger value="complementary" className="text-xs">
              Comp
            </TabsTrigger>
            <TabsTrigger value="analogous" className="text-xs">
              Analog
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="triadic" className="text-xs">
              Triadic
            </TabsTrigger>
            <TabsTrigger value="tetradic" className="text-xs">
              Tetradic
            </TabsTrigger>
            <TabsTrigger value="split" className="text-xs">
              Split
            </TabsTrigger>
          </TabsList>

          {harmonies.map((harmony) => (
            <TabsContent
              key={harmony.name.toLowerCase().replace(' ', '-')}
              value={harmony.name.toLowerCase().replace(' ', '-')}
              className="mt-0"
            >
              {renderHarmonyColors(harmony)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
