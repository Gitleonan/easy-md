import { useTabsStore } from '../../stores/tabsStore';
import { openViaDialog } from '../../hooks/useOpenFile';

interface TitleBarProps {
  onExportPdf: () => void;
}

function RefreshIcon() {
  return (
    <svg className="titlebar-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M15.5 6.5A6 6 0 1 0 16 10" />
      <path d="M15.5 3.5v3h-3" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="titlebar-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v9" />
      <path d="M6.5 8.5 10 12l3.5-3.5" />
      <path d="M4 14.5v1.5h12v-1.5" />
    </svg>
  );
}

export function TitleBar({ onExportPdf }: TitleBarProps) {
  const { tabs, activeTabId, setActive, closeTab, reloadTab } = useTabsStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <header className="titlebar">
      <button className="titlebar-open-btn" onClick={openViaDialog} title="打开文件 (Ctrl+O)">
        ＋
      </button>
      <div className="titlebar-tabs">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`titlebar-tab ${t.id === activeTabId ? 'active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            <span className="titlebar-tab-name">{t.fileName}</span>
            <button
              className="titlebar-tab-close"
              onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {activeTab && (
        <div className="titlebar-tools">
          <button
            className="titlebar-tool-btn titlebar-icon-btn"
            onClick={() => reloadTab(activeTab.id)}
            aria-label="重新载入当前文件"
            title="重新载入当前文件"
          >
            <RefreshIcon />
          </button>
          <button
            className="titlebar-tool-btn"
            onClick={onExportPdf}
            title="导出 PDF (Ctrl+P)"
          >
            <ExportIcon />
            <span>导出</span>
          </button>
        </div>
      )}
    </header>
  );
}
