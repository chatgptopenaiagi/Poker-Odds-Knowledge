# Bounded river strategy architecture

Strategy Study adds a separate decision model. The existing game reducer, deck/random streams, evaluator used for payouts and hand histories remain authoritative. A completed solver job cannot deal cards, submit a gameplay action, award chips or rewrite a played hand.

## Model and mathematics

The supported model is two active players, OOP then IP, on a complete five-card river board, no rake/antes/side pots, equal effective remaining stacks and one common initial pot. Each seat supplies a small explicit weighted concrete range. Card/weight validation rejects impossible input; compatible joint assignments have probability proportional to the **product of both weights**, normalized once across disjoint assignments. The learner's displayed cards must belong to the declared range; selecting another learner hand does not create another solved game.

The public tree offers CHECK/BET for OOP, CHECK/BET for IP after a check, and FOLD/CALL against a bet. An optional single full raise uses explicitly listed **raise TO** amounts, not raise BY. Every configured raise must meet the restricted full-raise rules; short all-in reopening and arbitrary bet sizes are out of scope. Check/check or matched call ends in showdown. Fold ends immediately with uncalled chips returned. There are no chance or future-street nodes.

Utilities are centered zero-sum chips. If the initial pot is P, the winner gains P/2 plus the opponent's new committed chips; the loser loses P/2 plus their own new committed chips. A tied, matched showdown gives zero to each. Example: P=100, OOP bets 50, IP raises TO 150 and OOP folds. OOP utility is −100 and IP +100; IP's unmatched 100 is returned. Past contributions to the initial pot are not charged again. Centering changes the displayed baseline, not action preferences.

Let V be OOP's expected utility under the exported average-policy pair. IP receives −V. Exact best-response values B0 and B1 each give one player their strongest unilateral deviation against the other's fixed average policy, respecting their information sets. **NashConv = B0+B1** in chips; two-player exploitability is half that amount. The reported pot percentage is `(NashConv/2)/P ×100`. Both deviation gains are nonnegative apart from small rounding: B0−V and B1+V. Self-play EV alone is not a convergence check.

Action EV is the conditional expected centered payoff for choosing that action and continuing with the exported average policies, under compatible opponent reach at that information set. It is not an optimal-continuation guarantee or terminal-call formula. Model-relative regret subtracts the chosen action EV from the largest listed action EV. A global NashConv bound is **not** a per-hand regret error bound. Mixed equilibrium actions may be approximately indifferent, and exact action frequencies need not be unique.

If opponent reach at an information set is zero, its conditional belief/EV is undefined. The adapter labels any initial-range fallback there; it must not be graded as a reached, validated decision. Own reach also matters for the displayed learner path. The oracle separately records which rows were excluded rather than treating arbitrary zero-reach continuation as evidence.

## Components and authority

| Layer | Responsibility | Authority boundary |
| --- | --- | --- |
| `src/strategy/contract.ts`, versioned JSON schemas | Strict game/abstraction/budget request, input hash, result metadata and pack validation | A checksum detects changes; it is not independent oracle attestation or a signature. Imported provenance must remain distinguishable from shipped verified packs. |
| `src/strategy/scenario.ts` | Converts explicit study fixtures to requests | Does not accept the simulator's deck, hidden cards, burn cards, future board or private action state. |
| `src/strategy/client.ts` | Explicit solve action, polling, cancellation and stale-result protection | Cannot start a local service/JVM; account/session and solver opt-in are required for API work. Offline packs remain useful without it. |
| `server/strategy-routes.ts` | Same-origin authenticated API, owner-specific job access/cancel, protected owner health | Existing platform Origin/CSRF/session/permission checks apply; no anonymous shell endpoint. |
| `server/strategy-jobs.ts` and migration | Persistent bounded queue, idempotency, per-owner isolation, quotas, restart-only recovery | One active owned process; no implicit resumable solver state. Cancel/deletion/shutdown must prevent late result publication. |
| `server/strategy-adapter.ts` | Validates model, checks configured runtime/JAR/dependency identities, streams bounded records, maps output | Only fixed executable/classpath; user input travels as JSON stdin, never command text or arbitrary file/URL. |
| `engine-adapters/java/` | Real upstream river CFR traversal and discounted average, explicit finite tree, terminal evaluator, progress | Local CPU-only opt-in; no gameplay authority, cloud model or third-party table access. |
| `scripts/solver-oracle.py`, `scripts/solver-quality.py` | Independent development LP/PokerKit checks and fixed-budget evidence | Not imported by the web app, service request path or Android edition; no per-click Python dependency. |

The canonical solve hash includes model, ranges, target/budgets and pinned adapter/upstream identity, while excluding request/revision/permission identity and the displayed learner hand. The latter affect ownership/UI but not equilibrium. Cache keys retain solver and adapter identity. Engine attribution and mathematical output must be checked against the exact request, not merely stamped onto arbitrary raw data.

The configured service enforces one active job, a short bounded queue, iteration/time limits and a fixed 512 MiB Windows process-memory limit. JVM heap is capped separately at 256 MiB. The guard verifies its owned child identity before releasing solver input and closes only that process job on cancellation. Native resources are local implementation details; no browser control can alter executable paths, memory policy, libraries or global services.

## Results, packs and honest limits

`fixtures/strategy/scenarios.json` contains six original small weighted-range studies. The prescribed 500/2000/10000 iteration plan and independent final quality gates are in [SOLVER_QUALITY.json](../strategy/SOLVER_QUALITY.json). Final packs use the predetermined 10,000-iteration output, retaining exact request, solver revision, average strategies, values, reported convergence and independent verification metadata. All previous checkpoints stay available for audit; no best-looking checkpoint is substituted.

Completed work and precision are separate: an exhausted iteration budget with excessive gap is partial/inconclusive. Interrupted or failed jobs cannot be labelled exact or solved. A low gap applies only to that game, its omitted actions and assumed ranges; the app should explain these limits beside decision feedback. Offline pack checks must preserve provenance and mark unverified imports before grading. Refer to the contract review tests for tampered verification fields, missing nodes/hand rows and stale/raw model mismatch.

The baseline ordinary trainer and selectable-engine preview remain separate from this new study feature. Live cloud AI, real OAuth, public hosting, a native Android solver, turn/flop solving and active multiway equilibrium are not inferred from a successful JVM river solve. UI/Android build and execution evidence must be recorded independently in the final mission manifest.
