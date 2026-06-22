param(
  [switch]$SkipInstall,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$devUrl = "http://127.0.0.1:14300"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
  param(
    [string]$Name,
    [string]$InstallHint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$Name'. $InstallHint"
  }
}

Set-Location $repoRoot

Write-Step "Checking development tools"
Assert-Command "node" "Install Node.js 20 or newer."
Assert-Command "pnpm" "Install pnpm with: npm install -g pnpm"
Assert-Command "cargo" "Install Rust stable from https://www.rust-lang.org/tools/install"

Write-Host "Node:  $(node --version)"
Write-Host "pnpm:  $(pnpm --version)"
Write-Host "Cargo: $(cargo --version)"

if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
  if ($SkipInstall) {
    throw "node_modules is missing. Re-run without -SkipInstall or run 'pnpm install' first."
  }

  Write-Step "Installing frontend dependencies"
  pnpm install
}

Write-Step "Using Tauri dev URL $devUrl"

if ($CheckOnly) {
  Write-Host "Check complete. Run scripts\dev.ps1 to start md++ in development mode."
  exit 0
}

$port = 14300
Write-Step "Checking port $port"
$existing = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
if ($existing) {
  $pidStr = ($existing -split '\s+')[-1]
  Write-Host "Port $port is in use by PID $pidStr — killing zombie process..."
  taskkill /F /PID $pidStr 2>$null | Out-Null
  Start-Sleep -Seconds 1
  Write-Host "Port released."
}

Write-Step "Starting md++ development app"
pnpm tauri dev
