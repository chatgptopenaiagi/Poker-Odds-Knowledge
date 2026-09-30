# Analysis protocol review

Reviewed 2026-09-30 in the isolated engine worktree. This is a focused implementation review and automated regression record, not a security certification or public deployment approval.

## Scope and resolved findings

Reviewed the versioned request/result boundary, browser worker controller, engine registry, comparison verdict, and canonical native wrapper. Ordinary dealing, legal actions, payouts, bot observations, saved-hand replay and the default poker engine were not replaced by these adapters.

- Result identity previously checked request/revision/engine but did not independently verify the returned input hash. The controller now computes the request hash and rejects a mismatched response.
- Null or malformed result/progress frames previously dereferenced fields before validation. They now reject the current calculation and terminate its worker without an uncaught message-handler exception. Progress must have safe nonnegative integer counts with completed no greater than target and target within the supported cap.
- Completed/timed-out workers previously retained live message handlers without a settled guard. A settled flag now ignores late responses/progress/crashes and avoids duplicate completion/termination effects.
- Exact comparison previously examined equity without fully comparing win/tie/loss or the pot list. The comparison routine was strengthened to compare the relevant result components; a matching scalar equity alone is not sufficient evidence of agreement.
- Native build/test evidence and browser runtime readiness are separate. A locally compiled CLI is not a working browser bridge. OMPEval remains unavailable to the static preview selector.

The controller gained an injectable worker factory only for protocol testing; its default factory still creates the actual module worker. The native module accepts a fixed binary, no supplied executable path or shell arguments. The canonical native wrapper rejects simulation, nonuniform compatible weights, side pots, insufficient memory budgets, missing explicit opt-in, malformed cards, and simulator-only extra fields. It does not flatten unsupported weights or infer hidden dead cards.

## Executed protocol unit tests

`tests/engine-client.test.ts`: **11 PASS**. These exercise the real `EngineClient` with an explicitly **simulated Worker transport**. They verify validated snapshot submission; current progress/result delivery; stale request/revision rejection; cancellation before hashing completes and after worker creation; consecutive-call isolation; wrong hash/engine/nonfinite results; malformed frames/progress; worker error/crash/retry; fake-timer deadline handling; and ignored late messages/cleared timers after completion.

These are controller unit tests. They do not prove a compiled browser worker, browser offline behavior, WASM loading, CLA awareness, or Apache deployment. The separate real-browser evidence owns those claims.

## Executed native boundary tests

`tests/native-engine-canonical.test.ts`: **5 PASS**, using the real local native binary where computation is expected. They verify malformed-request/simulator-secret rejection; explicit unsupported memory and pot semantics; equal non-unit compatible weights after blockers versus rejected unequal live weights; oversized exact work returning no partial answer; and cancellation plus separate uncalled-return metadata.

`tests/native-engine.test.ts`: **12 PASS** against the actual pinned OMPEval child. Detailed mathematical, lifecycle, build and resource-limit evidence is in `OMPEVAL_BUILD.md` and `OMPEVAL_VERIFICATION.json`.

The final focused run of the 11 controller plus 5 canonical tests passed together (16 tests, two files). A strict direct TypeScript check of both files passed. The root agent owns the final full-project build and browser regression run after dependency synchronization.

## Limits retained

Native side pots remain unsupported: an overall winner mask cannot identify a weaker winner when the overall winner is ineligible for a particular side pot. Native random-walk simulation remains disabled because upstream seed/dependence semantics do not support the browser estimator's reproducibility or fixed-N uncertainty claim. The native exact-state upper bound is conservative and can reject some heavily overlapping ranges that would have fewer compatible assignments.

Cancellation exercised an actual native child, while protocol deadline tests used fake timers. Deliberate native memory exhaustion and a deliberately stalled hard-timeout process were not forced. No live HTTP native route, external engine server, public hosting, paid model call, merge, deployment, or publication was performed by this review.
