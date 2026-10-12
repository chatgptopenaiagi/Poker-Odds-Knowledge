param([ValidateSet('Offline','Online','StopOnline')][string]$Edition='Offline')
$ErrorActionPreference='Stop'
if($PSVersionTable.PSVersion.Major -lt 7 -and $Edition -ne 'Offline'){
    $pwsh=Join-Path $env:ProgramFiles 'PowerShell\7\pwsh.exe'
    if(-not(Test-Path -LiteralPath $pwsh)){Write-Host 'Online launch requires the existing PowerShell 7 installation. Offline play still opens normally.';exit 1}
    & $pwsh -NoProfile -File $PSCommandPath -Edition $Edition
    exit $LASTEXITCODE
}
if($Edition -eq 'Online'){ & (Join-Path $PSScriptRoot 'scripts\Start-POK-Online.ps1'); exit }
if($Edition -eq 'StopOnline'){ & (Join-Path $PSScriptRoot 'scripts\Stop-POK-Online.ps1'); exit }
$url='http://localhost/holdem-lab/'
try { $response=Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5; if($response.StatusCode -ne 200){throw 'Application not reachable'} }
catch { Write-Host 'Open the existing XAMPP Control Panel and start Apache, then run this launcher again. No server, listener, firewall rule or other site was changed.'; exit 1 }
Start-Process $url
Write-Host 'Poker Odds Knowledge opened. Start hand → Reveal calculation → Continue → Hand Review. Settings → Back up progress saves your notebook.'
