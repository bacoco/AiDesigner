import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { ColorPicker } from '../color/ColorPicker';
import { ContrastChecker } from '../color/ContrastChecker';
import { ColorHarmonyGenerator } from '../color/ColorHarmonyGenerator';
import { PaletteGenerator } from '../color/PaletteGenerator';
import { ColorSchemeExporter } from '../export/ColorSchemeExporter';
import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

export function ColorsTab() {
  const { currentTheme, updateColors } = useThemeEditorStore();
  const colors = currentTheme.colors;

  const handleColorChange = (key: keyof typeof colors, value: string) => {
    updateColors({ [key]: value });
  };

  const handlePaletteGenerate = (palette: Record<string, string>) => {
    updateColors(palette);
  };

  const handleImportScheme = (importedColors: Record<string, string>) => {
    updateColors(importedColors);
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      <Tabs defaultValue="tokens" className="h-full flex flex-col">
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="harmony">Harmony</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
        {/* Background & Surfaces */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Background & Surfaces</h3>
          <div className="space-y-4">
            <ColorPicker
              label="Background"
              value={colors.background}
              onChange={(value) => handleColorChange('background', value)}
              description="Main app background color"
            />
            <ColorPicker
              label="Foreground"
              value={colors.foreground}
              onChange={(value) => handleColorChange('foreground', value)}
              description="Default text color on background"
            />
            <ColorPicker
              label="Card"
              value={colors.card}
              onChange={(value) => handleColorChange('card', value)}
              description="Card background color"
            />
            <ColorPicker
              label="Card Foreground"
              value={colors.cardForeground}
              onChange={(value) => handleColorChange('cardForeground', value)}
              description="Text color on cards"
            />
            <ColorPicker
              label="Popover"
              value={colors.popover}
              onChange={(value) => handleColorChange('popover', value)}
              description="Popover and dropdown background"
            />
            <ColorPicker
              label="Popover Foreground"
              value={colors.popoverForeground}
              onChange={(value) => handleColorChange('popoverForeground', value)}
              description="Text color in popovers"
            />
          </div>
        </div>

        <Separator />

        {/* Brand Colors */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Brand Colors</h3>
          <div className="space-y-4">
            <ColorPicker
              label="Primary"
              value={colors.primary}
              onChange={(value) => handleColorChange('primary', value)}
              description="Primary brand color"
            />
            <ColorPicker
              label="Primary Foreground"
              value={colors.primaryForeground}
              onChange={(value) => handleColorChange('primaryForeground', value)}
              description="Text on primary color"
            />
            <ColorPicker
              label="Secondary"
              value={colors.secondary}
              onChange={(value) => handleColorChange('secondary', value)}
              description="Secondary brand color"
            />
            <ColorPicker
              label="Secondary Foreground"
              value={colors.secondaryForeground}
              onChange={(value) => handleColorChange('secondaryForeground', value)}
              description="Text on secondary color"
            />
            <ColorPicker
              label="Accent"
              value={colors.accent}
              onChange={(value) => handleColorChange('accent', value)}
              description="Accent color for highlights"
            />
            <ColorPicker
              label="Accent Foreground"
              value={colors.accentForeground}
              onChange={(value) => handleColorChange('accentForeground', value)}
              description="Text on accent color"
            />
          </div>
        </div>

        <Separator />

        {/* Semantic Colors */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Semantic Colors</h3>
          <div className="space-y-4">
            <ColorPicker
              label="Muted"
              value={colors.muted}
              onChange={(value) => handleColorChange('muted', value)}
              description="Muted/disabled background"
            />
            <ColorPicker
              label="Muted Foreground"
              value={colors.mutedForeground}
              onChange={(value) => handleColorChange('mutedForeground', value)}
              description="Muted/disabled text"
            />
            <ColorPicker
              label="Destructive"
              value={colors.destructive}
              onChange={(value) => handleColorChange('destructive', value)}
              description="Error and destructive actions"
            />
            <ColorPicker
              label="Destructive Foreground"
              value={colors.destructiveForeground}
              onChange={(value) => handleColorChange('destructiveForeground', value)}
              description="Text on destructive color"
            />
          </div>
        </div>

        <Separator />

        {/* Interactive Elements */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Interactive Elements</h3>
          <div className="space-y-4">
            <ColorPicker
              label="Border"
              value={colors.border}
              onChange={(value) => handleColorChange('border', value)}
              description="Default border color"
            />
            <ColorPicker
              label="Input"
              value={colors.input}
              onChange={(value) => handleColorChange('input', value)}
              description="Input border color"
            />
            <ColorPicker
              label="Ring"
              value={colors.ring}
              onChange={(value) => handleColorChange('ring', value)}
              description="Focus ring color"
            />
          </div>
        </div>

        <Separator />

        {/* Chart Colors */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Chart Colors</h3>
          <div className="space-y-4">
            <ColorPicker
              label="Chart 1"
              value={colors.chart1}
              onChange={(value) => handleColorChange('chart1', value)}
              description="First chart color"
            />
            <ColorPicker
              label="Chart 2"
              value={colors.chart2}
              onChange={(value) => handleColorChange('chart2', value)}
              description="Second chart color"
            />
            <ColorPicker
              label="Chart 3"
              value={colors.chart3}
              onChange={(value) => handleColorChange('chart3', value)}
              description="Third chart color"
            />
            <ColorPicker
              label="Chart 4"
              value={colors.chart4}
              onChange={(value) => handleColorChange('chart4', value)}
              description="Fourth chart color"
            />
            <ColorPicker
              label="Chart 5"
              value={colors.chart5}
              onChange={(value) => handleColorChange('chart5', value)}
              description="Fifth chart color"
            />
          </div>
        </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tools" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              <PaletteGenerator onPaletteGenerate={handlePaletteGenerate} />
              <ContrastChecker
                foreground={colors.primaryForeground}
                background={colors.primary}
                label="Primary Color Contrast"
              />
              <ContrastChecker
                foreground={colors.foreground}
                background={colors.background}
                label="Background Contrast"
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="harmony" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              <ColorHarmonyGenerator
                baseColor={colors.primary}
                onColorSelect={(color) => handleColorChange('primary', color)}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="export" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full pr-4">
            <ColorSchemeExporter
              colors={colors as unknown as Record<string, string>}
              onImport={handleImportScheme}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
