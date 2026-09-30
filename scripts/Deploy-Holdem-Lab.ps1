$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distRoot = [IO.Path]::GetFullPath((Join-Path $sourceRoot 'dist'))
$targetRoot = 'C:\xampp\htdocs\holdem-lab'
$expectedParent = 'C:\xampp\htdocs'
if ([IO.Path]::GetDirectoryName($targetRoot) -ne $expectedParent) { throw 'Deployment target is outside the approved app directory.' }
if (-not (Test-Path -LiteralPath (Join-Path $distRoot 'index.html'))) { throw 'Build dist first.' }
foreach ($path in @($expectedParent, $targetRoot)) {
  if ((Test-Path -LiteralPath $path) -and ((Get-Item -LiteralPath $path).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Refusing reparse point: $path" }
}
$manifestName = 'hil-owned-assets.json'
$prior = $null
if (Test-Path -LiteralPath $targetRoot) {
  $priorPath = Join-Path $targetRoot $manifestName
  if (-not (Test-Path -LiteralPath $priorPath)) { throw 'Existing directory lacks HIL ownership manifest; refusing overwrite.' }
  $prior = Get-Content -Raw -LiteralPath $priorPath | ConvertFrom-Json
  if ($prior.product -notin @("Hold'em Insight Lab", "Poker Odds Knowledge") -or $prior.schema -ne 1) { throw 'Unrecognized ownership manifest.' }
}
function Resolve-OwnedFile([string]$relative) {
  if ([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[\\/])\.\.([\\/]|$)') { throw 'Unsafe manifest path.' }
  $resolved = [IO.Path]::GetFullPath((Join-Path $targetRoot $relative))
  if (-not $resolved.StartsWith($targetRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Manifest escaped the app directory.' }
  $check = $resolved
  while ($check.Length -gt $targetRoot.Length) {
    if ((Test-Path -LiteralPath $check) -and ((Get-Item -LiteralPath $check).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Refusing a reparse point within the deployment.' }
    $check = [IO.Path]::GetDirectoryName($check)
  }
  return $resolved
}
$files = @(Get-ChildItem -LiteralPath $distRoot -File -Recurse -Force | ForEach-Object {
  $relative = [IO.Path]::GetRelativePath($distRoot, $_.FullName).Replace('\','/')
  [ordered]@{path=$relative;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()}
})
foreach ($file in $files) {
  $dest = Resolve-OwnedFile $file.path
  if ((Test-Path -LiteralPath $dest) -and $prior -and $file.path -notin @($prior.files.path)) { throw "Refusing to overwrite unowned file: $($file.path)" }
}
if ($prior) {
  $backupRoot = Join-Path $sourceRoot ('artifacts\deploy-backups\' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
  foreach ($file in $prior.files) {
    $old = Resolve-OwnedFile $file.path
    if (Test-Path -LiteralPath $old) {
      $backup = Join-Path $backupRoot $file.path
      New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($backup)) -Force | Out-Null
      Copy-Item -LiteralPath $old -Destination $backup
    }
  }
  Copy-Item -LiteralPath (Join-Path $targetRoot $manifestName) -Destination (Join-Path $backupRoot $manifestName)
}
New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
foreach ($file in $files) {
  $dest = Resolve-OwnedFile $file.path
  New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($dest)) -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $distRoot $file.path) -Destination $dest -Force
}
if ($prior) {
  foreach ($file in $prior.files) {
    if ($file.path -notin @($files.path)) {
      $obsolete = Resolve-OwnedFile $file.path
      if (Test-Path -LiteralPath $obsolete -PathType Leaf) { Remove-Item -LiteralPath $obsolete }
    }
  }
}
$commit = git -C $sourceRoot rev-parse --short HEAD 2>$null
if ($LASTEXITCODE -ne 0) { $commit = 'uncommitted-development' }
$manifest = [ordered]@{schema=1;product="Poker Odds Knowledge";buildId=('POK-2.0.0-beta.1-' + $commit);deployedAt=(Get-Date).ToUniversalTime().ToString('o');files=$files}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $targetRoot $manifestName) -Encoding utf8
Write-Output "Deployed $($files.Count) owned public files to $targetRoot"
$response = Invoke-WebRequest -Uri 'http://localhost/holdem-lab/' -TimeoutSec 10
Write-Output "Canonical URL HTTP status: $($response.StatusCode)"
