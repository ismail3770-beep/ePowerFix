@echo off
echo === PG ROOT DIR ===
dir "C:\Program Files\PostgreSQL\16" 2>&1
echo.
echo === BIN DIR ===
dir "C:\Program Files\PostgreSQL\16\bin" 2>&1
echo.
echo === PG SERVICES ===
sc query type= service state= all | findstr /I "postgres" 2>&1
echo.
echo === PORT 5432 ===
netstat -ano | findstr ":5432" 2>&1
echo.
echo === DATA DIR ===
dir "C:\Program Files\PostgreSQL\16\data" 2>&1
