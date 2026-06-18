import { describe, it, expect } from 'vitest';
import { classifyLink, resolveLocalPath } from './links';

describe('classifyLink', () => {
  it('detects http(s) external links', () => {
    expect(classifyLink('https://example.com')).toEqual({ kind: 'external', url: 'https://example.com' });
    expect(classifyLink('http://example.com')).toEqual({ kind: 'external', url: 'http://example.com' });
  });

  it('detects mailto / tel as external', () => {
    expect(classifyLink('mailto:a@b.com')).toEqual({ kind: 'external', url: 'mailto:a@b.com' });
    expect(classifyLink('tel:+861234')).toEqual({ kind: 'external', url: 'tel:+861234' });
  });

  it('detects same-document anchors', () => {
    expect(classifyLink('#intro')).toEqual({ kind: 'anchor', hash: 'intro' });
  });

  it('detects relative .md links and splits hash', () => {
    expect(classifyLink('./other.md')).toEqual({ kind: 'mdFile', path: './other.md', hash: '' });
    expect(classifyLink('docs/spec.markdown#section')).toEqual({
      kind: 'mdFile', path: 'docs/spec.markdown', hash: 'section',
    });
  });

  it('decodes percent-escaped paths (markdown-it encodes spaces as %20)', () => {
    expect(classifyLink('./some%20file.md')).toEqual({
      kind: 'mdFile', path: './some file.md', hash: '',
    });
  });

  it('falls back to localFile for non-md relative paths', () => {
    expect(classifyLink('./diagram.png')).toEqual({ kind: 'localFile', path: './diagram.png' });
  });

  it('returns unknown for empty href', () => {
    expect(classifyLink('')).toEqual({ kind: 'unknown' });
  });
});

describe('resolveLocalPath', () => {
  it('joins relative path against the directory of the base file (Windows sep)', () => {
    expect(resolveLocalPath('C:\\docs\\note.md', './sub/other.md')).toBe('C:\\docs\\sub\\other.md');
  });

  it('handles parent traversal', () => {
    expect(resolveLocalPath('C:\\docs\\a\\note.md', '../b/x.md')).toBe('C:\\docs\\b\\x.md');
  });

  it('keeps absolute Windows path as-is and normalises separators', () => {
    expect(resolveLocalPath('C:\\docs\\note.md', 'D:/elsewhere/x.md')).toBe('D:\\elsewhere\\x.md');
  });

  it('keeps POSIX absolute path with POSIX base', () => {
    expect(resolveLocalPath('/home/user/note.md', '/abs/x.md')).toBe('/abs/x.md');
  });

  it('joins relative with POSIX base', () => {
    expect(resolveLocalPath('/home/user/note.md', './sub/x.md')).toBe('/home/user/sub/x.md');
  });
});
