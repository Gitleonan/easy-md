import { useTabsStore } from '../../stores/tabsStore';
import { openViaDialog } from '../../hooks/useOpenFile';

export function TitleBar() {
  const { tabs, activeTabId, setActive, closeTab } = useTabsStore();

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
    </header>
  );
}
