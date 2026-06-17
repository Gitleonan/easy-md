import type { RefObject } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { useThemeStore } from '../../stores/themeStore';
import { exportHtml, printContent, copyRichContent } from '../../features/export/export';

interface ExportDialogProps {
  visible: boolean;
  onClose: () => void;
  contentRef: RefObject<HTMLDivElement>;
}

export function ExportDialog({ visible, onClose, contentRef }: ExportDialogProps) {
  if (!visible) return null;
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const resolved = useThemeStore((s) => s.resolved);
  if (!tab || !contentRef.current) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>导出 / 分享</h3>
        <div className="export-buttons">
          <button onClick={() => printContent(contentRef.current!, resolved)}>
            系统打印 / 另存 PDF
          </button>
          <button onClick={() => exportHtml(tab.html, resolved)}>
            导出 HTML
          </button>
          <button onClick={() => copyRichContent(contentRef.current!)}>
            复制渲染内容
          </button>
        </div>
        <button className="modal-close" onClick={onClose}>取消</button>
      </div>
    </div>
  );
}
