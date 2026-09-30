$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$recordPath = Join-Path $projectRoot '.pok-local\server.json'
$entry = Join-Path $projectRoot 'server\main.ts'
if (-not (Test-Path -LiteralPath $recordPath)) { Write-Host 'No owned POK process record exists.'; exit 0 }
$record = Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json
$process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + [int]$record.pid)
if (-not $process) { Write-Host 'The owned POK process has already stopped.'; exit 0 }
if ($process.CommandLine -notmatch [regex]::Escape($entry) -or $process.Name -ne 'node.exe' -or [math]::Abs(([datetime]$record.startedAt - $process.CreationDate).TotalSeconds) -gt 30) { throw 'The process identity no longer matches the owned POK server. Nothing was stopped.' }
Stop-Process -Id ([int]$record.pid)
Write-Host 'Stopped only the recorded POK online server. Apache and other services remain running.'
