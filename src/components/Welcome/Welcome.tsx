import { openViaDialog } from '../../hooks/useOpenFile';
import { useRecentStore } from '../../stores/recentStore';
import { useTabsStore } from '../../stores/tabsStore';
import { useEffect } from 'react';
import { modKey } from '../../utils/platform';
import appIcon from '../../assets/app-icon.svg';

export function formatRecentOpenedAt(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();

  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isSameDay(date, today)) return `今天 ${time}`;
  if (isSameDay(date, yesterday)) return `昨天 ${time}`;

  return date.toLocaleDateString('zh-CN', {
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    month: 'numeric',
    day: 'numeric',
  }) + ` ${time}`;
}

export function Welcome() {
  const { files, load } = useRecentStore();
  const openTab = useTabsStore((s) => s.openTab);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="welcome">
      <div className="welcome-inner">
        <img className="welcome-icon" src={appIcon} alt="" aria-hidden="true" />
        <h1 className="welcome-title">md++</h1>
        <p className="welcome-subtitle">轻量便捷的 Markdown 阅读器</p>
        <button className="welcome-open-btn" onClick={openViaDialog}>
          打开 Markdown 文件
        </button>
        <p className="welcome-hint">或将 .md 文件拖入窗口</p>
        <p className="welcome-shortcut">{modKey()}+O 打开文件</p>

        {files.length > 0 && (
          <div className="welcome-recent">
            <div className="welcome-recent-header">
              <h3>最近打开</h3>
              <span>启动时快速回到上次阅读</span>
            </div>
            <ul>
              {files.slice(0, 10).map((f) => (
                <li key={f.path}>
                  <button className="welcome-recent-item" onClick={() => openTab(f.path)}>
                    <span className="welcome-recent-main">
                      <span className="welcome-recent-name">{f.name}</span>
                      <span className="welcome-recent-time">{formatRecentOpenedAt(f.lastOpenedAt)}</span>
                    </span>
                    <span className="welcome-recent-path" title={f.path}>{f.path}</span>
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
