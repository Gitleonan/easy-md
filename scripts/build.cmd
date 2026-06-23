@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 先切到仓库根目录，避免相对路径问题
cd /d "%~dp0.."

echo ========================================
echo   MD++ 打包构建脚本
echo ========================================
echo.

:: 读取 package.json 中的版本号
for /f "tokens=2 delims=:," %%a in ('findstr "\"version\"" package.json') do (
  set PKG_VER=%%~a
  set PKG_VER=!PKG_VER:"=!
  set PKG_VER=!PKG_VER: =!
)

echo 当前 package.json 版本: !PKG_VER!
echo Tauri/Cargo 版本会在构建前自动跟随 package.json
echo.

:: 询问版本号
set /p INPUT_VER="请输入要发布的版本号 (直接回车使用 !PKG_VER!): "
if "!INPUT_VER!"=="" set INPUT_VER=!PKG_VER!

echo.
echo 即将构建 MD++ v!INPUT_VER!
echo 目标: msi + nsis 安装包
echo.

set /p CONFIRM="确认构建? (y/N): "
if /i not "!CONFIRM!"=="y" (
  echo 已取消构建。
  exit /b 0
)

echo.
echo [1/3] 同步版本号到 package.json 和 Cargo.toml...

:: 更新 package.json 版本号
powershell -NoProfile -Command ^
  "$json = Get-Content 'package.json' -Raw | ConvertFrom-Json; $json.version = '!INPUT_VER!'; $json | ConvertTo-Json -Depth 10 | Set-Content 'package.json' -Encoding UTF8"

call pnpm sync-version
if %ERRORLEVEL% neq 0 (
  echo.
  echo 版本同步失败! 错误码: %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo [2/3] 清理旧的构建产物...
if exist "src-tauri\target\release\bundle" rmdir /s /q "src-tauri\target\release\bundle"

echo [3/3] 开始构建...
call pnpm tauri build

if %ERRORLEVEL% neq 0 (
  echo.
  echo 构建失败! 错误码: %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo   构建完成! 版本: v!INPUT_VER!
echo   产物位于: src-tauri\target\release\bundle\
echo ========================================
endlocal
