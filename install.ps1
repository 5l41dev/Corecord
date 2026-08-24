<#
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * One-shot Corecord installer for Windows.
 *
 *   - run from inside a Corecord checkout: installs in place
 *   - run anywhere else: clones the repo, then installs
 *
 * Checks prerequisites (Git, Node.js, pnpm), installs dependencies,
 * builds, and injects into Discord. Any old Equicord/Vencord patch on
 * your Discord install is replaced automatically.
 *
 * Usage:  .\install.ps1 [-Repo https://github.com/5l41dev/Corecord] [-Branch main]
 *
 * Remote one-liner (downloads to temp first so the script runs from disk):
 *   powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/5l41dev/Corecord/main/install.ps1 -OutFile $env:TEMP\corecord-install.ps1; & $env:TEMP\corecord-install.ps1"
#>
[CmdletBinding()]
param(
    [string]$Repo = "https://github.com/5l41dev/Corecord",
    [string]$Branch = "main",
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Err([string]$msg) { Write-Host "ERROR: $msg" -ForegroundColor Red }

$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($IsAdmin) {
    Write-Err "Do not run this from an admin/root terminal. It will mess up your Discord/Corecord instance. Close it and reopen as a normal user."
    exit 1
}

# --- Locate the checkout -------------------------------------------------
$Here = $PSScriptRoot
if (-not $Here) { $Here = (Get-Location).Path }

function Test-CorecordCheckout([string]$path) {
    $pkg = Join-Path $path "package.json"
    if (-not (Test-Path $pkg)) { return $false }
    try {
        return ((Get-Content $pkg -Raw | ConvertFrom-Json).name -eq "corecord")
    } catch { return $false }
}

if (Test-CorecordCheckout $Here) {
    $Target = $Here
    Write-Step "Using current directory as the Corecord checkout ($Target)"
} elseif (Test-CorecordCheckout (Join-Path $env:USERPROFILE "Corecord")) {
    $Target = Join-Path $env:USERPROFILE "Corecord"
    Write-Step "Found existing Corecord checkout at $Target"
} else {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Err "Git is required to clone Corecord. Install it from https://git-scm.com/download/win and reopen your terminal."
        exit 1
    }
    $Target = Join-Path $env:USERPROFILE "Corecord"
    Write-Step "Cloning Corecord from $Repo (branch $Branch)..."
    & git clone --branch $Branch --depth 1 $Repo $Target
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Clone failed. Check the repo URL and branch, or run this script from inside a Corecord checkout."
        exit $LASTEXITCODE
    }
}

Set-Location $Target

# --- Prerequisites -------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "Git is required. Install it from https://git-scm.com/download/win and reopen your terminal."
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Step "Node.js not found, installing via winget..."
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Err "Node.js is required. Install it from https://nodejs.org and reopen your terminal."
        exit 1
    }
    & winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements --silent
    if ($LASTEXITCODE -ne 0) { Write-Err "Node.js install failed. Install it from https://nodejs.org and rerun."; exit $LASTEXITCODE }
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

$NodeMajor = (& node -p "process.versions.node.split('.')[0]") -as [int]
if (-not $NodeMajor -or $NodeMajor -lt 22) {
    Write-Err "Node.js 22 or newer is required. Install the LTS from https://nodejs.org and reopen your terminal."
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Step "pnpm not found, installing via npm..."
    & npm install -g pnpm
    if ($LASTEXITCODE -ne 0) { Write-Err "pnpm install failed. Install it with: npm i -g pnpm"; exit $LASTEXITCODE }
}

# --- Dependencies, build, inject ------------------------------------------
Write-Step "Installing dependencies..."
& pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Step "Frozen install failed, retrying with a fresh resolution..."
    & pnpm install
    if ($LASTEXITCODE -ne 0) { Write-Err "pnpm install failed."; exit $LASTEXITCODE }
}

if (-not $NoBuild) {
    Write-Step "Building Corecord..."
    & pnpm build
    if ($LASTEXITCODE -ne 0) { Write-Err "Build failed."; exit $LASTEXITCODE }
}

Write-Step "Injecting into Discord..."
& (Join-Path $Target "inject.ps1") -NoBuild
exit $LASTEXITCODE
