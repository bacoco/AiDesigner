import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';

interface FontSelectorProps {
  label: string;
  value: string[];
  onChange: (fonts: string[]) => void;
  category: 'sans' | 'serif' | 'mono';
}

const FONT_OPTIONS = {
  sans: [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Source Sans Pro',
    'Nunito',
    'system-ui',
  ],
  serif: [
    'Georgia',
    'Merriweather',
    'Playfair Display',
    'Lora',
    'PT Serif',
    'Crimson Text',
    'serif',
  ],
  mono: [
    'Fira Code',
    'JetBrains Mono',
    'Source Code Pro',
    'Monaco',
    'Consolas',
    'Courier New',
    'monospace',
  ],
};

export function FontSelector({ label, value, onChange, category }: FontSelectorProps) {
  const currentFont = value[0] || FONT_OPTIONS[category][0];
  const options = FONT_OPTIONS[category];

  const handleChange = (newFont: string) => {
    onChange([newFont, ...value.slice(1)]);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={currentFont} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${category} font`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((font) => (
            <SelectItem key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="text-xs text-muted-foreground">
        Preview: <span style={{ fontFamily: currentFont }}>The quick brown fox</span>
      </div>
    </div>
  );
}
