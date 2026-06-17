import { buildTocTree } from '../Sidebar/Sidebar';
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
});
