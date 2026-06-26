@echo off
powershell -ExecutionPolicy Bypass -Command "Compress-Archive -Path 'I:\my-project' -DestinationPath 'I:\my-project-backup-before-refactor.zip' -Force"
if exist "I:\my-project-backup-before-refactor.zip" (
    echo BACKUP CREATED OK
) else (
    echo BACKUP FAILED
)
