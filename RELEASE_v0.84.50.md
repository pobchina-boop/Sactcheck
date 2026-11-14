# SACTCheck 0.84.50 — final head-and-neck 5+5 review package

Manual changed-file update over v0.84.49 at `15c524e0a843b8d869cc6bc6e3ecc6a26f18f2a6`. This task has not committed, pushed or deployed the changes. Browser/device checks and independent clinical approval remain outstanding.

## Five completed services

| NCCP | Service | Retrieved NCCP version | Handbook pages |
|---|---|---:|---:|
|00294/head_neck|Sorafenib for differentiated thyroid cancer|4|18|
|00242|Vandetanib for RET-positive medullary thyroid cancer|6|20|
|00295|Lenvatinib for differentiated thyroid cancer|6|19|
|00615|Cyclophosphamide, doxorubicin and cisplatin (CAP), salivary gland cancer|2|22|
|00893|Methotrexate 40 mg/m² on Days 1, 8 and 15 of a 28-day cycle|1|18|

These are five newly authored services for existing protocol families, not five additional protocol files. The catalogue remains at 377 protocols. Head-and-neck authoring now covers 30/30 families and 31 treatment contexts; 00385 has separate HNSCC and nasopharyngeal contexts. See `validation/head-neck-v08450/head-neck-completion.json`.

Each service includes source-specific assessment rules, clinical workflow, supportive-care phases, clinician knowledge and evidence, consent, monitoring, patient knowledge, an anatomical three-page pack, passport, wallet card, QR destinations and a complete handbook. Sorafenib's thyroid pathway is explicitly scoped; it is not presented as an HCC or RCC patient service.

Retrospective audits: **00514, 00517, 00903, 00589 and 00591**. Their freshly retrieved NCCP PDF hashes match the previous batch's sources. All 205 existing patient and compatibility-download files remain byte-for-byte unchanged. The 295 previous clinical scenarios were rerun.

## Source and software corrections

- Separate baseline eligibility from treatment-day and recovery decisions, including vandetanib QTc, lenvatinib proteinuria/BP, and CAP renal function. Preserve source boundary gaps and overlapping thresholds as explicit consultant review rather than inventing numerical cut-offs.
- Preserve component-specific reductions and omissions, prior toxicity, dose history and permanent-stop decisions. Methotrexate has no scheduled Day 22 dose in this regimen.
- Use continuous daily treatment and review calendars for the three oral medicines. Wallet recording spaces do not imply six cycles, a fixed treatment duration or a rest week.
- Preserve CAP's supplied local supportive-care adjuncts. Lenvatinib supportive-care choices distinguish doses above 12 mg from doses at or below 12 mg. Clinical and patient schedules derive from the same authored profiles.
- Retain separate source facts and conservative safeguards. CAP pregnancy prompts individual consultant/obstetric assessment; it is not falsely attributed to an absolute pregnancy exclusion in NCCP 00615.
- Keep historical asset approvals intact. The separate v50 transition records exact before identities from Git49 and the reviewed current files. Compatibility tests retain clinical boundary checks and extend the provenance chain.

## Evidence

The final status is in `validation/head-neck-v08450/validation-summary.json`. All commands in the CI pipeline completed across the initial run and documented resumed runs after stale risk, provenance and current-version assertions were corrected. The final site build, deployable-site validation and 48 local HTTP byte comparisons passed. Testing used Node 24.22.1; the configured Node 20 CI runtime still requires its own run after upload. The source retrieval records retain URLs, versions, dates and SHA-256 hashes for ten NCCP PDFs and the three relevant EMA product-information documents.

Clinical scenarios: **263/263 new and 295/295 retrospective**. Ten suite integration checks include 90 PDF mirror comparisons. The five packs retain their anatomical images and complete risk text; wallet size is 85.6 × 54 mm. QR PNGs and PDF-rendered QRs decode to their exact intended routes. Thirty-one companion PDFs contain 52 pages and passed 740 source-unit checks. The five handbooks passed independent text-retention, source, page-bound, chapter, mirror and QR checks. Representative covers, anatomical pages, wallet cards and a monitoring page were visually inspected.

Browser printable-reference HTML receives the existing publication normalizer after book generation; clinical PDF bytes remain those independently verified by the book checks. This normalization expands acronyms, restores SVG attribute case and orders the shared stylesheets. It does not constitute a browser visual test.

## Outstanding limits

- **00517:** the linked NCCP PDF is v2 while the NCIS list names v3. The discrepancy remains unresolved; no v3 encoding is claimed.
- **00893:** the retrieved PDF contains an `00892a` footer/indication typo, while the regimen/file/catalogue identity is 00893. Its printed review date has passed. Retrieval confirms the available source, not renewed clinical approval. The previously unavailable HPRA methotrexate SmPC was not independently retrieved in this batch.
- **Browser:** the required Chromium run was attempted and blocked before page load by `socket() Operation not permitted`. Desktop/mobile interactions and screenshots remain unverified. Real iPhone/Safari, Android installation, camera scans and physical printing remain untested.
- **Deployment:** live URLs, cache updates and deployed QR destinations have not been verified for v50. A local HTTP check does not establish deployment.
- **Clinical governance:** independent clinician, oncology-pharmacy and patient/PPI review is still pending. Example local telephone numbers must be replaced before patient use. The software checks are not clinical approval.

## Suggested commit

Summary: `v0.84.50: complete head-and-neck suites and repeat five audits`

Description: Complete sorafenib DTC, vandetanib, lenvatinib, CAP and methotrexate services across assessment, clinical workflow, knowledge, consent and patient documents. Reconcile source-specific thresholds, dose history and supportive care; provide continuous oral review calendars, anatomical packs, wallet QR cards and complete handbooks. Repeat the previous five source and regression audits, preserve historical assets, and include validation evidence plus the outstanding source, browser and independent-review limitations.
