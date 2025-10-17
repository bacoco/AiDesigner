import { useThemeEditorStore } from '../../../stores/themeEditorStore';
import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

export function OtherTab() {
  const { currentTheme, updateBorderRadius, updateSpacing, updateShadows, updateAnimations } =
    useThemeEditorStore();

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
      <div className="space-y-6">
        {/* Border Radius */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Border Radius</h3>
          <div className="space-y-4">
            {(['default', 'sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
              <div key={size} className="space-y-2">
                <Label className="text-sm capitalize">{size}</Label>
                <Input
                  type="text"
                  value={currentTheme.borderRadius[size]}
                  onChange={(e) =>
                    updateBorderRadius({
                      [size]: e.target.value,
                    })
                  }
                  className="font-mono"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Preview:</span>
                  <div
                    className="w-16 h-8 bg-primary"
                    style={{ borderRadius: currentTheme.borderRadius[size] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Spacing */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Spacing</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Base Unit</Label>
              <Input
                type="text"
                value={currentTheme.spacing.base}
                onChange={(e) =>
                  updateSpacing({
                    base: e.target.value,
                  })
                }
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Base spacing unit (e.g., 4px, 0.25rem)
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Scale Multipliers</Label>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {currentTheme.spacing.scale.map((value, index) => (
                  <div key={index} className="text-center">
                    <div className="font-mono text-muted-foreground">{index}</div>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        const newScale = [...currentTheme.spacing.scale];
                        newScale[index] = parseInt(e.target.value) || 0;
                        updateSpacing({ scale: newScale });
                      }}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Multipliers for spacing-0 through spacing-9
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Shadows */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Shadows</h3>
          <div className="space-y-4">
            {(['sm', 'md', 'lg', 'xl', 'xxl'] as const).map((size) => (
              <div key={size} className="space-y-2">
                <Label className="text-sm uppercase">{size}</Label>
                <Input
                  type="text"
                  value={currentTheme.shadows[size]}
                  onChange={(e) =>
                    updateShadows({
                      [size]: e.target.value,
                    })
                  }
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Preview:</span>
                  <div
                    className="w-16 h-8 bg-card rounded"
                    style={{ boxShadow: currentTheme.shadows[size] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Animations */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Animations</h3>
          
          {/* Duration */}
          <div className="space-y-4 mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground">Duration</h4>
            {(['fast', 'normal', 'slow'] as const).map((speed) => (
              <div key={speed} className="space-y-2">
                <Label className="text-sm capitalize">{speed}</Label>
                <Input
                  type="text"
                  value={currentTheme.animations.duration[speed]}
                  onChange={(e) =>
                    updateAnimations({
                      duration: {
                        ...currentTheme.animations.duration,
                        [speed]: e.target.value,
                      },
                    })
                  }
                  className="font-mono"
                />
              </div>
            ))}
          </div>

          {/* Easing */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground">Easing Functions</h4>
            {(['default', 'in', 'out', 'inOut'] as const).map((easing) => (
              <div key={easing} className="space-y-2">
                <Label className="text-sm capitalize">{easing}</Label>
                <Input
                  type="text"
                  value={currentTheme.animations.easing[easing]}
                  onChange={(e) =>
                    updateAnimations({
                      easing: {
                        ...currentTheme.animations.easing,
                        [easing]: e.target.value,
                      },
                    })
                  }
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
