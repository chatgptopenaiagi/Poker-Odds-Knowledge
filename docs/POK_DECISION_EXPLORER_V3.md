# Decision Explorer v3 — two response assumptions

Open Hand Review → River response example → Response Explorer → Compare two response models. Eligible replay positions offer the same panel. The pot, proposed bet, hero/public cards and initial opponent range come from the existing v2 study. Model A and Model B have independent call rules and multipliers. They are declared assumptions, never predictions of an identified player. Nothing executes a bet or writes a saved hand.

## Contract

`riverSnapshot` reuses `terminalBetContext` and the existing reducer legality checks. Its version-1 snapshot freezes the context and card arrays and includes hand ID/revision, public inputs, pot, covered bet bounds and initial range. It excludes opponent cards, deck, burns and future history. Only factory-validated immutable snapshots are accepted by the comparison API; arbitrary serialized objects must be revalidated from the existing hand model. Both results reference the same snapshot object.

`prepareResponseComparison` validates exactly two Fold/Call declarations, bounded range text, finite probabilities, explicit calculation options and the expected hand revision. Model properties outside the contract are rejected. No independent fold-frequency parameter can contradict the calling distribution. The v2 rule remains q_i = call-rule weight × multiplier, with unlisted combinations folding. Compatible calling weights are w_i*q_i; call probability is sum(w_i*q_i)/sum(w_i). The existing parser retains maximum-overlap semantics. Subnormal probabilities that would underflow to a false all-fold model are now explicitly refused.

`compareResponseModels` delegates to the existing worker through an injected runner. It does not introduce an evaluator, RNG, network or storage implementation. Each conditional calling distribution is evaluated separately with the same selected engine, method, budget and fixed seed 20260930. Completed identical requests within one comparison reuse one validated answer; cache scope is only that invocation. Engine, revision and input hash are checked before v2 `responseValue` validates the conditional payoff. All-fold branches are analytic and need no fabricated equity. Jobs run sequentially; cancellation and snapshot-generation checks reject obsolete replies. A completed unchanged comparison cannot be needlessly recalculated; edits/reset/navigation/reload clear it.

Both modeled values use the unchanged equation:

`EV = f*P + (1-f)*(E_call*(P+2*B)-B)`.

P includes the pot before the proposed opening bet. B is each player's equal added bet/call. Earlier committed chips are sunk. The result reports signed B−A and its absolute magnitude in chips, plus which declarations changed. It does not claim that one assumed model is true, that a positive EV guarantees profit, or that a larger modeled value establishes the optimal action.

The scope remains heads-up river, one eligible pot, covered legal opening bet, Fold/Call-only responses, no raises, rake, fees, refunds or future betting. Check EV is unsupported. No full strategic EV, equilibrium or GTO claim is made. Existing solver/bot systems are not replaced or used as unstated response assumptions.

## Numerical and uncertainty boundaries

Arithmetic equality uses the established probability tolerance 1e-12 scaled by max(1,P+2B) into chips. This is roundoff tolerance, not statistical uncertainty. Raw signed/absolute differences remain available. Tiny nonzero displayed differences retain their sign and an explicit magnitude bound instead of appearing as a confident zero.

For Monte Carlo, each model retains actual counts, engine, seed, provenance and the v2 transformed fixed-N interval. No interval or significance claim for B−A is invented; common seeds and identical-result reuse are not independent observations. The UI explicitly states this limitation. Intervals do not validate opponent behavior assumptions.

## Verification

Independent arithmetic references extend v2's verified fixtures. On the royal board with P=20 and B=20, 50% Fold gives EV15; 0% Fold gives EV10; 100% Fold gives EV20. Differences are -5 or +5 from A=15. Identical models give zero and one worker execution. With hero AA on the documented weighted AA/KK/99 river, KK-only calling gives EV70/3 while 99-only calling gives zero; B−A=-70/3 and absolute difference70/3. Tests also cover zero/full equity, weighted blockers, malformed/oversized models, unsupported states, stale revisions/replies, immutable identity, near-equal values and large valid chip values. These are hand-counting/arithmetic references, not a claim of an independent full solver oracle.

Unit source: `tests/response-comparison.test.ts`. Built Edge source: `tests/response-comparison-browser.spec.ts`. Browser assertions exercise real Standard and PH workers, changes to conditional ranges, cancellation, reset, navigation, reload, keyboard activation, theme compatibility, Romanian formatting, 200% text/140% cards and a 430px viewport. Synthetic notebook hand/history/progress/scenarios remain unchanged. External requests are blocked before load. One existing replay counter overflow at that enlarged layout was reproduced and repaired with wrapping controls. Its original failure and the underflow regression failure remain in local v3 evidence.

Use the established `playwright.repair.config.ts` gate with `POK_TEST_URL` set to the verified isolated preview, `POK_REPORT` set to the new report path, and `POK_AUDIT_DIR=artifacts/range-response-v3`. V2 reports/checkpoints are retained. No deployed installation, real notebook, account, SQL/WSL/CAE integration or machine service is changed.

Performance is measured from actual worker comparisons and recorded in browser attachments. Two different requests use at most two sequential workers; identical inputs use one; all-fold pairs use none. These measurements are representative fixtures, not universal latency guarantees. All diagnostic details remain collapsible; result values and exclusions stay visible. English/Romanian follow existing localization conventions; other locales retain English fallback and are not claimed professionally reviewed.
