# Current state

POK 2.0.0-beta.1 — Decision Explorer v3 development, not a stable release.

Phase A completed: v2 preserved at public commit 041e24928db2435e8befecd7fd0c12a384c74fd7 and independently cloned from GitHub; 113 imported hashes and 12 smoke tests passed. Original v2 private development: 23d65c4c065178cc8118b8026ddd15f58dd8fcd1; source repair: 74e3ea15522b54918e1d4b68d03aad507cbcf91f.

Phase B implements two declared response models on one immutable river snapshot. Private development milestone: b91c3c8253b87a1cfaf7ed6801dd465a9c4ab343. The publication branch imports reviewed source blobs, not private history. SOURCE_IMPORT_MANIFEST.json identifies all 118 imports. Use git rev-parse HEAD and git ls-remote to identify and verify the current public checkpoint.

Fresh v3 validation: 456 unit tests in both development and independent source repair; 26 built Edge behavioral tests plus one inventory; TypeScript/web/strategy/server builds. Scope, reference cases and exclusions: ../POK_DECISION_EXPLORER_V3.md. Public branch: feature/river-strategy-validation; draft PR #1. No main merge, stable release or owner deployment.

Read NEXT_SESSION.md, VALIDATION_EVIDENCE.md and RECOVERY_PROCEDURE.md. Existing notebooks and deployments remain untouched.
