import { open as openDialog } from '@tauri-apps/plugin-dialog';

/** 弹出系统文件选择器，返回选中的 .md/.markdown 文件路径列表 */
export async function pickMdFiles(): Promise<string[] | null> {
  const result = await openDialog({
    multiple: true,
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  });
  if (!result) return null;
  return Array.isArray(result) ? result : [result];
}
