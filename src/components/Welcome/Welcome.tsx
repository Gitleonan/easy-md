import { openViaDialog } from '../../hooks/useOpenFile';
import { useRecentStore } from '../../stores/recentStore';
import { useTabsStore } from '../../stores/tabsStore';
import { useEffect } from 'react';
import { modKey } from '../../utils/platform';

export function Welcome() {
  const { files, load } = useRecentStore();
  const openTab = useTabsStore((s) => s.openTab);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="welcome">
      <div className="welcome-inner">
        <h1 className="welcome-title">md++</h1>
        <p className="welcome-subtitle">轻量便捷的 Markdown 阅读器</p>
        <button className="welcome-open-btn" onClick={openViaDialog}>
          打开 Markdown 文件
        </button>
        <p className="welcome-hint">或将 .md 文件拖入窗口</p>
        <p className="welcome-shortcut">{modKey()}+O 打开文件</p>

        {files.length > 0 && (
          <div className="welcome-recent">
            <h3>最近打开</h3>
            <ul>
              {files.slice(0, 10).map((f) => (
                <li key={f.path}>
                  <button className="welcome-recent-item" onClick={() => openTab(f.path)}>
                    <span className="welcome-recent-name">{f.name}</span>
                    <span className="welcome-recent-path">{f.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
