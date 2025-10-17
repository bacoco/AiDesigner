import { useState } from 'react';
import {
  exportColorScheme,
  exportToCSS,
  exportToTailwind,
} from '../../../lib/colorUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Textarea } from '../../ui/textarea';
import { Download, Upload, Copy, Check } from 'lucide-react';
import copy from 'copy-to-clipboard';

interface ColorSchemeExporterProps {
  colors: Record<string, string>;
  onImport?: (colors: Record<string, string>) => void;
}

export function ColorSchemeExporter({ colors, onImport }: ColorSchemeExporterProps) {
  const [schemeName, setSchemeName] = useState('Custom Theme');
  const [importData, setImportData] = useState('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'css' | 'json' | 'tailwind'>('css');

  const handleCopy = (text: string, format: string) => {
    copy(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const scheme = exportColorScheme(colors, schemeName);
    let content = '';
    let filename = '';

    switch (exportFormat) {
      case 'css':
        content = exportToCSS(colors);
        filename = `${schemeName.toLowerCase().replace(/\s+/g, '-')}.css`;
        break;
      case 'json':
        content = JSON.stringify(scheme, null, 2);
        filename = `${schemeName.toLowerCase().replace(/\s+/g, '-')}.json`;
        break;
      case 'tailwind':
        content = exportToTailwind(colors);
        filename = 'tailwind.config.js';
        break;
    }

    handleDownload(content, filename);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData);
      
      if (parsed.colors && typeof parsed.colors === 'object') {
        onImport?.(parsed.colors);
      } else if (typeof parsed === 'object') {
        onImport?.(parsed);
      }
      
      setImportData('');
    } catch {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  const cssOutput = exportToCSS(colors);
  const jsonOutput = JSON.stringify(exportColorScheme(colors, schemeName), null, 2);
  const tailwindOutput = exportToTailwind(colors);

  return (
    <Card className="border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Import / Export</CardTitle>
        <CardDescription className="text-xs">
          Save and share your color schemes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="scheme-name">Scheme Name</Label>
              <Input
                id="scheme-name"
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                placeholder="My Custom Theme"
              />
            </div>

            <div className="space-y-2">
              <Label>Export Format</Label>
              <Tabs value={exportFormat} onValueChange={(v) => setExportFormat(v as 'css' | 'json' | 'tailwind')}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
                </TabsList>

                <TabsContent value="css" className="mt-3">
                  <div className="space-y-2">
                    <Textarea
                      value={cssOutput}
                      readOnly
                      className="font-mono text-xs h-40"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(cssOutput, 'css')}
                        className="flex-1"
                      >
                        {copiedFormat === 'css' ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="json" className="mt-3">
                  <div className="space-y-2">
                    <Textarea
                      value={jsonOutput}
                      readOnly
                      className="font-mono text-xs h-40"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(jsonOutput, 'json')}
                        className="flex-1"
                      >
                        {copiedFormat === 'json' ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tailwind" className="mt-3">
                  <div className="space-y-2">
                    <Textarea
                      value={tailwindOutput}
                      readOnly
                      className="font-mono text-xs h-40"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(tailwindOutput, 'tailwind')}
                        className="flex-1"
                      >
                        {copiedFormat === 'tailwind' ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Paste JSON Color Scheme</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder='{"colors": {"primary": "#7c3aed", ...}}'
                className="font-mono text-xs h-40"
              />
            </div>
            <Button onClick={handleImport} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Import Scheme
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
