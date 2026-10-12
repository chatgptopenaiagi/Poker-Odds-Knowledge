# Range and response intelligence

## Range checkpoint

Odds Lab's existing hero, board, dead-card, engine, method, budget and seed controls supply the Range Explorer. Range A is the existing one-opponent assumption. Range B is temporary and uses the same extracted `RangeMatrix` component as the original workbench. Existing multiway Odds Lab remains available; this comparison requires one opponent.

`range-study.ts` uses `expandRange`, without changing syntax or weighting. AA expands to six combinations, AKs to four and AKo to twelve. `77+` is supported; dash intervals are not. Overlapping tokens retain maximum weight, including duplicate explicit tokens. Duplicate concrete combinations at the engine boundary remain invalid. Matrix cells with mixed combination weights show the maximum; the text remains authoritative. Editing a cell deliberately replaces that cell's weights.

Blocker support shows raw counts and unnormalized weight mass before/after filtering, plus exact removed combinations and known-card reasons. Known cards are the entered hero, public board and explicitly declared dead cards. No opponent holdings are inferred. Empty support prevents calculation. Raw weight mass is not a probability or effective sample size.

Comparison runs two sequential existing EngineClient workers. Only completed results from the current snapshot are displayed. Edits, backgrounding and cancellation terminate owned work. `rangeDifference` rejects incompatible engine, method, card, seed, budget, pot or opponent-count contexts. Auto selection may produce different methods for A and B; that comparison is refused rather than mixed. Select a common explicit method in that case. Exact enumeration remains bounded by the existing engine limit.

The displayed difference is 100*(E_B-E_A) percentage points. Each result preserves its method, count, seed, input hash and engine provenance. Monte Carlo retains individual fixed-N intervals; no interval for the difference or significance claim is made. No causal story or actual opponent knowledge is inferred from a difference. The comparison does not add a call threshold where no validated betting context exists.

Independent reference: hero Ac Ad on 2c 3d 7h 8s 9c beats Kc Kd, ties As Ah and loses to 9d 9h. Range A=KcKd has equity 1. Range B with weights AA=.5, KK=.25, 99=.75 has equity 1/3, hence difference -200/3 percentage points. With As and Kd blocked, AA/AKs/AKo support becomes 3/2/7. These are small hand-counting references, not an external oracle.

No persistence migration is introduced. Comparison controls/results reset on reload; saved scenarios, hands, RNG and learning progress remain untouched. English/Romanian use existing fallback conventions. Offline acceptance means isolated browser HTTP access with external requests blocked before first load.

Verification commands: `node node_modules/typescript/bin/tsc --noEmit`; `node node_modules/vitest/vitest.mjs run`; `node node_modules/vite/bin/vite.js build --mode strategy-preview --outDir artifacts/card-repair/site`; `node node_modules/@playwright/test/cli.js test --config playwright.repair.config.ts`. Private evidence is under ignored `artifacts/range-response-v2/`. Source code, unit integration and real built Edge acceptance remain distinct evidence categories.

## Restricted response checkpoint

Hand Review offers a temporary **River response example** and a Response Explorer on eligible replay positions. The existing reducer and `legalActions` validate a hero-turn, heads-up river opening bet with equal prior contributions and full opponent coverage. There must be no outstanding wager, side pot, refund or completed hand. Positive integer bets must satisfy the actual minimum, hero stack and opponent stack. The model projects only hero/public cards and public chips. It never uses opponent holes, deck or future replay actions. A hypothetical reducer transition is performed on a copy to check the response legality; it is never saved or executed in the original hand.

The model explicitly restricts the opponent to Fold or Call. This is a declared educational assumption, even when the unrestricted rules allow raising. Check is legal at the initial decision but is not priced: a genuine check EV would need an opponent continuation model. Fold/Call and Check/Bet are not falsely offered together. Existing heuristic bots and the restricted CFR solver remain separate; no solver policy or predicted opponent behavior is claimed.

Let initial combination weights be w_i after known-card blockers. Let q_i be the call-rule weight times a common user-selected multiplier, bounded to [0,1]. Combinations not listed in the call rule fold. Rule combinations absent from the initial range have zero prior mass. Overlap follows the parser's maximum rule. The model derives Pr(Call)=sum(w_i*q_i)/sum(w_i), f=1-Pr(Call), and conditional calling weights w_i*q_i. The existing equity worker evaluates those conditional weights, not the original range. Changing a call-rule subset changes both fold mass and conditional equity; changing only the common multiplier deliberately holds the conditional calling distribution fixed. No independent fold slider is allowed to contradict the declared range model.

For pot P, equal added bet/call B and conditional expected pot share E_call:

`EV_bet = f*P + (1-f)*(E_call*(P+2*B)-B)`.

Values are relative to the current decision; earlier contributions are sunk. When the opponent folds, the uncalled bet comes back and net gain is the existing pot P. When called, the hero's expected net payoff is share of the final pot minus the added bet. No rake, fees, side pots, partial calls, raises or further betting are modeled. Positive modeled EV is not a full strategy recommendation or guaranteed profit. At f=1, the calling branch is unreachable and no equity result is fabricated. At f=0, the ordinary terminal showdown branch remains.

`responseValue` validates completed result shape and the expected conditional request hash. The UI also guards generation and snapshot identity. Its Monte Carlo interval is the existing fixed-N equity interval transformed by the fixed affine payoff model, conditional on the specified response assumptions. It does not quantify uncertainty about opponent behavior. Exact values remain conditional on those assumptions.

Reference cases: the royal-board example has P=20, B=20 and E_call=1/2. With f=1/2 the EV is 15; with f=0 it is 10; with f=1 it is 20. For the weighted AA/KK/99 fixture described above, calling only KK gives Pr(Call)=1/6 and E_call=1, so EV=70/3. Calling only 99 gives Pr(Call)=1/2 and E_call=0: EV=0 at B=20, or -10 at B=40. These independent arithmetic expectations are tested against real evaluator outputs. A seeded 2,000-observation weighted call model also tests an EV interval crossing zero without retrying seeds.

The first response browser test incorrectly stored an unfinished synthetic hand in completed history and was correctly rejected by storage validation. The corrected fixture completes the hand through the reducer and replays decision 7. The original failure evidence is retained; storage validation was not weakened. Tests verify saved hand/active hand/progress/scenarios remain unchanged, context changes invalidate results, invalid bets are refused, card themes and Romanian formatting work, and external network is blocked before first load. Other locale catalogs retain existing English fallback; translations are not professionally certified.

Remaining scope: no multiway range comparison, no paired Monte Carlo significance interval, no automatic range prediction, no raise response, no multistreet continuation, no priced Check alternative, and no full-game GTO. The source comparison and response panels are temporary study tools; no owner deployment or account/backend acceptance is implied.
