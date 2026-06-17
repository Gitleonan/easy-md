export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

export function modKey(): '⌘' | 'Ctrl' {
  return isMac() ? '⌘' : 'Ctrl';
}
