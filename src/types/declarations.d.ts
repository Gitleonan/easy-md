declare module 'markdown-it-task-lists';
declare module 'markdown-it-footnote';
declare module 'markdown-it-mark';
declare module '@traptitech/markdown-it-katex';
declare module 'markdown-it-sub';
declare module 'markdown-it-sup';
declare module 'markdown-it-emoji' {
  export function bare(md: import('markdown-it').MarkdownIt): void;
  export function light(md: import('markdown-it').MarkdownIt): void;
  export function full(md: import('markdown-it').MarkdownIt): void;
}
declare module 'markdown-it-abbr';
declare module 'markdown-it-container';
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*?raw' {
  const src: string;
  export default src;
}
