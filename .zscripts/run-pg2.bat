@echo off
powershell -ExecutionPolicy Bypass -File "I:\my-project\.zscripts\install-pg.ps1" > "I:\my-project\.zscripts\pg-install2.log" 2>&1
echo === DONE exit: %ERRORLEVEL% ===
