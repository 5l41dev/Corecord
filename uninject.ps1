<#
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Removes Corecord from your Discord client (restores the vanilla app.asar).
 * Usage:  .\uninject.ps1 [-Branch DiscordCanary]
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
    Write-Err "Do not run this from an admin/root terminal. Close it and reopen as a normal user."
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js is required. Install it from https://nodejs.org and reopen your terminal."
    exit 1
}

$InjectArgs = @((Join-Path $PSScriptRoot "scripts\corecordInject.mjs"), "--uninstall")
if ($Branch) { $InjectArgs += @("--branch", $Branch) }

Write-Step "Removing Corecord from Discord..."
& node @InjectArgs
exit $LASTEXITCODE
