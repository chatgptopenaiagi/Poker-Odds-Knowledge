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
