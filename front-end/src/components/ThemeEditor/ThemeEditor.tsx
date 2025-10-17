import { useEffect } from 'react';
import { useThemeEditorStore } from '../../stores/themeEditorStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ThemeTab } from './tabs/ThemeTab';
import { ColorsTab } from './tabs/ColorsTab';
import { TypographyTab } from './tabs/TypographyTab';
import { OtherTab } from './tabs/OtherTab';
import { GenerateTab } from './tabs/GenerateTab';
import { ComponentGallery } from './preview/ComponentGallery';
import { Button } from '../ui/button';
import { Undo2, Redo2, RotateCcw, Save } from 'lucide-react';

export function ThemeEditor() {
  const {
    currentTheme,
    activeTab,
    setActiveTab,
    undo,
    redo,
    reset,
    historyIndex,
    history,
  } = useThemeEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;

    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    root.style.setProperty('--font-sans', currentTheme.typography.fontFamily.sans.join(', '));
    root.style.setProperty('--font-serif', currentTheme.typography.fontFamily.serif.join(', '));
    root.style.setProperty('--font-mono', currentTheme.typography.fontFamily.mono.join(', '));
    root.style.setProperty('--font-size-base', currentTheme.typography.fontSize.base);

    Object.entries(currentTheme.borderRadius).forEach(([key, value]) => {
      const cssVarName = key === 'default' ? '--radius' : `--radius-${key}`;
      root.style.setProperty(cssVarName, value);
    });
  }, [currentTheme]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Theme Editor</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                title="Reset to default"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentTheme.name}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger
              value="theme"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Theme
            </TabsTrigger>
            <TabsTrigger
              value="colors"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Colors
            </TabsTrigger>
            <TabsTrigger
              value="typography"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Typography
            </TabsTrigger>
            <TabsTrigger
              value="other"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Other
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Generate
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="theme" className="mt-0 h-full p-4">
              <ThemeTab />
            </TabsContent>

            <TabsContent value="colors" className="mt-0 h-full p-4">
              <ColorsTab />
            </TabsContent>

            <TabsContent value="typography" className="mt-0 h-full p-4">
              <TypographyTab />
            </TabsContent>

            <TabsContent value="other" className="mt-0 h-full p-4">
              <OtherTab />
            </TabsContent>

            <TabsContent value="generate" className="mt-0 h-full p-4">
              <GenerateTab projectId={currentTheme.projectId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="h-full">
          <div className="border-b bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Component Preview</h3>
              <Button size="sm" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Theme
              </Button>
            </div>
          </div>
          <ComponentGallery />
        </div>
      </div>
    </div>
  );
}
