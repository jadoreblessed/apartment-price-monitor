$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$taskName = "ApartmentPriceMonitorBackup"
$cmdPath = Join-Path $env:SystemRoot "System32\cmd.exe"
$arguments = "/d /c `"npm.cmd run db:backup >> backup.log 2>&1`""
$action = New-ScheduledTaskAction -Execute $cmdPath -Argument $arguments -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Daily -At "23:30"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Ежедневная резервная копия Apartment Price Monitor" -Force | Out-Null
Write-Host "Задача $taskName создана. Ежедневная копия: 23:30."
Write-Host "Папка копий: $projectRoot\backups"
