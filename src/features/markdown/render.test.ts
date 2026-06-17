import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './render';

describe('renderMarkdown', () => {
  it('renders headings', () => {
    const html = renderMarkdown('# Hello');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
  });

  it('renders unordered list', () => {
    const html = renderMarkdown('- a\n- b');
    expect(html).toContain('<ul');
    expect(html).toContain('<li>a</li>');
  });

  it('renders code block with language class', () => {
    const html = renderMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('language-ts');
  });

  it('renders inline code', () => {
    const html = renderMarkdown('use `code` here');
    expect(html).toContain('<code>code</code>');
  });

  it('renders task list checkbox', () => {
    const html = renderMarkdown('- [x] done\n- [ ] todo');
    expect(html).toMatch(/checkbox/i);
  });

  it('renders footnote', () => {
    const html = renderMarkdown('Text[^1]\n\n[^1]: note');
    expect(html).toMatch(/footnote/i);
  });

  it('renders highlight mark', () => {
    const html = renderMarkdown('==highlighted==');
    expect(html).toContain('<mark');
  });

  it('renders auto-linkified bare url', () => {
    const html = renderMarkdown('see https://example.com here');
    expect(html).toContain('href="https://example.com"');
  });

  it('renders inline math', () => {
    const html = renderMarkdown('$a + b = c$');
    // katex 渲染为带 class 的 span
    expect(html).toMatch(/katex/i);
  });

  it('renders table', () => {
    const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table');
    expect(html).toContain('<th>a</th>');
  });

  it('renders blockquote', () => {
    const html = renderMarkdown('> quoted');
    expect(html).toContain('<blockquote');
  });
});
