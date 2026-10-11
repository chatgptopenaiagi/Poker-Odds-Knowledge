# Poker Odds Knowledge

An offline-first, play-chip Hold'em learning application. React/TypeScript runs legal actions, settlement, lessons, replay and browser persistence locally. Optional Node/Hono/SQLite services provide accounts and bounded local solver jobs; offline play does not require them.

## Build from this checkout

Use a compatible installed Node runtime with `node:sqlite` (the current Windows checks used Node 26.8.1), then `npm ci` from this folder. Dependencies are pinned by package-lock.json. No dependency directory from another worktree is required.

- `npm run build:web`: standard offline edition in dist, URL base /holdem-lab/.
- `npm run build:strategy`: isolated strategy edition in strategy-dist, URL base /holdem-strategy-validation/.
- `npm run build:server`: optional backend entrypoints in server-build.
- `npm test`: includes native adapter tests. These intentionally fail if the native prerequisite below has not been built; do not silently skip them.
- `node node_modules/@playwright/test/cli.js test --config playwright.cards.config.ts`: isolated built Edge card checks. The default target is loopback port 4322. Browser installation is a separate prerequisite.

For a static local strategy preview after building, run `node node_modules/vite/bin/vite.js preview --mode strategy-preview --outDir strategy-dist --host 127.0.0.1 --port 4322 --strictPort`. Do not reuse a port occupied by the optional API. This serves built assets, not source. Existing Apache deployment scripts have fixed app-local destinations; inspect ownership and back up before using them. Do not deploy over an unidentified installation.

## Source and dependency completeness

Root index.html, Playwright configurations, strategy fixtures, native wrapper, pinned third-party sources/notices, verification requirements and referenced launch scripts are included. [Import manifest](docs/SOURCE_IMPORT_MANIFEST.json) maps restored bytes to development revisions without importing development history. Private machine reports, notebooks, databases, caches, SDKs, Android-owned untracked work and test screenshots are excluded.

OMPEval is development/local-only. Build it from included ISC-licensed sources with [the native recipe](docs/OMPEVAL_BUILD.md) and scripts/build-ompeval.ps1; clean-checkout tests are unavailable until its native/bin output exists. Do not borrow an unexplained executable. PH browser WASM, source provenance and Apache-2.0 notices are bundled; see [PH build](docs/PH_BUILD.md). The Java solver requires its pinned build/runtime setup and explicit local permission; see engine-adapters/java. A discovery probe is not solver-quality verification.

## Capabilities and limits

2–6-seat cash-style no-limit Hold'em, integer chips, side pots and legal-action checks; bounded exact enumeration and seeded Monte Carlo with weighted ranges/blockers; 28 lessons, grading, review/branching and local backup. PH and POK share a sampler, so their agreement is not an independent sampling oracle. Restricted heads-up river Strategy Lab and saved packs do not establish full-game GTO.

Appearance includes four local card designs and independent suit colors. Graphical tens display 10; technical notation remains T. Appearance and notebooks have separate persistence. Different origins or build namespaces do not silently share progress. [Card verification](docs/CARD_THEME_FIX.md) states the executed scope.

No rake, tournaments/ICM, multiplayer, external poker-client assistance, deposits or prizes. Opponent ranges are assumptions; equity alone is not optimal strategy. Browser-local hidden cards are not adversarially secret. Optional providers, mail and AI remain unverified until separately configured; no paid provider acceptance is claimed.

See [rules](docs/RULESET.md), [math methods](docs/MATH_METHODS.md), [architecture](docs/ARCHITECTURE.md), and [platform architecture](docs/PLATFORM_ARCHITECTURE.md). Historical counts are not current acceptance. Local reports must distinguish source implementation, actual execution, and deployment to the owner's chosen origin.
