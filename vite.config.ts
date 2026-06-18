import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri 期望前端开发服务器跑在 1420 端口
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  // Tauri 不需要清屏，便于看 dev 日志
  clearScreen: false,
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
