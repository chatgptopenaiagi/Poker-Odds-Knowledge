# POK Strategy preview

Poker Odds Knowledge remains an offline play-chip trainer. Strategy Lab adds six original, saved heads-up river studies and an optional local solver. The studies do not solve full poker, and their assumed ranges and restricted bet sizes matter.

## Choose the edition

| Edition | Address or entry | Available without a server/account |
| --- | --- | --- |
| Offline browser preview | <http://localhost/holdem-strategy-validation/> | Play, Odds Lab, lessons, local notebook, appearance, and bundled Strategy Lab packs. Apache serves the public files; no application backend or Java is needed. |
| Local online study | Run `Open-POK-Strategy.ps1`; <http://127.0.0.1:4322/holdem-lab/> | The same guest study; an authenticated account and explicit permission enable a bounded local solve when its runtime is configured. |
| Android offline package | Consult the Android build/runtime report and delivery manifest | Packaged guest study is separate from Windows. Desktop Java, online accounts and fresh native solves are unavailable. An APK build is not evidence that it ran on a device. |

The original `/holdem-lab/` and `/holdem-engines-preview/` sites are preserved. The strategy preview uses the separate IndexedDB notebook `pok-strategy-validation-study-v1`; the ordinary trainer retains `hil-study-v1`. Sibling paths on localhost share an origin, so these explicit namespaces prevent accidental notebook replacement. `localhost` and `127.0.0.1` also have different browser storage. No notebook is automatically copied or uploaded.

## Play and learn first

1. Open the offline preview and choose **Guest Play** or **Play**. Use **Start hand**; legal controls appear when it is your turn. Use the calculation/explanation control beside the table before continuing. Pause/step is available for a slower pace.
2. Open **Drills**, select a lesson, submit your calculation and read the explanation. A correct calculation is recorded separately from chips won.
3. Finish a hand, then open **Hand Review** and select it. Use the timeline/replay controls; a branch is a new study scenario, not a rewrite of the original hand.
4. Open **Appearance** to change theme, palette, text size, card size, spacing or reduced motion. These controls do not restart the hand. Fullscreen uses the browser's real fullscreen facility; Escape exits where supported.

The original rules reducer remains authoritative for dealing, legal actions and payouts. Bots are labelled heuristics. Choosing an analysis evaluator or a saved strategy never controls the live table.

## Study a saved river decision

1. Open **Strategy Lab** and choose a scenario. **Saved verified solution** identifies a bundled study that passed the recorded independent checks.
2. Read **River board**, **Starting pot**, and **Effective stack**. Expand **Weighted starting ranges** and **Allowed betting tree** to see the model. All amounts are integer chips; raise sizes are **raise TO** totals.
3. Select a **Decision node** and **Private hand**. Choose an action before revealing the result, or press **Show strategy and explanation**.
4. Compare action frequencies and action EVs. The displayed difference is best listed action EV minus chosen action EV under this model's average continuation. It is not a grade of general poker skill.
5. Check **Solution quality**. NashConv is a global best-response gap in chips for this specific two-player game. It is not a per-hand error bound. Differences smaller than the solution's accuracy should not be overinterpreted; mixed strategies can use multiple actions.
6. **Export study pack** saves the complete versioned inputs, result and provenance as JSON. **Import study pack** reopens a validated file up to 2 MB. Imported verification statements belong to the file author; a checksum detects changes but does not certify accuracy. Fresh or imported results do not receive bundled-verified grading.

The six packs cover bluff catching, a monotone board, a paired queen board, shared straights, an explicit dead card and a restricted full-raise tree. They use small original weighted ranges, not a commercial solution database. Zero/negligible-reach rows disclose their fallback belief and are unsuitable for confident grading. Strategy choices do not submit table actions or enter numeric lesson-accuracy totals.

## Run an optional local solve

The Windows launcher starts only the project-owned loopback staging service on port 4322. It refuses an unrelated process occupying that port. It does not change Apache, services, firewall rules, global PATH or another application. Use a local test identity/password, not a real service password.

1. Open the local online address using `Open-POK-Strategy.ps1`. If runtime files are missing, its message identifies the prerequisite; offline packs still work.
2. Open **Account**, register an adult educational test account, and keep the entered test email in the form. Expand **Local test mail** and use its inbox button to open the verification link. This is an isolated local mail sink, **not real email delivery**. Sign in after verification.
3. Return to **Strategy Lab** and expand **Edit a river scenario**. Set five board cards, optional explicit dead cards, weighted ranges, learner hand, pot/stack and allowed sizes. Use **Apply scenario edits**. Pending edits cannot accidentally solve the previous model.
4. Check the local solver status and the permission checkbox, then press **Solve locally**. Only the validated study request is sent; the live hand, hidden opponents, future deck and notebook are not supplied.
5. Observe progress and use **Cancel solve** if needed. Leaving the feature, backgrounding the app or changing identity cancels owned work and rejects stale responses. A failed/deadline-interrupted job cannot become a complete solution.
6. Export a useful completed result. **Fresh local result · independent review not run** means the service reported its quality, while the development oracle has not checked that custom request. An unmet requested gap produces a **Partial** result.

Current model limits: heads-up river only, initial pot 2-10,000 chips, no rake/side pots, at most 32 concrete combinations per player, two bet sizes, one full raise size, 20,000 iterations, 15 seconds, one compute thread and one active service job. No turn/flop or active multiway strategy solving is claimed. Broad ranges may need more work than this experimental limit allows.

To stop the owned staging process, run `Open-POK-Strategy.ps1 -Stop`. This checks its recorded process identity; it does not stop Apache or another Java process.

## Back up and restore

Use **Settings → Export backup** or the progress export control for the local notebook. Keep the JSON somewhere you control. Import requires validation and confirmation; make an export first and check which edition/origin you have open. A study-pack JSON and a notebook backup are different formats. Export custom strategy packs separately before reloading; the in-memory imported/fresh pack list is not a replacement for a file backup.

Account export is separate from guest notebook export. Signing in does not silently upload guest hands. Browser-profile removal can erase local storage; changing hostname or browser profile does not migrate it. Never publish notebooks, account exports, verification links or private runtime configuration in a release ZIP.

## Portable bundle setup and limitations

The browser ZIP contains public assets only. Serve it through a new approved local Apache directory with the included application-scoped local-only rule. Verify the actual DocumentRoot/aliases and preserve existing sites. On this workstation, the original checkout's tested deployment helper targets only the new strategy preview and maintains an owned-file manifest/replacement backups. Its absolute local paths are deliberately omitted from the portable source archive.

For another installation, choose and verify a new directory outside existing sites, check that no destination component is a symlink/reparse point, and copy only the browser ZIP's public files. Keep an owned-file list with SHA-256 checksums before any future replacement, back up existing owned files first, and refuse to overwrite unowned files. Verify the app's actual local URL and the Apache local-request restriction independently. Do not change global listeners or expose another application to make the preview work. This is a manual portable procedure, not a claim that an unconfigured host has been deployed or tested.

For an extracted online source/runtime bundle, use the pinned lockfile with project-local `npm ci` and an approved Node runtime. The supplied launcher prefers `server-build/main.mjs`, with versioned migrations beside it; it falls back to the source entry only when that compiled file is absent. The compiled entry was exercised by an authenticated browser solve/cancel flow against the real JVM. Its dependencies still come from the project lockfile; compilation does not bundle `node_modules`. Extract the optional JVM archive into that same project root to restore its `.solver-tools/java-build` and `.solver-tools/java-deps` layout. It contains the tested thin JAR, four pinned dependencies and required notices, not a JDK.

Run `engine-adapters/java/Configure-Runtime.ps1` only after selecting an installed Java 21+ and PowerShell 7. It creates a private ignored runtime file with executable paths/hashes and refuses to overwrite a changed identity silently. The detailed source rebuild procedure is in [the Java adapter guide](../../engine-adapters/java/README.md). No Python oracle, CUDA toolkit or model service is needed for ordinary study/solving.

English and Romanian Strategy Lab controls are available; Romanian is machine-drafted and not linguistically reviewed. Other selected languages show a disclosed English fallback for this new section. Technical evidence, card notation and imported text keep their recorded language. Public hosting, real external identity-provider login, real mail, cloud coaching and native Android solving are separate capabilities; this local strategy release does not establish them.

Read [security and rollback](SECURITY_AND_ROLLBACK.md), [architecture](../architecture/STRATEGY_ARCHITECTURE.md), [solver research/licenses](../architecture/SOLVER_RESEARCH.md), and the delivery manifest for measured verification and current Android status.
