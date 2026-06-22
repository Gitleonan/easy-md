import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri 期望前端开发服务器跑在 1420 端口
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  // Tauri 不需要清屏，便于看 dev 日志
  clearScreen: false,
  // Mermaid v11 把每种图表 (flowchart / gantt / …) 拆成动态 import 的子 chunk，
  // 加上它依赖的 dayjs 是 CJS-only，没法以原生 ESM 方式被浏览器消费。
  // 这里显式 include mermaid 及其那些会被 await import() 进来的内部入口，
  // 让 Vite 一次性预构建打通整个依赖树。
  optimizeDeps: {
    include: [
      'mermaid',
      'mermaid > dayjs',
      'mermaid > dayjs/plugin/isoWeek.js',
      'mermaid > dayjs/plugin/customParseFormat.js',
      'mermaid > dayjs/plugin/advancedFormat.js',
      'mermaid > dayjs/plugin/duration.js',
    ],
  },
  server: {
    port: 14300,
    strictPort: true,
    host: host || '127.0.0.1',
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
    watch: {
      // 忽略 src-tauri，避免 Rust 改动触发前端 HMR
      ignored: ['**/src-tauri/**'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
