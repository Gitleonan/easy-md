import { create } from 'zustand';
import type { Tab, TocItem } from '../types';
import { renderMarkdown } from '../features/markdown/render';
import { highlightCodeBlocks } from '../features/markdown/highlight';
import { extractToc } from '../features/markdown/toc';
import { readFile, watchFiles } from '../ipc/files';

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (filePath: string) => Promise<void>;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  setScrollTop: (id: string, scrollTop: number) => void;
  updateSource: (id: string, source: string, html: string, toc: TocItem[]) => void;
  reloadTab: (id: string) => Promise<void>;
  restoreSession: () => Promise<void>;
}

let seq = 0;
const SESSION_KEY = 'mdpp.openTabs.v1';

function saveSession(tabs: Tab[], activeTabId: string | null) {
  try {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        paths: tabs.map((t) => t.filePath),
        activePath: activeTab?.filePath ?? null,
      }),
    );
  } catch {
    // localStorage may be unavailable in tests or restricted environments.
  }
}

function readSession(): { paths: string[]; activePath: string | null } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { paths?: unknown; activePath?: unknown };
    if (!Array.isArray(parsed.paths)) return null;
    return {
      paths: parsed.paths.filter((p): p is string => typeof p === 'string'),
      activePath: typeof parsed.activePath === 'string' ? parsed.activePath : null,
    };
  } catch {
    return null;
  }
}

async function buildTab(filePath: string): Promise<Tab> {
  console.log('[buildTab] reading file:', filePath);
  const source = await readFile(filePath);
  console.log('[buildTab] file read, length:', source.length);
  const toc = extractToc(source);
  console.log('[buildTab] toc extracted:', toc.length, 'items');
  const rawHtml = renderMarkdown(source);
  console.log('[buildTab] markdown rendered, html length:', rawHtml.length);
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const html = await highlightCodeBlocks(rawHtml, theme);
  console.log('[buildTab] highlight done, html length:', html.length);
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

function syncSessionAndWatcher(tabs: Tab[], activeTabId: string | null) {
  saveSession(tabs, activeTabId);
  syncWatcherFromTabs(tabs);
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  async openTab(filePath) {
    console.log('[openTab] called with:', filePath);
    const normalized = filePath.replace(/\//g, '\\');
    const existing = get().tabs.find(
      (t) => t.filePath === normalized || t.filePath === filePath,
    );
    if (existing) {
      console.log('[openTab] file already open, switching to tab:', existing.id);
      set({ activeTabId: existing.id });
      return;
    }
    try {
      const tab = await buildTab(normalized);
      console.log('[openTab] tab built successfully:', tab.id, tab.fileName);
      set((s) => {
        const tabs = [...s.tabs, tab];
        syncSessionAndWatcher(tabs, tab.id);
        return { tabs, activeTabId: tab.id };
      });
    } catch (err) {
      console.error('[openTab] buildTab failed:', err);
      throw err;
    }
  },

  closeTab(id) {
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      let activeTabId = s.activeTabId;
      if (activeTabId === id) {
        activeTabId = tabs[idx]?.id ?? tabs[idx - 1]?.id ?? null;
      }
      syncSessionAndWatcher(tabs, activeTabId);
      return { tabs, activeTabId };
    });
  },

  setActive(id) {
    set((s) => {
      saveSession(s.tabs, id);
      return { activeTabId: id };
    });
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

  async reloadTab(id) {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;
    const next = await buildTab(tab.filePath);
    set((s) => ({
      tabs: s.tabs.map((t) => (
        t.id === id
          ? { ...next, id, scrollTop: t.scrollTop, tocExpanded: t.tocExpanded }
          : t
      )),
      activeTabId: s.activeTabId,
    }));
  },

  async restoreSession() {
    if (get().tabs.length > 0) return;
    const session = readSession();
    if (!session?.paths.length) return;
    for (const path of session.paths) {
      try {
        await get().openTab(path);
      } catch (err) {
        console.error('[restoreSession] failed to reopen', path, err);
      }
    }
    const normalizedActive = session.activePath?.replace(/\//g, '\\');
    const active = get().tabs.find(
      (t) => t.filePath === normalizedActive || t.filePath === session.activePath,
    );
    if (active) get().setActive(active.id);
  },
}));
