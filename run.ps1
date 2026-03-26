# Phantom local dev — no Docker required.
# Full stack: install PostgreSQL (or point DATABASE_URL elsewhere) and copy .env from .env.example.
# Ports: API API_PORT (default 8787), dashboard Vite 5173 (proxies /api -> API), extension PLASMO_PUBLIC_API_URL -> API.
# Dashboard-only: .\run.ps1 -DashboardOnly (skips API/extension if you only need the UI)

param(
    [switch] $DashboardOnly
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js/npm not found. Install Node 20+ from https://nodejs.org/"
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
    npm install
}

if ($DashboardOnly) {
    Write-Host "Starting dashboard only -> http://localhost:5173" -ForegroundColor Green
    npm run dev -w @phantom/dashboard
} else {
    Write-Host "Starting shared, api, dashboard, extension (see package.json dev script)" -ForegroundColor Green
    npm run dev
}
