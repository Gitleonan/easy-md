import { useEffect, useRef, useState } from 'react';

interface ExportPdfModalProps {
  open: boolean;
  fileName: string | null;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/**
 * 导出 PDF 前的应用层弹窗。
 * 目的：与系统打印对话框做出明显视觉区分——先在 app 内呈现“将要导出 X”，
 * 用户点击「打开打印对话框」后再吊起 webview 的系统打印 UI。
 */
export function ExportPdfModal({ open, fileName, onConfirm, onClose }: ExportPdfModalProps) {
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // 进入弹窗后焦点交给主按钮，方便键盘操作。
  useEffect(() => {
    if (!open) {
      setBusy(false);
      return;
    }
    const btn = dialogRef.current?.querySelector<HTMLButtonElement>('[data-primary]');
    btn?.focus();
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <div
      className="export-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        ref={dialogRef}
      >
        <div className="export-modal-header">
          <span className="export-modal-badge">md++</span>
          <h3 id="export-modal-title">导出 PDF</h3>
        </div>
        {fileName && (
          <p className="export-modal-target">
            <span className="export-modal-target-label">当前文档</span>
            <span className="export-modal-target-name">{fileName}</span>
          </p>
        )}
        <p className="export-modal-hint">
          点击下方按钮后会调起<strong>系统打印对话框</strong>，请在「目的地 / Destination」中选择
          <strong>「另存为 PDF」</strong>，然后保存到本地文件即可。
        </p>
        <div className="export-modal-actions">
          <button type="button" className="export-modal-btn" onClick={onClose} disabled={busy}>
            取消
          </button>
          <button
            type="button"
            className="export-modal-btn primary"
            data-primary
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? '准备中…' : '打开打印对话框'}
          </button>
        </div>
      </div>
    </div>
  );
}
