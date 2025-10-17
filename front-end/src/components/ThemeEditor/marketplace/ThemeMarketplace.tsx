import { useState, useEffect } from 'react';
import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { apiClient } from '../../../api/client';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Download, Share2, Search, Eye } from 'lucide-react';
import type { ThemeConfiguration } from '../../../types/theme';

interface ThemeMarketplaceProps {
  projectId: string;
}

export function ThemeMarketplace({ projectId }: ThemeMarketplaceProps) {
  const { setTheme, savedThemes, loadThemes } = useThemeEditorStore();
  const [publicThemes, setPublicThemes] = useState<ThemeConfiguration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfiguration | null>(null);

  useEffect(() => {
    loadThemes(projectId);
    loadPublicThemes();
  }, [projectId]);

  const loadPublicThemes = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.listPublicThemes();
      setPublicThemes(result.themes);
    } catch (error) {
      console.error('Failed to load public themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTheme = (theme: ThemeConfiguration) => {
    setTheme({
      ...theme,
      projectId,
      id: `imported-${Date.now()}`,
    });
  };

  const handleShareTheme = async (theme: ThemeConfiguration, isPublic: boolean) => {
    try {
      const result = await apiClient.shareTheme(projectId, theme.id, isPublic);
      if (result.shareUrl) {
        navigator.clipboard.writeText(result.shareUrl);
        alert(`Share URL copied to clipboard: ${result.shareUrl}`);
      }
      setShareDialogOpen(false);
    } catch (error) {
      console.error('Failed to share theme:', error);
      alert('Failed to share theme. Please try again.');
    }
  };

  const filterThemes = (themes: ThemeConfiguration[]) => {
    if (!searchQuery) return themes;
    const query = searchQuery.toLowerCase();
    return themes.filter(
      (theme) =>
        theme.name.toLowerCase().includes(query) ||
        theme.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  };

  const renderThemeCard = (theme: ThemeConfiguration, isPublic: boolean = false) => (
    <Card key={theme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{theme.name}</CardTitle>
            <CardDescription className="text-xs capitalize mt-1">
              {theme.mode} theme
            </CardDescription>
          </div>
          {isPublic && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>Public</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-6 gap-1">
          {Object.entries(theme.colors).slice(0, 6).map(([key, color]) => (
            <div
              key={key}
              className="h-8 rounded"
              style={{ backgroundColor: color }}
              title={key}
            />
          ))}
        </div>
        {theme.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {theme.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={() => handleApplyTheme(theme)}
          size="sm"
          className="flex-1"
        >
          <Download className="w-3 h-3 mr-1" />
          Apply
        </Button>
        {!isPublic && (
          <Button
            onClick={() => {
              setSelectedTheme(theme);
              setShareDialogOpen(true);
            }}
            size="sm"
            variant="outline"
          >
            <Share2 className="w-3 h-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search themes by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="saved" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="saved">My Themes</TabsTrigger>
          <TabsTrigger value="public">Public Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="flex-1 mt-4">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {savedThemes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No saved themes yet</p>
                <p className="text-xs mt-2">
                  Save your current theme to see it here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pr-4">
                {filterThemes(savedThemes).map((theme) => renderThemeCard(theme))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="public" className="flex-1 mt-4">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Loading public themes...</p>
              </div>
            ) : publicThemes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No public themes available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pr-4">
                {filterThemes(publicThemes).map((theme) => renderThemeCard(theme, true))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Theme</DialogTitle>
            <DialogDescription>
              Choose how you want to share &quot;{selectedTheme?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              onClick={() => selectedTheme && handleShareTheme(selectedTheme, true)}
              className="w-full"
            >
              Share Publicly
            </Button>
            <Button
              onClick={() => selectedTheme && handleShareTheme(selectedTheme, false)}
              variant="outline"
              className="w-full"
            >
              Get Private Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
