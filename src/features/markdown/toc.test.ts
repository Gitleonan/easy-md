import { describe, it, expect } from 'vitest';
import { extractToc } from './toc';

describe('extractToc', () => {
  it('extracts h1-h6 with level and text', () => {
    const src = '# H1\n## H2\n### H3\ntext\n#### H4';
    const toc = extractToc(src);
    expect(toc).toEqual([
      { id: 'h1', level: 1, text: 'H1' },
      { id: 'h2', level: 2, text: 'H2' },
      { id: 'h3', level: 3, text: 'H3' },
      { id: 'h4', level: 4, text: 'H4' },
    ]);
  });

  it('handles duplicate headings with suffix', () => {
    const toc = extractToc('# A\n# A');
    expect(toc[0].id).toBe('a');
    expect(toc[1].id).toBe('a-1');
  });

  it('ignores headings inside code blocks', () => {
    const src = '# Real\n\n```\n# Fake\n```\n';
    const toc = extractToc(src);
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Real');
  });

  it('returns empty array for no headings', () => {
    expect(extractToc('just text\n\nmore text')).toEqual([]);
  });

  it('handles special characters in headings', () => {
    const toc = extractToc('# Hello World!');
    expect(toc[0].id).toBe('hello-world');
  });
});
