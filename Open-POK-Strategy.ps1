[CmdletBinding()]
param([switch]$Stop,[switch]$NoBrowser)
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath($PSScriptRoot)
$dataRoot=Join-Path $taskRoot '.pok-strategy\server'
$identityFile=Join-Path $dataRoot 'server.json'
$entry=Join-Path $taskRoot 'server-build\main.mjs'
if(!(Test-Path -LiteralPath $entry)){$entry=Join-Path $taskRoot 'server\main.ts'}
$url='http://127.0.0.1:4322/holdem-lab/'
if($Stop){
 if(!(Test-Path -LiteralPath $identityFile)){Write-Output 'No task-owned staging process is recorded.';return}
 $record=Get-Content -Raw -LiteralPath $identityFile|ConvertFrom-Json
 $owned=Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$record.pid)"
 if(!$owned){Write-Output 'The recorded staging process has already stopped.';return}
 if($record.port -ne 4322 -or $owned.CommandLine -notmatch [regex]::Escape($entry) -or [Math]::Abs(($owned.CreationDate.ToUniversalTime()-[datetime]$record.startedAt).TotalSeconds) -gt 30){throw 'Recorded process identity does not match; no process was stopped.'}
 Stop-Process -Id $record.pid
 Write-Output 'Stopped only the recorded POK Strategy staging process. Active owned JVM jobs close through their memory guard.'
 return
}
if(!(Test-Path -LiteralPath (Join-Path $taskRoot 'strategy-online-dist\index.html'))){throw 'Build the tested strategy online bundle first (npm run build:strategy:online).'}
if(!(Test-Path -LiteralPath (Join-Path $taskRoot '.pok-strategy\runtime.json'))){throw 'Run engine-adapters/java/Configure-Runtime.ps1 after building the pinned adapter.'}
$listeners=@(Get-NetTCPConnection -State Listen -LocalPort 4322 -ErrorAction SilentlyContinue)
if($listeners.Count){
 if(!(Test-Path -LiteralPath $identityFile)){throw 'Port 4322 is occupied by an unverified process; nothing was stopped.'}
 $record=Get-Content -Raw -LiteralPath $identityFile|ConvertFrom-Json
 $owned=Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$record.pid)"
 if(!$owned -or $owned.CommandLine -notmatch [regex]::Escape($entry) -or $listeners.OwningProcess -notcontains $record.pid){throw 'Port 4322 belongs to another process; nothing was changed.'}
}else{
 New-Item -ItemType Directory -Force -Path $dataRoot|Out-Null
 $node=(Get-Command node.exe -ErrorAction Stop).Source
 $changes=@{POK_PORT='4322';POK_BASE_URL='http://127.0.0.1:4322';POK_DATA_DIR=$dataRoot;POK_PUBLIC_DIR=(Join-Path $taskRoot 'strategy-online-dist');POK_STRATEGY_ENABLED='true';NODE_ENV='development'}
 $old=@{};foreach($key in $changes.Keys){$old[$key]=[Environment]::GetEnvironmentVariable($key,'Process');[Environment]::SetEnvironmentVariable($key,$changes[$key],'Process')}
 $arguments=if($entry.EndsWith('.mjs')){@(('"'+$entry+'"'),'--test-mail')}else{@('--import','tsx',('"'+$entry+'"'),'--test-mail')}
 try{Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $dataRoot 'stdout.log') -RedirectStandardError (Join-Path $dataRoot 'stderr.log')|Out-Null}finally{foreach($key in $changes.Keys){[Environment]::SetEnvironmentVariable($key,$old[$key],'Process')}}
 $ready=$false;for($attempt=0;$attempt -lt 30;$attempt++){try{$response=Invoke-WebRequest -Uri $url -TimeoutSec 1;if($response.StatusCode -eq 200){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 200}
 if(!$ready){throw 'Staging did not become ready; inspect the private staging logs. The normal Apache website was not changed.'}
}
Write-Output "POK Strategy: $url"
Write-Output 'Local experimental edition. Use a test account/password. Account verification is in the local mail sink, not real email. Offline study packs need no account.'
Write-Output 'To stop only this staging process: .\Open-POK-Strategy.ps1 -Stop'
if(!$NoBrowser){Start-Process $url}
