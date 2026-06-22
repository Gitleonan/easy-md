import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

vi.mock('./components/TitleBar/TitleBar', () => ({
  TitleBar: () => <header data-testid="titlebar" />,
}));

vi.mock('./components/Sidebar/Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />,
}));

vi.mock('./components/Content/Content', () => ({
  Content: () => <main data-testid="content" />,
}));

vi.mock('./components/Editor/Editor', () => ({
  Editor: () => <textarea data-testid="editor" />,
}));

vi.mock('./components/Welcome/Welcome', () => ({
  Welcome: () => <section data-testid="welcome" />,
}));

vi.mock('./components/SearchBar/SearchBar', () => ({
  SearchBar: () => <div data-testid="searchbar" />,
}));

vi.mock('./components/Lightbox/Lightbox', () => ({
  Lightbox: () => <div data-testid="lightbox" />,
}));

vi.mock('./components/ExportPdfModal/ExportPdfModal', () => ({
  ExportPdfModal: () => null,
}));

vi.mock('./components/AboutModal/AboutModal', () => ({
  AboutModal: () => null,
}));

vi.mock('./components/ThemeManager/ThemeManager', () => ({
  ThemeManager: () => null,
}));

vi.mock('./hooks/useOpenFile', () => ({
  useOpenFile: vi.fn(),
}));

vi.mock('./features/theme/useThemeInit', () => ({
  useThemeInit: vi.fn(),
}));

vi.mock('./features/fileWatch/useFileWatcher', () => ({
  useFileWatcher: vi.fn(),
}));

vi.mock('./hooks/useGlobalShortcuts', () => ({
  useGlobalShortcuts: vi.fn(),
}));

describe('App', () => {
  it('does not block the native context menu outside custom tab menus', () => {
    render(<App />);

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });

    screen.getByTestId('welcome').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
