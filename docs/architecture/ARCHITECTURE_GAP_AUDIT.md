# POK architecture gap audit

Baseline inspected 2026-09-30 around 09:58 UTC, starting commit `c9e37e31079dfec3ebea8a2d8653ca88cc077018`, branch `feature/river-strategy-android`. The initial source audit preceded the new solver and Android implementation. This is a bounded review of relevant entry points, manifests, tests and existing delivery reports; it does not inspect private browser data, account databases, CLA snapshots or unrelated projects.

## Evidence states

- **ABSENT:** no implementation found in the inspected baseline entry points/dependencies.
- **DESIGNED:** a documented proposed boundary exists; executable behavior is not established.
- **IMPLEMENTED:** concrete source and reachable code paths exist.
- **BUILT:** an actual output exists with build evidence, at the specified revision/edition.
- **TESTED:** named checks were actually run; historical tests retain their original date and scope.
- **AVAILABLE-HERE:** the feature can be used through the stated local route/runtime now. An HTTP 200 proves only page reachability, not a fresh full workflow test.

These labels are evidence dimensions, not marketing grades. A source file, package name, menu or roadmap does not prove runtime availability. A copied prior report does not rerun its tests.

## Editions are different artifacts

| Edition | Actual baseline evidence | Availability and boundary |
| --- | --- | --- |
| Existing offline trainer, `/holdem-lab/` | Read-only GET returned **200**, title Poker Odds Knowledge, 432 HTML bytes. The prior owned deployment is frozen. | **AVAILABLE-HERE** as the existing static trainer. Its served bundle is not silently replaced by current strategy source. New solver/platform source is not thereby deployed. |
| Selectable-engine preview, `/holdem-engines-preview/` | Read-only GET returned **200**, same product title, 456 HTML bytes. Prior `ENGINE_INTEGRATION_REPORT.md` records actual build, 368 tests and seven browser workflows. | **BUILT / TESTED (prior) / AVAILABLE-HERE** for the documented preview. Its separate notebook/preferences protect normal-origin data even though both paths share one origin. |
| Optional online platform | `server/main.ts` and `src/Platform.tsx` implement a distinct online build; Better Auth/Hono/SQLite APIs and isolated tests exist. | **IMPLEMENTED / TESTED (prior)**. No listeners were found on the two documented project ports 4318/4319 during this audit. No server was started by this audit. Public hosting and external credentials remain absent. |
| New river strategy study | Prior `STRATEGY_ENGINE_ROADMAP.md` establishes design gates; baseline has no solved-policy API. | **DESIGNED** at baseline; this mission must separately prove a real solver, job boundary, convergence, saved results and UI. A ranking/equity engine is not this feature. |
| Android package | Baseline scripts/dependencies contain no Capacitor/mobile app or Android install evidence. | **ABSENT** at baseline. Current mission work must separately establish build, device/emulator execution and data export. A web preview is not an APK test. |

The source workspace is a new isolated worktree, with no Git remotes at the time of audit. Shared runtime facts rechecked here: Node **26.8.1**, Git **2.55.0.windows.5**, existing verification Python **3.14.7** and PokerKit **0.7.6**. These observations do not attest a CLA process launch or renew prior hardware evidence.

## Source and trust boundaries

`index.html` → `src/main.tsx` → `src/App.tsx` is the React entry. `vite.config.ts` selects ordinary offline, online, or engine-preview public builds. The baseline always includes the game UI but gates platform calls with an online compile-time flag. A new strategy/mobile target should preserve that separation rather than making guest study depend on an account server.

| Function | Relevant inspected source | Baseline state / gap |
| --- | --- | --- |
| Rules, betting, showdown, replay | `src/game.ts`, `src/evaluator.ts`, `src/cards.ts`, `src/Review.tsx` | **IMPLEMENTED / TESTED (prior)**. Preserve integer-chip accounting and versioned replay; a solver result cannot award chips or change the dealt deck. |
| Actor observations and bots | `src/bots.ts`, `src/Play.tsx`, `tests/bots.test.ts` | **IMPLEMENTED / TESTED (prior)** heuristic policy. No Nash/CFR strategy or professional-strength claim. No hidden opponent/future-card context may cross to the coach/solver. |
| Odds, weighted ranges and side pots | `src/equity.ts`, `src/ranges.ts`, `src/engines/contract.ts`, `src/engines/runner.ts` | **IMPLEMENTED / BUILT / TESTED (prior)**. Exact/estimated output is conditional on declared inputs. Standard and PH share the sampler; their agreement is not independent strategy validation. |
| PH C/WASM | `src/engines/ph-evaluator.ts`, `public/engines/`, `vendor/ph-evaluator/` | **IMPLEMENTED / BUILT / TESTED (prior)**, selectable in the separate engine preview. Pinned binary/hash, lazy same-origin loading and explicit failure. |
| OMPEval native reference | `native/`, `server/native-engine.ts`, `server/native-canonical.ts` | **IMPLEMENTED / BUILT / TESTED (prior worktree)**. Static preview registry explicitly marks browser runtime unavailable. New-worktree native binary readiness must be rechecked; a copied registry flag alone is insufficient. |
| Persistence/import/export | `src/storage.ts`, `src/preview.ts`, migration/storage/browser tests | **IMPLEMENTED / TESTED (prior)**. Origin alone cannot isolate sibling app paths; explicit preview namespacing is essential. Never import guest data into an account or reset the live notebook automatically. |
| Appearance and languages | `src/AppearanceDrawer.tsx`, `src/appearance.ts`, theme tokens and versioned catalogs | **IMPLEMENTED / BUILT / TESTED (prior)**. Machine-drafted translations remain unreviewed; platform/legacy coverage gaps are preserved in language reports. |
| Accounts/community/moderation | `server/app.ts`, `server/migrations/001-platform.sql`, `server/moderation.ts`, `src/Platform.tsx` | **IMPLEMENTED / TESTED (isolated prior databases)**, not active through the offline page. Real SMTP/social approval/login and public service remain external blockers. |
| AI coach | `server/coach*.ts`, `tests/coach.test.ts`, operator notes | **IMPLEMENTED / TESTED (mock transport)**. Disabled without explicit authorized configuration/budget/location policy. No paid call or personal ChatGPT linkage is established. |
| Genuine strategy solving | New separate solver protocol/job/adapter required | **DESIGNED** at baseline. Must disclose game tree, action abstraction, range weights, card compatibility, root utility, iteration count and independent best-response error. |
| Solver remote exposure | No baseline route exists | **ABSENT**. Any new local route must use fixed executables, bounded job state, cancellation and strict input validation. No shell/SQL/Windows-file access from study inputs. |
| Production/public deployment | Existing operator checklist only | **DESIGNED / BLOCKED by missing approved destination and setup**. Local Apache and a private repository are not production hosting. |

Pinned direct dependencies are in `package-lock.json`: React 19.1.1, i18next 26.4.2, Better Auth 1.7.6, Hono 4.13.11, Nodemailer 10.0.13 and OpenAI SDK 7.25.0; Vite 7.3.6, TypeScript 5.9.3, Vitest 4.1.11 and Playwright 1.56.1 are build/test tools. These are inspected lockfile/package declarations; listing them is not a claim that cloud features are configured or that this new worktree has already rebuilt every target.

## Gaps this mission must close with evidence

1. A bounded genuine heads-up river solver using an explicit betting abstraction, separate from gameplay and ordinary equity. Compare returned average strategies with independent terminal payouts, sequence-form equilibrium value and exact best responses. Do not substitute a heuristic frequency or Leduc toy for NLHE verification.
2. A solver job adapter with input validation, fixed process identity, time/memory/concurrency limits, cancellation, terminal job states and no silent complete label for interrupted work. Preserve private information and model-free authority.
3. A coherent study UI: scenario → solve → convergence and range strategy → explanation/save/reopen. Saved strategy results need versioned inputs and solver identity. A new menu without an actual completed solve remains a gap.
4. A locally bundled Android guest edition with explicit asset scope, file export/import and runtime evidence. Native device/emulator availability must be reported independently from APK build success. Credentials, server binaries and user notebooks cannot enter an APK.
5. Regressions across inherited rules/math/storage and new targets, plus actual screenshots/runtime checks. Audit each deployment artifact separately and keep both earlier served directories unchanged unless the current user explicitly authorizes a new isolated preview path.

This initial audit intentionally records gaps before implementation. Final mission evidence should update it with named builds/tests and link the result manifest; it must not promote an inherited report or in-progress file to a fresh PASS.

## Verified implementation update, 2026-09-30 10:22 UTC

The river solver now advances from DESIGNED to **IMPLEMENTED / BUILT / TESTED / AVAILABLE-HERE through the explicit local CLI**. Real upstream Java traversal/discounted average runs in the reviewed finite river tree. Eighteen fixed jobs (500/2000/10000 iterations for six original scenarios) passed independent sequence-form LP best-response, terminal/rank, policy, conditional action-EV and reach checks under a predeclared NashConv ≤0.5-chip gate. See [SOLVER_QUALITY](../strategy/SOLVER_QUALITY.json), [solver architecture](STRATEGY_ARCHITECTURE.md), and [source/license research](SOLVER_RESEARCH.md).

The independent oracle has seven passing Python tests, including a separately constructed normal-form comparison and exact weighted-blocker arithmetic. The Java comparator matched independent PokerKit on 10,011 five/six/seven-card hands with zero disagreements. A strict trailing-JSON parser fix triggered one documented rerun of the unchanged fixed plan against the final JAR hash; prior artifacts were preserved.

Versioned solve schemas, job queue/API, bounded adapter and six canonical verified packs were **IMPLEMENTED** at this checkpoint. Subsequent evidence is recorded below rather than retroactively claiming browser readiness at the earlier observation time. Turn solving remains unsupported/NOT_RUN. Earlier served directories were read only and were not changed by this audit/oracle work.

## Subsequent web/runtime boundary review

The new Strategy Lab is now **IMPLEMENTED / BUILT / TESTED / AVAILABLE-HERE** in its isolated offline preview and local online edition. The parent-run built-browser workflow submitted an authenticated study request to the real guarded JVM, displayed the result and exercised cancellation. After the compiled server build, the authenticated real-JVM solve/cancel browser flow was repeated successfully against `server-build/main.mjs` (one test, 4.9 seconds). Offline packs and explicitly opt-in authenticated fresh solving remain distinct capabilities. Complete final regression totals and screenshots belong in the final test report; this update does not substitute for that final run.

Read-only review and negative cases identified pack-provenance, complete-node/hand validation, raw model matching, cancellation-before-job-ID and periodic-retention/quota edge cases. Corrected source now rejects inconsistent verification metadata, missing/duplicate hand rows and mismatched native input; the UI grants bundled grading only to bundled entries and labels imported/fresh provenance. Job creation returns its ID before deferred cancellation, periodic pruning runs, and separate global usage survives account deletion without its account link. Twenty-nine strategy/API regression tests were reported passing by the owning agent at this checkpoint. These are tested application controls, not a professional security certification.

Seven additional packaging-policy tests pass. A dry-run audit found no remaining blocking secret/path/contact findings after excluding older private machine-evidence reports, retaining required upstream notices and recognizing narrowly reviewed generated URL-test fixtures. No final release archives were created by that audit. Final archives require a clean committed source checkpoint and a new audit of their exact files.

Android wrapper source/build work is in progress at this update; APK existence, device/emulator execution and mobile storage lifecycle must be recorded separately. Do not infer device availability from the installed build tools or a successful web workflow.
