import { describe, it, expect } from 'vitest';
import { buildStandaloneHtml } from './export';

describe('export', () => {
  it('builds standalone html wrapping content with inline styles', () => {
    const html = buildStandaloneHtml('<h1>Hi</h1>', 'body { color: red; }', 'light');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('data-theme="light"');
    expect(html).toContain('<h1>Hi</h1>');
    expect(html).toContain('body { color: red; }');
  });

  it('supports dark theme', () => {
    const html = buildStandaloneHtml('<p>test</p>', '', 'dark');
    expect(html).toContain('data-theme="dark"');
  });

  it('includes katex CSS link', () => {
    const html = buildStandaloneHtml('', '', 'light');
    expect(html).toContain('katex');
  });
});
