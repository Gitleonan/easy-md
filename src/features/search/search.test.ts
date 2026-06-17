import { describe, it, expect, beforeEach } from 'vitest';
import { highlightMatches, clearHighlights, focusMatch } from './search';

describe('search', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
  });

  it('wraps matches in <mark>', () => {
    root.innerHTML = '<p>hello world hello</p>';
    const matches = highlightMatches(root, 'hello');
    expect(matches).toBe(2);
    expect(root.querySelectorAll('mark').length).toBe(2);
  });

  it('handles case insensitive search', () => {
    root.innerHTML = '<p>Hello HELLO hello</p>';
    expect(highlightMatches(root, 'hello')).toBe(3);
  });

  it('returns 0 for empty keyword', () => {
    root.innerHTML = '<p>hello</p>';
    expect(highlightMatches(root, '')).toBe(0);
  });

  it('returns 0 for no matches', () => {
    root.innerHTML = '<p>hello world</p>';
    expect(highlightMatches(root, 'xyz')).toBe(0);
  });

  it('skips script and style tags', () => {
    root.innerHTML = '<p>cat</p><script>cat</script><style>cat</style>';
    expect(highlightMatches(root, 'cat')).toBe(1);
  });

  it('clearHighlights removes search marks', () => {
    root.innerHTML = '<p><mark class="search-mark">hi</mark></p>';
    clearHighlights(root);
    expect(root.querySelectorAll('mark').length).toBe(0);
  });

  it('focusMatch toggles current class', () => {
    root.innerHTML = '<p>aaa aaa aaa</p>';
    highlightMatches(root, 'aaa');
    const marks = Array.from(root.querySelectorAll<HTMLElement>('mark'));
    focusMatch(marks, 1);
    expect(marks[1].classList.contains('search-mark-current')).toBe(true);
    expect(marks[0].classList.contains('search-mark-current')).toBe(false);
  });
});
