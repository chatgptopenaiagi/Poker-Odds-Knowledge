# HIL mathematical validation v1

Real CLI validation: **PASS**, observed 2026-09-30T07:35:08.481904+00:00. This is a fresh development observation, distinct from the immutable CLA launch snapshot. Raw returned build identity was **Maxima branch_5_50_base_9_gf03405fbf_dirty**; it is not relabelled as an official clean release. No semantic math adapter was exposed to this development agent, so the existing trusted Maxima CLI was used.

The reviewed fixed batch is [scripts/maxima-fixtures.mac](../scripts/maxima-fixtures.mac); [scripts/math-validate.py](../scripts/math-validate.py) executes it with `--no-init`, a newly empty `MAXIMA_USERDIR`, isolated temporary directory, `cmd /d` (no AutoRun), and a 30-second timeout. The launcher’s startup handling was inspected first. No arbitrary arguments or expressions are accepted; a timeout terminates only the process tree created by this script. The first attempt failed because Python list argument quoting did not match cmd’s quoting rules; it produced no mathematical evidence. The corrected fixed native command line completed in **1.300 seconds**.

The independent arithmetic route was a project-only virtual environment using **Python 3.14.7**, `fractions.Fraction` and `math.comb`. Anaconda base and the workstation installation were not modified. Actual returned Maxima values and exact Python agreement are retained in [math-v1.json](../tests/fixtures/math-v1.json), with a timestamp and sanitized result lines.

| Check | Maxima exact result | Meaning |
|---|---:|---|
| C(52,2) | 1326 | Concrete unordered starting hands |
| C(45,2) | 990 | Fixed two-player flop unordered terminal runouts |
| 9/47 | 9/47 | Next-card target hit: 19.148936…% |
| 1 − C(38,2)/C(47,2) | 378/1081 | At least one of 9 fixed targets in two cards: 34.967622…% |
| 9/46 | 9/46 | Turn-to-river target hit: 19.565217…% |
| 20/(80+20) | 1/5 | Call break-even equity: 20% |
| (1/4)(80+20)−20 | 5 | Terminal call EV in chips |
| 50/(100+50) | 1/3 | Pure-bluff break-even fold frequency |
| (2/5)100−(3/5)50 | 10 | Bluff EV at assumed 40% folds |
| EP−(1−E)C − [E(P+C)−C] | 0 | Two terminal-call expressions agree |
| FP0−(1−F)B − [F(P0+B)−B] | 0 | Two bluff expressions agree |
| E(P+C)−C at E=C/(P+C) | 0 | Call threshold identity |
| FP0−(1−F)B at F=B/(P0+B) | 0 | Bluff threshold identity |

All **13** rational/symbolic checks passed. Python also checked the call/bluff linear identity at **100 exact rational grid points**. Symbolic expressions assume positive denominators; card counts are nonnegative integers; E and F are probabilities in [0,1]; chip quantities are nonnegative. HIL’s 28 curated lessons have independently specified numeric expectations; percentage grading uses 0.05 percentage-point tolerance and integer-count questions use exact grading. The lesson test suite also compares the nine relevant lesson answers against the actual Maxima fixture.

Target-hit probability is not win probability. Draw targets must be fixed, with the stated unknown-card count; dirty outs, redraws, overlapping targets, extra known dead cards and opponent ranges need separate treatment. The rule of four is explicitly approximate. P already includes the current opposing bet; C is only the additional call. Terminal-call EV assumes one eligible pot, no rake and no further betting. Pure-bluff EV assumes zero equity when called and no future decisions. Implied/reverse-implied examples are stated toy models, not solved strategy.

## Independent card-evaluator oracle

**PokerKit 0.7.6 (MIT)** was installed only in the isolated Python 3.14 environment from a pinned requirement. [scripts/oracle-check.py](../scripts/oracle-check.py) consumes the synthetic corpus produced by [scripts/oracle-corpus.ts](../scripts/oracle-corpus.ts); no practice histories are used. The first actual run at 2026-09-30T07:36:08.298058+00:00 compared **5,004** legal 5/6/7-card hands and **5,003** adjacent ordering/tie relationships with **zero disagreements**, in **0.515 seconds**. The checker also compares every category label; the latest actual result is in `artifacts/oracle-result.json`.

The extended actual oracle run at **2026-09-30T07:38:18.837358+00:00** also compared **5,004 category labels**, again with zero disagreements, in **0.534 seconds**. The TypeScript direct evaluator is original code. A separately implemented five-card reference plus best-of-combinations evaluator supplies another oracle. The separate bounded exhaustive census covered **2,598,960 five-card hands** with expected category counts; see the final test report for its observed timing and generated artifact. Exhaustive seven-card enumeration was **NOT_RUN**; generated tests and a five-card census are not a proof of every seven-card case.

Normal gameplay ships formulas and a dedicated evaluator. It never starts Maxima, Python, PokerKit, CLA, Blender, Qwen, or a shell. No model determines cards, legal actions, ranks, payouts, or numeric answers.
