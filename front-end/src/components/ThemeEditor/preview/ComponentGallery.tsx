import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Slider } from '../../ui/slider';
import { Switch } from '../../ui/switch';
import { Checkbox } from '../../ui/checkbox';
import { Progress } from '../../ui/progress';
import { Info, CheckCircle2, XCircle, Monitor, Tablet, Smartphone, ChevronDown, Settings, User, LogOut } from 'lucide-react';
import { Label } from '../../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Separator } from '../../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';

export function ComponentGallery() {
  const { previewViewport, setPreviewViewport } = useThemeEditorStore();

  const getViewportWidth = () => {
    switch (previewViewport) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  return (
    <div className="space-y-4">
      {/* Viewport Switcher */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Component Preview</h3>
        <div className="flex gap-2">
          <Button
            variant={previewViewport === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewViewport('mobile')}
          >
            <Smartphone className="w-4 h-4" />
          </Button>
          <Button
            variant={previewViewport === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewViewport('tablet')}
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={previewViewport === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewViewport('desktop')}
          >
            <Monitor className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex justify-center p-6 bg-muted/20">
        <div
          className="w-full transition-all duration-300"
          style={{ maxWidth: getViewportWidth() }}
        >
          <div className="space-y-8 bg-background p-6 rounded-lg border">
      {/* Buttons */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      {/* Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">This is the card content area with some sample text.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Action</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
              <CardDescription>With different content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress</span>
                  <span className="text-sm text-muted-foreground">75%</span>
                </div>
                <Progress value={75} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inputs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Inputs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabled">Disabled</Label>
            <Input id="disabled" disabled placeholder="Disabled input" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Alerts</h3>
        <div className="space-y-3 max-w-xl">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is an informational alert with some helpful text.
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your action was completed successfully.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </div>

      {/* Form Controls */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Form Controls</h3>
        <div className="space-y-6 max-w-md">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Accept terms and conditions
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
          </div>

          <div className="space-y-2">
            <Label>Volume</Label>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>

          <div className="space-y-2">
            <Label>Progress</Label>
            <Progress value={66} />
          </div>
        </div>
      </div>
            
      {/* Typography Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Typography</h3>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Heading 1</h1>
          <h2 className="text-3xl font-semibold">Heading 2</h2>
          <h3 className="text-2xl font-semibold">Heading 3</h3>
          <h4 className="text-xl font-medium">Heading 4</h4>
          <p className="text-base">
            Body text with normal weight. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-sm text-muted-foreground">
            Small text in muted color for secondary information.
          </p>
        </div>
      </div>

      <Separator />

      {/* Interactive Tabs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Tabs</h3>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="mt-4">
            <p className="text-sm">Content for Tab 1</p>
          </TabsContent>
          <TabsContent value="tab2" className="mt-4">
            <p className="text-sm">Content for Tab 2</p>
          </TabsContent>
          <TabsContent value="tab3" className="mt-4">
            <p className="text-sm">Content for Tab 3</p>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Dropdown Menus */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dropdown Menu</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Open Menu
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Dialog */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dialog</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Accordion */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Accordion</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is this component?</AccordionTrigger>
            <AccordionContent>
              This is an accordion component that allows you to show and hide content.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I use it?</AccordionTrigger>
            <AccordionContent>
              Click on the trigger to expand or collapse the content section.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can I customize it?</AccordionTrigger>
            <AccordionContent>
              Yes! All components can be customized using the theme editor.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
