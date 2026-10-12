# Source checkout verification

This branch is based on the separate public source history at e45856b, not a merge of development history. Necessary missing source was restored from known committed development trees: HTML entrypoint, five historical browser configurations, strategy fixtures, native wrapper and MIT JSON dependency, OMPEval/PH source and license/provenance files, verification requirements, and launch scripts. Existing public src/server/scripts/tests/schemas/public/engine-adapters files remain. Source/import mapping is in SOURCE_IMPORT_MANIFEST.json.

The preceding recovery independently installed dependencies with npm ci --ignore-scripts --no-audit --no-fund. This worktree did not borrow node_modules, binary artifacts or databases. Its initial 18 prerequisite-dependent failures were retained. OMPEval was compiled from included source with the installed pinned Windows compiler route; its targeted 151 tests passed. The earlier 415-test run had 413 passes and two failures because Java solve/cancellation prerequisites were absent. Those are historical failures, not the final result.

The continuation configured the same already approved JDK21 and PowerShell guard using Configure-Runtime.ps1, creating only an ignored project-local runtime configuration. build.ps1 -Download retrieved the pinned MIT solver revision and checksum-locked Maven dependencies and compiled 31 sources. No JAR or runtime configuration file was copied from development. The independent checkout then passed all 415 tests including actual solve/cancellation. After importing the reviewed decision-study extension, its final full run passed 421/421 tests in 26 files, zero failures/skips. TypeScript and web, strategy and server builds passed. 81 of 82 strategy build files matched the development preview byte-for-byte. The sole difference, index.html, is CRLF versus LF; normalized text and asset URLs match. Both original hashes are preserved in local evidence; no manifest hash was changed to hide the difference. All 96 import-manifest entries matched their recorded hashes.

Reproduce from this source, using existing trusted toolchain paths rather than installing or altering global settings:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
& ./scripts/build-ompeval.ps1
& ./engine-adapters/java/Configure-Runtime.ps1 -JavaPath '<approved JDK21 bin/java.exe>' -GuardShellPath '<approved pwsh.exe>'
& ./engine-adapters/java/build.ps1 -Download
node node_modules/vitest/vitest.mjs run
npm.cmd run build:web
npm.cmd run build:strategy
npm.cmd run build:server
```

Run PowerShell scripts in PowerShell 7. The native recipe requires its documented compiler/SDK versions. Missing prerequisites are explicit errors, not passes or silently skipped tests. Builds still warn about a large frontend chunk; that warning is not a failed build. Clean-source compilation and byte-identical static assets do not establish live backend/provider acceptance. The 18 passing built Edge behavior tests ran against the isolated development preview with byte-identical JS/CSS/WASM/assets and the line-ending-only HTML difference described above; one additional inventory test is not counted as behavioral acceptance.

No owner browser profile or original notebook was touched. No remote push occurred. Windows system services, security, ports exposed to the LAN, global PATH and installed toolchain versions were not changed. Only a loopback static preview process was added by the development task.

Legacy machine-specific acceptance reports excluded from the original export remain excluded. Their historical claims are not fresh evidence. Updated README points to included public guides; private per-machine results live outside the published tree. Native/compiler/runtime prerequisites remain explicit, not silently skipped.

Decision Explorer continuation: reviewed source at development 750276858d3606024fb7f63dc9d4118ebb0ae398 was imported without merging histories. The independent checkout passed 435/435 unit tests in 27 files, including configured real Java solve/cancellation and native tests; TypeScript and web/strategy/server builds passed. All 103 import hashes match. Build comparison again matched 81/82 files, with only the documented index.html line-ending difference. Existing independently installed dependencies and approved native/JVM builds were reused after hash verification; no downloads or system changes were needed. Development built-browser acceptance is 20/20 behavior tests plus one separate inventory test. The source-repair checkout was built/tested independently, but no separate source-repair browser server was launched.

Range/response continuation: development 23d65c4c065178cc8118b8026ddd15f58dd8fcd1 was imported as 14 explicitly reviewed source/test/document paths, without merging histories. This checkout freshly passed 447/447 unit tests with zero failures/skips, including native and configured JVM checks, plus TypeScript and web/strategy/server builds. All 113 import hashes match. Native/JVM binaries and 19 PH plus 19 OMPEval source hashes match their pinned provenance. The independent strategy build matches 81/82 preview files; only index.html line endings differ, with both hashes preserved. Dependencies were reused from this checkout; no new download, global Java setting, or borrowed binary was needed. Development built Edge acceptance passed 24/24 behavior tests, plus a separate inventory test. No separate browser origin was launched for this checkout. The first response browser fixture was rejected as unfinished completed-history data; corrected reducer-generated fixture passed, without weakening storage validation. See POK_DECISION_EXPLORER_V2.md for the restricted fold/call response assumptions. No publication or existing deployment update is authorized.

V3 continuation from private development b91c3c8253b87a1cfaf7ed6801dd465a9c4ab343: 118 import hashes; 456/456 unit tests and TypeScript/web/strategy/server builds in the independent source repair. Development isolated Edge gate: 26/26 behavior tests plus inventory. The final GitHub recovery gate requires the bounded 21-test mathematical smoke using its own lockfile installation; native/JVM prerequisites are intentionally NOT_RUN there, not borrowed. No existing deployment or production credential is needed.
