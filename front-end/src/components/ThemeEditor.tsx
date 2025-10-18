import { useState, useEffect } from 'react';
import {
  Palette,
  Undo2,
  Redo2,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useThemeStore } from '../stores/themeStore';
import { ensureValidHex } from '../lib/theme';
import { ThemeEditorChat } from './ThemeEditorChat';
import type { UITheme } from '../api/types';

interface ThemeEditorProps {
  onThemeChange?: (theme: UITheme) => void;
}

export function ThemeEditor({ onThemeChange }: ThemeEditorProps) {
  const {
    currentTheme,
    history,
    historyIndex,
    presets,
    isModified,
    setColor,
    applyPreset,
    generatePalette,
    generateDarkMode,
    undo,
    redo,
    reset,
    exportTheme,
  } = useThemeStore();

  const [baseColor, setBaseColor] = useState('#7c3aed');
  const [paletteStyle, setPaletteStyle] = useState('complementary');
  const [copied, setCopied] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Notify parent on every theme change
  useEffect(() => {
    onThemeChange?.(currentTheme);
  }, [currentTheme, onThemeChange]);

  const handleColorChange = (field: keyof typeof currentTheme, value: string) => {
    const sanitized = ensureValidHex(value, currentTheme[field] || '#000000');
    setColor(field, sanitized);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: show prompt dialog
      window.prompt('Copy to clipboard:', text);
    }
  };

  const handleExport = (format: 'css' | 'json' | 'tailwind') => {
    const exported = exportTheme(format);
    handleCopy(exported, format.toUpperCase());
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Theme Editor</h2>
            {isModified && (
              <Badge variant="secondary" className="text-xs">
                Modified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              title="Reset to default"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant={showChat ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowChat(!showChat)}
              title="AI Assistant"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4 mt-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Color Tokens</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary">Primary</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded border-2 border-border"
                        style={{ backgroundColor: currentTheme.primary }}
                      />
                      <Input
                        id="primary"
                        value={currentTheme.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#7c3aed"
                      />
                      <input
                        type="color"
                        value={currentTheme.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent">Accent</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded border-2 border-border"
                        style={{ backgroundColor: currentTheme.accent }}
                      />
                      <Input
                        id="accent"
                        value={currentTheme.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#ec4899"
                      />
                      <input
                        type="color"
                        value={currentTheme.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background">Background</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded border-2 border-border"
                        style={{ backgroundColor: currentTheme.background }}
                      />
                      <Input
                        id="background"
                        value={currentTheme.background}
                        onChange={(e) => handleColorChange('background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#0f172a"
                      />
                      <input
                        type="color"
                        value={currentTheme.background}
                        onChange={(e) => handleColorChange('background', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Export Theme</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-2"
                  >
                    {copied === 'JSON' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('css')}
                    className="flex items-center gap-2"
                  >
                    {copied === 'CSS' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    CSS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('tailwind')}
                    className="flex items-center gap-2"
                  >
                    {copied === 'TAILWIND' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Tailwind
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="presets" className="space-y-3 mt-4">
              {presets.map((preset) => (
                <Card
                  key={preset.id}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => applyPreset(preset.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{preset.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {preset.colors.primary && (
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                      )}
                      {preset.colors.accent && (
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                      )}
                      {preset.colors.background && (
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: preset.colors.background }}
                        />
                      )}
                    </div>
                  </div>
                  {preset.tags && (
                    <div className="flex flex-wrap gap-1">
                      {preset.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="generate" className="space-y-4 mt-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Generate Palette
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseColor">Base Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="baseColor"
                        value={baseColor}
                        onChange={(e) => setBaseColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#7c3aed"
                      />
                      <input
                        type="color"
                        value={baseColor}
                        onChange={(e) => setBaseColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paletteStyle">Palette Style</Label>
                    <Select value={paletteStyle} onValueChange={setPaletteStyle}>
                      <SelectTrigger id="paletteStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monochromatic">Monochromatic</SelectItem>
                        <SelectItem value="complementary">Complementary</SelectItem>
                        <SelectItem value="analogous">Analogous</SelectItem>
                        <SelectItem value="triadic">Triadic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      const safe = ensureValidHex(baseColor, currentTheme.primary);
                      generatePalette(safe, paletteStyle);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Palette
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={generateDarkMode}
                >
                  Generate Dark Mode Version
                </Button>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">History</h3>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {history.slice().reverse().map((entry, idx) => {
                  const actualIndex = history.length - 1 - idx;
                  const isActive = actualIndex === historyIndex;
                  return (
                    <div
                      key={entry.id}
                      className={`text-sm p-2 rounded ${
                        isActive
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="flex-1">{entry.action}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </ScrollArea>
      </div>
      {showChat && (
        <div className="w-96">
          <ThemeEditorChat />
        </div>
      )}
    </div>
  );
}
