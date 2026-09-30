param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$privateDirectory = Join-Path $projectRoot '.pok-local'
$entry = Join-Path $projectRoot 'server\main.ts'
$url = 'http://127.0.0.1:4318/holdem-lab/'
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'online-dist\index.html'))) { throw 'The online client bundle is missing. Build the online edition before launching.' }
$listener = Get-NetTCPConnection -State Listen -LocalPort 4318 -ErrorAction SilentlyContinue
if ($listener) {
    $owned = Join-Path $privateDirectory 'server.json'
    if (-not (Test-Path -LiteralPath $owned)) { throw 'Port 4318 is in use. No process was stopped or replaced.' }
    $record = Get-Content -LiteralPath $owned -Raw | ConvertFrom-Json
    $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + [int]$record.pid)
    if (-not $process -or $process.CommandLine -notmatch [regex]::Escape($entry) -or $listener.OwningProcess -notcontains [int]$record.pid) { throw 'Port 4318 belongs to another process. It was left untouched.' }
} else {
    New-Item -ItemType Directory -Path $privateDirectory -Force | Out-Null
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    Start-Process -FilePath $node -ArgumentList @('--import','tsx',('"' + $entry + '"'),'--test-mail') -WorkingDirectory $projectRoot -WindowStyle Hidden -Environment @{NODE_ENV='development';POK_PORT='4318';POK_BASE_URL='http://127.0.0.1:4318';POK_DATA_DIR=$privateDirectory} -RedirectStandardOutput (Join-Path $privateDirectory 'server-output.log') -RedirectStandardError (Join-Path $privateDirectory 'server-error.log') | Out-Null
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try { $result = Invoke-RestMethod -Uri 'http://127.0.0.1:4318/api/status' -TimeoutSec 1; if ($result.product -eq 'Poker Odds Knowledge') { $ready = $true; break } } catch { }
        Start-Sleep -Milliseconds 200
    }
    if (-not $ready) { throw 'The owned POK server did not become ready. Inspect its private server-error.log; other services were not changed.' }
}
Write-Host 'Local online learning edition: http://127.0.0.1:4318/holdem-lab/'
Write-Host 'Local test mail only; no real email is delivered. Use a separate study password. Offline Apache remains independent.'
if (-not $NoBrowser) { Start-Process $url }
