# POK optional online platform

The offline Apache build and online staging build share the tested client engine. The online edition adds one Hono TypeScript process and one SQLite database. It does not host multiplayer poker, deal shared cards or accept client-reported stack awards. Neither the offline engine nor its worker imports the server.

Pinned runtime packages: Better Auth 1.7.6 (MIT), Hono 4.13.11 (MIT), @hono/node-server 2.1.3 (MIT), Nodemailer 10.0.13 (MIT-0). Node's built-in SQLite avoids native addon compilation. The actual test runtime and SQLite version are recorded in the delivery/test report. No production PostgreSQL/MySQL claim is made.

`server/app.ts` exports `createPlatform` with explicit database path, origin, dedicated authentication secret, mode and optional mail/provider integrations. Better Auth creates/migrates its pinned authentication schema. `server/migrations/001-platform.sql` is the versioned idempotent application migration; it records applied versions and contains profile, session-CSRF, factor-verified session, content, reports, sanctions, appeals, blocks, notifications, study sync, dictionaries, settings and audit tables. SQLite foreign keys are enabled. WAL and bounded busy timeout are used. Auth sessions and rate limits persist in the database; no Redis is required.

All custom APIs require database-backed authentication. Writes additionally require the exact Origin, JSON content type, and a random session-bound CSRF token returned by `/api/me`. Requests are limited to 1.1 MB before parsing; study payloads have a further 1 MB cap and use the existing trusted study validator. Completed hands are replayed, grades recomputed, invalid and unfinished records refused. Remote sync is opt-in and revision-checked. Conflicts return 409; no last-writer-wins silent overwrite occurs. A guest notebook is never automatically uploaded, erased or attached to an arbitrary login.

The content API persists questions, answers, chat, private feedback and feedback replies. It supplies bounded pagination/search, author edit/delete rules, resolved status, reports, blocks and notifications. Feedback is visible only to its author and authorized support staff. Replies retain the parent access rule. Chat polling rechecks current sessions and sanctions on every request; it is moderated study discussion, not multiplayer poker. Content is restricted plain text, rendered by React; no HTML, attachments or remote image uploads are accepted.

Role capabilities:

| Role | Permitted platform administration |
|---|---|
| Owner | All sections and role grants; last owner protected |
| Administrator | Users/read, moderation, support, content, defaults, provider readiness and audit |
| Moderator | Reports/chat, questions, moderation cases and appeals |
| Support | Private feedback and responses |
| Content editor (`editor`) | Questions, language coverage and dictionary changes |
| Member | Own profile/history, ordinary community actions and own reports/appeals |

Sensitive writes require a session created within ten minutes. Production CP requests additionally require an actual factor-verified session recorded after Better Auth TOTP/backup-code verification; simply setting the user's MFA flag is insufficient. The first registrant is an ordinary member. A local operator may bootstrap the first owner only from an existing verified account; production additionally requires enrolled MFA. Subsequent role changes require the owner. No password viewer, key viewer, shell endpoint or SQL console exists.

API groups: `/api/auth/*` maintained authentication, `/api/me`, `/api/profile`, `/api/content`, `/api/reports`, `/api/blocks`, `/api/notifications`, `/api/appeals`, `/api/sync`, `/api/account/export`, `/api/admin/:section`. Root-owned coach routes mount through the same authorization helpers. `GET /api/status` exposes readiness and nonsecret appearance defaults. Administration language coverage is computed from the shipped catalogs, not hardcoded completeness claims.

Boundaries: no live external OAuth, SMTP delivery or public deployment has been verified. Production requires operator setup, current policy review, hosting, TLS, secret management, backups, external integration approvals and independent security review. This release is an experimental educational beta, not a professional-security certification.
