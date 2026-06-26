# Find bun installation location
$wingetLinks = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\bun.exe"
$defaultBun = "$env:USERPROFILE\.bun\bin\bun.exe"

Write-Output "Checking winget Links: $wingetLinks"
if (Test-Path $wingetLinks) { Write-Output "FOUND at winget Links" }

Write-Output "Checking default: $defaultBun"
if (Test-Path $defaultBun) { Write-Output "FOUND at default .bun" }

# Search winget package dirs
Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "bun.exe" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Write-Output "WINGETPKG: $($_.FullName)" }
