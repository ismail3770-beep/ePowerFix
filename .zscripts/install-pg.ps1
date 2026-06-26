$ErrorActionPreference = 'Continue'
$installer = "$env:TEMP\pg16-installer.exe"

if (-not (Test-Path $installer)) {
    Write-Output "Installer missing, re-downloading..."
    $url = "https://get.enterprisedb.com/postgresql/postgresql-16.14-2-windows-x64.exe"
    Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
}
Write-Output "Installer present: $((Get-Item $installer).Length) bytes"

# Clean any partial install first
Write-Output "Cleaning partial install..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","rmdir /s /q `"C:\Program Files\PostgreSQL\16`"" -Wait

$pgPass = "postgres"
$instLog = "$env:TEMP\pg-install-detail.log"

# Minimal unattended args - let installer choose components, just set password + port + service
$args = @(
    "--mode","unattended",
    "--unattendedmodeui","none",
    "--superpassword",$pgPass,
    "--serverport","5432",
    "--servicename","postgresql-x64-16",
    "--servicedomain","NT AUTHORITY\NetworkService",
    "--installer_runtimedir","$env:TEMP",
    "--log",$instLog
)

Write-Output "Running install (args: $args)..."
$proc = Start-Process -FilePath $installer -ArgumentList $args -Wait -PassThru
Write-Output "INSTALLER_EXIT_CODE: $($proc.ExitCode)"

Write-Output "=== Bin dir check ==="
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (Test-Path $psql) {
    Write-Output "PSQL FOUND: $psql"
} else {
    Write-Output "PSQL NOT FOUND"
    if (Test-Path $instLog) {
        Write-Output "=== Last 40 lines of installer log ==="
        Get-Content $instLog -Tail 40
    }
}
