<#
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Injects Corecord into your Discord client (builds first if needed).
 * Usage:  .\inject.ps1 [-Branch DiscordCanary] [-NoBuild]
#>
[CmdletBinding()]
param(
    [string]$Branch = "",
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

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js is required. Install it from https://nodejs.org and reopen your terminal."
    exit 1
}

$Patcher = Join-Path $PSScriptRoot "dist\desktop\patcher.js"
if (-not (Test-Path $Patcher)) {
    if ($NoBuild) {
        Write-Err "dist\desktop\patcher.js is missing and -NoBuild was passed. Run pnpm build first."
        exit 1
    }
    Write-Step "Build output not found, building Corecord..."
    & pnpm build
    if ($LASTEXITCODE -ne 0) { Write-Err "Build failed."; exit $LASTEXITCODE }
}

$InjectArgs = @((Join-Path $PSScriptRoot "scripts\corecordInject.mjs"), "--install")
if ($Branch) { $InjectArgs += @("--branch", $Branch) }

Write-Step "Injecting Corecord into Discord..."
& node @InjectArgs
exit $LASTEXITCODE
