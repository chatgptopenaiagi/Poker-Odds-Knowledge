# Bounded native OMPEval integration

Verified locally on 2026-09-30. This is an optional development/native backend, not the default offline calculator and not a strategy solver. No Apache configuration, service, firewall, system PATH, or existing poker rules were changed. No native program is invoked by an offline browser.

## Provenance and real build

The [OMPEval source](https://github.com/zekyll/OMPEval) is pinned to `4aec210ff75b0851af0ee170b35a7899e1a4fe8f` dated 2016-08-21. The actual retained source, two marked portability changes, and licenses are recorded in `vendor/ompeval/PROVENANCE.md`. It is ISC; bundled libdivide has a separate three-condition permissive license. The JSON parser is unmodified nlohmann/json 3.12.0 (MIT) with its release-published header hash verified. These notices must accompany native distributions.

Actual compiler: clang-cl 22.1.8, LLVM commit `ca7933e47d3a3451d81e72ac174dcb5aa28b59d1`; installed MSVC headers/libraries 14.51.36231; installed Windows SDK 10.0.28000.0. CMake 4.4.3 was observed but is not used. `scripts/build-ompeval.ps1` was executed successfully with C++17, `/O2`, `/MT`, x64 and lld. It selects fixed, verified local compiler/SDK paths without changing environment configuration. A machine without this route must select and verify its own compatible build environment; this script does not install one.

The native build manifest, full local build log and binary reside under ignored `native/bin/`; they are never copied into Apache public assets. The build completed with two diagnostics for the same old upstream conversion of an unlimited uint64 sentinel to double. The adapter always sets a finite positive deadline, so it does not use that unlimited setting. Windows `INFINITE` is undefined in the new adapter before loading the upstream header to avoid a macro-name collision.

Final tested binary SHA-256 is recorded in `OMPEVAL_VERIFICATION.json` and `native/bin/build-manifest.json`; the local launch module hashes the actual binary before execution and refuses manifest mismatch. This detects build mismatch, not malicious changes by an administrator controlling both files. Imported DLL inspection found only Windows system dependencies; static CRT was used.

## Strict native contract

One process handles one structured JSON request on stdin and emits NDJSON progress plus one terminal result on stdout. Schema 1 operations:

```json
{"schema":1,"op":"equity","ranges":[[[48,49]],[[44,45]]],"board":[0,5,10],"dead":[],"maxStates":250000,"deadlineMs":15000}
```

The other operations are `{"schema":1,"op":"info"}` and `{"schema":1,"op":"evaluate","hands":[[48,49,0,5,10]]}` (one through 10,000 five-to-seven-card hands). Inputs use POK integers, rank 2 through ace, suits clubs/diamonds/hearts/spades. The adapter explicitly converts suit indices to OMPEval's spades/hearts/clubs/diamonds order using `{2,3,1,0}`. Evaluation ranks are upstream integers, higher is better; dividing by 4096 yields categories 1 through 9. They must not be compared numerically with POK/PH score encodings.

`CardRange` is a set of unique concrete combinations. The adapter never invokes the upstream permissive notation parser. Duplicate combinations, malformed cards, unexpected fields, unsupported weights, side pots, and extra executable/path parameters are rejected. Known board/dead blockers remove affected combinations; empty/impossible joint ranges fail. Board lengths are 0, 3, 4 or 5; two through six players are supported. Preflop queries normally exceed the small exact budget and are rejected.

Only uniform ranges, conditioned jointly on collision-free assignments, are accepted. Expected states are independently counted compatible joint assignments multiplied by `C(remaining cards, remaining board slots)`. A conservative Cartesian upper bound is checked before that count, so collision-heavy feasible problems can still be rejected. Suit/permutation lookup optimizations inside OMPEval preserve multiplicity: physical evaluations are reported separately from full outcome states.

`EXACT_ENUMERATION` requires `hands == independently expected states == sum(winsByPlayerMask)`. Upstream `finished` includes forced stops and its internal progress can become 1 before a batch ends; neither is accepted as evidence of completion. Progress uses completed weighted outcomes divided by the independent expected count.

The winner bitmask counts are used to calculate outright wins, raw tie occurrences, losses, fractional tie shares, and expected pot share separately. `ties` in the upstream structure is already fractional; it is not mislabelled as raw tie count. Overall winner masks cannot recover winners of side pots excluding a stronger player; **side pots remain unsupported**. Root canonical integration must reject them, not reinterpret those masks.

## Why native simulation is unavailable

Upstream `EquityCalculator` seeds its random walk from `std::random_device`, offers no public seed control, reuses correlated states, and its fast integer distribution describes modulo-like bias. This release exposes no native simulation request, no invented seed, and no IID Hoeffding/95% interval for that implementation. Exact results have `seed:null` and `uncertainty:null`. The separately tested POK browser estimator remains the supported estimated-equity path.

## Bounds and server boundary

- One worker thread and at most one native child per Node module; concurrent calls fail with `native_busy`.
- Hard maximum 250,000 exact outcome states; requested deadline 100–15,000 ms.
- A Windows Job Object enforces a 256 MiB process committed-memory limit and fails closed if unavailable. Peak process committed memory is measured from that job, not estimated from GPU/RAM inventory.
- Native watchdog invokes `stop()` at the deadline, joins with `wait()`, and terminates only its own process after a 500 ms grace period. The parent independently kills only its own child after deadline plus 1,000 ms. The cancellation test exercised actual child termination; a deliberately stalled full timeout and deliberate memory exhaustion were not forced.
- Input cap 256 KiB; JSON depth guard; output cap 512 KiB; stderr cap 16 KiB. Maximum evaluation request size is also constrained by the byte cap.
- `server/native-engine.ts` accepts no executable path, arguments, working directory or shell input from requests. It spawns the fixed verified binary with `shell:false`, `windowsHide:true`, and validates returned rank/count/share relationships.
- This module itself is not a network endpoint. Any route requires existing authentication, CSRF, quotas, approved information-set extraction, cancellation, and explicit opt-in. Availability of this binary alone does not prove route/UI validation.

## Actual checks

`npx vitest run tests/native-engine.test.ts`: **12 PASS** against the real binary. Cases include all categories/wheel/kickers/suit ties; 2,400 seeded five/six/seven-card hands against independent best-of-21 rank ordering; fixed flop 990; six-player flop 666; one explicit dead card 946; all 990 legal river opponent hands; six-way board-playing tie; collision-conditioned joint ranges and seat permutation; blockers/impossible ranges; budgets/unknown fields/weights/pots/duplicates/JSON depth; actual cancellation and concurrent-job rejection. Strict standalone TypeScript check passed.

`npx tsx native/verify-corpus.ts` was executed over the shared PH corpus: **10,000 seven-card category checks, 9,999 adjacent total-order/tie comparisons, zero disagreements** with both PH ordinals and independent reference scores. Corpus identity and timing are in `OMPEVAL_VERIFICATION.json`. The separate actual `scripts/ph-pokerkit-check.py` result was inspected: PokerKit 0.7.6 on Python 3.14.7 agreed with PH on all 10,000 categories/normalized ranks and 9,999 adjacent order/tie comparisons (zero disagreements, 2.29 seconds). This is a shared-corpus chain of cross-checks, not a claim that native rank integers equal PokerKit indices. It is not exhaustive seven-card verification or strategy validation.

Measured one bounded 79,200-outcome query: about 80.6 ms end-to-end including process launch/hash checks, 19.4 ms native elapsed, 9,307 physical evaluations after symmetry optimizations. The 10,000-hand evaluation request took about 205.1 ms end-to-end. These are single observed workloads, not professional-performance or universal-speed claims. No GPU benchmark, model call, or soak test occurred.

The commands above were run in the isolated source worktree. Rebuild if adapter/source/compiler settings change, then rerun the tests and corpus verifier. The native binary and source must remain outside the public web root. No default engine was switched and no release or deployed site was replaced by this work.
