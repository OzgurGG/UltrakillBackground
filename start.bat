@echo off
if exist "%~dp0UltrakillBackground\UltrakillBackground.exe" (
    cd /d "%~dp0UltrakillBackground"
    start "" "UltrakillBackground.exe"
) else (
    cd /d "%~dp0csharp"
    start "" "UltrakillBackground.exe"
)
exit

