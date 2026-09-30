[CmdletBinding()]
param([string]$JavaPath,[string]$GuardShellPath)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$folder=Join-Path $root '.pok-strategy'
$file=Join-Path $folder 'runtime.json'
if(Test-Path -LiteralPath $file){
 $existing=Get-Content -Raw -LiteralPath $file | ConvertFrom-Json
 if((Get-FileHash -LiteralPath $existing.javaPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $existing.javaSha256 -or (Get-FileHash -LiteralPath $existing.guardShell -Algorithm SHA256).Hash.ToLowerInvariant() -ne $existing.guardShellSha256){throw 'An existing runtime changed. This script will not overwrite it; review the local configuration explicitly.'}
 if(($JavaPath -and ![string]::Equals([IO.Path]::GetFullPath($JavaPath),[IO.Path]::GetFullPath($existing.javaPath),[StringComparison]::OrdinalIgnoreCase)) -or ($GuardShellPath -and ![string]::Equals([IO.Path]::GetFullPath($GuardShellPath),[IO.Path]::GetFullPath($existing.guardShell),[StringComparison]::OrdinalIgnoreCase))){throw 'An existing approved runtime uses a different path. No configuration was changed.'}
 Write-Output 'Existing approved runtime hashes verified. No configuration was changed.'
 exit 0
}
if(!$JavaPath){$JavaPath=(Get-Command java -CommandType Application -ErrorAction Stop).Source}
if(!$GuardShellPath){$GuardShellPath=(Get-Command pwsh -CommandType Application -ErrorAction Stop).Source}
$JavaPath=[IO.Path]::GetFullPath($JavaPath);$GuardShellPath=[IO.Path]::GetFullPath($GuardShellPath)
if([IO.Path]::GetFileName($JavaPath) -ne 'java.exe' -or [IO.Path]::GetFileName($GuardShellPath) -ne 'pwsh.exe'){throw 'Select actual java.exe and pwsh.exe application paths, not shell scripts.'}
$start=[Diagnostics.ProcessStartInfo]::new();$start.FileName=$JavaPath;$start.ArgumentList.Add('-version');$start.UseShellExecute=$false;$start.CreateNoWindow=$true;$start.RedirectStandardError=$true;$start.RedirectStandardOutput=$true
$probe=[Diagnostics.Process]::Start($start)
if(!$probe.WaitForExit(5000)){$probe.Kill();throw 'Java version probe timed out.'}
$version=$probe.StandardError.ReadToEnd()+$probe.StandardOutput.ReadToEnd()
if($probe.ExitCode -ne 0 -or $version -notmatch 'version\s+"([0-9]+)[.]' -or [int]$Matches[1] -lt 21){throw 'Java 21 or newer is required; no software installation was attempted.'}
$config=@{javaPath=$JavaPath;javaSha256=(Get-FileHash -LiteralPath $JavaPath -Algorithm SHA256).Hash.ToLowerInvariant();guardShell=$GuardShellPath;guardShellSha256=(Get-FileHash -LiteralPath $GuardShellPath -Algorithm SHA256).Hash.ToLowerInvariant()}
New-Item -ItemType Directory -Force $folder | Out-Null
$json=$config|ConvertTo-Json
$stream=[IO.File]::Open($file,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try{$bytes=[Text.UTF8Encoding]::new($false).GetBytes($json+[Environment]::NewLine);$stream.Write($bytes,0,$bytes.Length)}finally{$stream.Dispose()}
Write-Output 'Created the private project runtime configuration. System PATH, JAVA_HOME, policies and services were not changed.'
