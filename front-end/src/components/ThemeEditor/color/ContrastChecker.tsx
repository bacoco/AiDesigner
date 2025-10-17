import { getContrastRatio } from '../../../lib/colorUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ContrastCheckerProps {
  foreground: string;
  background: string;
  label?: string;
}

export function ContrastChecker({ foreground, background, label }: ContrastCheckerProps) {
  const result = getContrastRatio(foreground, background);

  const getStatusIcon = (passed: boolean, warning?: boolean) => {
    if (passed) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (warning) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className="border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {label || 'Contrast Check'}
        </CardTitle>
        <CardDescription className="text-xs">
          WCAG Accessibility Guidelines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color Preview */}
        <div
          className="h-20 rounded-md flex items-center justify-center text-lg font-semibold"
          style={{ backgroundColor: background, color: foreground }}
        >
          Aa
        </div>

        {/* Contrast Ratio */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Contrast Ratio</span>
          <Badge variant="outline" className="text-base font-mono">
            {result.ratio.toFixed(2)}:1
          </Badge>
        </div>

        {/* WCAG Compliance Levels */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Normal Text
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {getStatusIcon(result.aa)}
              WCAG AA
            </span>
            <span className={result.aa ? 'text-green-500' : 'text-red-500'}>
              {result.aa ? 'Pass' : 'Fail'} (≥4.5:1)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {getStatusIcon(result.aaa)}
              WCAG AAA
            </span>
            <span className={result.aaa ? 'text-green-500' : 'text-red-500'}>
              {result.aaa ? 'Pass' : 'Fail'} (≥7:1)
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Large Text (18pt+)
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {getStatusIcon(result.aaLarge)}
              WCAG AA
            </span>
            <span className={result.aaLarge ? 'text-green-500' : 'text-red-500'}>
              {result.aaLarge ? 'Pass' : 'Fail'} (≥3:1)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {getStatusIcon(result.aaaLarge)}
              WCAG AAA
            </span>
            <span className={result.aaaLarge ? 'text-green-500' : 'text-red-500'}>
              {result.aaaLarge ? 'Pass' : 'Fail'} (≥4.5:1)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
