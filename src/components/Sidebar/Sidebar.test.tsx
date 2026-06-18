import { buildTocTree, filterTocTree, splitHighlightedText } from '../Sidebar/Sidebar';
import { describe, it, expect } from 'vitest';

describe('buildTocTree', () => {
  it('nests children by level', () => {
    const flat = [
      { id: 'a', level: 1 as const, text: 'A' },
      { id: 'b', level: 2 as const, text: 'B' },
      { id: 'c', level: 2 as const, text: 'C' },
      { id: 'd', level: 3 as const, text: 'D' },
    ];
    const tree = buildTocTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![1].children).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    expect(buildTocTree([])).toEqual([]);
  });

  it('handles same level items', () => {
    const flat = [
      { id: 'a', level: 1 as const, text: 'A' },
      { id: 'b', level: 1 as const, text: 'B' },
    ];
    const tree = buildTocTree(flat);
    expect(tree).toHaveLength(2);
  });

  it('filters nodes and keeps matching descendants', () => {
    const tree = buildTocTree([
      { id: 'a', level: 1 as const, text: 'Intro' },
      { id: 'b', level: 2 as const, text: 'Install Windows' },
      { id: 'c', level: 1 as const, text: 'API' },
    ]);

    const filtered = filterTocTree(tree, 'windows');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].text).toBe('Intro');
    expect(filtered[0].children?.[0].text).toBe('Install Windows');
  });

  it('splits matched TOC text case-insensitively', () => {
    expect(splitHighlightedText('Install Windows', 'win')).toEqual([
      { text: 'Install ', match: false },
      { text: 'Win', match: true },
      { text: 'dows', match: false },
    ]);
  });
});
