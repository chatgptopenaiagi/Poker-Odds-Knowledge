# Validation evidence

V2 historical milestone: 447/447 unit tests in development and independent source repair; 24/24 built Edge behavior tests plus one separate inventory test. TypeScript/web/strategy/server builds passed. 709 observed control/state rows: 56 mapped to behavior, 653 NOT_RUN. These are state rows, not globally unique controls. Authenticated live API/JVM browser acceptance was excluded. No real mail/OAuth/paid AI acceptance.

Phase A fresh verification is recorded locally under artifacts/range-response-v3. Existing v2 reports were inspected and their hashes retained locally. All 113 source-import hashes matched committed bytes before publication. Native/JVM artifacts are local build prerequisites, not borrowed runtime files or source substitutes.

Commands (project-local dependencies):
- npm ci --ignore-scripts --no-audit --no-fund when a checkout has no dependency installation.
- node node_modules/vitest/vitest.mjs run
- npm run build:web
- npm run build:strategy
- npm run build:server
- node node_modules/@playwright/test/cli.js test --config playwright.repair.config.ts

The browser gate uses installed Edge and a separately verified loopback strategy-preview server. It excludes one authenticated live-backend browser case; no mock is counted as that acceptance. Default test:browser is not the scoped preview gate. See SOURCE_CHECKOUT_VERIFICATION for compiler/JDK prerequisites before full native/JVM testing. A fresh checkout may run the bounded mathematical smoke before those prerequisites exist. Missing prerequisites must be reported as BLOCKED, not skipped successes.

Mathematical models and independent hand-counting references are in POK_DECISION_EXPLORER_V2.md. Offline means local HTTP remains available while external requests are blocked before first load. It does not establish file:// or packaged-app acceptance.

Phase A fresh gate: 447/447 unit tests, 24/24 built Edge behavior tests, TypeScript and web/strategy/server builds pass. No final failures/skips. Existing frontend size and Node deprecation warnings remain. Resume script reports state without installing, fetching, changing branches or starting services.

phase-a-unit.json SHA-256: 3f804ea429c5978692c2ac2eb5f5ac5247a60f4e9ddd1394f33ade210b426119

phase-a-browser.json SHA-256: 641a1d1aac694aefbe4cd87f8208d6a9e5fc8080f2d3ca053f3f4f0f5bd9a49e

## V3 fresh validation

456/456 unit tests in the development and source-repair checkouts; 26/26 built Edge behavior tests plus one inventory; TypeScript and web/strategy/server builds pass. Observed control/state rows: 751; 92 mapped to fresh evidence, 659 NOT_RUN. Counts are not globally unique controls. The authenticated live-backend browser case remains excluded.

First failures retained locally: a positive subnormal call probability underflowed to all fold; corrected with explicit refusal. Enlarged Romanian replay counter overflow was reproduced and repaired with wrapping controls. No assertions were weakened.

Representative final browser timings: two royal-board model worker runs 230.9 ms; identical-model reuse with one worker 170.9 ms; two narrow conditional ranges 32 ms. Single local observations, not universal guarantees or a statistical benchmark.

v3 unit SHA-256: 321c6636eee1c637326a1484f3e3e86bf7b8b2bd584b43e91bb1a6858e0312b9

v3 browser SHA-256: db5a3ab53bcc4512960adf427c8bafbe51d4844ee6e678907b3667da79280038
