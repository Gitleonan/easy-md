import { describe, expect, it } from 'vitest';
import { countMarkdownWords, getActiveHeadingId } from './Content';

describe('countMarkdownWords', () => {
  it('counts CJK characters and latin words from markdown text', () => {
    const source = '# 开发进度记录\n\n完成 export PDF and smooth scroll.\n\n`ignoredCode()`';

    expect(countMarkdownWords(source)).toBe(13);
  });
});

describe('getActiveHeadingId', () => {
  it('returns the latest heading above the viewport offset', () => {
    const container = document.createElement('div');
    container.innerHTML = '<h1 id="intro">Intro</h1><h2 id="details">Details</h2>';
    const [intro, details] = Array.from(container.querySelectorAll<HTMLElement>('h1,h2'));

    Object.defineProperty(intro, 'offsetTop', { value: 20 });
    Object.defineProperty(details, 'offsetTop', { value: 240 });
    container.scrollTop = 160;

    expect(getActiveHeadingId(container, 96)).toBe('details');
  });

  it('returns null without headings', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p>No headings</p>';

    expect(getActiveHeadingId(container)).toBeNull();
  });
});
