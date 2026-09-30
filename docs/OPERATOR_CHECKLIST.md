# Operator readiness checklist

These are external/setup prerequisites, not failures of offline guest play.

- **Public hosting: BLOCKED.** No approved destination, domain or HTTPS deployment was supplied. No public site or tunnel was created. Use an approved production host, private storage, a single application instance, TLS reverse proxy, request limits, real backups and a restore exercise. XAMPP remains local-only.
- **Real mail: NOT_RUN.** Configure a TLS SMTP service through server secret references, sender verification and delivery testing. The loopback launcher uses an explicit test inbox and refuses that mode in production. Never use real production credentials in the test edition.
- **External identity: NOT_RUN live.** Google, Facebook, X and Snapchat adapters have separate contract tests. Register eligible apps, configure exact callback URLs and minimal scopes, complete any provider review/access prerequisites and test real login/link/unlink. Only configured, approved adapters become enabled. Instagram personal login is unavailable; Baidu access remains unverified.
- **AI: disabled / live NOT_RUN.** No paid API call was made. Provision a dedicated owner-authorized server key securely and explicitly approve a budget. For local-owner use, the operator must truthfully attest a supported service country. A user profile country never grants eligibility. Public AI fails closed until a reviewed location-enforcement adapter exists. Recheck model/pricing/policy, quotas, moderation, cancellation and provider-side project caps before activation.
- **Administration:** explicitly bootstrap an existing verified account using the local operator tool. There are no default passwords or first-registrant privileges. Enroll and verify MFA before production CP access. Keep recovery codes private and test account recovery.
- **Language/content review:** all new translations and moderation dictionaries are machine-drafted and labelled. Commission linguistic and mathematical review before presenting them as reviewed educational translations. Refer to the per-locale coverage report for remaining English fallback strings.
- **Independent assurance:** obtain the security/privacy/accessibility review appropriate to the planned audience. Automated checks are evidence, not professional certification. Public accounts/community/AI are an adult educational beta.

Keep the offline and online origins' notebook backups separate. Account sync is explicit; never silently upload guest hands. Retain the original HIL archives and the owned deployment backup for rollback.
