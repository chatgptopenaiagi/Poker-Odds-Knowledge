param([string]$ClangPath = 'C:\Program Files\LLVM\bin\clang.exe')
$ErrorActionPreference = 'Stop'
$pokRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$pokGitRoot = (& git -C $pokRoot rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($pokGitRoot) -ne $pokRoot) { throw 'Run inside the verified POK source worktree.' }
if (-not (Test-Path -LiteralPath $ClangPath -PathType Leaf)) { throw 'Existing clang compiler not found. Pass its verified path; this script installs nothing.' }
$pokVendor = Join-Path $pokRoot 'vendor\ph-evaluator'
$pokProvenance = Get-Content -LiteralPath (Join-Path $pokVendor 'UPSTREAM.json') -Raw | ConvertFrom-Json
foreach ($pokFile in $pokProvenance.files) {
  $pokFilePath = [IO.Path]::GetFullPath((Join-Path $pokVendor $pokFile.path))
  if (-not $pokFilePath.StartsWith($pokVendor + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Source manifest path escaped the vendor directory.' }
  if ((Get-FileHash -LiteralPath $pokFilePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pokFile.sha256) { throw "Upstream file differs from reviewed pin: $($pokFile.path)" }
}
$pokOut = Join-Path $pokRoot 'public\engines'
New-Item -ItemType Directory -Path $pokOut -Force | Out-Null
$pokWasm = Join-Path $pokOut 'ph-evaluator.wasm'
$pokSourceNames = @('dptables.c','tables_bitwise.c','evaluator5.c','evaluator6.c','evaluator7.c','hash.c','hashtable.c','hashtable5.c','hashtable6.c','hashtable7.c')
$pokArgs = @('--target=wasm32-unknown-unknown','-std=c99','-O3','-ffreestanding','-fno-builtin','-nostdlib','-fno-ident',('-I'+(Join-Path $pokVendor 'pok-port')),('-I'+(Join-Path $pokVendor 'cpp\src')))
foreach ($pokSourceName in $pokSourceNames) { $pokArgs += Join-Path $pokVendor ('cpp\src\'+$pokSourceName) }
$pokArgs += Join-Path $pokVendor 'pok-port\runtime.c'
$pokArgs += @('-Wl,--no-entry','-Wl,--export=evaluate_5cards','-Wl,--export=evaluate_6cards','-Wl,--export=evaluate_7cards','-Wl,--export-memory','-Wl,--initial-memory=393216','-Wl,--max-memory=393216','-Wl,-z,stack-size=65536','-Wl,--strip-all','-Wl,--gc-sections','-o',$pokWasm)
& $ClangPath @pokArgs
if ($LASTEXITCODE -ne 0) { throw 'PH freestanding WASM compilation failed.' }
$pokCompiler = (& $ClangPath --version | Select-Object -First 1).Trim()
$pokBuild = [ordered]@{
  schemaVersion = 1; upstream = $pokProvenance.repository; revision = $pokProvenance.revision
  version = $pokProvenance.version; license = 'Apache-2.0'; portVersion = 1
  compiler = $pokCompiler; target = 'wasm32-unknown-unknown'; optimization = '-O3'; runtime = 'freestanding; no WASI; no imports; one thread'
  memoryBytes = 393216; stackBytes = 65536; bytes = (Get-Item -LiteralPath $pokWasm).Length
  sha256 = (Get-FileHash -LiteralPath $pokWasm -Algorithm SHA256).Hash.ToLowerInvariant()
  sourceFiles = $pokProvenance.files
  portFiles = @('pok-port/stdio.h','pok-port/runtime.c') | ForEach-Object { [ordered]@{path=$_;sha256=(Get-FileHash -LiteralPath (Join-Path $pokVendor $_) -Algorithm SHA256).Hash.ToLowerInvariant()} }
}
$pokBuild | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $pokOut 'ph-evaluator-build.json') -Encoding utf8
Copy-Item -LiteralPath (Join-Path $pokVendor 'LICENSE') -Destination (Join-Path $pokOut 'PH-EVALUATOR-LICENSE.txt') -Force
[pscustomobject]$pokBuild | Select-Object revision,version,bytes,sha256,memoryBytes,compiler | ConvertTo-Json
