# Strategy preview: boundaries, backups and rollback

This is a local experimental educational release. The documented checks exercise concrete boundaries; they do not certify professional security, a production service or every possible solver input.

## Separation of authority

The existing deterministic poker rules/evaluator still decide cards, legal actions, ranks and payouts. Strategy Lab is a separate explicit range study with no live-game reference in its request builder. Neither Java nor a saved strategy can submit an action, alter a random stream, award chips or access the simulator's hidden deck.

Offline public files have no API key, account database, runtime executable path or shell endpoint. Guest gameplay, lessons and saved strategy packs do not require a server or model. The new Apache directory retains a local-request guard; its localhost URL alone would not establish that protection. Do not remove the rule or expose the development machine through a public tunnel.

The online preview binds to its project-owned loopback endpoint. Strategy jobs use the existing authentication, same-origin/CSRF and ownership boundaries. A job ID alone does not grant access. Runtime selection is operator-controlled in ignored `.pok-strategy/runtime.json`; a request cannot provide an executable, command, filesystem path, URL or Java option. The adapter checks runtime, JAR and dependency identities, sends validated JSON to stdin and uses no shell interpolation.

One active solver is allowed, with a queue of four including running jobs, 12 submissions per account per hour and 100 globally per day. Quotas are stored separately from account-owned job content; deleting an account does not erase consumed global work. The JVM heap is capped at 256 MiB. The separate Windows Job Object limits process committed memory to 512 MiB and closes only the owned process on cancellation. These are different memory measures. Deliberate memory exhaustion is not implied by testing limit installation/query and process lifetime.

Time, iteration, input/output size and result-shape limits bound work. Results must match model, board/dead cards, normalized ranges, public nodes, actions and hand rows before publication. A generation/input-hash check rejects stale browser results. Initial job creation is allowed to return its ID even after cancellation, so the client can cancel the just-created server job. Interrupted/deleted/cancelled work cannot later overwrite its terminal state with a successful result.

The service marks queued/running jobs failed on restart: recovery is **restart-only**, not checkpoint resume. Job content and quota records expire after seven days, checked on start, submission and a periodic cleanup. Account deletion cancels and removes its private jobs; aggregate quota usage retains no account link. Exports are deliberate user actions. The local test-mail sink is development-only and unsuitable for real account/mail confidentiality or public hosting.

## Pack trust and accuracy

Pack JSON has strict version/model/result validation, a bounded import size and a checksum. User text is rendered as text; no HTML/code is executed. A self-computed checksum is not a signature or mathematical attestation. Imported packs show author-supplied provenance and are not granted bundled verification status. Fresh custom results show that independent review was not run. The shipped six packs have a named independent PokerKit/sequence-form LP report, exact recorded inputs and final solver identity.

NashConv and conditional action EV belong only to the specified finite heads-up river abstraction. Solver stopping, convergence evidence and independently established accuracy are separate facts. Zero-reach belief fallbacks, partial results, uncertain small differences and arbitrary imported claims must not become confident grades. A global gap is not a per-hand error bound.

## Package hygiene

`scripts/package-strategy.py` defaults to a dry-run audit. `--package` requires a clean final Git checkpoint, committed implementation files, valid build/artifact hashes and no blocking audit findings. It copies tracked source selected by `git ls-files`, omitting private historical evidence and generated environments. The original local Git history and reports remain unchanged. A generated release index documents omitted older machine-specific README/test/integration reports.

The release excludes `.git`, user notebooks, account databases, `.env` values, private runtime configuration, build logs, SDK/JDK/Python environments, node_modules, keys/keystores and raw CLA evidence. Workstation-specific deployment/verification helpers remain unchanged in the original checkout and are omitted from portable source/runtime archives; use the generic operator procedure instead. No absolute workstation-path exception applies to distributable files. Required third-party notices and public upstream copyright contacts remain intact. Generic test addresses and explicitly reviewed malicious-URL fixtures are data, not personal accounts.

The audit scans selected text, built assets, nested JAR/APK members and explicitly selected screenshots for configured secret/path/email patterns. It records locations and fingerprints rather than echoing suspicious values. Pattern scanning is not proof of the absence of every possible secret. Screenshots still require visual review. Every ZIP is reopened and compared byte-for-byte against its intended members; release files have SHA-256 checksums. Native/JVM archive hashes identify exact tested bytes, not a claim of reproducible JAR timestamps or signed software.

No Git remote push, private release upload, public hosting or paid API call is performed by packaging. No new public license for original POK code is inferred. The current Android artifact/build/execution state is recorded separately; a debug APK must not be described as production-signed or device-tested without that evidence.

## Before changing or removing anything

1. Export the notebook from the exact edition/browser profile in use. Save any custom study packs separately. For account data, use its separate export.
2. Retain the previous release archives, checksums and owned deployment manifest. Keep private service backups outside all web roots and ZIP/publication folders.
3. Stop only the recorded staging process using `Open-POK-Strategy.ps1 -Stop`. Never kill an arbitrary process by port or image name. Verify no owned solver remains before copying service data.
4. With the service stopped, copy the entire private service data directory as a private backup. This preserves the database and associated authentication secret together. Do not copy a live SQLite database file alone while ignoring its WAL. A backup is not validated until a restore is exercised in an isolated project-owned directory/profile.

## Roll back the static preview

The strategy deployment script keeps its own manifest and replacement backup under ignored artifacts. Restore only paths listed in that strategy manifest, checking that each resolves inside the dedicated preview directory and is not a reparse point. The previous archive's SHA-256 and per-file manifest establish what bytes should be restored. Preserve unknown/unowned files and stop if the manifest is missing or incompatible. Do not copy source, `.git`, runtime dependencies or private backups into Apache.

Rolling back public assets does not erase browser storage. The normal and engine-preview sites remain untouched. If a release changes a data schema in the future, retain exported JSON and explicit migration evidence rather than opening an older app against incompatible data or deleting the user's notebook. This mission's separate strategy namespace is the default isolation boundary.

## Roll back the local online edition

Stop the owned launcher process, preserve its private backup, then extract the prior source/runtime and optional JVM archives into a new project-owned directory. Install only the prior locked project dependencies. Review and regenerate local runtime paths/hashes there; never distribute another workstation's runtime JSON. Restore an account database only into an isolated stopped service with the matching secret and migration level. Do not downgrade a migrated live database blindly.

Check the prior build's health and guest/account workflows on a verified free loopback port before any deliberate replacement. The launcher is fixed to its documented port and will refuse an unrelated listener. No automatic rollback may rewrite global Apache/PHP settings, database services, firewall/router configuration, SDK installations or another application's data.

## Production is a separate decision

The local test-mail mode, development origin and Windows launcher are not a production deployment recipe. A public service would need an approved destination, HTTPS, a real mail provider, secret provisioning, production administrator MFA, operational backup/restore evidence, dependency maintenance, abuse controls and a review of the old upstream solver. Those steps are not established by this local release. Mobile online authentication is disabled; use the offline Android edition's stated functions and its own export/restore workflow.
