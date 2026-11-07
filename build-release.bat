@echo off
cd /d "%~dp0"
echo ========================================================
echo     UltrakillBackground Paket Derleme ve Hazirlama
echo ========================================================

echo [1/3] Web arayuzu (Vite) derleniyor...
call npm --prefix web run build
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Web derlemesi basarisiz oldu.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] C# UltrakillBackground.exe derleniyor...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe ^
  /target:winexe ^
  /out:csharp\UltrakillBackground.exe ^
  /reference:csharp\Microsoft.Web.WebView2.Core.dll,csharp\Microsoft.Web.WebView2.WinForms.dll,System.Windows.Forms.dll,System.Drawing.dll ^
  csharp\WallpaperApp.cs
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] C# derlemesi basarisiz oldu.
    pause
    exit /b %ERRORLEVEL%
)

echo [3/3] Dagitim klasoru (ultrakillbackgroundapp) hazirlaniyor...
set "PKG_DIR=ultrakillbackgroundapp"
if not exist "%PKG_DIR%" mkdir "%PKG_DIR%"
if not exist "%PKG_DIR%\dist" mkdir "%PKG_DIR%\dist"
if not exist "%PKG_DIR%\x64" mkdir "%PKG_DIR%\x64"
if not exist "%PKG_DIR%\runtimes\win-x64\native" mkdir "%PKG_DIR%\runtimes\win-x64\native"

copy /y "csharp\UltrakillBackground.exe" "%PKG_DIR%\UltrakillBackground.exe" >nul
copy /y "csharp\Microsoft.Web.WebView2.Core.dll" "%PKG_DIR%\Microsoft.Web.WebView2.Core.dll" >nul
copy /y "csharp\Microsoft.Web.WebView2.WinForms.dll" "%PKG_DIR%\Microsoft.Web.WebView2.WinForms.dll" >nul
copy /y "csharp\WebView2Loader.dll" "%PKG_DIR%\WebView2Loader.dll" >nul
copy /y "csharp\WebView2Loader.dll" "%PKG_DIR%\x64\WebView2Loader.dll" >nul
copy /y "csharp\WebView2Loader.dll" "%PKG_DIR%\runtimes\win-x64\native\WebView2Loader.dll" >nul

if exist "Baslat.bat" (
    copy /y "Baslat.bat" "%PKG_DIR%\Baslat.bat" >nul
)

if exist "ultrakill-config.json" (
    copy /y "ultrakill-config.json" "%PKG_DIR%\ultrakill-config.json" >nul
) else if exist "switch-config.json" (
    copy /y "switch-config.json" "%PKG_DIR%\ultrakill-config.json" >nul
)

xcopy /e /y /i "web\dist" "%PKG_DIR%\dist" >nul

echo ========================================================
echo  [BASARILI]
echo  Klasor: %cd%\ultrakillbackgroundapp
echo  Exe:    %cd%\ultrakillbackgroundapp\UltrakillBackground.exe
echo ========================================================
