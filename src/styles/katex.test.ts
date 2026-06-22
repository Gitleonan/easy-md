import { describe, expect, it } from 'vitest';
import entry from '../main.tsx?raw';

describe('KaTeX styles', () => {
  it('loads the KaTeX stylesheet in the app entrypoint', () => {
    expect(entry).toContain("katex/dist/katex.min.css");
  });
});
