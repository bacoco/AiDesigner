import { describe, expect, it } from 'vitest';

import { ensureValidHex, hexToRgba, normalizeHex } from './theme';

describe('normalizeHex', () => {
  it('returns value unchanged when empty', () => {
    expect(normalizeHex('')).toBe('');
  });

  it('normalizes 3 character hex codes regardless of prefix', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('abc')).toBe('#aabbcc');
  });

  it('normalizes 6 character hex codes regardless of prefix', () => {
    expect(normalizeHex('#abcdef')).toBe('#abcdef');
    expect(normalizeHex('abcdef')).toBe('#abcdef');
  });

  it('strips alpha channel from 8 character hex codes', () => {
    expect(normalizeHex('#112233ff')).toBe('#112233');
  });

  it('returns trimmed original value when characters are invalid', () => {
    expect(normalizeHex(' #zzzzzz ')).toBe('#zzzzzz');
  });
});

describe('hexToRgba', () => {
  it('converts normalized hex to rgba string with alpha', () => {
    expect(hexToRgba('#336699', 0.5)).toBe('rgba(51, 102, 153, 0.5)');
  });

  it('handles shorthand hex codes by normalizing first', () => {
    expect(hexToRgba('#0f0', 0.25)).toBe('rgba(0, 255, 0, 0.25)');
  });

  it('returns original value when it cannot normalize to 6 digits', () => {
    expect(hexToRgba('not-a-color')).toBe('not-a-color');
    expect(hexToRgba('#abcd')).toBe('#abcd');
  });
});

describe('ensureValidHex', () => {
  it('returns normalized hex when the value is valid', () => {
    expect(ensureValidHex('abc', '#000000')).toBe('#aabbcc');
  });

  it('falls back to provided default when the value is invalid', () => {
    expect(ensureValidHex('xyz', '#123456')).toBe('#123456');
  });
});
