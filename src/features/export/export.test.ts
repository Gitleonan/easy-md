import { describe, it, expect, vi, beforeEach } from 'vitest';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '../../ipc/files';
import { buildStandaloneHtml, exportDocument } from './export';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
}));

vi.mock('../../ipc/files', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('export', () => {
  const saveMock = vi.mocked(save);
  const writeFileMock = vi.mocked(writeFile);

  beforeEach(() => {
    saveMock.mockReset();
    writeFileMock.mockClear();
    saveMock.mockResolvedValue('C:\\out\\doc.html');
    document.body.innerHTML = '';
  });

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

  it('exports pdf via a hidden iframe + window.print, not via saveDialog or rust', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<h1>你好</h1><p>Hi</p>';

    // jsdom 没实现 print，给 HTMLIFrameElement.contentWindow.print 打桩
    const printSpy = vi.fn();
    // 拦截 iframe 的 srcdoc 设值：onload 在 jsdom 里不会自动触发，手动派发
    const origAppendChild = document.body.appendChild.bind(document.body);
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      const result = origAppendChild(node);
      if (node instanceof HTMLIFrameElement) {
        // 等下一个微任务，模拟 srcdoc 完成
        Promise.resolve().then(() => {
          Object.defineProperty(node, 'contentWindow', {
            configurable: true,
            value: { focus: vi.fn(), print: printSpy },
          });
          node.dispatchEvent(new Event('load'));
        });
      }
      return result;
    });

    await exportDocument({
      element: root,
      source: '# 你好',
      fileName: 'note.md',
      theme: 'light',
      format: 'pdf',
    });

    expect(saveMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(printSpy).toHaveBeenCalledTimes(1);

    appendSpy.mockRestore();
  });

  it('exports markdown as a new md file', async () => {
    saveMock.mockResolvedValue('C:\\out\\copy.md');
    const root = document.createElement('div');

    await exportDocument({
      element: root,
      source: '# Title',
      fileName: 'note.md',
      theme: 'light',
      format: 'markdown',
    });

    expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({
      defaultPath: 'note.md',
    }));
    expect(writeFileMock).toHaveBeenCalledWith('C:\\out\\copy.md', '# Title');
  });

  it('exports html files', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<h1>Title</h1>';

    saveMock.mockResolvedValueOnce('C:\\out\\note.html');
    await exportDocument({
      element: root,
      source: '# Title',
      fileName: 'note.md',
      theme: 'light',
      format: 'html',
    });
    expect(writeFileMock).toHaveBeenLastCalledWith('C:\\out\\note.html', expect.stringContaining('<h1>Title</h1>'));
    expect(writeFileMock).toHaveBeenLastCalledWith('C:\\out\\note.html', expect.stringContaining('.code-block-wrapper'));
    expect(writeFileMock).toHaveBeenLastCalledWith('C:\\out\\note.html', expect.stringContaining('.github-alert'));
  });
});
