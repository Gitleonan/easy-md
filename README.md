# easy-md

> **md++** — Windows 平台轻量、便捷的 Markdown 纯阅读器。架构预留 macOS 适配。

[![made with Tauri](https://img.shields.io/badge/made%20with-Tauri%20v2-orange)](https://tauri.app)
[![React](https://img.shields.io/badge/frontend-React%2018%20%2B%20TS-blue)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 特性

- 📖 **纯阅读器** — 专注内容呈现，无编辑干扰
- 🎨 **全语法渲染** — 标准 Markdown + KaTeX 数学公式 + shiki 代码高亮 + Mermaid 图表 + 任务列表/脚注/高亮标记
- 🗂️ **多标签页** — 顶部浏览器风格标签栏，独立记忆滚动与目录状态
- 📑 **双栏 TOC** — 左侧自动生成目录树，点击跳转，滚动联动
- 🌗 **深浅主题** — 浅色 / 深色 / 跟随系统，切换即时生效
- 🖼️ **图片完整支持** — 相对路径 + 绝对路径 + 网络图片，点击 Lightbox 放大
- 🔍 **全文搜索** — `Ctrl+F` 高亮所有匹配，上下导航
- 📤 **多格式导出** — PDF / HTML / 系统打印 / 复制渲染富文本
- 🔄 **文件监听** — 外部修改自动刷新（300ms 防抖）
- 🚀 **多入口打开** — 右键关联 / 拖拽 / 文件对话框 / 最近文件列表
- 🍎 **跨端预留** — 平台差异全部隔离在 Rust 层，前端零耦合，macOS 仅需补图标

---

## 📦 下载安装

前往 [Releases](../../releases) 下载最新的 Windows 安装包（`.msi` 或 `.exe`），双击安装即可。

**系统要求：** Windows 10 1809+（需 WebView2 运行时，Win11 默认自带）。

安装后会自动注册 `.md` / `.markdown` 文件的右键菜单 **"用 md++ 打开"**。

---

## 🛠️ 开发

### 前置环境

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 20 | 前端构建 |
| pnpm | ≥ 9 | 包管理（`npm i -g pnpm`） |
| Rust | stable | Tauri 后端编译（[安装](https://www.rust-lang.org/tools/install)） |
| Git | ≥ 2.30 | 版本控制 |

### 启动开发

```bash
git clone https://github.com/<your-account>/easy-md.git
cd easy-md
pnpm install
pnpm tauri dev
```

首次启动会编译 Rust 依赖（约 5-10 分钟），之后启动很快。

### 运行测试

```bash
pnpm test          # 前端单元测试（Vitest）
cd src-tauri && cargo test   # 后端 Rust 测试
```

### 构建安装包

```bash
pnpm tauri build
```

产物位于 `src-tauri/target/release/bundle/`，包含 `.msi` 与 `.exe`。

---

## 🎹 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+W` | 关闭当前标签 |
| `Ctrl+F` | 全文搜索 |
| `Ctrl+Shift+T` | 切换深浅主题 |
| `Ctrl+P` | 打印 / 导出 PDF |
| `Ctrl+Shift+C` | 复制渲染内容 |

> macOS 版本将使用 `⌘` 替代 `Ctrl`。

---

## 🏗️ 架构

```
Tauri v2 (Rust)  ── 文件 IO / 文件监听 / 系统集成 / 平台隔离
       ↕ Tauri Command 契约
React 18 + TS    ── 渲染管线 / UI / 状态管理 / 业务逻辑
```

- **Rust 后端**只做前端做不了的事（文件系统、监听、系统集成）
- **前端**完全平台无关，所有平台差异由 Rust `#[cfg(...)]` 隔离
- **渲染管线**纯前端：`markdown-it` → `shiki` → `mermaid` → 图片路径解析

详见 [docs/DESIGN.md](docs/DESIGN.md)。

---

## 📚 项目文档

- [功能规格清单](docs/SPEC.md)
- [设计方案](docs/DESIGN.md)
- [实现计划](docs/superpowers/plans/2026-06-17-easy-md.md)

---

## 🗺️ 路线图

- [x] v0.1 — Windows 首发，完整阅读功能
- [ ] v0.2 — macOS 适配（`.dmg` 分发）
- [ ] v0.3 — 性能优化（大文件 Web Worker 渲染）
- [ ] v0.4 — 自动更新

---

## 📄 License

MIT
