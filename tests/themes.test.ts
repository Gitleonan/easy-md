import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const themesCss = readFileSync('src/styles/themes.css', 'utf8');

describe('theme layout styles', () => {
  it('does not draw a focus outline around the preview container', () => {
    const focusRule = themesCss.match(/\.md-content:focus\s*\{[\s\S]*?\}/)?.[0] ?? '';

    expect(focusRule).toContain('outline: none');
  });
});
