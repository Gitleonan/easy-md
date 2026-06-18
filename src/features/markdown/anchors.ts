import type { TocItem } from '../../types';
import { slugifyHeading } from './slug';

/** 在渲染后的 DOM 上为 h1-h6 注入 id，与 TOC 提取的 slug 算法保持一致 */
export function injectAnchors(container: HTMLElement, toc: TocItem[]): void {
  const headings = Array.from(container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'));
  const seen = new Map<string, number>();
  for (const [index, h] of headings.entries()) {
    const text = h.textContent || '';
    h.id = toc[index]?.id ?? slugifyHeading(text, seen);
  }
}
