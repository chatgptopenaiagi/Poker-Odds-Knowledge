$ErrorActionPreference = 'Stop'
$repoRoot = (& git -C $PSScriptRoot rev-parse --show-toplevel)
if ($LASTEXITCODE -ne 0) { throw 'This script must belong to a Git checkout.' }
Write-Output "Repository: $repoRoot"
& git -C $repoRoot branch --show-current
& git -C $repoRoot rev-parse HEAD
& git -C $repoRoot status --short
Write-Output 'Remote tracking status (local knowledge; no fetch or network mutation):'
& git -C $repoRoot --no-pager branch -vv
$package = Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json
Write-Output "Package: $($package.name) $($package.version)"
foreach ($file in @('CURRENT_STATE.md','NEXT_SESSION.md')) {
    $document = Join-Path $repoRoot "docs/continuity/$file"
    Write-Output "Continuation: $document"
    Get-Content -LiteralPath $document
}
