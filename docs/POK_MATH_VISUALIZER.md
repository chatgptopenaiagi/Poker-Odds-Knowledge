# Math Visualizer foundation

Odds Lab now presents completed results from the existing cancellable EngineClient worker as graphical cards and accessible win/tie/loss meters, separately from fractional expected pot share. It retains exact/Monte Carlo attribution, completed outcome count and the existing fixed-N confidence interval. No probability is hardcoded and no sampler/evaluator was replaced.

A deterministic study-only explanation computes C/(P+C) and equity*(P+C)-C for an editable single fully eligible pot, no rake, no future betting. Amounts are explicitly separate from the active game. Zero/zero is undefined, invalid/empty chip input gets a visible error. This is not a strategic recommendation and does not infer unknown opponent behavior.

The flop/turn explorer enumerates next cards using the existing evaluator and displays category improvements. It excludes known fixed opponent/dead cards. It deliberately does not call these winning outs or treat their count as a weighted-range draw probability. Selecting one updates the scenario, cancels/invalidates its old result, and requires Calculate equity for the new conditional result. Preflop and river still support calculation, but have no one-card category explorer.

Unit checks cover terminal EV/threshold/zero/invalid values and independently counted flush candidates (13 spades minus known cards). Built browser evidence exercises flop exact 990 outcomes, conditional turn 44, a river royal-board tie (100% tied best, 50% expected share), seeded preflop Monte Carlo, invalid amounts and source-result invalidation. This is a usable foundation, not a full weighted winning-outs or payoff-distribution system.

New descriptions and card labels are English/Romanian, with disclosed English fallback elsewhere. No account, AI, SQL Server, WSL or internet dependency. Existing progress/exercises are preserved. No new adaptive-learning/progress dashboard was started in this slice.

Final combined built-preview gate: 14/14 browser tests pass, with 415/415 unit tests and TypeScript passing in the configured development environment. The first visualizer browser run exposed system-locale number formatting; the count now uses the selected locale. An existing same-origin assertion was corrected to compare the actual preview origin rather than a hardcoded hostname. No assertion was removed.
