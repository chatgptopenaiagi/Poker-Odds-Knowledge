# Hold'em Insight Lab architecture

HIL is a static TypeScript/React application. Apache serves the Vite-built local assets. Node is build/test tooling; Python, PokerKit and Maxima are independent development validators. No runtime application server, PHP endpoint, database daemon, cloud service or model process is required. The frontend does not execute shell commands or connect to CLA.

## State and information boundaries

`src/game.ts` holds a pure rules engine. `createHand`, `legalActions`, `act`, `observe` and `replayHand` separate complete engine state from an actor observation. Full state includes the deck, burns and all private cards for local replay. An observation has only the actor’s cards, public board, public seats/action log and legal choices. The UI may reveal cards in labelled teaching/review views; bots still receive observations.

Each hand has schema version 1, a rules version, immutable initial deal/configuration, a revision number and a versioned legal-action log. The reducer clones input state and validates turn/revision/action before changing chips. The engine tracks acted status and reopening thresholds separately from matched contributions. It settles eligibility layers, returns uncalled chips and distributes integer tied pots with the documented odd-chip rule. Refer to RULESET.md and the engine tests for exact policies.

`src/cards.ts` represents a card as `4 × (rank − 2) + suit`, where suits are clubs, diamonds, hearts and spades. Parsing rejects duplicates. Ordinary deals use `crypto.getRandomValues` with rejection sampling for bounded integers, then Fisher–Yates. Seeded lessons/tests use Mulberry32. Deck state is never passed to an equity calculator or consumed by a bot-policy calculation.

## Evaluation and analysis

`src/evaluator.ts` directly evaluates rank counts, suit counts, straights and kickers for the best five of five through seven cards; higher numeric score means stronger. It is original code without an imported lookup database. The independent test reference evaluates five-card combinations separately. PokerKit validates generated ordering, ties and categories; a separate job enumerates every five-card hand.

`src/ranges.ts` expands educational weighted starting-hand classes to concrete combinations and removes only explicitly known blockers. `src/equity.ts` validates requests, selects tractable exact enumeration or fixed-budget Monte Carlo and returns method, engine version, input assumptions, counts, timing and uncertainty. Each sampled outcome is a fractional pot share; tie frequency and win frequency are distinct. Explicit pot layers have separate eligibility. Opponent range assignments are drawn independently, then rejected globally on collisions, avoiding seat-order renormalization bias.

`src/equity.worker.ts` runs analysis away from the UI thread and sends progress. `src/analysis-client.ts` gives each request a generation ID, terminates old workers on cancel/replacement and ignores queued stale results. Each client has at most one live worker. Analysis input contains known cards/ranges, never the full game state. Hero checkdown analysis uses the public board and hero’s cards; revealed-card analysis is a separately labelled conditional question.

`src/bots.ts` implements three explicitly heuristic profiles. It accepts an observation, independent policy seed and optional observation-based equity. Play requests a bounded 300-sample estimate against declared educational ranges; incompatible sampling falls back to hand/texture heuristics. Position, effective stack, public aggression and legal actions shape policy. There is no claim of equilibrium or professional strength.

## Learning and review

`src/lessons.ts` contains 28 original versioned calculation scenarios, each with prerequisites, a decision information set, replay inputs, numeric grading/tolerance and worked explanation. All 28 have complete English and Romanian text. Exact formulas, approximations and assumption-dependent models are distinct. `src/i18n.ts` provides translated core controls, beginner explanations and a term glossary; detailed UI text also uses explicit English/Romanian pairs. Calculation accuracy/error types are stored separately from practice chips.

Play supports learn, guess-first and practice modes. Review replays the original action history and can fork a decision into an editable Odds Lab scenario. A branch is saved separately; it does not rewrite the original hand or retroactively grade a decision using a lucky runout.

## Persistence

`src/storage.ts` uses IndexedDB database `hil-study-v1`, schema version 1, object store `state`, key `hil:session`. Current hand, completed hands, attempts, scenarios and settings live in one serialized record. A read/write transaction compares the expected revision before updating the record; a second tab with an older revision is rejected rather than overwriting an action or awarding twice. UI actions also use the hand revision.

Import is capped at 5 MB and validates schema, primitive bounds, settings, array lengths and card uniqueness. Saved hands are reconstructed through legal replay rather than trusting imported payouts. Unsupported schema versions are rejected without replacing stored data. There is currently no prior public HIL schema to migrate; a future migration must be explicitly implemented and tested. HTML/executable text, dangerous object keys and excessive nesting are rejected. Exports are portable JSON, not executable content.

Storage belongs to a browser profile and origin. `localhost` and `127.0.0.1` are separate origins; choose the documented canonical URL and keep exported backups. Browser deletion or eviction can remove data. Local browser state is not an adversarial secrecy boundary.

## Deployment boundary

The source tree and verification environments remain outside the verified Apache DocumentRoot and aliases. Only `dist` public assets, notices and application-scoped access rules enter the owned app directory. The deployment script/manifest records owned files and backups. No global listeners, services, PATH, profiles, AI environments or existing sites are modified. Application-scoped local-request verification and fresh-context offline browser checks are reported separately from unit tests.
