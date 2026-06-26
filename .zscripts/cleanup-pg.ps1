@echo off
echo === Cleaning partial PostgreSQL install ===
rmdir /s /q "C:\Program Files\PostgreSQL\16" 2>nul
echo Cleaned. Exit: %ERRORLEVEL%
