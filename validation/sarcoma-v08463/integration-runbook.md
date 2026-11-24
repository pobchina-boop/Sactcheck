# v0.84.63 integration and preservation

The delivered v62 working state contains22,456files, authenticated by manifest6265aaf2cca13c16b96d230c07bdd415b9aa298c734b88b8b18cd2f4b6d505d7 and migration0f5793f73b38a0395bc6841eac6dd7f132dd2031b47388c4815cad80033708c9. Actual Git remains c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c(v59). Reconstruct the working baseline from its preceding migration; never infer a v62 Git commit.

The five additional services are00420,00463,00100,00596,00680, all base patient routes with unchanged national IDs. The selected preceding-five routes receive only consent-form HTML/PDF corrections; `document_routes` remains the newfive and `corrective_consent_routes` separately lists00374,00228/liposarcoma,00205/sarcoma,00462,00554. Their oldbooks remain byte-identical, supported by an actual body-source dependency trace and an explicit historical broad-input fingerprint transition. Expected counts are377protocols,283registeredcodes,316bundleroutes and324visualroutes. MAP29weeks and mifamurtide36weeks are reference courses with treatment-visit/infusion records, not203/252day repeating cycles.

Clinical acceptance authenticates original candidates, named-product/CNS corrections, six appended qualitative review rules, exact integration metadata and13 source-reviewed input definitions. Original650author and197independent reports remain immutable. Their known pre-grading raw639/650 and191/197 outcomes and all17 source-adjudicated differences remain visible. The MAP prior febrile-neutropenia definition now accepts0/3/4, with1/2 invalid/incomplete; any resulting historical replay delta is separately enumerated. No clinical dose rule is bundled into grading changes. Fresh100current-five and87focused checks are distinct from20adjudicated controls,4other-product controls and retained seven-context347/five-context123 replays.

The preceding five-service retrospective gate requires97/100 raw primary passes with exactly three retained severity assumptions, plus18 supplemental assertions over15 additional inputs(115uniqueinputs/118assertions total). It must not present these as100 raw passes.

Freeze package.json and all shared document inputs before generating PDFs. Apply patient data only after authenticating both exact clinical transition manifests. Check every reference-course caption, all stable download links, full generic/agent consent risks and the first-page monitoring summaries before initial HTML freeze. Mifamurtide is innate immune therapy; its separately prescribed concurrent chemotherapy checklist must not become checkpoint-inhibitor consent. Preserve complete supplied CUH reference rows as display-only material, source discrepancies and explicit phase exceptions. Current v63 has9phases/71rows; the179row external review also includes future v64 material and must not be reported as all integrated in v63.

Generate scoped knowledge HTML before complete-pathways/overview publication; new routes do not yet have knowledge.html. Stop dependent steps when prerequisite generation fails. Generate a representative MAP then mifamurtide pack before remaining routes. Keep full handbooks separate from three-page guides. After books generate knowledge-print browser HTML, apply only scoped final publication and prove source/PDF bytes unchanged if the output-only normalization occurs after source freeze. Require zero pending publication changes before the global design check. No placeholder PDFs or whole-catalogue regeneration.

Run bounded current checks with GIT_NO_LAZY_FETCH=1 and GIT_TERMINAL_PROMPT=0. Keep all blocked historical assertions enabled. The unchanged environment lacks historical Git objects and browser sockets; do not repeat those deterministic failures. On a capable full checkout, run the historical availability guard before full test:ci.

```bash
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 180 --output validation/sarcoma-v08463/logs/scoped-final -- npm run test:sarcoma-v08463
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 120 --output validation/sarcoma-v08463/logs/design-final -- npm run patient:design:check
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 120 --output validation/sarcoma-v08463/logs/pages-final -- npm run build:pages
```

Complete all in-repository reports/notes/logs before migration. Keep transient rendering stages external and retain required verifier fixtures. Record the exact approved migration only once final content is settled, then use external logs:

```bash
node tools/record-sarcoma-migration-v08463.cjs
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 120 --output ../sarcoma63-evidence/preservation-final -- npm run test:sarcoma-preservation-v08463
```

Parent performs exact current-source/_site/HTTP acceptance, freezes the working manifest and packages repository-relative files without a wrapper directory. Persist and post each completed batch immediately. No automatic commit, push or deployment is authorised; software/source-text review does not confer human oncology/pharmacy approval.
