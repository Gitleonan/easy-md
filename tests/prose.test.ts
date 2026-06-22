import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const proseCss = readFileSync('src/styles/prose.css', 'utf8');

describe('prose styles', () => {
  it('stacks code line numbers vertically in the gutter', () => {
    expect(proseCss).toMatch(/\.line-numbers[\s\S]*display:\s*flex/);
    expect(proseCss).toMatch(/\.line-numbers[\s\S]*flex-direction:\s*column/);
    expect(proseCss).toMatch(/\.line-number[\s\S]*display:\s*block/);
  });

  it('sizes the code line number gutter to rendered lines', () => {
    const gutterRule = proseCss.match(/\.line-numbers\s*\{[\s\S]*?\}/)?.[0] ?? '';
    const lineRule = proseCss.match(/\.line-number\s*\{[\s\S]*?\}/)?.[0] ?? '';

    expect(gutterRule).toContain('height: auto');
    expect(gutterRule).not.toMatch(/height:\s*calc/);
    expect(lineRule).toContain('height: 1lh');
  });

  it('keeps code content and line numbers on the same compact line rhythm', () => {
    const preRule = proseCss.match(/\.md-content pre\s*\{[\s\S]*?\}/)?.[0] ?? '';
    const gutterRule = proseCss.match(/\.line-numbers\s*\{[\s\S]*?\}/)?.[0] ?? '';
    const lineRule = proseCss.match(/\.line-number\s*\{[\s\S]*?\}/)?.[0] ?? '';
    const shikiLineRule = proseCss.match(/\.md-content \.shiki \.line\s*\{[\s\S]*?\}/)?.[0] ?? '';

    expect(preRule).toContain('line-height: 1.45');
    expect(gutterRule).toContain('line-height: 1.45');
    expect(lineRule).toContain('line-height: inherit');
    expect(shikiLineRule).toContain('line-height: inherit');
    // .shiki .line 是块级行（让行标记背景能撑满整行），但通过 min-height: 1lh
    // 锁定行高，与 .line-number 的 1lh 槽位仍能严格对齐。
    expect(shikiLineRule).toContain('min-height: 1lh');
  });

  it('keeps README badge image links inline without external-link arrows', () => {
    expect(proseCss).toContain('a.md-link-external:has(> img)::after');
    expect(proseCss).toContain('img.shields.io');
  });

  it('styles code-line-* classes for shiki-highlighted code blocks', () => {
    // 行标记样式必须存在（高亮/聚焦/新增/删除/错误/警告）
    expect(proseCss).toMatch(/\.shiki \.line\.code-line-highlight/);
    expect(proseCss).toMatch(/\.shiki \.line\.code-line-focus/);
    expect(proseCss).toMatch(/\.shiki \.line\.code-line-add/);
    expect(proseCss).toMatch(/\.shiki \.line\.code-line-remove/);
    expect(proseCss).toMatch(/\.shiki \.line\.code-line-error/);
    expect(proseCss).toMatch(/\.shiki \.line\.code-line-warning/);
    // 暗色主题
    expect(proseCss).toMatch(/\[data-theme="dark"\] .*\.line\.code-line-highlight/);
    const highlightRule = proseCss.match(/\.md-content \.shiki \.line\.code-line-highlight\s*\{[\s\S]*?\}/)?.[0] ?? '';
    expect(highlightRule).toContain('rgba(234, 179, 8');
    // 行号模式下的 ± 偏移
    expect(proseCss).toMatch(/\.line-numbers-mode.*\.code-line-add::before/);
    // 确保旧的 .line-highlight 等幽灵类已被移除
    expect(proseCss).not.toMatch(/\.line-highlight\s*\{/);
    expect(proseCss).not.toMatch(/\.line-add\s*\{/);
    expect(proseCss).not.toMatch(/\.line-focus\s*\{/);
    expect(proseCss).not.toMatch(/\.line-remove\s*\{/);
  });
});
