import { create } from 'zustand';
import type { Tab, TocItem } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { renderMarkdown } from '../features/markdown/render';
import { highlightCodeBlocks } from '../features/markdown/highlight';
import { extractToc } from '../features/markdown/toc';
import { watchFiles } from '../ipc/files';

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (filePath: string) => Promise<void>;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  setScrollTop: (id: string, scrollTop: number) => void;
  updateSource: (id: string, source: string, html: string, toc: TocItem[]) => void;
}

let seq = 0;

async function readFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path });
}

async function buildTab(filePath: string): Promise<Tab> {
  const source = await readFile(filePath);
  const toc = extractToc(source);
  const rawHtml = renderMarkdown(source);
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const html = await highlightCodeBlocks(rawHtml, theme);
  const fileName = filePath.split(/[/\\]/).pop() || filePath;
  return {
    id: `tab-${++seq}`,
    filePath,
    fileName,
    source,
    html,
    toc,
    scrollTop: 0,
    tocExpanded: {},
  };
}

/** 同步标签页路径到 Rust watcher，让外部编辑时能自动刷新 */
function syncWatcherFromTabs(tabs: Tab[]) {
  const paths = tabs.map((t) => t.filePath);
  watchFiles(paths).catch(() => {
    // 忽略：Tauri 命令可能还没注册（开发时前端先启动）
  });
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  async openTab(filePath) {
    const normalized = filePath.replace(/\//g, '\\');
    const existing = get().tabs.find(
      (t) => t.filePath === normalized || t.filePath === filePath,
    );
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const tab = await buildTab(filePath);
    set((s) => {
      const tabs = [...s.tabs, tab];
      syncWatcherFromTabs(tabs);
      return { tabs, activeTabId: tab.id };
    });
  },

  closeTab(id) {
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      let activeTabId = s.activeTabId;
      if (activeTabId === id) {
        activeTabId = tabs[idx]?.id ?? tabs[idx - 1]?.id ?? null;
      }
      syncWatcherFromTabs(tabs);
      return { tabs, activeTabId };
    });
  },

  setActive(id) {
    set({ activeTabId: id });
  },

  setScrollTop(id, scrollTop) {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, scrollTop } : t)),
    }));
  },

  updateSource(id, source, html, toc) {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, source, html, toc } : t)),
    }));
  },
}));
