import type { TocItem } from '../../types';

/** 在渲染后的 DOM 上为 h1-h6 注入 id，与 TOC 提取的 slug 算法保持一致 */
export function injectAnchors(container: HTMLElement, _toc: TocItem[]): void {
  const headings = Array.from(container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'));
  const seen = new Map<string, number>();
  for (const h of headings) {
    const text = h.textContent || '';
    const base = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    h.id = count === 0 ? base : `${base}-${count}`;
  }
}
