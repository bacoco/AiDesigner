import type { CSSProperties } from 'react';
import type { UITheme } from '../api/types';

export const normalizeHex = (value: string): string => {
  if (!value) {
    return value;
  }
  const trimmed = value.trim();
  const raw = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  if (!/^[0-9a-fA-F]+$/.test(raw)) {
    return trimmed; // Not a valid hex character sequence, return original.
  }

  if (raw.length === 3) {
    return `#${raw.split('').map((char) => char + char).join('')}`;
  }
  if (raw.length === 6) {
    return `#${raw}`;
  }
  if (raw.length === 8) {
    return `#${raw.slice(0, 6)}`;
  }

  return trimmed; // Return original if not a supported length.
};

export const hexToRgba = (value: string, alpha = 1): string => {
  const normalized = normalizeHex(value);
  if (!normalized.startsWith('#')) {
    return value;
  }
  const raw = normalized.slice(1);
  if (raw.length !== 6) {
    return normalized;
  }
  const int = Number.parseInt(raw, 16);
  if (Number.isNaN(int)) {
    return normalized;
  }
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const ensureValidHex = (value: string, fallback: string): string => {
  const normalized = normalizeHex(value);
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
};

export const createBackgroundStyle = (theme: UITheme): CSSProperties => ({
  background: `radial-gradient(circle at 15% 15%, ${hexToRgba(theme.primary, 0.45)}, transparent 55%), radial-gradient(circle at 85% 0%, ${hexToRgba(theme.accent, 0.35)}, transparent 60%), linear-gradient(135deg, ${theme.background}, #020617 80%)`,
});
