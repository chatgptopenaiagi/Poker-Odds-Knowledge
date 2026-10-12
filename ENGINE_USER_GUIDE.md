# Select a real analysis engine

Open **http://localhost/holdem-engines-preview/**, or double-click `Open-POK-Engine-Preview.ps1`. The launcher checks Apache first and starts no server. The normal `http://localhost/holdem-lab/` site is unchanged.

1. Choose **Explore first → Odds Lab**.
2. Keep the example cards or enter your own cards and ranges.
3. In **Analysis engine**, choose **POK Standard** or **POK + PH Evaluator**.
4. Select **Calculate equity**. The result names the route, location, method and work completed.
5. Select **Compare engines** to run both against one fixed input snapshot. Agreement is evidence, not a stronger strategy or a reason to choose the larger number.

**Automatic (recommended)** always uses POK Standard in this release. Changing the choice cancels analysis and rejects late replies; it does not change dealing, hand settlement or information visibility. A failed route shows Retry / Use POK Standard and never silently substitutes one engine under another name. Cancel calculation stops its worker. Native names are not selectable in the static browser edition.

Both browser routes work without accounts, backend services, internet or an AI key. PH loads its reviewed local WASM only when selected. Its evaluator differs; its weighted sampler, enumeration, card validation and side-pot wrapper are shared with POK. The 174,063-byte WASM has no imports and fixed 393,216-byte memory. It is not an opponent or a strategy solver.

The preview has a **separate notebook** (`pok-engine-preview-study-v1`) and appearance key. A URL path alone would not provide that isolation. To copy your normal progress, explicitly export it at the normal site's Settings → Back up progress, then import that JSON in preview Settings. The preview cannot silently migrate or overwrite the normal notebook. Preview export and confirmation-based reset operate on the preview only. Localhost and 127.0.0.1 still have separate storage; use the canonical localhost link.

To play, select Play → Start hand. Reveal calculation shows the pot-odds explanation. Drills → The price of this call → enter 20 → Check answer demonstrates the 20% call threshold. Hand Review provides replay controls; Branch to Odds Lab opens the same selector using the selected review information set. Appearance controls and 41 language choices remain available. New engine controls are machine-drafted translations; technical result diagnostics retain English, and existing language fallback notices disclose incomplete older text.

## Supported analysis

Hold'em high, 2–6 players, board lengths 0/3/4/5, fixed hands or concrete weighted ranges, explicit known dead cards, fractional ties, and separately eligible pots work in both browser routes. The joint distribution is proportional to the product of combination weights, conditioned on no card collisions. Zero-weight and blocked combinations do not contribute. Hidden folded cards, burns and future deck cards are not dead-card inputs.

Exact enumeration is limited to 250,000 outcomes; larger requests use explicit fixed-budget Monte Carlo (100–200,000 observations in the contract; smaller UI presets). The default deadline is 30 seconds and one worker is active at a time. Interrupted exact work returns no completed exact equity. Fixed-N Hoeffding intervals concern independent fractional shares and do not justify optional stopping. Memory/request caps are conservative design bounds; browser-managed JS heap is not an OS hard reservation.

## Optional native development reference

OMPEval was built and tested locally. It is **CLI-only**, not a browser service. No native HTTP endpoint, account credential or CORS exception is provided. `npm run engines:compare` runs the fixed reviewed fixture corpus and bounded comparisons through the canonical adapter. It writes the five named engine reports locally. The command was executed on this workstation; it is not required for normal use.

The optional native package contains a Windows x64 executable, identity/hash, notices and fixed synthetic examples. It accepts bounded structured JSON on stdin; no supplied executable path or shell expression is accepted. Its exact route supports uniform compatible ranges only, no side pots, at most 250,000 represented outcomes, one thread, a 15-second requested deadline, and a Windows 256 MiB child-job limit. Monte Carlo is deliberately unavailable because upstream random-walk dependence and missing seed control differ from POK. Equal non-unit weights within a seat are equivalent to a uniform set; nonuniform weights are rejected. Native global winner masks cannot recover every side-pot winner.

Build recipes are `scripts/build-ph-wasm.ps1` and `scripts/build-ompeval.ps1`, with pinned sources and marked changes. They use existing verified compiler paths; missing prerequisites cause a clear failure and never install system software. `npm ci --ignore-scripts`, `npm run build:engines`, and `scripts/Deploy-Engine-Preview.ps1` were run. Deployment copies only public build assets to the owned preview folder and backs up replacements. Never use the legacy default-site deployment script for this experiment.

## Rollback

Close the preview and open the normal site: it was not replaced. No process cleanup is needed for browser analysis; workers terminate on cancellation/navigation. Native CLI children end after each explicit job. Preview replacements have owned-file backups under `artifacts/deploy-backups`. Restore only a matching preview ownership manifest and its listed files; do not restore them over `holdem-lab`. Deleting preview learning progress is optional, requires the in-app confirmation, and does not remove the normal notebook. Original platform source checkpoint and engine branch remain separate local Git history.
