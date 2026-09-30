# Engine selector language coverage

Catalog `src/locales/engines.json` contains **41 distinct language maps × 15 supplied keys = 615 strings**. All requested languages have actual translations for the engine selector, automatic recommendation, browser/offline descriptions, comparison, details, cancellation, calculation, retry, Standard fallback, engine catalog, isolated preview, shared sampler disclosure, execution location and input assumptions. Product identifiers POK, PH and POK Standard intentionally remain unchanged.

Source: implementation-agent machine drafts. **Human linguistic review: NOT_RUN.** No paid API or remote translation service was used. Mechanical completeness does not establish native fluency or mathematical translation correctness.

`tests/engine-i18n.test.ts` verifies the exact supported locale set and key set, nonempty translated text, absence of HTML, replacement glyphs and invisible bidi controls, actual `engineText` lookups without raw keys or fallback, non-English source-clone rejection for explanatory strings, brand preservation and four RTL metadata entries. The application uses semantic direction/isolation rather than embedding invisible direction markers in translations.

The catalog covers these 15 selector strings, not every sentence visible in Odds Lab. The inherited trainer has 41 core/lesson/appearance/mail catalogs; full legacy and platform translation remains partial as recorded in `LANGUAGES.md` and `LANGUAGE_COVERAGE.json`. Existing range-help details and some errors, technical result records, method identifiers and native development-adapter descriptions may still appear in English under the disclosed fallback notice. PH is a hand evaluator inside the POK equity pipeline; translations explicitly preserve the shared weighted-sampler disclosure and do not claim independent equity engines or solver strength.

Browser rendering, RTL layout, font glyphs, keyboard interaction, narrow widths and enlarged text require actual preview-browser checks. This document records catalog tests only; source inspection is not a screenshot or a browser PASS.
