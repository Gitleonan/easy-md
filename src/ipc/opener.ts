import { openUrl as openUrlPlugin, openPath as openPathPlugin } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';

/** 用系统默认浏览器打开外链。 */
export async function openExternalUrl(url: string): Promise<void> {
  await openUrlPlugin(url);
}

/** 用系统默认应用打开本地文件路径。 */
export async function openLocalPath(path: string): Promise<void> {
  await openPathPlugin(path);
}

/** 在系统文件管理器中显示本地文件。 */
export async function openContainingFolder(path: string): Promise<void> {
  await invoke('open_containing_folder', { path });
}

/** 注册为 .md / .markdown 文件的默认打开方式 */
export async function registerFileAssociation(): Promise<void> {
  await invoke('register_file_association');
}
