import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Palette, 
  Type, 
  Sparkles, 
  Moon, 
  Share2, 
  Download, 
  Zap,
  Check,
  Code,
  Eye,
  Layers,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

export function ThemeEditorShowcase() {
  const [activeDemo, setActiveDemo] = useState<string>('overview');

  const features = [
    {
      id: 'colors',
      icon: Palette,
      title: '24 Color Tokens',
      description: 'Complete color system with background, surfaces, brand, semantic, and chart colors',
      category: 'Core',
    },
    {
      id: 'typography',
      icon: Type,
      title: 'Typography System',
      description: 'Font families, weights, sizes, line heights, and letter spacing',
      category: 'Core',
    },
    {
      id: 'ai-colors',
      icon: Sparkles,
      title: 'AI Color Suggestions',
      description: '4 unique palettes generated from any base color with smart algorithms',
      category: 'AI',
    },
    {
      id: 'dark-mode',
      icon: Moon,
      title: 'Auto Dark Mode',
      description: 'Intelligently convert light themes to dark with one click',
      category: 'AI',
    },
    {
      id: 'marketplace',
      icon: Share2,
      title: 'Theme Marketplace',
      description: 'Browse, share, and download community themes',
      category: 'Community',
    },
    {
      id: 'export',
      icon: Download,
      title: 'Multi-Format Export',
      description: 'Export as CSS variables, JSON, or Tailwind config',
      category: 'Developer',
    },
    {
      id: 'live-preview',
      icon: Eye,
      title: 'Live Preview',
      description: '15+ components with real-time updates',
      category: 'Core',
    },
    {
      id: 'responsive',
      icon: Monitor,
      title: 'Responsive Testing',
      description: 'Mobile, tablet, desktop viewport switcher',
      category: 'Core',
    },
    {
      id: 'harmonies',
      icon: Layers,
      title: 'Color Harmonies',
      description: '6 harmony types: monochromatic, complementary, analogous, and more',
      category: 'Advanced',
    },
    {
      id: 'contrast',
      icon: Zap,
      title: 'WCAG Contrast Checker',
      description: 'Real-time accessibility validation with AA/AAA compliance',
      category: 'Accessibility',
    },
  ];

  const stats = [
    { label: 'Total Features', value: '50+', icon: Zap },
    { label: 'Components', value: '47', icon: Layers },
    { label: 'Color Tokens', value: '24', icon: Palette },
    { label: 'Presets', value: '6', icon: Code },
  ];

  const codeExamples = {
    install: `npm install @aidesigner/theme-editor`,
    usage: `import { ThemeEditor } from '@aidesigner/theme-editor';

function App() {
  return <ThemeEditor projectId="my-project" />;
}`,
    export: `// Export as CSS Variables
:root {
  --background: #ffffff;
  --foreground: #020817;
  --primary: #0f172a;
  /* ... 24 total tokens */
}

{
  "colors": {
    "background": "#ffffff",
    "foreground": "#020817",
    /* ... */
  }
}

module.exports = {
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#020817",
        /* ... */
      }
    }
  }
}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />
              Production Ready
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400">
              Theme Editor Pro
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Enterprise-grade design system management platform with AI-powered features,
              collaborative tools, and real-time preview
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="text-lg">
                <Eye className="w-5 h-5 mr-2" />
                View Live Demo
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                <Code className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <stat.icon className="w-8 h-8 text-primary" />
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage and scale your design system
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <feature.icon className="w-10 h-10 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {feature.category}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Interactive Demo Section */}
      <div className="bg-white dark:bg-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
            <p className="text-xl text-muted-foreground">
              Watch how easy it is to create beautiful themes
            </p>
          </div>

          <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="ai">AI Features</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Theme Editing Suite</CardTitle>
                  <CardDescription>
                    All-in-one platform for managing design tokens, colors, typography, and more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                    <div className="text-center p-8">
                      <Monitor className="w-24 h-24 mx-auto mb-4 text-primary" />
                      <p className="text-lg font-medium">Interactive Demo Coming Soon</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Navigate to http://localhost:5173 and click "Theme Editor" tab
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Color Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="h-20 rounded bg-slate-900" />
                    <div className="h-20 rounded bg-primary" />
                    <div className="h-20 rounded bg-secondary" />
                    <div className="h-20 rounded bg-accent" />
                  </div>
                  <ul className="space-y-2">
                    {[
                      '24 customizable color tokens',
                      'Real-time preview updates',
                      'WCAG contrast checking',
                      '6 harmony generation types',
                      'Random palette generator',
                      'Export to CSS/JSON/Tailwind',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <Sparkles className="w-8 h-8 text-primary mb-2" />
                    <CardTitle>AI Color Suggestions</CardTitle>
                    <CardDescription>
                      Generate 4 unique palettes from any base color
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Vibrant Energy palette</li>
                      <li>• Calm Professional palette</li>
                      <li>• Modern Minimal palette</li>
                      <li>• Dark Elegance palette</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Moon className="w-8 h-8 text-primary mb-2" />
                    <CardTitle>Auto Dark Mode</CardTitle>
                    <CardDescription>
                      One-click intelligent theme conversion
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Smart lightness inversion</li>
                      <li>• Contrast preservation</li>
                      <li>• Semantic color mapping</li>
                      <li>• Instant preview</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Typography System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Font Families</h3>
                    <p className="font-sans">Sans: Inter, Roboto, Open Sans</p>
                    <p className="font-serif">Serif: Georgia, Merriweather</p>
                    <p className="font-mono">Mono: Fira Code, JetBrains Mono</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Font Weights</h3>
                    <div className="flex gap-4">
                      <span className="font-normal">Normal 400</span>
                      <span className="font-medium">Medium 500</span>
                      <span className="font-semibold">Semibold 600</span>
                      <span className="font-bold">Bold 700</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Component Preview</CardTitle>
                  <CardDescription>
                    See changes in real-time across 15+ components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Button size="sm" className="w-full">
                      <Smartphone className="w-4 h-4 mr-1" />
                      Mobile
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Tablet className="w-4 h-4 mr-1" />
                      Tablet
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Monitor className="w-4 h-4 mr-1" />
                      Desktop
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>Components previewed:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Buttons',
                        'Cards',
                        'Inputs',
                        'Alerts',
                        'Badges',
                        'Forms',
                        'Typography',
                        'Tabs',
                        'Dropdowns',
                        'Dialogs',
                        'Accordion',
                        'Progress',
                      ].map((comp) => (
                        <div key={comp} className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Multi-Format Export</CardTitle>
                  <CardDescription>
                    Export your theme in the format you need
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="css" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="css">CSS</TabsTrigger>
                      <TabsTrigger value="json">JSON</TabsTrigger>
                      <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
                    </TabsList>
                    <TabsContent value="css">
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                        {`:root {
  --background: #ffffff;
  --foreground: #020817;
  --primary: #0f172a;
  --primary-foreground: #f8fafc;
  /* ... 20 more tokens */
}`}
                      </pre>
                    </TabsContent>
                    <TabsContent value="json">
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                        {`{
  "colors": {
    "background": "#ffffff",
    "foreground": "#020817",
    "primary": "#0f172a"
  }
}`}
                      </pre>
                    </TabsContent>
                    <TabsContent value="tailwind">
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                        {`module.exports = {
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#020817"
      }
    }
  }
}`}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Code Examples */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Easy Integration</h2>
          <p className="text-xl text-muted-foreground">
            Get started in minutes with simple installation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm">
                {codeExamples.install}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                {codeExamples.usage}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Design System?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start creating beautiful, accessible themes in minutes
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg">
              <Eye className="w-5 h-5 mr-2" />
              Try Live Demo
            </Button>
            <Button size="lg" variant="outline" className="text-lg bg-white/10 hover:bg-white/20 border-white/20">
              <Download className="w-5 h-5 mr-2" />
              Download Now
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">Theme Editor Pro</h3>
              <p className="text-sm">
                Enterprise-grade design system management platform
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>Color Management</li>
                <li>Typography System</li>
                <li>AI Features</li>
                <li>Theme Marketplace</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Examples</li>
                <li>GitHub</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>Contact Us</li>
                <li>Discord Community</li>
                <li>Issue Tracker</li>
                <li>Changelog</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm">
            <p>© 2025 AiDesigner. Built with React, TypeScript, and Tailwind CSS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
