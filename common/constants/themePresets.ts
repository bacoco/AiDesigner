/**
 * Shared theme presets used across front-end and MCP server
 */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary?: string;
    accent?: string;
    background?: string;
  };
  tags?: string[];
}

export const DEFAULT_PRESETS: ThemePreset[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool, calming ocean-inspired palette',
    colors: { primary: '#0077be', accent: '#00d4ff', background: '#001f3f' },
    tags: ['blue', 'professional', 'calm'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm, vibrant sunset colors',
    colors: { primary: '#ff6b35', accent: '#fdc830', background: '#1a0b2e' },
    tags: ['warm', 'vibrant', 'energetic'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural, earthy forest tones',
    colors: { primary: '#2d6a4f', accent: '#74c69d', background: '#081c15' },
    tags: ['green', 'natural', 'calm'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep, mysterious midnight blues',
    colors: { primary: '#6366f1', accent: '#a855f7', background: '#020617' },
    tags: ['purple', 'dark', 'modern'],
  },
  {
    id: 'coral',
    name: 'Coral Reef',
    description: 'Vibrant coral and teal combination',
    colors: { primary: '#ff6f61', accent: '#2ec4b6', background: '#011627' },
    tags: ['coral', 'teal', 'vibrant'],
  },
];
