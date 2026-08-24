<#
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Updates Corecord: pulls latest, installs dependencies, rebuilds, reinjects.
 * Usage:  .\update.ps1 [-Branch DiscordCanary]
#>
[CmdletBinding()]
param(
    [string]$Branch = ""
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Err([string]$msg) { Write-Host "ERROR: $msg" -ForegroundColor Red }

$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($IsAdmin) {
    Write-Err "Do not run this from an admin/root terminal. It will mess up your Discord/Corecord instance. Close it and reopen as a normal user."
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js is required. Install it from https://nodejs.org and reopen your terminal."
    exit 1
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Err "pnpm is required. Install it with: npm i -g pnpm"
    exit 1
}

if (Test-Path (Join-Path $PSScriptRoot ".git")) {
    Write-Step "Pulling latest Corecord..."
    & git pull
    if ($LASTEXITCODE -ne 0) { Write-Err "git pull failed. Commit or stash local changes first."; exit $LASTEXITCODE }
} else {
    Write-Step "Not a git checkout, skipping pull."
}

Write-Step "Installing dependencies..."
& pnpm install
if ($LASTEXITCODE -ne 0) { Write-Err "pnpm install failed."; exit $LASTEXITCODE }

Write-Step "Building Corecord..."
& pnpm build
if ($LASTEXITCODE -ne 0) { Write-Err "Build failed."; exit $LASTEXITCODE }

Write-Step "Reinjecting into Discord..."
& (Join-Path $PSScriptRoot "inject.ps1") -NoBuild -Branch $Branch
exit $LASTEXITCODE
