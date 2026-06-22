import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'katex/dist/katex.min.css';
import './styles/themes.css';
import './styles/prose.css';
import './styles/index.css';

// 屏蔽右键菜单 — 调试模式下放行（允许审查元素）
let debugMode = localStorage.getItem('mdpp.debug') === 'true';
document.addEventListener('contextmenu', (e) => {
  if (!debugMode) e.preventDefault();
});
// 暴露给 AboutModal 调用
(window as unknown as Record<string, unknown>).__toggleDebug = (on: boolean) => {
  debugMode = on;
  localStorage.setItem('mdpp.debug', String(on));
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
