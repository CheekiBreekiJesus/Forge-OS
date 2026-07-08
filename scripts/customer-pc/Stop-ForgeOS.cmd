@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Stop-ForgeOS.ps1"
exit /b %ERRORLEVEL%
