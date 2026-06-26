@echo off
set "BUN_DIR=C:\Users\fulba\AppData\Local\Microsoft\WinGet\Packages\Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe\bun-windows-x64"
set "PATH=%BUN_DIR%;%PATH%"

cd /d I:\my-project

echo === Running: bun run db:push ===
"%BUN_DIR%\bun.exe" run db:push
echo.
echo === EXIT CODE: %ERRORLEVEL% ===
