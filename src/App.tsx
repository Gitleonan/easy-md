import { useRef, useEffect, useState, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Content } from './components/Content/Content';
import { Welcome } from './components/Welcome/Welcome';
import { SearchBar } from './components/SearchBar/SearchBar';
import { Lightbox } from './components/Lightbox/Lightbox';
import { useTabsStore } from './stores/tabsStore';
import { useOpenFile } from './hooks/useOpenFile';
import { useThemeInit } from './features/theme/useThemeInit';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useFileWatcher } from './features/fileWatch/useFileWatcher';
import { useRecentStore } from './stores/recentStore';
import { useThemeStore } from './stores/themeStore';
import { exportPdf } from './features/export/export';

export default function App() {
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  useOpenFile();
  useThemeInit();
  useFileWatcher();

  const contentRef = useRef<HTMLDivElement>(null);
  const hasTabs = useTabsStore((s) => s.tabs.length > 0);
  const activeTab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const record = useRecentStore((s) => s.record);
  const resolvedTheme = useThemeStore((s) => s.resolved);

  const loadRecent = useRecentStore((s) => s.load);
  const restoreSession = useTabsStore((s) => s.restoreSession);
  const exportCurrentPdf = useCallback(() => {
    if (!contentRef.current) return;
    void exportPdf(contentRef.current, resolvedTheme);
  }, [resolvedTheme]);

  useGlobalShortcuts({ onExportPdf: exportCurrentPdf });

  // 恢复刷新前打开的标签，避免 WebView 右键刷新后回到空状态。
  useEffect(() => {
    loadRecent();
    restoreSession();
  }, [loadRecent, restoreSession]);

  // 命令行参数打开文件
  useEffect(() => {
    const unlisten = listen<string[]>('open-on-startup', async (e) => {
      for (const p of e.payload) await useTabsStore.getState().openTab(p);
    });
    return () => { unlisten.then((u) => u()); };
  }, []);

  // 记录最近文件
  useEffect(() => {
    if (activeTab) record(activeTab.filePath, activeTab.fileName);
  }, [activeTab?.id, record]);

  return (
    <div className="app">
      <TitleBar onExportPdf={exportCurrentPdf} />
      {hasTabs && activeTab && <SearchBar contentRef={contentRef} />}
      <div className="app-body">
        {hasTabs && activeTab && <Sidebar toc={activeTab.toc} activeId={activeHeadingId} />}
        {hasTabs ? (
          <Content contentRef={contentRef} onActiveHeadingChange={setActiveHeadingId} />
        ) : (
          <Welcome />
        )}
      </div>
      <Lightbox />
    </div>
  );
}
