@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" %*
set "EXITCODE=%ERRORLEVEL%"

if %EXITCODE% neq 0 (
  echo.
  echo [run.bat] Failed with exit code %EXITCODE%.
  if not defined CI pause
)

exit /b %EXITCODE%
