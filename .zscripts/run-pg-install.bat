@echo off
echo === Cleaning partial PostgreSQL install ===
rmdir /s /q "C:\Program Files\PostgreSQL\16" 2>nul
echo Cleaned.
echo.
echo === Running silent PostgreSQL install ===
powershell -ExecutionPolicy Bypass -File "I:\my-project\.zscripts\install-pg.ps1" > "I:\my-project\.zscripts\pg-install.log" 2>&1
echo === DONE, exit: %ERRORLEVEL% ===
