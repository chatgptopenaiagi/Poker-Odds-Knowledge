$ErrorActionPreference = 'Stop'
$url = 'http://localhost/holdem-lab/'
try {
  $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
  if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
  Start-Process $url
  Write-Output "Opened Hold'em Insight Lab at $url"
} catch {
  Write-Host "Hold'em Insight Lab is not reachable at $url."
  Write-Host 'Open the existing XAMPP Control Panel and start Apache if it is stopped. Do not start another server or stop a process using port 80.'
  Write-Host 'If Apache is already running, check that the HIL public bundle is deployed in its dedicated holdem-lab directory.'
  Write-Host $_.Exception.Message
}
