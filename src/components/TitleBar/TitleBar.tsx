import { useTabsStore } from '../../stores/tabsStore';
import { useThemeStore } from '../../stores/themeStore';
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

function SunIcon() {
  return (
    <svg className="titlebar-icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="titlebar-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M17.3 11.3A7 7 0 0 1 8.7 2.7 7 7 0 1 0 17.3 11.3z" />
    </svg>
  );
}

export function TitleBar({ onExportPdf }: TitleBarProps) {
  const { tabs, activeTabId, setActive, closeTab, reloadTab } = useTabsStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const resolved = useThemeStore((s) => s.resolved);
  const toggleTheme = useThemeStore((s) => s.toggle);

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
      <div className="titlebar-tools">
        <button
          className="titlebar-tool-btn titlebar-icon-btn"
          onClick={toggleTheme}
          aria-label={resolved === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
          title={resolved === 'dark' ? '切换到日间模式 (Ctrl+Shift+T)' : '切换到夜间模式 (Ctrl+Shift+T)'}
        >
          {resolved === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        {activeTab && (
          <>
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
          </>
        )}
      </div>
    </header>
  );
}
