# 开发进度记录

> 最后更新：2026-06-18
> 当前分支：main
> 最新提交：`9731c31` fix: Ctrl+O shortcut, sidebar collapse, responsive layout, code copy button

---

## 项目概况

| 项 | 值 |
|----|-----|
| 应用名 | md++ |
| GitHub 项目名 | easy-md |
| 本地目录 | `E:\code\md++` |
| 技术栈 | Tauri v2 + React 18 + TypeScript + TailwindCSS + Zustand |
| 渲染引擎 | markdown-it + shiki + mermaid + katex |

---

## 已完成提交（按时间顺序）

| # | 提交哈希 | 消息 | 测试 |
|---|---------|------|------|
| 1 | `3f09b74` | docs: init project docs | — |
| 2 | `2867d5e` | feat(markdown): markdown-it render pipeline | 11 pass |
| 3 | `6a65cfe` | feat(markdown): shiki code highlighting | 4 pass |
| 4 | `4d28afc` | feat(markdown): mermaid diagram rendering | 4 pass |
| 5 | `c7a1f75` | feat(markdown): TOC extraction | 5 pass |
| 6 | `0436d46` | feat(search): TreeWalker full-text search | 7 pass |
| 7 | `1a18fd6` | feat(export): HTML/print/copy export | 3 pass |
| 8 | `c1b4924` | feat(theme): light/dark/system switching | 5 pass |
| 9 | `5f26517` | feat(tabs): Zustand tabs store | 6 pass |
| 10 | `9f89097` | feat(ui): complete frontend | — |
| 11 | `69d683b` | docs: development progress record | — |
| 12 | `d749d6b` | feat(backend): complete Tauri Rust backend + NSIS | — |
| 13 | `e7c92fc` | docs: update progress | — |
| 14 | `10cb0b9` | fix: use RecommendedWatcher (cross-platform) | — |
| 15 | `9731c31` | fix: Ctrl+O, sidebar collapse, responsive, code copy | — |

**前端测试：9 个文件，48 个测试全部通过**

---

## 完成状态总览

### ✅ 已完成

- [x] 项目文档（SPEC/DESIGN/README/进度记录）
- [x] 前端脚手架（React + TS + Vite + TailwindCSS）
- [x] 渲染管线（markdown-it + shiki + mermaid + TOC + 锚点注入）
- [x] 全文搜索（TreeWalker + 高亮导航）
- [x] 导出（PDF/HTML/打印/复制）
- [x] 主题切换（light/dark/system）
- [x] UI 组件（TitleBar/Sidebar/Content/SearchBar/Lightbox/Welcome/ExportDialog）
- [x] 状态管理（tabsStore/themeStore/searchStore/recentStore）
- [x] Hooks（useOpenFile/useGlobalShortcuts/useLightbox/useFileWatcher）
- [x] IPC 封装（files/system/recent）
- [x] 平台工具（isMac/modKey）
- [x] 完整样式（themes.css + prose.css）+ 响应式布局
- [x] Rust 后端源码（files/recent/watcher commands）
- [x] NSIS 右键关联脚本
- [x] lib.rs 命令注册 + argv 启动参数解析
- [x] Tauri capabilities 权限配置（dialog/fs/opener）
- [x] 前端 watcher 集成（tabsStore 自动同步文件监听）
- [x] Ctrl+O 快捷键打开文件对话框
- [x] Sidebar 收起/展开功能
- [x] 代码块复制按钮 + 语言标签
- [x] 响应式布局（768px/600px 断点）
- [x] 端口问题修复（1420→14300，避开 Windows 预留端口）
- [x] Rust 编译验证：`cargo check` ✓
- [x] 前端构建验证：`pnpm build` ✓
- [x] 前端测试验证：`pnpm test` ✓ (48/48)
- [x] 生产构建：`pnpm tauri build` ✓（MSI 6.1MB + NSIS 4.9MB）
- [x] 本地调试模式运行成功

### 🔧 已修复的 Bug

| Bug | 问题 | 修复 |
|-----|------|------|
| 1 | Ctrl+O 无法打开文件对话框 | useGlobalShortcuts 注册 Ctrl+O → openViaDialog |
| 2 | Sidebar 目录无法收起 | 添加收起/展开按钮 + collapsed 状态 |
| 3 | 页面不支持不同宽度自适应 | 添加 768px/600px 响应式断点 |
| 4 | 代码块无样式和复制功能 | enhanceCodeBlocks 包装器 + 复制按钮 + 语言标签 |

### ⚠️ 待完成

- [ ] GitHub 远端仓库创建与推送
- [ ] 安装包验收测试（安装后完整功能验证）
- [ ] 生产构建重新打包（含最新修复）

---

## 环境状态

| 工具 | 版本 | 状态 |
|------|------|------|
| Node.js | v24.15.0 | ✅ |
| pnpm | 10.33.4 | ✅ |
| Git | 2.54.0 | ✅ |
| Rust/Cargo | 1.96.0 | ✅ |
| VS 2022 Community + MSVC | 14.44.35207 | ✅ |
| gh CLI | — | ❌ 未装 |

**注意：** Windows 预留端口 1394-1493（Hyper-V/WSL），Vite dev 端口已改为 14300。

---

## 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染引擎 | markdown-it | 插件生态丰富 |
| 代码高亮 | shiki | VS Code 主题兼容 |
| 状态管理 | zustand | 轻量无样板 |
| 图片处理 | data URL | 自包含，导出可内嵌 |
| 搜索实现 | TreeWalker | 可控，精确高亮 |
| 主题切换 | CSS 变量 + data-theme | 避免重渲染 |
| 文件监听 | notify + 300ms 防抖 | 避免频繁刷新 |
| 代码块复制 | DOM 后处理包装器 | 不侵入渲染管线 |
| 响应式 | CSS 媒体查询 | 纯 CSS，无 JS 开销 |

---

## 下次继续的任务

### 1. GitHub 远端仓库

```bat
cd /d E:\code\md++
git remote add origin https://github.com/<your-account>/easy-md.git
git push -u origin main
```

### 2. 重新构建安装包（含最新修复）

```bat
set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"
cd /d E:\code\md++
pnpm tauri build
```

### 3. 安装包验收清单

- [ ] 右键 `.md` → "用 md++ 打开"
- [ ] Ctrl+O 打开文件对话框
- [ ] 拖拽打开
- [ ] Sidebar 收起/展开
- [ ] 响应式布局（窄屏适配）
- [ ] 代码块复制按钮
- [ ] 深浅主题切换
- [ ] 全文搜索
- [ ] 图片 lightbox
- [ ] 导出功能
- [ ] 文件监听自动刷新

---

## 实现计划完整文档

详细实现步骤（含代码）见：
`docs/superpowers/plans/2026-06-17-easy-md.md`
