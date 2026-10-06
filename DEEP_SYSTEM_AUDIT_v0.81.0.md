# SACTCheck v0.81.0 - Deep System Audit and Architecture Consolidation

Audit date: 1 October 2026  
Audit basis: repository `main` at v0.80.4 plus the v0.81.0 consolidation candidate.  
Scope: landing page -> protocol catalogue -> assessment -> regimen workflow -> supportive care -> patient guide/passport -> QR/public routes -> GitHub Pages deployment -> regression/release controls.

## Executive finding

SACTCheck's principal weakness at v0.80.4 was not the deterministic assessment engine. The recent failures were caused by **multiple pieces of code owning the same user-facing behaviour**, combined with release/version drift and a heavy eager-loading startup model.

The most consequential example was patient information. A clinically correct static 00568 guide could coexist with an older JavaScript `about:blank` renderer. Tests proved that the correct PDF existed, but did not prove that the button a clinician pressed opened that PDF. Routing fixes therefore repeatedly changed one layer while an older layer remained capable of bypassing it.

v0.81.0 changes the architectural rule from “new layers may decorate older layers” to **one owner per user-facing responsibility** wherever this release can safely do so without altering deterministic NCCP assessment rules.

## Repository and system scale

Current repository audit metrics:

- 1,451 tracked files, approximately 54.6 MB.
- 376 published protocol records in the canonical protocol index.
- Approximately 11.1 MB of protocol JSON across 382 JSON files under `/protocols`.
- 55 JavaScript files, approximately 1.06 MB.
- 132 test files, approximately 0.55 MB.
- The landing `index.html` is approximately 320 KB and references 45 external scripts, 19 stylesheets and 14 inline script blocks.
- The canonical `/patient/` tree contains 59 files and approximately 13.9 MB.
- The compatibility `/docs/patient/` tree also contains 59 files and approximately 13.9 MB, illustrating the duplication risk that caused prior drift.
- 13 dedicated protected patient pipelines are currently included in the consolidated patient registry.

Clinical-content/governance snapshot from the current repository:

- 376 protocols in the clinical-validation register.
- 452 tissue contexts.
- 171/376 are marked `source_document_checked` in that register.
- 354/376 are marked `software_tests_completed`.
- 0/376 are marked as formally consultant reviewed in the current validation register.
- 0/376 are marked as formally oncology-pharmacy reviewed in the current validation register.
- 30 regimen knowledge profiles, 35 drug profiles and 66 evidence records in the v0.68.0 knowledge layer.
- Regimen-card metadata is complete for 70/376 protocols; 306 retain non-blocking review items.

Those figures are not reasons to stop development; they define the boundary between a technically mature prototype and formal clinical validation/authorisation.

---

# 1. Startup and landing-page audit

## Finding 1.1 - eager protocol fan-out is the largest startup weakness

The legacy protocol loader reads `protocols/index.json` and then eagerly fetches every enabled protocol before it publishes the library. The current index contains 376 protocols. The loader limits concurrency to 8, requests JSON with `cache: "no-store"`, and permits up to four attempts for retryable/network failures.

Mechanism of failure:

1. Landing page JavaScript starts.
2. Protocol index is fetched.
3. Hundreds of individual JSON requests begin.
4. The catalogue is not published until the full concurrency map has settled.
5. A slow network response can occupy a worker through multiple retry/back-off cycles.
6. `no-store` makes repeat visits pay much of the network cost again.

This explains intermittent “stalls” even when no JavaScript exception is present.

### v0.81.0 remediation

A new `runtime-performance-v0810.js` supervisor is installed before the legacy loader. It does not change any protocol or rule content. It:

- replaces `no-store` for same-origin static protocol/data JSON with release-scoped CacheStorage reuse;
- normalises retry URLs so retry query strings do not defeat the cache;
- coalesces identical in-flight requests so prewarming and the legacy loader do not request the same file twice;
- prewarms the protocol library at DOM ready with concurrency 16;
- bounds individual static-data network waits;
- deletes obsolete release caches;
- provides an explicit “loading / taking longer than usual / ready” status rather than an apparently frozen page.

### Residual risk

The first uncached visit still ultimately requires the legacy architecture to obtain hundreds of protocol records. v0.81.0 materially improves repeated starts and failure behaviour, but the long-term optimum is a generated lightweight catalogue snapshot followed by **on-demand full protocol loading when a regimen is opened**. That is the largest remaining performance refactor and should be done before significantly enlarging the library again.

Priority: **P1 performance architecture**.

---

# 2. Runtime ownership and module bootstrapping

## Finding 2.1 - duplicate ownership caused the recent patient-guide regressions

Before consolidation, dedicated patient information could be reached through several independent paths:

- `/patient/<code>/`
- `/docs/patient/<code>/`
- static `guide.pdf`
- static/generated `guide.html`
- `patient-support-v0750.js` dynamic printable output
- Clinic Workflow patient output
- Treatment Passport runtime output
- query-string fallback `?patientSupport=...`

The dangerous part was not route count alone. More than one pathway could independently render patient content.

The screenshot showing `about:blank` proved that the clinician-facing Patient Guide button was invoking a dynamic JavaScript renderer rather than the approved static 00568 PDF.

### v0.81.0 remediation

`patient-asset-registry-v0810.js` is now the single authority for the 13 dedicated patient pipelines.

For a registered regimen:

- canonical portal = `/patient/<code>/`
- patient guide = `/patient/<code>/guide.pdf`
- passport = `/patient/<code>/passport.pdf`
- public QR = `https://sactcheck.com/patient/<code>/`

`patient-support-v0750.js` and `regimen-workflow-engine-v0750.js` resolve dedicated assets through that registry rather than carrying independent route maps.

**Dedicated content always wins.** The historical dynamic `about:blank` patient-guide renderer is retained only for:

- consent-discussion output, which is a distinct clinician document; or
- regimens without a dedicated static patient pipeline.

A dedicated 00568 Patient Guide action therefore cannot legitimately invoke `about:blank` after this release.

Priority after remediation: **closed / regression-protected**.

---

# 3. Patient portal and PDF integrity

## Finding 3.1 - existence tests were insufficient

Earlier release checks mostly established that the PDF existed, contained expected strings/markers, had the expected number of pages and/or that a QR decoded. They did not always prove that the UI action resolved to that asset.

That allowed a high-quality file and an incorrect runtime renderer to coexist.

### v0.81.0 remediation

The release adds `protected-patient-assets-v0810.json`, which records SHA-256 and byte length for each canonical dedicated:

- `index.html`
- `guide.pdf`
- `passport.pdf`
- plus the 00831 contact card where applicable.

The release gate fails if a protected asset changes without explicitly updating the fixture manifest.

The 13 canonical patient portals retain the approved rich anatomy format. 00568 retains the recovered central anatomy with explicit pembrolizumab versus pemetrexed/carboplatin attribution.

The `/docs/patient/` HTML pages are demoted to compatibility redirects. They no longer own an independent full HTML portal. Compatibility PDF copies are required to remain byte-identical to their canonical `/patient/` equivalents.

Priority after remediation: **closed / regression-protected**.

---

# 4. Regimen-card visual stability

## Finding 4.1 - staged card hydration caused visible jumping

The interface historically rendered a base card and then several modules independently added controls after DOM creation. Patient-support, workflow, antiemetic and interface enrichment could therefore arrive in separate visual waves.

### v0.81.0 remediation

`ui-stability-v0810.js` provides atomic action hydration:

- card action space is reserved before enrichment;
- action controls remain visually hidden behind a fixed placeholder until workflow, patient guide, assessment, regimen information and antiemetic capabilities are present;
- a bounded fallback reveals a degraded but usable card if a non-core enrichment never arrives;
- a single observer watches relevant card/control additions rather than repeatedly reinstalling the workflow engine.

This does not change clinical behaviour; it changes when controls become visible.

Priority after remediation: **closed for the current card architecture**.

---

# 5. Clinic Workflow

## Finding 5.1 - app release and workflow-data schema were incorrectly coupled

The workflow JSON remains an independently versioned data contract (`0.78.0`). Later application versions incorrectly caused the workflow engine to expect the public app version, producing messages such as `Expected workflow data 0.79.0`.

### v0.81.0 remediation

The workflow engine explicitly separates:

- public application release; and
- `WORKFLOW_DATA_RELEASE="0.78.0"`.

The workflow also consumes the canonical patient-asset registry instead of owning a separate dedicated-route map.

Priority after remediation: **closed / contract-tested**.

---

# 6. Antiemetic/supportive-care workflow

## Finding 6.1 - the visual traffic light and prescribing output had different owners

The emetogenic badge/accordion displayed source information, while the one-page regimen-derived supportive-care PDF existed elsewhere. Users could therefore click the obvious traffic-light control and not reach the printable script.

### v0.81.0 remediation

`antiemetic-print-v0810.js` becomes the canonical traffic-light action owner:

- clicking the regimen-card emetogenic badge opens `openSupportivePdf()`;
- the expanded card still retains the NCCP source link and an explicit “Open printable antiemetic script” button;
- capture-phase ownership prevents older badge handlers from also opening a conflicting workflow/dropdown action.

Clinical boundary remains unchanged: this is prescribing support and requires current NCCP/local/patient-specific review.

Priority after remediation: **closed / action-owner tested**.

---

# 7. Release/version architecture

## Finding 7.1 - `data/app-release.json` had schema drift

v0.80.4 used:

- `version = 0.80.4`
- `release = "Stability, workflow, antiemetic PDF and expanded patient portal family"`

A long-standing regression test correctly expects `app.release === package.version`. GitHub Pages therefore failed even though many other tests passed.

This is an example of a field changing meaning without updating the contract.

### v0.81.0 remediation

The stable schema is restored:

- `release: "0.81.0"`
- `version: "0.81.0"`
- prose moved to `summary`
- independent module releases remain explicit.

Priority after remediation: **closed / release-gated**.

---

# 8. GitHub Pages and CI

## Finding 8.1 - release-breaking checks ran too late

v0.80.4 CodeQL passed, but Pages failed late in the full test suite on version consistency. This allowed a package to appear locally complete even though production could not deploy it.

### v0.81.0 remediation

The Pages workflow now runs `npm run release:gate` immediately after checkout/setup, before the expensive full regression suite.

The gate includes:

1. public/module version consistency;
2. protected v0.80.4 patient-content fixtures;
3. v0.81.0 architecture/user-journey consolidation checks.

Only after that does the workflow proceed to security checks, protocol rebuild, full tests, Pages build and deployable-site validation.

Release rule going forward:

**A ZIP is locally validated when its local gates pass. It is live validated only after the corresponding GitHub Pages workflow is green and public routes are rechecked.**

Priority after remediation: **closed procedurally**.

---

# 9. Routing and 404 behaviour

## Finding 9.1 - compatibility routing covered only two regimens

The existing 404 handler only recognised 00209 and 00831 while the dedicated family had expanded to 13 routes.

### v0.81.0 remediation

The compatibility map covers all 13 codes. `/docs/patient/<code>/` redirects to canonical `/patient/<code>/`, and old `guide.html` compatibility paths redirect to the static canonical guide PDF.

Priority after remediation: **closed / route-tested**.

---

# 10. Clinical assessment engine and protocol library

## Strengths observed

The repository has unusually broad deterministic regression coverage for a prototype:

- 376 published regimens in the canonical library;
- single-entry assessment behaviour tested across thousands of visible rule inputs;
- tumour-specific library tests;
- dose/schedule and organ-function audit layers;
- CTCAE descriptor tests;
- protocol source-link tests;
- CodeQL and repository security checks;
- explicit separation between source-linked content and formal clinical authorisation.

The recent portal problems did **not** indicate that the core rule engine itself was reverting. They occurred in presentation/orchestration layers added later.

## Remaining clinical-governance weakness

The clinical-validation register currently shows no formal consultant or oncology-pharmacy sign-off. That is the dominant boundary to real-world clinical authorisation, regardless of software test volume.

The current register also shows source-document checks for 171/376 protocols and software tests for 354/376. Those statuses should remain visible and should not be translated into “clinically validated” language until the formal review fields are satisfied.

Priority: **P0 before any claim of clinical validation / routine clinical authorisation**.

---

# 11. Knowledge/evidence layer

The knowledge module currently contains 30 regimen profiles, 35 drug profiles and 66 evidence records. This is a meaningful foundation but covers only a minority of the 376-regimen library.

The architecture correctly states that evidence summaries are educational and do not change deterministic assessment. Preserve this separation.

Recommendation: expansion should continue only after the runtime/release architecture remains stable for several releases. New evidence content should not be allowed to introduce new startup observers or parallel card decorators.

Priority: **P2 after stability and HST-relevant deliverables**.

---

# 12. Regimen-card metadata maturity

Only 70/376 regimen-card metadata records are currently marked complete; 306 retain non-blocking review items. This does not prevent core assessment, but it means display-level summaries such as intent/duration can remain incomplete.

Recommendation: treat this as a structured content-completion programme, not a UI problem. Do not fill missing duration/intent by inference simply to remove badges.

Priority: **P1 content-quality programme**.

---

# 13. Repository maintainability

The repository has accumulated a long sequence of release-specific files, compatibility scripts and historical module version names. Keeping historical evidence is useful, but runtime code should not continue the same additive pattern.

Rules adopted for future releases:

1. **One owner per user-facing action.**
2. **Dedicated content overrides fallback content.**
3. **Public release numbers and module/data schema versions are separate concepts.**
4. **No new MutationObserver or document-wide click interceptor without an explicit ownership review.**
5. **Do not add a second routing table. Extend the canonical registry.**
6. **Do not regenerate a protected patient asset during an unrelated routing/version fix.**
7. **Update protected hashes only after explicit visual/content review.**
8. **Run the release gate before the full suite.**
9. **Never call a release live-verified until Pages is green and public URLs are checked.**
10. **Clinical-rule changes and presentation/runtime changes should be separate commits/releases whenever possible.**

---

# 14. Remaining architectural work after v0.81.0

## P1 - lazy protocol catalogue

The largest remaining runtime improvement is replacing eager fetch of 376 full protocol files with:

1. a generated lightweight searchable catalogue loaded in one request;
2. immediate card rendering from that catalogue;
3. on-demand loading of the full protocol JSON only when assessment/workflow is opened;
4. background optional prefetch after the interface is already usable.

This would materially reduce first-visit request fan-out and should be the next technical refactor if landing-page performance remains unsatisfactory after v0.81.0 caching.

## P1 - true browser end-to-end CI

The v0.81.0 release gate tests the actual routing functions and protected assets, but the repository still lacks a full browser automation test that literally clicks through the rendered page.

Recommended browser journeys:

- load homepage -> search 00568 -> wait for atomic card -> click Patient guide -> assert `/patient/00568/guide.pdf`;
- click Clinic Workflow -> assert workflow modules render without version error;
- click emetogenic badge -> assert PDF viewer opens;
- open patient portal -> guide -> passport -> verify routes;
- repeat for one chemotherapy-only, one ICI/chemotherapy, one oral regimen and 00831 reference regimen;
- run at mobile and desktop viewport widths.

## P2 - eliminate compatibility PDF duplication

The canonical and `/docs/patient/` PDF copies are now hash-locked, which prevents silent divergence. A future hosting layer capable of HTTP redirects could remove the duplicate PDF bytes entirely.

## P2 - external QR dependency for generic fallback

Dedicated guides/passports use protected embedded QRs. Some generic runtime fallback tools still depend on external QR generation. Replace that with a local QR library before generic patient-output expansion.

---

# 15. Release acceptance criteria going forward

A release touching patient/workflow/runtime code is acceptable only when all of the following are true:

- canonical public release schema passes;
- deterministic clinical protocol JSON is unchanged unless the release explicitly declares a clinical-content change;
- protected patient hashes pass or an intentional visual/content review updates them;
- dedicated Patient Guide actions resolve directly to static guide PDFs;
- dedicated passports resolve to static passport PDFs;
- no dedicated output uses the fallback `about:blank` patient renderer;
- workflow data schema validation passes independently of app release;
- antiemetic badge opens printable prescribing support;
- cards do not expose partial action sets while hydrating;
- local regression gate passes;
- GitHub Pages build is green;
- canonical public routes return successfully;
- QR destinations resolve to those same canonical routes.

This converts the lessons from v0.80.1-v0.80.4 into explicit release engineering controls rather than relying on memory.
