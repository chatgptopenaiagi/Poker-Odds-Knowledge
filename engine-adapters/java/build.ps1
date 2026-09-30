[CmdletBinding()]
param([switch]$Download)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runtime=Get-Content -Raw -LiteralPath "$root/.pok-strategy/runtime.json" | ConvertFrom-Json
if((Get-FileHash -LiteralPath $runtime.javaPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $runtime.javaSha256){throw 'Approved Java runtime hash differs. Review and explicitly configure the runtime first.'}
$jdk=Split-Path (Split-Path ([IO.Path]::GetFullPath($runtime.javaPath)))
foreach($tool in @('java','javac','jar')) { if(!(Test-Path -LiteralPath "$jdk/bin/$tool.exe")){throw 'Verified JDK21 route unavailable; no installation attempted.'} }
$lock=Get-Content -Raw -LiteralPath "$PSScriptRoot/dependencies.json" | ConvertFrom-Json
$upstream=Join-Path $root '.solver-tools/TexasHoldemSolverJava'
if(!(Test-Path -LiteralPath "$upstream/.git")){if(!$Download){throw 'Pinned source missing. Re-run with -Download for the documented GitHub source.'}; & git clone --no-checkout --filter=blob:none $lock.upstream.repository $upstream; if($LASTEXITCODE){throw 'Source clone failed'}; & git -C $upstream sparse-checkout init --cone; & git -C $upstream sparse-checkout set src/main/java; & git -C $upstream checkout --detach $lock.upstream.revision; if($LASTEXITCODE){throw 'Pinned source checkout failed'}}
if((& git -C $upstream rev-parse HEAD).Trim() -ne $lock.upstream.revision){throw 'Unexpected upstream revision; refusing to build.'}
if((& git -C $upstream status --porcelain -- src/main/java)){throw 'Upstream source checkout has local changes; refusing to compile unreviewed code.'}
$deps=Join-Path $root '.solver-tools/java-deps';$build=Join-Path $root '.solver-tools/java-build'
$classes=Join-Path $build ('classes-'+[Guid]::NewGuid().ToString('N'))
# A new empty class directory prevents removed sources or stale classes entering a later JAR.
New-Item -ItemType Directory -Force $deps,"$build/src",$classes | Out-Null
$jars=@()
foreach($dep in $lock.dependencies){$name=($dep.coordinate -split '/')[-1]+'.jar';$file=Join-Path $deps $name;if(!(Test-Path -LiteralPath $file)){if(!$Download){throw "Dependency $name missing. -Download permits pinned Maven downloads."};Invoke-WebRequest "https://repo.maven.apache.org/maven2/$($dep.coordinate).jar" -TimeoutSec 30 -OutFile $file};if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $dep.sha256){throw 'Dependency checksum mismatch'};$jars+=$file}
$prefix='src/main/java/icybee/solver'
$selected=@('Card.java','Deck.java','GameTree.java','RiverRangeManager.java','compairer/Compairer.java','solver/Solver.java','solver/CfrPlusRiverSolver.java','solver/BestResponse.java','solver/MonteCarolAlg.java','solver/GameTreeBuildingSettings.java','ranges/PrivateCards.java','ranges/PrivateCardsManager.java','ranges/RiverCombs.java','trainable/Trainable.java','trainable/DiscountedCfrTrainable.java','utils/Range.java')
foreach($folder in @('exceptions','nodes')){$selected+=Get-ChildItem -LiteralPath "$upstream/$prefix/$folder" -Filter '*.java' -File | ForEach-Object {"$folder/$($_.Name)"}}
$sources=@()
foreach($relative in $selected){
 $text=Get-Content -Raw -LiteralPath "$upstream/$prefix/$relative"
 # Marked compatibility-only changes: maintained JSON package and a direct-tree constructor.
 $text=$text.Replace('import com.alibaba.fastjson.JSONObject;','import com.alibaba.fastjson2.JSONObject; // POK: maintained JSON dependency migration.')
 if($relative -eq 'GameTree.java'){$text=$text.Replace('public class GameTree {',"public class GameTree {`n    // POK adapter: accepts an already validated bounded river tree; no file loader.`n    public GameTree(Deck deck, GameTreeNode root) { this.deck=deck; this.root=root; this.recurrentSetDepth(root,0); }")}
 $target=Join-Path "$build/src/icybee/solver" $relative;New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null;[IO.File]::WriteAllText($target,$text,[Text.UTF8Encoding]::new($false));$sources+=$target
}
$sources+=Get-ChildItem -LiteralPath "$PSScriptRoot/src" -Filter '*.java' -Recurse -File | ForEach-Object FullName
$arguments=@('-encoding','UTF-8','--release','21','-cp',($jars -join ';'),'-d',$classes)+$sources
$argFile=Join-Path $build 'compile.args';[IO.File]::WriteAllLines($argFile,($arguments | ForEach-Object {'"'+$_.Replace('\','/')+'"'}),[Text.UTF8Encoding]::new($false))
$log=& "$jdk/bin/javac.exe" "@$argFile" 2>&1;$code=$LASTEXITCODE;$log | Set-Content -LiteralPath "$build/build.log" -Encoding utf8;if($code){$log | Write-Output;throw 'Java source compilation failed'}
Copy-Item -LiteralPath "$upstream/LICENSE" -Destination "$classes/LICENSE-TexasHoldemSolverJava.txt"
& "$jdk/bin/jar.exe" --create --file "$build/pok-river-solver.jar" --main-class pok.solver.PokRiverMain -C $classes .
if($LASTEXITCODE){throw 'JAR packaging failed'}
$manifest=@{schemaVersion=1;adapterVersion='pok-java-river-1';upstreamRevision=$lock.upstream.revision;javaVersion=((& "$jdk/bin/java.exe" -version 2>&1 | Select-Object -First 1).ToString());sha256=(Get-FileHash -LiteralPath "$build/pok-river-solver.jar" -Algorithm SHA256).Hash.ToLowerInvariant();dependencyHashes=$lock.dependencies;builtUtc=[DateTime]::UtcNow.ToString('o');sourceCount=$sources.Count}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$build/build-manifest.json" -Encoding utf8
$manifest | ConvertTo-Json -Depth 5
