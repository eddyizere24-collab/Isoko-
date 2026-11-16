import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

function linearChannel(hex: string, offset: number): number {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  return 0.2126 * linearChannel(hex, 1)
    + 0.7152 * linearChannel(hex, 3)
    + 0.0722 * linearChannel(hex, 5);
}

function contrastRatio(foreground: string, background: string): number {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('ISOKO brand tokens use the approved clear mobile palette', () => {
  for (const token of [
    '--isoko-bg: #FAFAF7;',
    '--isoko-surface: #FFFFFF;',
    '--isoko-ink: #1A1F1C;',
    '--isoko-muted: #4B544F;',
    '--isoko-green: #0B6E4F;',
    '--isoko-red: #C0392B;',
  ]) {
    assert.ok(css.includes(token), `missing palette token: ${token}`);
  }
});

test('primary, secondary and accent text colours meet WCAG AA contrast on the page background', () => {
  const background = '#FAFAF7';
  for (const foreground of ['#4B544F', '#1A1F1C', '#0B6E4F', '#C0392B']) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${foreground} contrast is below 4.5:1 against ${background}`
    );
  }
});

test('Imigongo band uses a square 12px tile and at least 1.5px strokes', () => {
  assert.match(css, /background-size:\s*12px 12px/);
  assert.match(css, /width='12' height='12' viewBox='0 0 12 12'/);
  assert.match(css, /stroke-width='1\.5'/);
  assert.match(css, /height:\s*12px/);
});

test('legacy utility aliases map old washed-out colours to the central tokens', () => {
  assert.match(css, /\[class~="bg\[#F7F5F0\]"\].*var\(--isoko-bg\)/);
  assert.match(css, /\[class~="text\[#68716D\]"\].*var\(--isoko-muted\)/);
  assert.match(css, /\[class~="bg\[#214E43\]"\].*var\(--isoko-green\)/);
});
