@echo off
REM Bun was installed by winget into the package dir (Links dir is empty)
set "BUN_DIR=C:\Users\fulba\AppData\Local\Microsoft\WinGet\Packages\Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe\bun-windows-x64"
set "PATH=%BUN_DIR%;%PATH%"

cd /d I:\my-project

echo === Bun version ===
"%BUN_DIR%\bun.exe" --version
echo.
echo === Running: bun install ===
"%BUN_DIR%\bun.exe" install
echo.
echo === EXIT CODE: %ERRORLEVEL% ===
