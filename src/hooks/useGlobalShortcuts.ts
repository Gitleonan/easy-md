import { useEffect } from 'react';
import { useSearchStore } from '../stores/searchStore';
import { useThemeStore } from '../stores/themeStore';
import { isMac } from '../utils/platform';
import { openViaDialog } from './useOpenFile';

interface GlobalShortcutsOptions {
  onExportPdf?: () => void;
}

export function useGlobalShortcuts(options: GlobalShortcutsOptions = {}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = isMac() ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        useSearchStore.getState().setVisible(true);
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        useThemeStore.getState().toggle();
      } else if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openViaDialog();
      } else if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        options.onExportPdf?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options.onExportPdf]);
}
