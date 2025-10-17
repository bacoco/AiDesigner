import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { useThemeStore } from '../stores/themeStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ThemeEditorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you customize your theme. Try saying things like:\n\n• "Make the primary color blue"\n• "Apply an ocean theme"\n• "Generate a warm palette from #ff6b35"\n• "Create a dark mode version"\n• "Export as CSS"',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const themeStore = useThemeStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseCommand = (userInput: string): {
    action: string;
    params: any;
    response: string;
  } | null => {
    const lower = userInput.toLowerCase();

    if (lower.match(/make.*primary.*(blue|#[0-9a-f]{6})/i)) {
      const colorMatch = userInput.match(/(#[0-9a-fA-F]{6})|blue|red|green|purple|orange|pink|teal/i);
      const colorMap: Record<string, string> = {
        blue: '#3b82f6',
        red: '#ef4444',
        green: '#22c55e',
        purple: '#a855f7',
        orange: '#f97316',
        pink: '#ec4899',
        teal: '#14b8a6'
      };
      const color = colorMatch ? (colorMatch[0].startsWith('#') ? colorMatch[0] : colorMap[colorMatch[0].toLowerCase()]) : '#3b82f6';
      return {
        action: 'setColor',
        params: { field: 'primary', value: color },
        response: `Set primary color to ${color}`
      };
    }

    if (lower.match(/make.*accent.*(blue|#[0-9a-f]{6})/i)) {
      const colorMatch = userInput.match(/(#[0-9a-fA-F]{6})|blue|red|green|purple|orange|pink|teal/i);
      const colorMap: Record<string, string> = {
        blue: '#3b82f6',
        red: '#ef4444',
        green: '#22c55e',
        purple: '#a855f7',
        orange: '#f97316',
        pink: '#ec4899',
        teal: '#14b8a6'
      };
      const color = colorMatch ? (colorMatch[0].startsWith('#') ? colorMatch[0] : colorMap[colorMatch[0].toLowerCase()]) : '#ec4899';
      return {
        action: 'setColor',
        params: { field: 'accent', value: color },
        response: `Set accent color to ${color}`
      };
    }

    if (lower.match(/make.*background.*(blue|#[0-9a-f]{6}|dark|darker)/i)) {
      const colorMatch = userInput.match(/(#[0-9a-fA-F]{6})/i);
      const color = colorMatch ? colorMatch[0] : (lower.includes('darker') ? '#020617' : '#0f172a');
      return {
        action: 'setColor',
        params: { field: 'background', value: color },
        response: `Set background color to ${color}`
      };
    }

    if (lower.match(/apply.*(ocean|sunset|forest|midnight|coral)/i)) {
      const presetMatch = lower.match(/(ocean|sunset|forest|midnight|coral)/i);
      const presetId = presetMatch ? presetMatch[1] : 'ocean';
      return {
        action: 'applyPreset',
        params: { presetId },
        response: `Applied ${presetId} preset`
      };
    }

    if (lower.match(/(generate|create).*(dark mode|dark theme)/i)) {
      return {
        action: 'generateDarkMode',
        params: {},
        response: 'Generated dark mode version of current theme'
      };
    }

    if (lower.match(/(generate|create).*(palette|colors)/i)) {
      const colorMatch = userInput.match(/#[0-9a-fA-F]{6}/i);
      const styleMatch = lower.match(/(monochromatic|complementary|analogous|triadic)/i);
      const baseColor = colorMatch ? colorMatch[0] : themeStore.currentTheme.primary;
      const style = styleMatch ? styleMatch[1] : 'complementary';
      return {
        action: 'generatePalette',
        params: { baseColor, style },
        response: `Generated ${style} palette from ${baseColor}`
      };
    }

    if (lower.match(/(export|copy).*(css|json|tailwind)/i)) {
      const formatMatch = lower.match(/(css|json|tailwind)/i);
      const format = formatMatch ? formatMatch[1] as 'css' | 'json' | 'tailwind' : 'json';
      return {
        action: 'export',
        params: { format },
        response: `Exported theme as ${format.toUpperCase()}`
      };
    }

    if (lower.match(/undo|go back|revert/i)) {
      return {
        action: 'undo',
        params: {},
        response: 'Undone last change'
      };
    }

    if (lower.match(/warmer|warm/i) && !lower.includes('not')) {
      return {
        action: 'adjustWarmth',
        params: { direction: 'warmer' },
        response: 'Made colors warmer (shifted toward orange/red tones)'
      };
    }

    if (lower.match(/cooler|cool/i) && !lower.includes('not')) {
      return {
        action: 'adjustWarmth',
        params: { direction: 'cooler' },
        response: 'Made colors cooler (shifted toward blue tones)'
      };
    }

    if (lower.match(/brighter|lighter|increase.*brightness/i)) {
      return {
        action: 'adjustBrightness',
        params: { direction: 'brighter' },
        response: 'Increased brightness of all colors'
      };
    }

    if (lower.match(/darker|decrease.*brightness|dimmer/i)) {
      return {
        action: 'adjustBrightness',
        params: { direction: 'darker' },
        response: 'Decreased brightness of all colors'
      };
    }

    if (lower.match(/more.*vibrant|saturate|increase.*saturation/i)) {
      return {
        action: 'adjustSaturation',
        params: { direction: 'more' },
        response: 'Increased saturation - colors are now more vibrant'
      };
    }

    if (lower.match(/less.*vibrant|desaturate|decrease.*saturation/i)) {
      return {
        action: 'adjustSaturation',
        params: { direction: 'less' },
        response: 'Decreased saturation - colors are now more muted'
      };
    }

    return null;
  };

  const executeCommand = (command: { action: string; params: any }) => {
    const { action, params } = command;

    switch (action) {
      case 'setColor':
        themeStore.setColor(params.field, params.value);
        break;
      case 'applyPreset':
        themeStore.applyPreset(params.presetId);
        break;
      case 'generateDarkMode':
        themeStore.generateDarkMode();
        break;
      case 'generatePalette':
        themeStore.generatePalette(params.baseColor, params.style);
        break;
      case 'export':
        const exported = themeStore.exportTheme(params.format);
        navigator.clipboard.writeText(exported);
        break;
      case 'undo':
        themeStore.undo();
        break;
      case 'adjustWarmth':
        adjustThemeWarmth(params.direction === 'warmer');
        break;
      case 'adjustBrightness':
        adjustThemeBrightness(params.direction === 'brighter');
        break;
      case 'adjustSaturation':
        adjustThemeSaturation(params.direction === 'more');
        break;
    }
  };

  const adjustThemeWarmth = (warmer: boolean) => {
    const current = themeStore.currentTheme;
    const adjustColor = (hex: string) => {
      const hsl = hexToHSL(hex);
      const shift = warmer ? 15 : -15;
      return hslToHex((hsl.h + shift + 360) % 360, hsl.s, hsl.l);
    };

    themeStore.setColor('primary', adjustColor(current.primary));
    themeStore.setColor('accent', adjustColor(current.accent));
  };

  const adjustThemeBrightness = (brighter: boolean) => {
    const current = themeStore.currentTheme;
    const adjustColor = (hex: string) => {
      const hsl = hexToHSL(hex);
      const shift = brighter ? 10 : -10;
      return hslToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + shift)));
    };

    themeStore.setColor('primary', adjustColor(current.primary));
    themeStore.setColor('accent', adjustColor(current.accent));
  };

  const adjustThemeSaturation = (more: boolean) => {
    const current = themeStore.currentTheme;
    const adjustColor = (hex: string) => {
      const hsl = hexToHSL(hex);
      const multiplier = more ? 1.15 : 0.85;
      return hslToHex(hsl.h, Math.max(0, Math.min(100, hsl.s * multiplier)), hsl.l);
    };

    themeStore.setColor('primary', adjustColor(current.primary));
    themeStore.setColor('accent', adjustColor(current.accent));
  };

  const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    setTimeout(() => {
      const command = parseCommand(trimmed);

      if (command) {
        try {
          executeCommand(command);
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `✓ ${command.response}`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `❌ Sorry, I couldn't do that: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        const helpMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I didn\'t quite understand that. Try commands like:\n\n• "Make primary blue"\n• "Apply sunset preset"\n• "Generate a complementary palette from #ff6b35"\n• "Make it warmer"\n• "Export as CSS"',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, helpMessage]);
      }

      setIsProcessing(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Theme Assistant</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ask me to customize your theme
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-foreground" />
                )}
              </div>
              <Card
                className={`p-3 max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </Card>
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <Card className="p-3 bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Make primary blue..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
