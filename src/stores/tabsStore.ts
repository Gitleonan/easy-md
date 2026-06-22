import { create } from 'zustand';
import type { Tab, TocItem } from '../types';
import { renderMarkdown } from '../features/markdown/render';
import { highlightCodeBlocks } from '../features/markdown/highlight';
import { extractToc } from '../features/markdown/toc';
import { readFile, watchFiles } from '../ipc/files';
import { isMac } from '../utils/platform';

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (filePath: string) => Promise<void>;
  closeTab: (id: string) => void;
  closeTabsToLeft: (id: string) => void;
  closeTabsToRight: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  moveTab: (id: string, targetId: string) => void;
  setActive: (id: string) => void;
  setScrollTop: (id: string, scrollTop: number) => void;
  updateSource: (id: string, source: string, html: string, toc: TocItem[]) => void;
  reloadTab: (id: string) => Promise<void>;
  restoreSession: () => Promise<void>;
}

let seq = 0;
const SESSION_KEY = 'mdpp.openTabs.v1';

/**
 * 路径比较归一化：统一分隔符并转小写用于去重。
 * Windows: 反斜杠 + 大小写不敏感 → 统一为反斜杠小写
 * macOS:   正斜杠 + HFS/APFS 默认大小写不敏感 → 仅转小写
 * Linux:   正斜杠 + 大小写敏感 → 保留原样
 */
function normalizePathKey(p: string): string {
  if (isMac()) {
    return p.toLowerCase();
  }
  return p.replace(/\//g, '\\').replace(/\\+/g, '\\').toLowerCase();
}

function isWindows(): boolean {
  return !isMac();
}

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
    isLoading: false,
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
    // Windows 路径归一化：统一使用反斜杠分隔符；macOS/Linux 保留正斜杠
    const normalized = isWindows() ? filePath.replace(/\//g, '\\') : filePath;
    const targetKey = normalizePathKey(filePath);
    const existing = get().tabs.find(
      (t) => normalizePathKey(t.filePath) === targetKey,
    );
    if (existing) {
      console.log('[openTab] file already open, switching to tab:', existing.id);
      set({ activeTabId: existing.id });
      return;
    }
    // 先插入一个 loading 占位 tab，让用户立刻看到反馈
    const placeholderId = `tab-${++seq}`;
    const fileName = normalized.split(/[/\\]/).pop() || normalized;
    const placeholder: Tab = {
      id: placeholderId,
      filePath: normalized,
      fileName,
      source: '',
      html: '',
      toc: [],
      scrollTop: 0,
      tocExpanded: {},
      isLoading: true,
    };
    set((s) => {
      const tabs = [...s.tabs, placeholder];
      syncSessionAndWatcher(tabs, placeholderId);
      return { tabs, activeTabId: placeholderId };
    });
    try {
      const tab = await buildTab(normalized);
      console.log('[openTab] tab built successfully:', tab.id, tab.fileName);
      set((s) => {
        const tabs = s.tabs.map((t) => (t.id === placeholderId ? { ...tab, id: placeholderId, isLoading: false } : t));
        syncSessionAndWatcher(tabs, placeholderId);
        return { tabs };
      });
    } catch (err) {
      console.error('[openTab] buildTab failed:', err);
      // 构建失败时保留 tab 但显示错误信息，而不是直接删除（避免链接点击后闪关）
      const errorMsg = err instanceof Error ? err.message : String(err);
      set((s) => {
        const tabs = s.tabs.map((t) => (
          t.id === placeholderId
            ? { ...t, isLoading: false, html: `<div class="mermaid-error" role="note">打开文件失败：${errorMsg}</div>`, source: '' }
            : t
        ));
        syncSessionAndWatcher(tabs, s.activeTabId);
        return { tabs };
      });
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

  closeTabsToLeft(id) {
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx <= 0) return s;
      const tabs = s.tabs.slice(idx);
      const activeTabId = tabs.some((t) => t.id === s.activeTabId) ? s.activeTabId : id;
      syncSessionAndWatcher(tabs, activeTabId);
      return { tabs, activeTabId };
    });
  },

  closeTabsToRight(id) {
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx < 0 || idx >= s.tabs.length - 1) return s;
      const tabs = s.tabs.slice(0, idx + 1);
      const activeTabId = tabs.some((t) => t.id === s.activeTabId) ? s.activeTabId : id;
      syncSessionAndWatcher(tabs, activeTabId);
      return { tabs, activeTabId };
    });
  },

  closeOtherTabs(id) {
    set((s) => {
      const tab = s.tabs.find((t) => t.id === id);
      if (!tab) return s;
      const tabs = [tab];
      syncSessionAndWatcher(tabs, id);
      return { tabs, activeTabId: id };
    });
  },

  moveTab(id, targetId) {
    if (id === targetId) return;
    set((s) => {
      const from = s.tabs.findIndex((t) => t.id === id);
      const to = s.tabs.findIndex((t) => t.id === targetId);
      if (from < 0 || to < 0) return s;
      const tabs = [...s.tabs];
      const [moved] = tabs.splice(from, 1);
      tabs.splice(to, 0, moved);
      syncSessionAndWatcher(tabs, s.activeTabId);
      return { tabs };
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
    // 重载时显示 loading 状态
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, isLoading: true } : t)),
    }));
    try {
      const next = await buildTab(tab.filePath);
      set((s) => ({
        tabs: s.tabs.map((t) => (
          t.id === id
            ? { ...next, id, scrollTop: t.scrollTop, tocExpanded: t.tocExpanded, isLoading: false }
            : t
        )),
        activeTabId: s.activeTabId,
      }));
    } catch {
      // 构建失败时恢复非 loading 状态，保留旧内容
      set((s) => ({
        tabs: s.tabs.map((t) => (t.id === id ? { ...t, isLoading: false } : t)),
      }));
    }
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
    const normalizedActive = session.activePath ? normalizePathKey(session.activePath) : null;
    const active = normalizedActive
      ? get().tabs.find((t) => normalizePathKey(t.filePath) === normalizedActive)
      : null;
    if (active) get().setActive(active.id);
  },
}));
