import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTabsStore } from '../../stores/tabsStore';
import { readFile } from '../../ipc/files';
import { renderMarkdown } from '../markdown/render';
import { highlightCodeBlocks } from '../markdown/highlight';
import { extractToc } from '../markdown/toc';

/** 监听 Rust 端 file-changed 事件，自动刷新被外部修改的文件 */
export function useFileWatcher() {
  useEffect(() => {
    const unlisten = listen<string[]>('file-changed', async (e) => {
      const changedPaths = e.payload;
      const { tabs, updateSource } = useTabsStore.getState();
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      for (const path of changedPaths) {
        const tab = tabs.find(
          (t: { filePath: string }) => t.filePath === path || t.filePath === path.replace(/\//g, '\\'),
        );
        if (!tab) continue;
        try {
          const source = await readFile(tab.filePath);
          if (source === tab.source) continue;
          const toc = extractToc(source);
          const html = await highlightCodeBlocks(renderMarkdown(source), theme);
          updateSource(tab.id, source, html, toc);
        } catch (err) {
          console.error('reload failed', err);
        }
      }
    });
    return () => { unlisten.then((u) => u()); };
  }, []);
}
