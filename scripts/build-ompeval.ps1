[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$compiler = 'C:\Program Files\LLVM\bin\clang-cl.exe'
$vcRoot = 'C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.51.36231'
$sdkRoot = 'C:\Program Files (x86)\Windows Kits\10'
$sdkVersion = '10.0.28000.0'
$required = @($compiler, "$vcRoot\include", "$vcRoot\lib\x64", "$sdkRoot\Include\$sdkVersion\ucrt", "$sdkRoot\Lib\$sdkVersion\um\x64")
foreach ($item in $required) { if (!(Test-Path -LiteralPath $item)) { throw 'The pinned local compiler/SDK route is unavailable. No system installation was attempted.' } }
$outDir = Join-Path $sourceRoot 'native\bin'
New-Item -ItemType Directory -Force $outDir | Out-Null
$arguments = @('/nologo','/std:c++17','/EHsc','/O2','/MT','/DNDEBUG','/D_CRT_SECURE_NO_WARNINGS','/clang:-fuse-ld=lld',"/I$sourceRoot\vendor\ompeval","/I$sourceRoot\native\vendor","/imsvc$vcRoot\include","/imsvc$sdkRoot\Include\$sdkVersion\ucrt","/imsvc$sdkRoot\Include\$sdkVersion\shared","/imsvc$sdkRoot\Include\$sdkVersion\um", "$sourceRoot\native\adapter.cpp")
$arguments += @(Get-ChildItem -LiteralPath "$sourceRoot\vendor\ompeval\omp" -Filter '*.cpp' | Sort-Object Name | ForEach-Object FullName)
$arguments += @("/Fe$outDir\pok-ompeval.exe",'/link',"/LIBPATH:$vcRoot\lib\x64","/LIBPATH:$sdkRoot\Lib\$sdkVersion\ucrt\x64","/LIBPATH:$sdkRoot\Lib\$sdkVersion\um\x64",'kernel32.lib')
Push-Location $outDir
try {
    $log = & $compiler @arguments 2>&1
    $status = $LASTEXITCODE
    $log | Set-Content -LiteralPath (Join-Path $outDir 'build.log') -Encoding utf8
    if ($status -ne 0) { $log | Write-Output; throw "Native build failed ($status)." }
    $identity = (& $compiler --version | Select-Object -First 1)
    $manifest = @{schema=1;engine='OMPEval';revision='4aec210ff75b0851af0ee170b35a7899e1a4fe8f';adapter='1.0.0';compiler=$identity;msvc='14.51.36231';sdk=$sdkVersion;sha256=(Get-FileHash -LiteralPath (Join-Path $outDir 'pok-ompeval.exe') -Algorithm SHA256).Hash.ToLowerInvariant();builtUtc=[DateTime]::UtcNow.ToString('o')}
    $manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $outDir 'build-manifest.json') -Encoding utf8
    $manifest | ConvertTo-Json
} finally { Pop-Location }
