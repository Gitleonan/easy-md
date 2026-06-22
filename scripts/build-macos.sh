#!/usr/bin/env bash
set -euo pipefail

# ========================================
#   MD++ macOS 打包构建脚本
#   Usage: bash scripts/build-macos.sh [version]
# ========================================

# 切到仓库根目录
cd "$(dirname "$0")/.."

# --- 版本号处理 ---
PKG_VER=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.2.0")
TAU_VER=$(node -p "require('./src-tauri/tauri.conf.json').version" 2>/dev/null || echo "0.1.0")

echo "========================================"
echo "  MD++ macOS 打包构建脚本"
echo "========================================"
echo ""
echo "当前 package.json 版本: ${PKG_VER}"
echo "当前 tauri.conf.json 版本: ${TAU_VER}"
echo ""

INPUT_VER="${1:-$PKG_VER}"
echo "构建版本: v${INPUT_VER}"
echo "目标: dmg + app bundle"
echo ""

if [[ "${CONFIRM:-}" != "y" ]]; then
  read -r -p "确认构建? (y/N): " CONFIRM
  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "已取消构建。"
    exit 0
  fi
fi

# --- 同步版本号 ---
echo ""
echo "[1/4] 同步版本号..."

# 更新 tauri.conf.json
node -e "
const fs = require('fs');
const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
conf.version = '${INPUT_VER}';
fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(conf, null, 2) + '\n');
console.log('tauri.conf.json 版本已更新为 ${INPUT_VER}');
"

# 更新 package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${INPUT_VER}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json 版本已更新为 ${INPUT_VER}');
"

# --- 环境检查 ---
echo ""
echo "[2/4] 检查构建环境..."

# 检查 Rust
if command -v rustc &>/dev/null; then
  echo "  ✓ Rust: $(rustc --version)"
else
  echo "  ✗ Rust 未安装，请先运行: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  exit 1
fi

# 检查 Node.js
if command -v node &>/dev/null; then
  echo "  ✓ Node.js: $(node --version)"
else
  echo "  ✗ Node.js 未安装"
  exit 1
fi

# 检查 pnpm
if command -v pnpm &>/dev/null; then
  echo "  ✓ pnpm: $(pnpm --version)"
else
  echo "  ! pnpm 未安装，尝试安装..."
  npm install -g pnpm
fi

# macOS 特定：检查 Xcode Command Line Tools
if [[ "$(uname)" == "Darwin" ]]; then
  if xcode-select -p &>/dev/null; then
    echo "  ✓ Xcode Command Line Tools"
  else
    echo "  ✗ Xcode Command Line Tools 未安装，请运行: xcode-select --install"
    exit 1
  fi
fi

# --- 安装依赖 ---
echo ""
echo "[3/4] 安装 npm 依赖..."
pnpm install --frozen-lockfile

# --- 构建 ---
echo ""
echo "[4/4] 开始 Tauri 构建..."
pnpm tauri build

# --- 完成 ---
echo ""
echo "========================================"
echo "  构建完成! 版本: v${INPUT_VER}"
echo "  产物位于: src-tauri/target/release/bundle/"
echo "========================================"
echo ""

# 列出产物
BUNDLE_DIR="src-tauri/target/release/bundle"
if [[ -d "$BUNDLE_DIR" ]]; then
  echo "产物列表:"
  find "$BUNDLE_DIR" -type f \( -name "*.dmg" -o -name "*.app" \) -exec ls -lh {} \; 2>/dev/null || true
  find "$BUNDLE_DIR" -mindepth 1 -maxdepth 2 -type d -name "*.app" -exec echo "  {}/" \; 2>/dev/null || true
fi
