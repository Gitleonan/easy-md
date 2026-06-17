import { md } from './plugins';
import type { TocItem } from '../../types';

/** 在 markdown-it 解析时收集 heading token，返回扁平 TOC */
export function extractToc(source: string): TocItem[] {
  const tokens = md.parse(source, {});
  const items: TocItem[] = [];
  const seen = new Map<string, number>();

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open') {
      const level = Number(t.tag.slice(1)) as TocItem['level'];
      // 下一个 inline token 是标题文本
      const inline = tokens[i + 1];
      const text = inline?.content ?? '';
      const id = slugify(text, seen);
      items.push({ id, level, text });
    }
  }
  return items;
}

function slugify(text: string, seen: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}
