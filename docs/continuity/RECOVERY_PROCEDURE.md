# Independent recovery

Clone the canonical GitHub development branch into a new, verified-unused directory. Never replace an existing worktree. Read root AGENTS.md and continuity/NEXT_SESSION.md, run the read-only resume script, compare HEAD with git ls-remote, and verify package version and source-import hashes. No production credentials are needed to inspect/build the offline source.

Install only the lockfile dependencies locally if absent: npm ci --ignore-scripts --no-audit --no-fund. Run the bounded range/response smoke tests before optional native setup. Follow SOURCE_CHECKOUT_VERIFICATION.md for approved compiler and JDK routes; no global PATH or service changes. Build web/strategy/server. Browser tests need an owned loopback preview, not an existing user deployment.

Private local reports and browser profiles are not in GitHub. Reproduce their commands; do not treat historical counts as fresh results. Local source bundles require their documented base commits. Recover older source into a separate detached checkout; never git reset --hard or git clean. User notebooks remain outside source rollback.
