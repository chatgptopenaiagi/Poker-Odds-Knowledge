# Resume entry point

1. Read AGENTS.md and CURRENT_STATE.md. Run ./scripts/resume-development.ps1. Confirm root, branch, HEAD, dirty files and origin. Do not reset or clean.
2. Verify origin is the canonical GitHub repository and the development branch is fetchable. Read GITHUB_STATE.md. Publication authorization is task-specific; never merge main or force-push.
3. Inspect src/response-study.ts and src/ResponseExplorer.tsx plus tests/response-study.test.ts and tests/response-browser.spec.ts. Do not recreate v2.
4. Next milestone after Phase A verification: compare two explicitly declared Fold/Call response models on one immutable river snapshot. Preserve conditional ranges, existing payoff equation and uncertainty. No Check EV, raises, side pots, rake or future betting.
5. Use artifacts/range-response-v3 for new local evidence. Preserve v2 artifacts. Use isolated browser storage and the existing loopback preview only after verifying ownership.

Bounded smoke: node node_modules/vitest/vitest.mjs run tests/range-study.test.ts tests/response-study.test.ts
Full commands and native/JVM prerequisites: VALIDATION_EVIDENCE.md and ../SOURCE_CHECKOUT_VERIFICATION.md.
