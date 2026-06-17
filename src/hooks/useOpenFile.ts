import { useEffect } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useTabsStore } from '../stores/tabsStore';
import { pickMdFiles } from '../ipc/system';

const MD_EXT = /\.(md|markdown)$/i;

/** 拖拽 + 文件对话框打开文件 hook */
export function useOpenFile() {
  const openTab = useTabsStore((s) => s.openTab);

  // 拖拽
  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent(async (e) => {
      if (e.payload.type === 'drop') {
        const paths = (e.payload.paths || []).filter((p: string) => MD_EXT.test(p));
        for (const p of paths) await openTab(p);
      }
    });
    return () => { unlisten.then((u) => u()); };
  }, [openTab]);
}

/** 通过文件对话框打开 */
export async function openViaDialog() {
  const paths = await pickMdFiles();
  if (!paths) return;
  for (const p of paths) {
    await useTabsStore.getState().openTab(p);
  }
}
