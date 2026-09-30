$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$targetRoot = 'C:\xampp\htdocs\holdem-strategy-validation'
$distRoot = Join-Path $sourceRoot 'strategy-dist'
$bundle = @(Get-ChildItem -LiteralPath (Join-Path $distRoot 'assets') -Filter 'index-*.js')
if ($bundle.Count -ne 1 -or $bundle[0].Name -notmatch '^index-[a-zA-Z0-9_-]+\.js$') { throw 'Expected one built main JS asset.' }
# Re-observe the named local interface; do not store a workstation LAN address in source.
$interfaces = @(Get-NetIPAddress -InterfaceAlias 'Ethernet' -AddressFamily IPv4 | Where-Object { $_.AddressState -eq 'Preferred' -and $_.IPAddress -notmatch '^(127\.|169\.254\.)' })
if ($interfaces.Count -ne 1) { throw 'Expected one non-loopback IPv4 on the previously verified Ethernet interface; re-inspect before testing.' }
$lanAddress = $interfaces[0].IPAddress
function Request-Status([string]$url, [bool]$lan = $false) {
  if ($lan) { $status = & curl.exe --noproxy '*' --max-time 10 -s -o NUL -w '%{http_code}' --interface $lanAddress -H 'Host: localhost' $url }
  else { $status = & curl.exe --noproxy '*' --max-time 10 -s -o NUL -w '%{http_code}' $url }
  if ($LASTEXITCODE -ne 0) { throw 'HTTP verification command failed.' }
  return [int]$status
}
$checks = @(
  [ordered]@{name='Canonical local page';expected=200;actual=(Request-Status 'http://localhost/holdem-strategy-validation/')},
  [ordered]@{name='Non-loopback source page';expected=403;actual=(Request-Status "http://$lanAddress/holdem-strategy-validation/" $true)},
  [ordered]@{name='Non-loopback source JS asset';expected=403;actual=(Request-Status ("http://$lanAddress/holdem-strategy-validation/assets/" + $bundle[0].Name) $true)},
  [ordered]@{name='Application dot file denied';expected=403;actual=(Request-Status 'http://localhost/holdem-strategy-validation/.htaccess')},
  [ordered]@{name='Git path denied';expected=403;actual=(Request-Status 'http://localhost/holdem-strategy-validation/.git/config')},
  [ordered]@{name='Source package not web exposed';expected=404;actual=(Request-Status ('http://localhost/' + (Split-Path $sourceRoot -Leaf) + '/package.json'))}
)
foreach ($check in $checks) { if ($check.actual -ne $check.expected) { throw "Failed $($check.name): HTTP $($check.actual)" } }
$manifest = Get-Content -Raw -LiteralPath (Join-Path $targetRoot 'pok-strategy-preview-owned-assets.json') | ConvertFrom-Json
foreach ($file in $manifest.files) {
  $relative = $file.path
  if ([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[\\/])\.\.([\\/]|$)') { throw 'Unsafe manifest.' }
  $deployed = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $targetRoot $relative)).Hash.ToLowerInvariant()
  $built = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $distRoot $relative)).Hash.ToLowerInvariant()
  if ($deployed -ne $built -or $deployed -ne $file.sha256) { throw "Asset mismatch: $relative" }
}
$deployedFiles = @(Get-ChildItem -LiteralPath $targetRoot -Recurse -File -Force)
if ($deployedFiles.Count -ne $manifest.files.Count + 1) { throw 'Unexpected served file beyond public assets and ownership manifest.' }
$headers = (Invoke-WebRequest -Uri 'http://localhost/holdem-strategy-validation/' -TimeoutSec 10).Headers
if (-not $headers['Content-Security-Policy'] -or $headers['X-Content-Type-Options'] -ne 'nosniff') { throw 'Expected app response headers missing.' }
$report = [ordered]@{schemaVersion=1;observedAt=(Get-Date).ToUniversalTime().ToString('o');status='PASS';checks=$checks;publicFiles=$manifest.files.Count;assetHashesMatch=$true;securityHeadersPresent=$true;site='http://localhost/holdem-strategy-validation/';limitations=@('Non-loopback source request originated on this PC; a second external LAN device was not tested.','No Apache restart, global config edit, firewall change or new listener.');buildId=$manifest.buildId}
$report | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath (Join-Path $sourceRoot 'artifacts\solver/strategy-deployment-checks.json') -Encoding utf8
$report | ConvertTo-Json -Depth 7
