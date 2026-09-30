# Hold'em Insight Lab (HIL)

An original offline-first, play-chip No-Limit Texas Hold'em learning application for this Windows PC. A complete static application: existing Apache serves the built files; cards, legal actions, payouts, probability work, lessons and local history run in the browser. No mandatory model, cloud account, Node server, Python service, PHP or MariaDB.

**Open [http://localhost/holdem-lab/](http://localhost/holdem-lab/)** or run `Open-Holdem-Lab.ps1`. If Apache is stopped, the launcher explains how to start it through the existing XAMPP Control Panel. It does not start duplicate servers or alter services. Always use this origin: `127.0.0.1` has separate browser storage.

See [QUICKSTART.md](QUICKSTART.md) for the five-minute walkthrough. Delivery checks, versions, build identity, artifacts and limits are in [DELIVERY_MANIFEST.md](DELIVERY_MANIFEST.md) and [TEST_REPORT.md](TEST_REPORT.md). CLA acceptance is independent of poker correctness: [CLA_ACCEPTANCE.md](CLA_ACCEPTANCE.md).

## What works

- Cash-style 2–6-seat NLHE with one human and three labelled local heuristic profiles; integer chips, correct heads-up order, minimum/full/short raises, cumulative reopening, main/side pots, uncalled returns and deterministic odd chips. Default six seats, 5/10 blinds and 1,000 chips each.
- Learn, Guess-first and Practice modes; optional teaching reveal, pause/step, playback speed, reduced motion, responsive layout, English and Romanian core controls. All 28 original calculation lessons have English and Romanian prompts/explanations.
- Odds Lab: specific hands or editable weighted ranges for up to five opponents; 13×13 combination matrix, blocker removal, explicit dead cards, exact enumeration where bounded, seeded Monte Carlo, cancellation/progress and fractional-share uncertainty.
- Completed-hand timeline, original information sets, replay, counterfactual Odds Lab or playable branches, and saved scenarios. Strategic suggestions are heuristics, not GTO grades.
- Versioned IndexedDB persistence, calculation accuracy/error tracking separately from chips, validated/regraded JSON imports, portable exports and confirmed resets. Pending hand and completed history save atomically; stale clicks and competing tabs are rejected.

## Boundaries

Play chips only. No deposits, money, prizes, external poker clients, HUDs, live-table advice, network multiplayer or real-money wagering. HIL is not a GTO solver, a professional-strength bot, or regulated gaming software. Raw showdown equity does not decide every multistreet action. Unknown opponent ranges remain assumptions. Browser users can inspect their local deal; no adversarial secrecy is claimed.

No rake, antes, straddles, tournaments/ICM, multiple boards, CFR module, speech or Qwen narration. Histories are HIL's own records; importing third-party live hand histories is not supported. Advanced technical identifiers, range notation, method labels and raw diagnostics remain English in Romanian mode; all beginner lesson prose is translated.

## Source, build and deployment

Source/Git root: `C:\xampp\CLA-HOLDEM-LAB`, verified outside Apache's web roots and aliases. Served directory: `C:\xampp\htdocs\holdem-lab`, owned by HIL's file manifest. Existing sites, including DragonHydra, are preserved. Only public build assets are deployed. The application-specific `.htaccess` denies non-loopback sources; both loopback allow and a local request using the LAN interface were tested.

Pinned packages and scripts are in package.json/package-lock.json. Use the existing Node installation. `npm ci`, `npm run build`, `npm test`, and `npm run test:browser` are the development entry points; the report distinguishes the actual executed checks. The browser suite targets the built Apache site with installed Edge, fresh contexts and non-loopback requests blocked. It does not start Vite or modify machine networking.

`scripts/Deploy-Holdem-Lab.ps1` updates only its dedicated directory, refuses unknown ownership/reparse points, backs up prior owned assets outside the web root, and removes only obsolete manifest-listed files. It does not change Apache configuration or restart it. Review target/configuration evidence before moving this source to another PC.

The test-only Python environment is `.venv` using verified Python 3.14.7; its one dependency is pinned in requirements-verification.txt. Maxima uses fixed reviewed batch input, disabled initialization and a timeout. None of these development tools is a browser backend. Original evaluator verification includes an independent five-card/best-of-21 reference, PokerKit and an exhaustive five-card census.

## Further documentation

- [Architecture](docs/ARCHITECTURE.md), [ruleset](docs/RULESET.md), [math methods](docs/MATH_METHODS.md)
- [Real Maxima/Python validation](docs/MATH_VALIDATION.md), [security/offline/storage](docs/SECURITY_OFFLINE.md)
- [Environment and bounded reuse evidence](docs/ENVIRONMENT.md), [primary-source research](RESEARCH.md), [third-party notices](THIRD_PARTY_NOTICES.md)

Source is kept in local Git. No remote, publication, uploaded histories or public package was created. The supplied mission text is preserved locally and excluded from Git/build archives.
