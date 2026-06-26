# Find the PostgreSQL installer downloaded by winget
$pkg = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PostgreSQL.PostgreSQL.16*" -ErrorAction SilentlyContinue
foreach ($p in $pkg) { Write-Output "PKGDIR: $($p.FullName)" }
$exe = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PostgreSQL.PostgreSQL.16*" -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue
foreach ($e in $exe) { Write-Output "EXE: $($e.FullName)" }
# Also check the cache/download dir
$dl = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Cache" -Filter "postgresql*.exe" -Recurse -ErrorAction SilentlyContinue
foreach ($d in $dl) { Write-Output "CACHE: $($d.FullName)" }
# Check if anything already installed
$installed = Test-Path "C:\Program Files\PostgreSQL\16"
Write-Output "INSTALLED_16: $installed"
