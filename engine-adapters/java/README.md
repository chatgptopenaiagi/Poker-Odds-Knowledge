# POK experimental river adapter

This folder contains the reviewed headless adapter, fixed build recipe, Windows process guard, dependency lock, notices and real verification records for TexasHoldemSolverJava. The detailed provenance, definitions and limitations are in `docs/architecture/JAVA_SOLVER_REVIEW.md`.

## Local operator setup

Run these from the project root using an existing PowerShell 7 and JDK 21 or newer. These commands were exercised on the development machine; they do not install a JDK or change system environment settings.

```powershell
pwsh -NoProfile -File engine-adapters/java/Configure-Runtime.ps1
pwsh -NoProfile -File engine-adapters/java/build.ps1
node --import tsx engine-adapters/java/verify.ts
```

The configuration helper resolves actual `java.exe` and `pwsh.exe` applications from the current process's command lookup, or accepts explicit `-JavaPath` and `-GuardShellPath` arguments. It writes a **new** ignored `.pok-strategy/runtime.json` containing approved executable paths and hashes. An existing matching configuration is verified without modification; a changed runtime or different supplied path requires explicit local review and is never silently overwritten. The build also needs the same JDK's `javac.exe` and `jar.exe`.

If pinned source/dependencies are missing, `build.ps1 -Download` permits the documented GitHub sparse checkout and four hash-pinned official Maven downloads. Without this explicit switch, missing inputs stop the build. The download path needs internet once; solving needs no internet. The output is `.solver-tools/java-build/pok-river-solver.jar` plus a build manifest. It is a thin JAR requiring the four `.solver-tools/java-deps` artifacts; it is not a standalone executable or Android library. Include all `notices` if packaging those artifacts. The existing main application launcher/backend owns authenticated job execution; this folder creates no listener or persistent service.

## Fixed CLI protocol

The adapter reads one bounded UTF-8 JSON request from stdin and emits newline-delimited JSON progress followed by one result. A fresh process handles each request. `example-request.json` and `example-result.json` are an original real weighted river case and its actual measured result. The canonical TypeScript wrapper is `server/strategy-adapter.ts`; callers should use it for runtime/dependency verification, OS guarding, cancellation, budget enforcement and strict result validation rather than spawning Java themselves.

The raw solve request has `schema:1`, `op:"solve"`, five `board` cards, `dead` cards, two arrays of weighted concrete `ranges`, integer `pot` and `effectiveStack`, `betSizes`, `raiseTo`, `maxRaises`, `iterations` and `deadlineMs`. Actor zero is OOP; actor one is IP. Range card strings use `Tc`, `Ah` and similar rank/suit notation. No path or command field is accepted. Only a complete heads-up river tree with the specified bet sizes and at most one full raise is modeled.

The result includes normalized input ranges, all public nodes and combo policies, compatible assignment count, joint weight, conditional action EV, reach, profile values, best responses, trace and metric definitions. Raw `COMPLETE` indicates only that iterations finished. Application readiness additionally requires a quality threshold. Zero-reach conditional-EV fallbacks are labelled and unsuitable for grading. `op:"info"` reports the bounded adapter identity; `op:"evaluate"` is a development comparator diagnostic, not a strategy API.

Do not feed simulator-only hidden cards into a live decision request. Solve only explicitly constructed range study or completed-hand review inputs. Offline play, authoritative cards, payouts and lessons do not depend on Java.

## Evidence

- `BUILD_VERIFICATION.json`: sanitized actual compiler/artifact/dependency inventory.
- `VERIFICATION.json`: eight real process/comparator/validation/guard test groups.
- `docs/strategy/SOLVER_QUALITY.json`: 18 independent LP/PokerKit checks for six original scenarios.
- `docs/strategy/JAVA_POKERKIT_VERIFICATION.json`: 10,011 independent ranking checks.

The old upstream project is unmaintained. A small-tree quality gate is evidence for that defined abstraction; it does not solve full poker or establish production safety. No public service, paid API call, Android solver execution, system install or deployment is performed by these scripts.
