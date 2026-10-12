# Architecture and boundaries

Existing reducer determines legality and chip accounting. Existing worker computes equity. Decision layers derive only supported quantities. Shared cards and matrix preserve card IDs, weighted range semantics and appearance. Temporary study state does not write notebooks. V2 supports one-opponent A/B range comparison and covered heads-up river opening bets with explicit Fold/Call responses. Conditional calling weights are prior weights times declared call probabilities; fold mass is derived, never independently inconsistent.

Known exclusions: raises, Check EV, side pots, rake, refunds, future betting, full GTO and opponent prediction. Monte Carlo intervals concern sampling under fixed assumptions, not whether those assumptions describe an opponent. No external AI, account, SQL, WSL or network dependency is added.

Environment: project-local pinned Node dependencies; Windows Edge preview tested. Native compiler/JDK prerequisites are documented separately. No installation origin is assumed to be the owner's normal site. No deployment, browser data migration or service restart is authorized by source publication. Source repair remains identifiable through its commit and import manifest, without merging private histories.

V3: one factory-validated frozen river snapshot, two explicit response declarations, sequential existing workers and invocation-local reuse of identical completed requests. No comparison confidence interval is invented from individual intervals. Study state is ephemeral; no schema migration or notebook write. See POK_DECISION_EXPLORER_V3.md for exact numerical tolerance, input bounds and reference cases.
