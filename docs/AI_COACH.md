# POK AI Coach

Optional server-only explanation service using the official OpenAI JavaScript SDK and Responses API. Gameplay, grading, cards and payouts remain deterministic and offline. It is not a personal ChatGPT account or an official ChatGPT website.

Default: disabled. No API key was available and no paid API call is authorized for this implementation. Automated tests use a labelled mock transport that refuses to start outside test mode. Live provider compatibility is NOT_RUN.

Activation requires a dedicated server secret reference, an explicitly approved nonzero daily/monthly budget, the allowlisted model and an operator-provided supported-location policy. A user's selected country is never an eligibility check. Production cloud use must fail closed until that policy is supplied; do not proxy around geographic restrictions. Provision keys with a trusted secure setup flow, never chat, browser storage, VITE variables, repository files or Codex credentials.

Only a consented question (2000 characters), a stable approved lesson ID, and an optional allowlisted terminal-call calculation are accepted. The server recomputes the formula. No arbitrary URLs, files, community content, full hands, hidden opponent cards, future deck, shell or admin tools are accepted. Text entered by the user remains untrusted, including prompt-injection attempts. There are no model tools.

The provider stream is fully buffered, then moderated before any text is delivered. This sacrifices token-by-token latency to avoid releasing unreviewed partial output. Input moderation also runs. Stop aborts the provider call; emergency disable aborts all in-flight calls. SDK retries are disabled; timeout is bounded. Errors are generic at the HTTP boundary and never return key values.

SQLite BEGIN IMMEDIATE reserves a conservative full-request cost before provider calls. Input tokens use an upper estimate based on UTF-8 bytes plus framing allowance; output is capped at 512 tokens including reasoning. Fixed model pricing is versioned, cached discounts ignored. A mismatch disables coaching for operator review. Unknown charges after cancellation, failure or crash retain the full reservation; completed usage reconciles actual tokens. Daily and monthly global caps, per-user request/token quotas and concurrency limits are enforced before work. Run one application process; horizontal scaling requires a shared admission/concurrency implementation. Configure independent provider-side project caps as defense in depth, not as a replacement for application enforcement.

Private conversation retention defaults to 30 days (configurable 1–90), with owner-only export/delete. Usage records contain counts, estimated costs and user IDs, not prompts. Deleted conversations are not retained in application chat history; database backups have a separate bounded operator retention policy. OpenAI provider retention/policies remain separate.

Primary references inspected 2026-09-30:
- https://developers.openai.com/api/docs/guides/streaming-responses
- https://developers.openai.com/api/docs/guides/moderation
- https://developers.openai.com/api/docs/supported-countries
- https://developers.openai.com/api/docs/models/gpt-5-mini
- https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
- https://github.com/openai/openai-node (Apache-2.0)

Recheck model availability, pricing, supported countries and policy before activation. This release does not claim a security audit or professional poker strategy strength.
