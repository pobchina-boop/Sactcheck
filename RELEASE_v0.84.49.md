# SACTCheck 0.84.49 — head-and-neck 5+5 review package

Manual update over v0.84.48, commit `a54aa0e5306c06c0e02f203b30b6f094ad13382c`. No files have been committed, pushed or deployed by this task. Browser/device verification and the 00517 source-version reconciliation remain open. This is a review package, not production release approval.

## Five new authored services

| NCCP | Service | Retrieved source | Handbook pages |
|---|---|---|---:|
|00514|Gemcitabine 1250 alone, nasopharyngeal cancer|v3|19|
|00517|Gemcitabine 1250/cisplatin 80|Linked v2; discrepancy open|23|
|00903|Gemcitabine 1000/cisplatin 80 induction|v1|24|
|00589|Carboplatin 70 mg/m² on Days 1–4 plus fluorouracil with RT|v5|25|
|00591|Carboplatin AUC 4 on Day 1 plus fluorouracil with RT|v4|25|

Each includes assessment rules, clinician workflow and support phases, knowledge/evidence, consent discussion and form, patient portal, a three-page anatomical pack, passport, wallet QR and complete handbook.

Retrospective services: **00315, 00323, 00324, 00332 and 00419/HNSCC**. Freshly retrieved NCCP PDFs match their v48 sources. Their 217 existing patient/download files remain byte-identical. The previous source scenarios were rerun.

## Corrections

- Separate gemcitabine Day 1 and Day 8 count actions, renal/liver boundaries and toxicity thresholds. For 00903, a delayed Day 8 dose is omitted. Preserve prior toxicity and permanent-stop review.
- Update 00589/00591 to the retrieved 2026 versions. Replace obsolete liver thresholds; retain DPD, renal interpretation and count-table gaps; keep component-specific actions.
- Distinguish low-risk gemcitabine alone, moderate-risk four-day carboplatin and high-risk AUC 4. Day 8 support differs from Day 1; later chemoradiotherapy has a separate prescription. Preserve supplied CUH adjunct references.
- Align schedule, tests, radiation relationship, agent risks and source identity across clinician/patient outputs. Show carboplatin, fluorouracil and the separate radiation calendar in the schedule graphic.
- Preserve historical asset records. A separate v49 migration verifies every changed protected file against the exact v48 Git tree.

## Validation and limits

Final results: `validation/head-neck-v08449/validation-summary.json`.

Clinical scenarios: **295/295 new**, plus **181/181 TPF** and **130/130 carboplatin/retrospective** checks. Ten scoped suite integration contracts pass, including 90 PDF mirror checks. New PDFs pass text retention, bounds, page count, QR and card-size checks; representative rendered pages were inspected. Independent clinical, pharmacy and patient/PPI approval remains separate.

**00517 source discrepancy:** the current HSE head-and-neck page links v2; the October 2025 NCIS list names v3. This package follows the retrieved linked v2. Reconcile with NCCP before clinical use; no v3 encoding is claimed.

**Browser checks blocked:** Chromium exits before page load because this environment denies its Unix socket. Desktop/mobile functional and visual checks remain blocked. Deployment, live QR destinations and device/cache behaviour remain unverified. Complete these checks before production deployment.

Coverage after authoring this package: 25 of 30 head-and-neck families have patient services; five remain for authoring. This count does not close the pending source, browser or clinical approval stages.

## Suggested commit

Summary: `v0.84.49: add five head-and-neck suites and repeat five audits`

Description: Add gemcitabine and carboplatin/fluorouracil pathways across assessment, clinician workflow, knowledge, consent and patient documents. Correct day-specific rules, updated hepatic/renal/count tables, support phases and treatment timelines. Retain five previous suites with fresh-source and regression checks. Include asset provenance, PDF/QR evidence and the unresolved 00517 source-version and browser-validation limitations.
