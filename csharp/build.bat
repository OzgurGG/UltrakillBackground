@echo off
cd /d "%~dp0"
echo Compiling SWITCH Wallpaper C# Runner...
if exist "SWITCH-Wallpaper.exe.old" del /f /q "SWITCH-Wallpaper.exe.old" >nul 2>&1
if exist "SWITCH-Wallpaper.exe" move /y "SWITCH-Wallpaper.exe" "SWITCH-Wallpaper.exe.old" >nul 2>&1
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /reference:Microsoft.Web.WebView2.Core.dll,Microsoft.Web.WebView2.WinForms.dll,System.Windows.Forms.dll,System.Drawing.dll /out:SWITCH-Wallpaper.exe WallpaperApp.cs
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] SWITCH-Wallpaper.exe built successfully.
) else (
    echo [ERROR] Build failed.
    if exist "SWITCH-Wallpaper.exe.old" move /y "SWITCH-Wallpaper.exe.old" "SWITCH-Wallpaper.exe" >nul 2>&1
)
pause

