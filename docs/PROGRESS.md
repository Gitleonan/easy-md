# 开发进度记录

> 最后更新：2026-06-18
> 当前分支：main
> 最新提交：`d749d6b` feat(backend): complete Tauri Rust backend + NSIS + file watcher

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
| 1 | `3f09b74` | docs: init project docs (SPEC/DESIGN/plan/README) | — |
| 2 | `2867d5e` | feat(markdown): markdown-it render pipeline | 11 pass |
| 3 | `6a65cfe` | feat(markdown): shiki code highlighting | 4 pass |
| 4 | `4d28afc` | feat(markdown): mermaid diagram rendering | 4 pass |
| 5 | `c7a1f75` | feat(markdown): TOC extraction | 5 pass |
| 6 | `0436d46` | feat(search): TreeWalker full-text search | 7 pass |
| 7 | `1a18fd6` | feat(export): HTML/print/copy export | 3 pass |
| 8 | `c1b4924` | feat(theme): light/dark/system switching | 5 pass |
| 9 | `5f26517` | feat(tabs): Zustand tabs store | 6 pass |
| 10 | `9f89097` | feat(ui): complete frontend (components/styles/hooks/IPC) | — |
| 11 | `69d683b` | docs: add development progress record | — |
| 12 | `d749d6b` | feat(backend): complete Tauri Rust backend + NSIS + file watcher | — |

**前端测试：9 个文件，48 个测试全部通过**

---

## 完成状态总览

### ✅ 已完成

- [x] 项目文档（SPEC/DESIGN/README/进度记录）
- [x] 前端脚手架（React + TS + Vite + TailwindCSS）
- [x] 渲染管线（markdown-it + shiki + mermaid + TOC）
- [x] 全文搜索（TreeWalker + 高亮导航）
- [x] 导出（PDF/HTML/打印/复制）
- [x] 主题切换（light/dark/system）
- [x] UI 组件（TitleBar/Sidebar/Content/SearchBar/Lightbox/Welcome/ExportDialog）
- [x] 状态管理（tabsStore/themeStore/searchStore/recentStore）
- [x] Hooks（useOpenFile/useGlobalShortcuts/useLightbox/useFileWatcher）
- [x] IPC 封装（files/system/recent）
- [x] 平台工具（isMac/modKey）
- [x] 完整样式（themes.css + prose.css）
- [x] Rust 后端源码（files/recent/watcher commands）
- [x] NSIS 右键关联脚本
- [x] lib.rs 命令注册 + argv 启动参数解析
- [x] 前端 watcher 集成（tabsStore 自动同步文件监听）
- [x] 前端构建验证：`pnpm build` ✓
- [x] 前端测试验证：`pnpm test` ✓ (48/48)

### ⛔ 待完成（阻塞于 MSVC Build Tools）

- [ ] Rust 编译验证：`cargo check`（需要 MSVC）
- [ ] 开发模式验证：`pnpm tauri dev`（需要 MSVC）
- [ ] 生产构建：`pnpm tauri build`（需要 MSVC）
- [ ] 安装包验收测试
- [ ] GitHub 远端仓库创建与推送

---

## 文件结构（当前状态）

```
E:\code\md++\
├── docs/
│   ├── SPEC.md                          # 功能规格清单
│   ├── DESIGN.md                        # 设计方案
│   ├── PROGRESS.md                      # 开发进度（本文档）
│   └── superpowers/plans/
│       └── 2026-06-17-easy-md.md        # 实现计划
├── scripts/
│   └── register-file-association.nsh    # NSIS 右键关联脚本
├── src/                                 # 前端源码（React + TS）
│   ├── main.tsx                         # 入口
│   ├── App.tsx                          # 根组件（组装所有功能）
│   ├── components/
│   │   ├── TitleBar/TitleBar.tsx        # 顶部标签栏
│   │   ├── Sidebar/Sidebar.tsx          # 左侧 TOC 目录
│   │   ├── Content/Content.tsx          # 右侧内容区
│   │   ├── SearchBar/SearchBar.tsx      # 搜索栏
│   │   ├── Lightbox/Lightbox.tsx        # 图片放大
│   │   ├── Welcome/Welcome.tsx          # 欢迎页
│   │   └── ExportDialog/ExportDialog.tsx # 导出对话框
│   ├── features/
│   │   ├── markdown/
│   │   │   ├── plugins.ts              # markdown-it + 插件链
│   │   │   ├── render.ts               # 主渲染入口
│   │   │   ├── highlight.ts            # shiki 代码高亮
│   │   │   ├── mermaid.ts              # mermaid 图表
│   │   │   ├── toc.ts                  # TOC 提取
│   │   │   ├── anchors.ts              # DOM 锚点注入
│   │   │   └── rehighlight.ts          # 主题切换重高亮
│   │   ├── search/search.ts            # 全文搜索
│   │   ├── export/export.ts            # 导出（HTML/打印/复制）
│   │   ├── theme/useThemeInit.ts       # 主题初始化 hook
│   │   └── fileWatch/useFileWatcher.ts # 文件监听 hook
│   ├── stores/
│   │   ├── tabsStore.ts                # 标签页状态（含 watcher 同步）
│   │   ├── themeStore.ts               # 主题状态
│   │   ├── searchStore.ts              # 搜索状态
│   │   └── recentStore.ts              # 最近文件
│   ├── hooks/
│   │   ├── useOpenFile.ts              # 拖拽 + 对话框打开
│   │   ├── useGlobalShortcuts.ts       # 全局快捷键
│   │   └── useLightbox.ts              # Lightbox 状态
│   ├── ipc/
│   │   ├── files.ts                    # Tauri 文件命令（含 watchFiles）
│   │   ├── system.ts                   # 系统对话框
│   │   └── recent.ts                   # 最近文件命令
│   ├── utils/platform.ts               # 平台判断（isMac/modKey）
│   ├── types/
│   │   ├── index.ts                    # 全局类型定义
│   │   └── declarations.d.ts           # 模块声明
│   └── styles/
│       ├── index.css                   # Tailwind 入口
│       ├── themes.css                  # 主题变量 + 全部组件样式
│       └── prose.css                   # 内容区排版
├── src-tauri/                           # Rust 后端
│   ├── Cargo.toml                      # 依赖（notify/base64/dirs/dialog/fs）
│   ├── tauri.conf.json                 # 窗口/CSP/打包/NSIS 配置
│   └── src/
│       ├── main.rs                     # Tauri 入口
│       ├── lib.rs                      # 注册所有命令 + plugins + argv
│       ├── commands/
│       │   ├── mod.rs                  # 模块导出
│       │   ├── files.rs                # read_text_file, resolve_image
│       │   └── recent.rs              # list_recent, add_recent
│       └── watcher.rs                 # watch_files 命令（notify + debounce）
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.js
```

---

## 环境状态

| 工具 | 版本 | 状态 |
|------|------|------|
| Node.js | v24.15.0 | ✅ |
| pnpm | 10.33.4 | ✅ |
| Git | 2.54.0 | ✅ |
| Rust/Cargo | 1.96.0 | ✅ 已装（需 PATH 补 `~/.cargo/bin`） |
| VS 2022 Community | — | ✅ 壳已装 |
| **MSVC C++ 编译器** | — | **❌ 未装（阻塞 Tauri 编译）** |
| gh CLI | — | ❌ 未装 |

**注意：** Rust 的 `cargo` 在当前 shell 需要手动补 PATH：
```bat
set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"
```

---

## ⛔ 当前阻塞项

**MSVC C++ 编译器缺失**，导致 `cargo check` 报 `linker link.exe not found`。

`VC\Tools\MSVC\14.44.35207\bin` 目录不存在——只有 `include`/`modules`/`Auxiliary`，缺少编译器二进制（`cl.exe`/`link.exe`）。

### 解决步骤

1. 开始菜单搜索 **"Visual Studio Installer"** → 打开
2. 找到 **Visual Studio Community 2022** → 点 **"修改"**
3. 在 "工作负载" 标签页，勾选 **"使用 C++ 的桌面开发"**
4. 展开右侧 "安装详细信息"，**确认包含**：
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 生成工具（最新）**
   - ✅ **Windows 11 SDK** 或 **Windows 10 SDK**
5. 点右下角 **"修改"** 开始下载安装（约 6-8 GB，10-20 分钟）

> ⚠️ 关键判断标志：装好后 `C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64\link.exe` 必须存在。

---

## 下次继续的任务

### 1. 验证 Rust 编译（需 MSVC 就绪）

```bat
set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"
cd /d E:\code\md++\src-tauri
cargo check
```

### 2. 开发模式验证

```bat
cd /d E:\code\md++
pnpm tauri dev
```

- 验证窗口弹出
- 验证拖拽打开 .md 文件
- 验证 TOC、搜索、主题、Lightbox、导出
- 验证外部编辑后自动刷新

### 3. 构建安装包

```bat
pnpm tauri build
```

产物在 `src-tauri/target/release/bundle/` 下：
- `msi/` — MSI 安装包
- `nsis/` — EXE 安装包（含右键关联）

### 4. 验收清单

- [ ] 右键 `.md` → "用 md++ 打开"
- [ ] 拖拽打开
- [ ] 文件对话框打开
- [ ] 最近文件列表
- [ ] 命令行参数打开
- [ ] 深浅主题切换
- [ ] 全文搜索
- [ ] 图片 lightbox
- [ ] 导出（PDF/HTML/打印/复制）
- [ ] 文件监听自动刷新
- [ ] 安装/卸载注册表清理

### 5. GitHub 远端仓库

手动创建（gh CLI 未装）：
1. 到 https://github.com/new 新建仓库 `easy-md`
2. 本地推送：
```bat
cd /d E:\code\md++
git remote add origin https://github.com/<your-account>/easy-md.git
git push -u origin main
```

---

## 已知技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染引擎 | markdown-it（非 remark） | 插件生态丰富，配置简单 |
| 代码高亮 | shiki（非 prism） | VS Code 主题兼容，渲染准确 |
| 状态管理 | zustand（非 redux） | 轻量无样板，单文件可测 |
| 图片处理 | data URL（非 tauri:// 协议） | 自包含，导出 HTML 时可内嵌 |
| 搜索实现 | TreeWalker（非 window.find） | 可控，支持精确高亮和导航 |
| 主题切换 | CSS 变量 + data-theme 属性 | 避免重渲染，性能好 |
| 导出 PDF | 浏览器原生 print（非自建引擎） | 简化实现，用户可选"打印到 PDF" |
| 平台隔离 | Rust #[cfg] + 前端零耦合 | Mac 适配仅需补后端命令 |
| 文件监听 | notify crate + 300ms 防抖 | 避免编辑器频繁保存导致抖动 |
| 目录结构 | features/ 按业务聚合 | 文件按"一起变化"原则组织 |

---

## 实现计划完整文档

详细实现步骤（含代码）见：
`docs/superpowers/plans/2026-06-17-easy-md.md`
