# Phantom local dev - no Docker required.
# Full stack: configure PostgreSQL (see src/README.md "Local Postgres") and .env from .env.example
# (often src/api/.env when using npm workspaces - same vars as repo root).
# Ports: API API_PORT (default 8787), dashboard Vite 5173 (proxies /api -> API), extension PLASMO_PUBLIC_API_URL -> API.
# Dashboard-only: .\run.ps1 -DashboardOnly (skips API/extension if you only need the UI)
# Skip browser: .\run.ps1 -NoBrowser  or set PHANTOM_NO_BROWSER=1
# Skip migrations: .\run.ps1 -SkipMigrate

param(
    [switch] $DashboardOnly,
    [switch] $NoBrowser,
    [switch] $SkipMigrate
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$DashboardUrl = if ($env:VITE_DEV_SERVER_URL) { $env:VITE_DEV_SERVER_URL.TrimEnd('/') } else { "http://localhost:5173" }

function Start-PhantomBrowserLaunch {
    param(
        [string] $Url,
        [int] $TimeoutSec = 120
    )
    return Start-Job -Name PhantomOpenBrowser -ScriptBlock {
        param($TargetUrl, $WaitSec)
        $deadline = (Get-Date).AddSeconds($WaitSec)
        while ((Get-Date) -lt $deadline) {
            try {
                $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
                if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                    Start-Process $TargetUrl
                    return
                }
            } catch {
                Start-Sleep -Milliseconds 750
            }
        }
    } -ArgumentList $Url, $TimeoutSec
}

function Stop-PhantomBrowserLaunch {
    Get-Job -Name PhantomOpenBrowser -ErrorAction SilentlyContinue |
        Stop-Job -PassThru |
        Remove-Job -Force -ErrorAction SilentlyContinue
}

function Test-LaunchBrowser {
    param([switch] $SkipBrowser)
    if ($SkipBrowser) { return $false }
    if ($env:CI -eq "true") { return $false }
    if ($env:PHANTOM_NO_BROWSER -eq "1") { return $false }
    return $true
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js/npm not found. Install Node 20+ from https://nodejs.org/"
}

$needInstall = (-not (Test-Path "node_modules")) -or (-not (Test-Path "node_modules/concurrently"))
if ($needInstall) {
    Write-Host "Installing npm dependencies (root devDependencies incomplete or missing concurrently)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Dashboard / extension resolve @phantom/shared types from dist; dev runs all workspaces in parallel.
if (-not (Test-Path "src/shared/dist/index.d.ts")) {
    Write-Host "Building @phantom/shared (generates dist for TypeScript consumers)..." -ForegroundColor Cyan
    npm run build -w @phantom/shared
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not $DashboardOnly -and -not $SkipMigrate) {
    Write-Host "Applying database migrations (prisma migrate deploy)..." -ForegroundColor Cyan
    npm run db:migrate:deploy -w @phantom/api
    if ($LASTEXITCODE -ne 0) {
        Write-Error @"
Database migration failed. Ensure PostgreSQL is running and DATABASE_URL is set
(see src/api/.env or .env.example). To start without migrating: run.bat -SkipMigrate
"@
    }
}

if (Test-LaunchBrowser -SkipBrowser:$NoBrowser) {
    Write-Host "Will open $DashboardUrl when the dashboard is ready..." -ForegroundColor Cyan
    $null = Start-PhantomBrowserLaunch -Url $DashboardUrl
}

try {
    if ($DashboardOnly) {
        Write-Host "Starting dashboard only -> $DashboardUrl" -ForegroundColor Green
        npm run dev -w @phantom/dashboard
    } else {
        Write-Host "Starting shared, api, dashboard, extension (see package.json dev script)" -ForegroundColor Green
        npm run dev
    }
    exit $LASTEXITCODE
} finally {
    Stop-PhantomBrowserLaunch
}
