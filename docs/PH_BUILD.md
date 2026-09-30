# PH Evaluator: reviewed browser WASM port

This optional analysis evaluator uses the real C PH Evaluator, not a renamed TypeScript implementation. The existing POK rules, deal stream, replay and payout engine remain independent. Loading this module does not select it by default or deploy it to the frozen application.

Upstream: https://github.com/HenryRLee/PokerHandEvaluator

- Exact reviewed commit: `10be452e4c1ee40a6a56f06457f46bff27ca495a`.
- CMake project version at that commit: **0.6.1**.
- License: **Apache-2.0**, retained in `vendor/ph-evaluator/LICENSE` and public `engines/PH-EVALUATOR-LICENSE.txt`.
- The initial master-branch API reference was `6134a3b8f2c342805df33a5888a7d7020b2b45f3` (CMake 0.6.0). The actual freshly cloned default branch is `develop`, resolving to `10be452e…` (commit date 2026-09-15). Both commits were fetched and compared; the selected evaluator, table, public C header and license files have no differences. The final pin uses the actual reviewed default-clone revision, not an inferred release tag.
- `UPSTREAM.json` records SHA-256 for each unchanged copied upstream file. The full clone is preserved privately in ignored development artifacts; it is not part of the vendored source or public bundle.

The subset includes only five/six/seven-card Hold'em evaluator C files, their perfect-hash tables and headers, license, and relevant version/API source evidence. No Omaha tables, C++ runtime, Python runtime, third-party JS port, remote runtime download or upstream benchmark binary is used.

## Build

`scripts/build-ph-wasm.ps1` uses an existing verified Clang/LLD installation; it never installs or upgrades tools. The tested compiler is Clang and LLD **22.1.8**, LLVM commit `ca7933e47d3a3451d81e72ac174dcb5aa28b59d1`. The script checks its actual Git root, verifies every upstream file hash, compiles a fixed reviewed source list and records build metadata. Its optional `ClangPath` parameter accepts an operator-selected existing compiler.

Target: `wasm32-unknown-unknown`, C99, `-O3 -ffreestanding -fno-builtin -nostdlib`, no entry point, no imports and one thread. Fixed linear memory is **393,216 bytes** (six pages), including a **65,536-byte stack**. Memory growth beyond that cap fails. No WASI or Emscripten SDK is needed.

Upstream files are unmodified. Separate POK port shims are small and explicit:

- `pok-port/stdio.h` is empty because the selected source includes that header but calls no stdio function. New accidental use fails compilation.
- `pok-port/runtime.c` supplies only a byte-loop `memset`, compiled with builtins disabled. It supports compiler-emitted array initialization without importing a libc.

Generated `public/engines/ph-evaluator.wasm` is **174,063 bytes**, SHA-256 **092a30b76ac3f1a3e20e2d17e6f75a61541fa445109d3ea5fc5b83c5ccc92b6e**. `ph-evaluator-build.json` records pin, exact compiler identity, source/shim hashes, size and memory. The adapter verifies the expected binary SHA-256 before instantiation. A reviewed rebuild that changes the hash requires explicitly updating the adapter and rerunning validation; a stale or substituted asset fails visibly.

## Mapping and integration

Upstream `cpp/include/phevaluator/phevaluator.h` explicitly maps rank `2..A` to indexes `0..12`, multiplied by four, then clubs/diamonds/hearts/spades `0..3`. This is exactly the existing POK card encoding; no guessed suit permutation is used. All 52 IDs are tested.

PH's raw ranks are 1 (best) through 7462 (worst). The adapter returns **7463 − raw rank**, so higher is stronger and equal scores are true ties. These ordinal values must never be passed to POK's original base-15 `handCategory` function or compared numerically across engine implementations. `phCategory` maps ordinal boundaries from upstream `rank.c` to the shared category order; ordering/ties are compared independently in tests. This is a ranking ordinal, not equity or a strategy recommendation.

`loadPHEvaluator()` lazily fetches only the app-origin static WASM asset when an explicit analysis worker selects it. Fetch has a ten-second timeout and a two-megabyte cap; no external URL, shell, server execution or hidden game state is used. The loader rejects wrong hashes, unexpected imports/exports, invalid memory size and failed deterministic ABI checks. Failures remain explicit and retryable; it never silently switches algorithms. The parent analysis controller owns cancellation/stale-response handling; terminating that worker also abandons its in-progress load. Same-origin static bytes may be browser-cached; the instantiated module stays inside its worker. The `compileAndInstantiateMs` diagnostic includes the preliminary SHA-256 integrity check in the final adapter.

The scoped preview application's CSP must allow `wasm-unsafe-eval` in `script-src` for WebAssembly compilation. The frozen offline deployment's policies are not changed by this module. Browser loading, worker cancellation and preview integration are separate parent-level tests; Node WASM success alone does not establish them.

## Validation actually run

Six automated PH tests passed, including all nine categories, wheel straights, board ties, double trips, three pairs, kickers, invalid/duplicate cards, all 52 mapped cards, binary hash/import/export/memory checks, 10,000 seeded seven-card comparisons and 1,000 each of five/six-card comparisons. The independent five-card/best-of-21 reference uses a distinct straightforward classification algorithm. Exact numeric encodings differ, so comparisons cover categories, ordering and ties.

Separate bounded verification jobs ran through the real compiled module:

- 10,000 seeded seven-card hands: **0 category/rank-mapping disagreements, 0 ordering disagreements**, 2,699 observed ranks; 339.6 ms for reference-inclusive checks before adding loader hash timing. Exported deterministic corpus: `artifacts/ph-oracle-corpus.json`, SHA-256 `c6972e41203ffa643d98e580e40d193bcaaf5a8004fb1f31d4668a63243233af`.
- Exhaustive five-card census: **2,598,960 hands**, all **7,462 distinct ranks**, **0 disagreements**, 3,357.3 ms. Categories high to low: 1,302,540 / 1,098,240 / 123,552 / 54,912 / 10,200 / 5,108 / 3,744 / 624 / 40.
- One bounded Node timing comparison, 100,000 seven-card evaluations per route over a fixed 10,000-hand corpus: checked PH 14.9 ms, already-validated PH 4.0 ms, original already-validated evaluator 80.4 ms. These are actual warm CPU timings on the development workstation, not browser/worker throughput, professional strength, or a promised speedup on other computers.
- Independent **PokerKit 0.7.6**, using the existing isolated **Python 3.14.7** environment: 10,000 category and 10,000 normalized-index comparisons plus 9,999 adjacent ordering/tie checks, **zero disagreements**. The reproducible `scripts/ph-pokerkit-check.py` calls `StandardHighHand.from_game` and records the same corpus hash in [PH_POKERKIT_VERIFICATION.json](PH_POKERKIT_VERIFICATION.json). The final evidence run took 2.182 seconds. No package/environment change occurred; this is not exhaustive seven-card validation or strategy validation.

No GPU, model, paid API, solver, service, new port, Apache deployment or remote publication was involved in this port. Actual browser/worker integration evidence is recorded separately by the parent and must not be inferred from these checks.
