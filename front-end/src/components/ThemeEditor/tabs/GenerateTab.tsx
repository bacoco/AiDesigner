import { ScrollArea } from '../../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AIColorSuggestions } from '../ai/AIColorSuggestions';
import { DarkModeGenerator } from '../ai/DarkModeGenerator';
import { ThemeMarketplace } from '../marketplace/ThemeMarketplace';

interface GenerateTabProps {
  projectId?: string;
}

export function GenerateTab({ projectId = 'default' }: GenerateTabProps) {
  return (
    <Tabs defaultValue="ai" className="h-full flex flex-col">
      <TabsList className="grid grid-cols-3 w-full mb-4">
        <TabsTrigger value="ai">AI Colors</TabsTrigger>
        <TabsTrigger value="darkmode">Dark Mode</TabsTrigger>
        <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
      </TabsList>

      <TabsContent value="ai" className="flex-1">
        <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
          <AIColorSuggestions />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="darkmode" className="flex-1">
        <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
          <DarkModeGenerator />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="marketplace" className="flex-1">
        <ThemeMarketplace projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}
