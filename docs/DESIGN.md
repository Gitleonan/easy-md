# md++ (easy-md) — 设计方案

> 配套文档: [SPEC.md](./SPEC.md) · [实现计划](./superpowers/plans/2026-06-17-easy-md.md)

---

## 1. 总体架构

```
┌──────────────────────────────────────────────────────────────┐
│                        Tauri 主进程 (Rust)                     │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  文件系统命令     │  │  文件监听       │  │  窗口/菜单    │  │
│  │  read_file       │  │  notify crate   │  │  title bar   │  │
│  │  resolve_image   │  │  (防抖 300ms)   │  │  tray        │  │
│  │  recent_files    │  └─────────────────┘  └──────────────┘  │
│  └──────────────────┘                                          │
│           ▲ invoke / event  ▲                                  │
└───────────┼──────────────────┼──────────────────────────────────┘
            │                  │
┌───────────┼──────────────────┼──────────────────────────────────┐
│           ▼                  ▼           WebView2 / WKWebView    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  React 应用 (TypeScript)                 │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │  状态管理    │  │  渲染管线     │  │  UI 组件       │   │   │
│  │  │  (Zustand)  │  │  markdown-it │  │  Tabs/TOC/     │   │   │
│  │  │  tabsStore  │  │  + shiki     │  │  Content/      │   │   │
│  │  │  themeStore │  │  + katex     │  │  Search/       │   │   │
│  │  │  recentStore│  │  + mermaid   │  │  Lightbox/     │   │   │
│  │  └─────────────┘  └──────────────┘  │  Export        │   │   │
│  │                                      └────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**关键设计原则：**
- **前后端职责清晰**：Rust 只做"前端做不了的事"（文件 IO、监听、系统集成）；所有渲染、UI 逻辑留在前端。
- **平台隔离在 Rust 层**：前端永远通过统一的 Tauri Command 调用后端，平台差异由 Rust `#[cfg(...)]` 屏蔽。
- **渲染管线纯前端**：markdown-it 链路完全在 WebView 中跑，方便 Mac 直接复用。

---

## 2. 技术选型

### 2.1 核心框架

| 层级 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 应用壳 | **Tauri** | v2 | 体积小、性能好、原生支持 Win/Mac/Linux |
| 前端框架 | **React** | 18+ | 生态成熟、团队/作者熟悉 |
| 语言 | **TypeScript** | 5+ | 大型应用必备类型安全 |
| 样式 | **TailwindCSS** | v3 | 与极简风一致，主题切换方便 |
| 构建 | **Vite** | 5+ | Tauri 默认搭档，HMR 快 |
| 包管理 | **pnpm** | 9+ | 速度快、磁盘占用小 |

### 2.2 渲染与功能库

| 用途 | 选型 | 说明 |
|------|------|------|
| Markdown 解析 | `markdown-it` | 插件化架构，扩展性强 |
| 数学公式 | `@traptitech/markdown-it-katex` + `katex` | 支持 `$...$` / `$$...$$` |
| 代码高亮 | `shiki` | 主题丰富（VS Code 兼容）、渲染准确 |
| 图表 | `mermaid` | 流程图/时序图/甘特图 |
| 任务列表 | `markdown-it-task-lists` | `- [x]` / `- [ ]` |
| 脚注 | `markdown-it-footnote` | `[^1]` |
| 高亮标记 | `markdown-it-mark` | `==高亮==` |
| 自动链接 | `markdown-it` 内置 linkify | 裸链接自动转超链接 |
| 状态管理 | `zustand` | 轻量、无样板代码 |
| 文件监听（Rust） | `notify` crate | 跨平台文件系统监听 |

---

## 3. 项目目录结构

```
easy-md/
├── docs/                              # 项目文档
│   ├── SPEC.md                       # 功能清单
│   ├── DESIGN.md                     # 本文档
│   └── superpowers/plans/            # 实现计划
├── src/                              # 前端源码（React + TS）
│   ├── main.tsx                      # React 入口
│   ├── App.tsx                       # 根组件（布局编排）
│   ├── components/                   # UI 组件
│   │   ├── TitleBar/                 # 顶部标题栏 + 标签栏
│   │   ├── Sidebar/                  # 左侧 TOC 目录
│   │   ├── Content/                  # 右侧内容渲染区
│   │   ├── SearchBar/                # 全文搜索栏
│   │   ├── Lightbox/                 # 图片放大组件
│   │   ├── Welcome/                  # 空状态欢迎页
│   │   └── ExportDialog/             # 导出对话框
│   ├── features/                     # 功能模块（按职责聚合）
│   │   ├── markdown/                 # markdown-it 渲染管线
│   │   │   ├── render.ts             # 主渲染入口
│   │   │   ├── plugins.ts            # 插件配置
│   │   │   ├── toc.ts                # TOC 提取
│   │   │   └── imageResolver.ts      # 图片路径解析/占位
│   │   ├── theme/                    # 主题切换
│   │   ├── search/                   # 搜索高亮逻辑
│   │   ├── export/                   # PDF/HTML/打印/复制
│   │   └── fileWatch/                # 文件监听事件订阅
│   ├── stores/                       # Zustand 状态
│   │   ├── tabsStore.ts              # 标签页状态
│   │   ├── themeStore.ts             # 主题状态
│   │   └── recentStore.ts            # 最近文件
│   ├── hooks/                        # 自定义 Hooks
│   ├── ipc/                          # Tauri 命令封装（统一出口）
│   │   ├── files.ts                  # 文件读写/图片
│   │   ├── recent.ts                 # 最近文件持久化
│   │   └── system.ts                 # 打印/对话框等
│   ├── styles/                       # 全局样式 / 主题变量
│   │   ├── themes.css                # 深浅色 CSS 变量
│   │   └── prose.css                 # 内容区排版（类 GitHub）
│   ├── types/                        # 全局 TS 类型
│   └── utils/                        # 纯函数工具
├── src-tauri/                        # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json               # Tauri 配置（窗口/打包/关联）
│   ├── build.rs
│   ├── icons/                        # 应用图标
│   └── src/
│       ├── main.rs                   # 入口
│       ├── commands/                 # Tauri 命令
│       │   ├── mod.rs
│       │   ├── files.rs              # 文件读取/图片解码
│       │   ├── recent.rs             # 最近文件持久化
│       │   └── system.rs             # 系统集成（打印等）
│       ├── watcher.rs                # 文件监听（notify）
│       └── platform/                 # 平台隔离
│           ├── mod.rs
│           ├── windows.rs            # Win 右键菜单/关联注册
│           └── macos.rs              # Mac 占位（预留）
├── scripts/                          # 辅助脚本
│   └── register-file-association.nsh # NSIS 右键注册脚本片段
├── .gitignore
├── .editorconfig
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

**目录设计原则：**
- `components/` 按视觉单元分组，每个组件一个目录（含样式与测试）。
- `features/` 按业务职责聚合（渲染、主题、搜索、导出、监听），**文件按"一起变化"原则组织**，而非按技术层（避免一个功能散落到 components/hooks/utils 多处）。
- `ipc/` 作为前后端契约的唯一出口，前端不直接 `import @tauri-apps/api`，便于跨端复用与 Mock 测试。

---

## 4. 关键设计细节

### 4.1 渲染管线

```
Markdown 源文本
      │
      ▼
 ┌─────────────┐
 │ markdown-it │ ─── 插件链 ──► katex / footnote / mark / task-lists / linkify
 └─────────────┘
      │ HTML（含未渲染的 <code class="language-xxx"> 和 <div class="mermaid">）
      ▼
 ┌─────────────┐
 │   shiki     │ ─── 对每个代码块同步高亮，替换 innerHTML
 └─────────────┘
      │
      ▼
 ┌─────────────┐
 │   mermaid   │ ─── 对每个 .mermaid 容器异步渲染为 SVG
 └─────────────┘
      │
      ▼
 ┌─────────────┐
 │ imageResolver│ ─── 遍历 <img>，相对/绝对路径通过 Tauri 读为 base64 注入
 └─────────────┘
      │
      ▼
 安全注入 DOM + 后处理（TOC 锚点、外链 target=_blank、搜索高亮层）
```

**关键决策：**
- shiki 在主线程同步渲染（量级可控，避免 Worker 通信复杂度）；如果后续遇到大文件性能问题，再迁移到 Web Worker。
- 图片路径解析必须放到渲染后处理阶段，因为需要拿到最终的 `<img src>` 才知道要解析哪些。
- TOC 从 markdown-it 解析阶段的 token 提取（而非从 DOM 反查），保证准确且无渲染时序问题。

### 4.2 状态管理（Zustand）

```ts
// stores/tabsStore.ts 核心结构
interface Tab {
  id: string;              // 唯一 ID
  filePath: string;        // 绝对路径
  fileName: string;        // 显示名
  scrollTop: number;       // 滚动位置记忆
  tocExpanded: Record<string, boolean>; // TOC 展开状态
  source: string;          // 原始 markdown 文本
  html: string;            // 渲染后 HTML（缓存）
  toc: TocItem[];          // TOC 结构
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  openTab(filePath: string): Promise<void>;
  closeTab(id: string): void;
  setActive(id: string): void;
  updateTabSource(id: string, source: string): void; // 文件监听触发
}
```

**为什么不用 Redux/Context？** Zustand 没有 Provider 包裹成本，API 极简，单文件可测，契合中等复杂度应用。

### 4.3 图片路径解析

前端无法直接读本地文件，必须走 Tauri 命令：

```ts
// ipc/files.ts
export async function resolveImage(mdFilePath: string, src: string): Promise<string> {
  // 网络图片直接返回
  if (/^https?:\/\//.test(src)) return src;
  // 相对/绝对路径交给 Rust 解析并读为 data URL
  return await invoke<string>('resolve_image', { mdFilePath, src });
}
```

```rust
// src-tauri/src/commands/files.rs
#[tauri::command]
async fn resolve_image(md_file_path: String, src: String) -> Result<String, String> {
    let base = Path::new(&md_file_path).parent().unwrap();
    let img_path = if Path::new(&src).is_absolute() {
        PathBuf::from(&src)
    } else {
        base.join(&src)
    };
    if !img_path.exists() {
        // 返回占位符 data URL（图片不存在的友好提示）
        return Ok(PLACEHOLDER_DATA_URL.to_string());
    }
    let bytes = fs::read(&img_path).map_err(|e| e.to_string())?;
    let mime = guess_mime(&img_path);
    Ok(format!("data:{};base64,{}", mime, base64::encode(bytes)))
}
```

**为什么用 data URL 而不是 `tauri://` 协议？** data URL 自包含，导出 HTML 时可直接内嵌，避免导出文件路径失效。

### 4.4 文件监听

```rust
// src-tauri/src/watcher.rs（伪代码）
use notify::{Watcher, RecursiveMode, Event};
pub fn watch(path: &str, app_handle: AppHandle) {
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
        if let Ok(e) = res {
            // 防抖：300ms 内多次修改只发一次事件
            debounce_emit(&app_handle, e.path, Duration::from_millis(300));
        }
    }).unwrap();
    watcher.watch(Path::new(path), RecursiveMode::NonRecursive).unwrap();
    // watcher 需保活（放到 Tauri State）
}
```

前端订阅：

```ts
import { listen } from '@tauri-apps/api/event';
listen('file-changed', (event) => {
  tabsStore.updateTabSource(event.payload.tabId, event.payload.source);
});
```

### 4.5 主题切换

使用 CSS 变量 + `data-theme` 属性，避免重渲染：

```css
/* styles/themes.css */
:root[data-theme="light"] { --bg: #ffffff; --fg: #1f2328; ... }
:root[data-theme="dark"]  { --bg: #0d1117; --fg: #e6edf3; ... }
```

```ts
// stores/themeStore.ts
export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolved: 'light',
  setTheme(theme) {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('theme', theme);
    set({ theme, resolved });
  },
}));
```

**shiki 主题同步**：shiki 需要预加载两套主题（`github-light` / `github-dark`），渲染时用 `data-theme` 决定使用哪个；切换主题时遍历 DOM 重新应用 `data-theme` 到代码块。

### 4.6 全文搜索

搜索作用于**已渲染的 DOM**，而非 markdown 源文本（避免代码块/公式里误命中）：

- 用 `window.find()` 不可控，改用 **TreeWalker 遍历文本节点**，命中处包 `<mark>` 高亮。
- 维护一个匹配节点数组，实现"上一个/下一个"跳转与"第 N/M"。
- 关闭搜索栏时移除所有 `<mark>`，恢复原文。

### 4.7 导出实现

| 方式 | 实现路径 |
|------|---------|
| PDF | Tauri 调用 WebView 的 `printToPdf`（v2 已封装）；或前端 `window.print()` + 用户选"打印到 PDF" |
| HTML | 拼接 `<!DOCTYPE html>` + 内联 CSS + 已渲染 HTML（图片为 data URL 自包含） |
| 系统打印 | 前端 `window.print()`，配 `@media print` 样式隐藏 TOC/标签栏 |
| 复制渲染内容 | 用 `navigator.clipboard.write()` 写入 `text/html` Blob，粘贴到 Word/邮件保留格式 |

### 4.8 Windows 文件关联与右键菜单

Tauri v2 + NSIS 安装器支持注册。在 `tauri.conf.json` 的 `bundle.windows.nsis` 配置 install/uninstall 脚本片段：

- 写入注册表 `HKCU\Software\Classes\.md\shell\OpenWithMdpp`
- 右键菜单 "用 md++ 打开" → 调用 `mdpp.exe "%1"`，`%1` 为文件路径
- 应用启动时读取 `argv` 获取文件路径（Tauri 的 `tauri::get_cli` 或 plugin-cli）

详见 `scripts/register-file-association.nsh`（NSIS 脚本）。

### 4.9 跨端适配策略

| 关注点 | 策略 |
|--------|------|
| 文件路径分隔符 | 全部走 Rust `Path` 处理，前端只用 Rust 返回的规范化路径 |
| 快捷键 | 用 `is-mac` 判断后切换 `Ctrl` ↔ `Cmd`，定义集中在 `utils/platform.ts` |
| 字体 | 系统默认字体栈（`-apple-system, Segoe UI, ...`），不硬编码字体文件 |
| 图标 | 应用图标按平台准备（`.ico` for Win, `.icns` for Mac），放到 `src-tauri/icons/` |
| Mac 适配工作量 | 后端 `platform/macos.rs` 实现占位，前端零改动；主要工作是 Mac 上重新打包与图标 |

---

## 5. 数据模型

### 5.1 核心类型（`src/types/index.ts`）

```ts
export interface TocItem {
  id: string;          // 锚点 id（slugified text）
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;        // 标题纯文本
  children?: TocItem[];
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
  lastOpenedAt: number;  // unix ms
}

export type ThemeMode = 'light' | 'dark' | 'system';
```

### 5.2 本地持久化

| 数据 | 存储位置 | 方式 |
|------|---------|------|
| 主题选择 | `localStorage` | 前端直接读写 |
| 最近文件列表 | Tauri `appDataDir/recent.json` | Rust 命令读写（路径跨平台安全） |
| 上次打开的标签 | `localStorage` | 仅记录路径，启动时按需恢复 |

---

## 6. 打包与分发

### 6.1 Tauri 打包配置（`tauri.conf.json` 关键项）

```jsonc
{
  "productName": "md++",
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],   // MSI + NSIS exe
    "icon": ["icons/icon.ico"],
    "windows": {
      "nsis": {
        "installerHooks": "scripts/register-file-association.nsh"
      }
    }
  },
  "app": {
    "security": { "csp": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'" }
  }
}
```

### 6.2 CSP 策略

- `img-src` 必须含 `data:`（本地图片 base64）与 `https:`（网络图片）
- `style-src 'unsafe-inline'`：shiki 内联样式、katex 动态样式需要
- 其余严格 `'self'`

---

## 7. 测试策略

| 层级 | 工具 | 范围 |
|------|------|------|
| 单元测试（前端纯函数） | Vitest | TOC 提取、图片路径判断、搜索高亮逻辑、主题切换 |
| 单元测试（Rust） | `cargo test` | 文件读取、路径解析、最近文件序列化 |
| 组件测试 | Vitest + Testing Library | 关键组件交互（标签关闭、TOC 跳转、搜索栏） |
| 渲染快照 | Vitest | 典型 markdown 样本的 HTML 输出回归 |
| E2E（可选） | Tauri WebDriver + 暂不强制 | 打开/关闭/主题切换主流程 |

**测试原则：** 渲染管线（markdown → HTML）必须有快照测试，防止插件升级破坏输出。

---

## 8. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| shiki 同步渲染大文件卡顿 | 启动/打开慢 | 预设阈值（如 >50KB），大文件改 Web Worker；当前先用主线程 |
| 图片 base64 占用内存 | 多图大文档内存高 | 单图 > 2MB 时改用 Tauri 自定义协议 `tauri://localhost/asset` 流式加载 |
| WebView2 在精简版 Windows 缺失 | 无法启动 | 安装包捆绑 WebView2 Bootstrapper |
| Mermaid 渲染慢 | 时序图复杂时卡顿 | 异步渲染 + loading 占位，不阻塞首屏 |
| 文件监听误触发 | 频繁刷新抖动 | Rust 端 300ms 防抖，前端 diff 源文本无变化则跳过 |
