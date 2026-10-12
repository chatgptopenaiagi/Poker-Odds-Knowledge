# Resume entry point

Read AGENTS.md and CURRENT_STATE.md. Run ./scripts/resume-development.ps1; verify root, branch, HEAD, status and origin before changes. Canonical repository is chatgptopenaiagi/Poker-Odds-Knowledge. This is the publication source lineage; never merge private development history.

Completed: card designs, Math Visualizer, v1 Fold/Call study, v2 ranges/blockers/response model, v3 two-model immutable river comparison. Do not recreate them. Inspect src/response-comparison.ts, src/ResponseComparison.tsx and tests/response-comparison.test.ts. V3 reuses v2 responseValue and existing workers; source provenance lives in SOURCE_IMPORT_MANIFEST.json.

Bounded smoke: node node_modules/vitest/vitest.mjs run tests/range-study.test.ts tests/response-study.test.ts tests/response-comparison.test.ts

Full commands/prerequisites: VALIDATION_EVIDENCE.md and ../SOURCE_CHECKOUT_VERIFICATION.md. Set POK_TEST_URL to an owned isolated strategy preview and POK_AUDIT_DIR/POK_REPORT to a new evidence directory before browser gates. Preserve artifacts/range-response-v2 and range-response-v3; do not overwrite old evidence. Missing native/JVM prerequisites are BLOCKED, not successful skips. No production credentials are required for offline recovery.

Next coherent milestone: broaden the behavioral contracts for existing study/replay controls and improve unsupported-context explanations. Do not add raises, Check EV, multistreet continuation or solver claims without a separately validated model and current user scope. Model A/B sensitivity remains assumption-dependent.

Never reset unknown files, alter owner notebooks/deployments, change services/CAE, force-push, merge main or release. New publication requires current authorization and staged-content review. GitHub state and independent recovery procedure are documented alongside this file.
