import { describe, it, expect, vi } from 'vitest';
import { buildStandaloneHtml, exportPdf } from './export';

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

  it('prints from a hidden iframe instead of relying on a popup window', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {
      throw new Error('window.open should not be used for PDF export');
    });
    const root = document.createElement('div');
    root.innerHTML = '<h1>Hi</h1>';

    await exportPdf(root, 'light');

    const iframe = document.querySelector<HTMLIFrameElement>('iframe[data-md-export-frame="true"]');
    expect(iframe).not.toBeNull();
    expect(iframe?.srcdoc).toContain('<h1>Hi</h1>');
    openSpy.mockRestore();
    iframe?.remove();
  });
});
