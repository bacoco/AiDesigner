import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { FontSelector } from '../typography/FontSelector';
import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';

export function TypographyTab() {
  const { currentTheme, updateTypography } = useThemeEditorStore();
  const typography = currentTheme.typography;

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
      <div className="space-y-6">
        {/* Font Families */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Font Families</h3>
          <div className="space-y-4">
            <FontSelector
              label="Sans Serif"
              value={typography.fontFamily.sans}
              onChange={(fonts) =>
                updateTypography({
                  fontFamily: { ...typography.fontFamily, sans: fonts },
                })
              }
              category="sans"
            />
            <FontSelector
              label="Serif"
              value={typography.fontFamily.serif}
              onChange={(fonts) =>
                updateTypography({
                  fontFamily: { ...typography.fontFamily, serif: fonts },
                })
              }
              category="serif"
            />
            <FontSelector
              label="Monospace"
              value={typography.fontFamily.mono}
              onChange={(fonts) =>
                updateTypography({
                  fontFamily: { ...typography.fontFamily, mono: fonts },
                })
              }
              category="mono"
            />
          </div>
        </div>

        <Separator />

        {/* Font Size */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Font Size</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Base Size</Label>
              <Input
                type="text"
                value={typography.fontSize.base}
                onChange={(e) =>
                  updateTypography({
                    fontSize: { ...typography.fontSize, base: e.target.value },
                  })
                }
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Base font size (e.g., 16px, 1rem)
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">
                Scale Factor: {typography.fontSize.scale.toFixed(2)}
              </Label>
              <Slider
                value={[typography.fontSize.scale]}
                onValueChange={([value]) =>
                  updateTypography({
                    fontSize: { ...typography.fontSize, scale: value },
                  })
                }
                min={1.1}
                max={1.5}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Multiplier for heading sizes
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Font Weights */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Font Weights</h3>
          <div className="space-y-4">
            {(['normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
              <div key={weight} className="space-y-2">
                <Label className="text-sm capitalize">{weight}</Label>
                <Slider
                  value={[typography.fontWeight[weight]]}
                  onValueChange={([value]) =>
                    updateTypography({
                      fontWeight: { ...typography.fontWeight, [weight]: value },
                    })
                  }
                  min={100}
                  max={900}
                  step={100}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Value: {typography.fontWeight[weight]}</span>
                  <span
                    style={{
                      fontWeight: typography.fontWeight[weight],
                    }}
                  >
                    Preview Text
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Line Height */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Line Height</h3>
          <div className="space-y-4">
            {(['tight', 'normal', 'relaxed'] as const).map((spacing) => (
              <div key={spacing} className="space-y-2">
                <Label className="text-sm capitalize">{spacing}</Label>
                <Slider
                  value={[typography.lineHeight[spacing]]}
                  onValueChange={([value]) =>
                    updateTypography({
                      lineHeight: { ...typography.lineHeight, [spacing]: value },
                    })
                  }
                  min={1}
                  max={2.5}
                  step={0.05}
                />
                <div className="text-xs text-muted-foreground">
                  Value: {typography.lineHeight[spacing].toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Letter Spacing */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Letter Spacing</h3>
          <div className="space-y-4">
            {(['tight', 'normal', 'wide'] as const).map((spacing) => (
              <div key={spacing} className="space-y-2">
                <Label className="text-sm capitalize">{spacing}</Label>
                <Input
                  type="text"
                  value={typography.letterSpacing[spacing]}
                  onChange={(e) =>
                    updateTypography({
                      letterSpacing: {
                        ...typography.letterSpacing,
                        [spacing]: e.target.value,
                      },
                    })
                  }
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  CSS value (e.g., -0.025em, 0, 0.025em)
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
