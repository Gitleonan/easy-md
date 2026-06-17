import { useRef, useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Content } from './components/Content/Content';
import { Welcome } from './components/Welcome/Welcome';
import { SearchBar } from './components/SearchBar/SearchBar';
import { Lightbox } from './components/Lightbox/Lightbox';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { useTabsStore } from './stores/tabsStore';
import { useOpenFile } from './hooks/useOpenFile';
import { useThemeInit } from './features/theme/useThemeInit';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useRecentStore } from './stores/recentStore';

export default function App() {
  useOpenFile();
  useThemeInit();
  useGlobalShortcuts();

  const contentRef = useRef<HTMLDivElement>(null);
  const hasTabs = useTabsStore((s) => s.tabs.length > 0);
  const activeTab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const record = useRecentStore((s) => s.record);

  const [exportVisible, setExportVisible] = useState(false);

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
      <TitleBar />
      {hasTabs && activeTab && <SearchBar contentRef={contentRef} />}
      <div className="app-body">
        {hasTabs && activeTab && <Sidebar toc={activeTab.toc} />}
        {hasTabs ? <Content contentRef={contentRef} /> : <Welcome />}
      </div>
      <Lightbox />
      <ExportDialog
        visible={exportVisible}
        onClose={() => setExportVisible(false)}
        contentRef={contentRef}
      />
    </div>
  );
}
