@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-ForgeOS-Local.ps1"
exit /b %ERRORLEVEL%
