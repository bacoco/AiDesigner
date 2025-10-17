/**
 * Shared color utility functions for theme management
 * Used across front-end, MCP server, and chat components
 */

/**
 * Convert hex color to HSL
 * @param hex - Hex color string (e.g., "#7c3aed")
 * @returns HSL object with h (0-360), s (0-100), l (0-100)
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Validate hex format
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    console.warn(`Invalid hex color: ${hex}, returning default HSL`);
    return { h: 0, s: 0, l: 0 };
  }

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
}

/**
 * Convert HSL to hex color
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string (e.g., "#7c3aed")
 */
export function hslToHex(h: number, s: number, l: number): string {
  // Clamp values to valid ranges
  h = ((h % 360) + 360) % 360; // Normalize to 0-360
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));

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
}

/**
 * Validate if a string is a valid hex color
 * @param hex - String to validate
 * @returns true if valid hex color
 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/**
 * Ensure a value is a valid hex color, with fallback
 * @param value - Value to validate/sanitize
 * @param fallback - Fallback hex color
 * @returns Valid hex color string
 */
export function ensureValidHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (isValidHex(trimmed)) {
    return trimmed;
  }
  return fallback;
}
