import { useState, useEffect, useId, type ChangeEvent } from 'react';
import { HexColorPicker } from 'react-colorful';
import { colord } from 'colord';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const inputId = useId();

  // Sync local state when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    setLocalValue(color);
    onChange(color);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Sanitize input to prevent XSS
    const sanitized = newValue.replace(/[^#0-9a-fA-F]/g, '');
    setLocalValue(sanitized);

    try {
      const parsed = colord(sanitized);
      if (parsed.isValid()) {
        onChange(parsed.toHex());
      }
    } catch {
      // Invalid color
    }
  };

  const handleInputBlur = () => {
    try {
      const parsed = colord(localValue);
      if (parsed.isValid()) {
        const hex = parsed.toHex();
        setLocalValue(hex);
        onChange(hex);
      } else {
        setLocalValue(value);
      }
    } catch {
      setLocalValue(value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-10 p-0 border-2"
              style={{ backgroundColor: value }}
              aria-label={`Pick ${label} color`}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <HexColorPicker color={value} onChange={handleColorChange} />
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-5 gap-1">
                {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    aria-label={`Select ${color}`}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Input
          id={inputId}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
}
