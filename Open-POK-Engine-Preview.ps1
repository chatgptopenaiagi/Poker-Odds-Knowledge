[CmdletBinding()]
param([switch]$CheckOnly)
$ErrorActionPreference='Stop'
$previewUrl='http://localhost/holdem-engines-preview/'
try {
    $response=Invoke-WebRequest -Uri $previewUrl -Method Head -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw 'Preview not ready.' }
} catch {
    Write-Host 'POK analysis preview is not reachable. Open XAMPP Control Panel and start Apache if it is stopped. No service or port was changed.'
    Write-Host 'If Apache is running, build and deploy the owned engine preview as described in ENGINE_USER_GUIDE.md.'
    exit 1
}
Write-Host 'POK preview is ready. Its notebook and appearance preferences are separate from the normal site.'
Write-Host 'Open Odds Lab, choose Analysis engine, then Calculate equity or Compare engines.'
if (-not $CheckOnly) { Start-Process $previewUrl }
