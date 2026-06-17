export interface TocItem {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  source: string;
  html: string;
  toc: TocItem[];
  scrollTop: number;
  tocExpanded: Record<string, boolean>;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpenedAt: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
