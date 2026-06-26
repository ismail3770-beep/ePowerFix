@echo off
echo === FULL PG16 DIR TREE ===
dir /s /b "C:\Program Files\PostgreSQL\16" 2>&1
echo.
echo === REGISTRY PG ENTRIES ===
reg query "HKLM\SOFTWARE\PostgreSQL" /s 2>&1 | findstr /I "Installations Version Base Directory"
echo.
echo === UNINSTALL ENTRIES ===
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" /s /f "PostgreSQL" 2>&1 | findstr /I "DisplayName PostgreSQL"
echo.
echo === ADMIN CHECK ===
net session >nul 2>&1
if %ERRORLEVEL%==0 (echo ADMIN: YES) else (echo ADMIN: NO)
