@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File" 2>nul
start "" "%~dp0UltrakillBackground.exe"
