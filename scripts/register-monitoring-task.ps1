$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$cmdPath = Join-Path $env:SystemRoot "System32\cmd.exe"
$url = "http://localhost:3000/check"
$times = @(
  @{ Suffix = "Morning"; Label = "утренняя"; At = "08:00" },
  @{ Suffix = "Day"; Label = "дневная"; At = "14:00" },
  @{ Suffix = "Evening"; Label = "вечерняя"; At = "20:00" }
)

foreach ($item in $times) {
  $taskName = "ApartmentPriceCheck$($item.Suffix)"
  $arguments = "/d /c start `"`" `"$url`""
  $action = New-ScheduledTaskAction -Execute $cmdPath -Argument $arguments -WorkingDirectory $projectRoot
  $trigger = New-ScheduledTaskTrigger -Daily -At $item.At
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "$($item.Label) ручная проверка цен" -Force | Out-Null
}

Write-Host "Напоминания созданы: 08:00, 14:00 и 20:00."
Write-Host "В заданное время откроется $url"
