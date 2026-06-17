import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('resolves system theme to light or dark', () => {
    const store = useThemeStore.getState();
    store.setTheme('system');
    const resolved = useThemeStore.getState().resolved;
    expect(['light', 'dark']).toContain(resolved);
  });

  it('sets light theme explicitly', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().resolved).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets dark theme explicitly', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().resolved).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists theme choice to localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggle switches between light and dark', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().resolved).toBe('dark');
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().resolved).toBe('light');
  });
});
