import { openUrl as openUrlPlugin, openPath as openPathPlugin } from '@tauri-apps/plugin-opener';

/** 用系统默认浏览器打开外链。 */
export async function openExternalUrl(url: string): Promise<void> {
  await openUrlPlugin(url);
}

/** 用系统默认应用打开本地文件路径。 */
export async function openLocalPath(path: string): Promise<void> {
  await openPathPlugin(path);
}
