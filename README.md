# md++

> **md++** — 轻量化 Markdown 阅读器，支持 Windows / macOS。

[![made with Tauri](https://img.shields.io/badge/made%20with-Tauri%20v2-orange)](https://tauri.app)
[![React](https://img.shields.io/badge/frontend-React%2018%20%2B%20TS-blue)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---
![md++ 软件界面介绍图](assets/github-promo.png)

## 🤔 为什么做这个

Windows 下一直没有好用的 Markdown 预览工具。想快速看一眼 `.md` 文件的内容，要么得打开 VS Code 这样的重量级编辑器，要么得用浏览器配合插件，体验都不够便捷。

**md++** 就是为了解决这个问题——一个轻量、纯粹的 Markdown 阅读器，双击文件即可预览，需要时也能快速编辑。

## ✨ 特性

### 阅读体验
- 🎨 **全语法渲染** — 标准 Markdown + KaTeX 数学公式 + shiki 代码高亮 + Mermaid 图表
- 📑 **双栏 TOC** — 左侧目录树，点击跳转，滚动联动高亮，支持搜索过滤
- 🖼️ **图片增强** — 相对/绝对/网络图片，点击 Lightbox 放大，支持缩放（`+` / `-`）
- 📝 **代码块增强** — 行号、语言标签、一键复制
- 💡 **GitHub 风格** — NOTE / TIP / WARNING / CAUTION 警报块 + `:::` 自定义容器
- 🔗 **智能链接** — 外链用系统浏览器打开，`.md` 链接自动在新标签页打开
- ✏️ **快速编辑** — `Ctrl+E` 切换编辑模式，语法着色，`Ctrl+S` 保存

### 效率工具
- 🗂️ **多标签页** — 浏览器风格标签栏，拖拽排序，独立记忆滚动位置与目录状态
- 🔍 **全文搜索** — `Ctrl+F` 浮动搜索栏，高亮所有匹配，上下导航
- 📤 **多格式导出** — PDF / HTML / Markdown 原文件
- 🔄 **文件监听** — 外部修改自动刷新，编辑模式下自动跳过
- 🚀 **多入口** — 右键关联 / 拖拽 / 文件对话框 / 最近文件列表
- 💾 **会话恢复** — 重启后自动恢复上次打开的所有标签

### 界面与主题
- 🌗 **深浅主题** — 浅色 / 深色 / 跟随系统，一键切换（`Ctrl+Shift+T`）
- 🎨 **自定义主题** — 导入 CSS 文件自定义正文样式，内置「清新」「午夜」「学术」三套主题
- 🧘 **Zen 专注模式** — `Ctrl+Shift+Z` 进入，隐藏所有 UI 仅显示内容，`ESC` 退出
- 🪟 **毛玻璃 UI** — 标题栏、搜索栏、字数统计等采用毛玻璃模糊效果
- 🔝 **平滑滚动** — 回到顶部 / TOC 跳转 / 搜索导航均带缓动动画

### 跨平台
- 🍎 平台差异隔离在 Rust 层，前端零耦合，Windows / macOS 均已适配

---

## 📦 下载安装

前往 [Releases](../../releases) 下载对应平台的安装包：

| 平台 | 格式 | 系统要求 |
|------|------|----------|
| Windows | `.msi` | Windows 10 1809+（需 WebView2 运行时，Win11 默认自带） |
| macOS | `.dmg` | macOS 11.0+ (Big Sur) |

安装后可自动注册 `.md` / `.markdown` 文件的右键菜单 **"用 md++ 打开"**

---

## 🎹 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+F` | 全文搜索 |
| `Ctrl+E` | 切换编辑 / 预览模式 |
| `Ctrl+S` | 保存（编辑模式） |
| `Ctrl+P` | 导出 |
| `Ctrl+Shift+T` | 切换深浅主题 |
| `Ctrl+Shift+Z` | 进入 / 退出 Zen 专注模式 |
| `ESC` | 关闭搜索 / 退出 Zen 模式 / 关闭灯箱 |

> macOS 使用 `⌘` 替代 `Ctrl`。

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
git clone https://github.com/Gitleonan/easy-md.git
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

产物位于 `src-tauri/target/release/bundle/`：
- **Windows** — `.msi` 安装包
- **macOS** — `.dmg` 磁盘映像

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
- **状态管理**：zustand（tabsStore / editStore / themeStore / zenStore / searchStore）
- **图标库**：lucide-react（按需导入，最小打包）

---

## 🗺️ 路线图

- [x] v0.1 — Windows 首发，完整阅读功能
- [x] v0.2 — 编辑模式 / 自定义主题 / Zen 专注模式 / macOS 适配
- [ ] v0.3 — 监听修订模式

---

## 📄 License

MIT
