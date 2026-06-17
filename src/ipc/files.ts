import { invoke } from '@tauri-apps/api/core';

/** 读取本地文件文本内容 */
export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path });
}

/** 解析图片路径，返回 data URL 或网络 URL */
export async function resolveImage(mdFilePath: string, src: string): Promise<string> {
  return invoke<string>('resolve_image', { mdFilePath, src });
}

/** 在已渲染的 DOM 中遍历所有 <img>，把相对/绝对路径换为 data URL */
export async function resolveImages(container: HTMLElement, mdFilePath: string): Promise<void> {
  const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      if (/^(https?:|data:)/.test(src)) return;
      try {
        const dataUrl = await resolveImage(mdFilePath, src);
        img.src = dataUrl;
      } catch {
        img.src = PLACEHOLDER;
      }
    }),
  );
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2Zz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PC9zdmc+';
