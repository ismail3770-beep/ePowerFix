@echo off
REM Bun install with logging - run via background
set "BUN_DIR=C:\Users\fulba\AppData\Local\Microsoft\WinGet\Packages\Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe\bun-windows-x64"
set "PATH=%BUN_DIR%;%PATH%"

cd /d I:\my-project

echo [%date% %time%] Starting bun install > I:\my-project\.zscripts\bun-install.log
"%BUN_DIR%\bun.exe" install --verbose >> I:\my-project\.zscripts\bun-install.log 2>&1
echo [%date% %time%] FINISHED with exit code %ERRORLEVEL% >> I:\my-project\.zscripts\bun-install.log
