# SACTCheck v0.84.30 — lung completion and closeout audit

Checked 2 November 2026 against committed v0.84.29, commit `0b5e878939e7bebed44de7dc99214a0104563a34`. This is a local release package; no commit, push or deployment has been performed.

## Coverage

All **59/59 NCCP lung catalogue entries** now have authored service coverage. This denominator includes shared protocols and mesothelioma; it does not claim to include every possible lung regimen or confer clinical approval.

| New suite | Current NCCP source | Patient scope |
| --- | --- | --- |
| 00214 bevacizumab 7.5 mg/kg | v8 | Lung component; partner chemotherapy requires its own plan |
| 00279 cisplatin/etoposide/RT | v8 | Reference IV q21d limited-stage lung schedule |
| 00309 weekly carboplatin/paclitaxel/RT | v6a | Seven-week stage III NSCLC course |
| 00372 nintedanib/docetaxel | v6 | Separate combination and continuation packs |
| 00456 cisplatin/etoposide/RT | v4 | q28d; two initial cycles and possible further treatment |
| 00561 carboplatin/etoposide/RT | v5 | q28d; two-cycle course |

The overall service inventory contains 160 canonical records, including three selectors: 157 complete canonical bundles plus 16 separate context bundles, totalling 173 complete patient bundles. The recorded authoring/retrospective queue is empty; independent clinical review is not complete.

## Source reconciliation and clinical changes

All 59 official source PDFs were freshly retrieved. Three of the six new-suite source versions changed: 00279 v7 to v8, 00309 v6 to v6a, and 00561 v4 to v5. All 53 previously authored regimens retain their recorded versions. Forty-nine PDFs exactly match earlier binary hashes; four earlier audits had no binary hash, so only version continuity can be established for those four. Fresh hashes are retained.

- **00279:** Explicit mutually exclusive dose/schedule choices cover 12 clinician alternatives. Preserve IV versus oral etoposide, split cisplatin, carboplatin substitution and q21/q28 choices. Cisplatin infusion is now one hour. Preserve source blood-count boundaries and gaps, baseline renal exclusion versus dose-table conflict, oral product-information differences and component-specific organ-function rules. The patient pack covers the reference IV q21d lung schedule only; other choices require personalised patient information.
- **00309:** Seven weekly treatments are distinguished from CROSS and other treatment settings. Preserve its own baseline/on-treatment blood counts, ALT/bilirubin dosing and decimal gaps; remove imported generic neuropathy dose percentages. Radiotherapy remains separately prescribed. No trial consolidation regimen becomes an automatic patient plan.
- **00456/00561:** Keep the distinct renal and hepatic tables rather than copying one etoposide scheme between protocols. Exact ambiguous blood-count boundaries and source/product-information conflicts remain review decisions. Where renal percentage information coexists with specialist review, it is explanatory text without a calculated numerical dose. The generic engine's wider action-priority behavior has not been redesigned in this release.
- **00214:** Preserve lung/colorectal clinical indications and component scope. Distinguish urine dipstick escalation from quantitative protein thresholds, blood-pressure assessment and other bevacizumab risks. Do not invent renal/hepatic dose percentages or present PFS evidence as an overall-survival benefit.
- **00372:** Separate docetaxel Day 1 with nintedanib Days 2–21 from continuous nintedanib continuation in 28-day review cycles. Continuation needs at least four prior combination cycles and a team decision. Reconcile eligibility, counts, liver injury, organ-function uncertainty, reduced-dose restart, minimum-dose intolerance and serious adverse events. Supportive care follows the selected phase and actual treatment day.

Full source findings, provenance, boundary cases and limitations are in `rt21/audit.md`, `rt28/audit.md`, and `bev-nintedanib/audit.md` within the validation folder. Individual source manifests retain official URLs, versions and hashes. Sources are evidence for software encoding, not clinical approval.

## Retrospective closeout

The existing 53 suites and their 59 actual lung routes underwent structural/source-reference checks, including incomplete assessments, dose models, knowledge/evidence, consent coverage, supportive care, anatomy, monitoring, chronology and assets. All 413 pre-existing PDF/download-copy pairs matched. All 2,893 existing rule source URLs were present, with no unexpected explicit version mismatch. This was **not** a new rule-by-rule clinical revalidation of all 53 suites.

Implemented corrections:

- 00284 and 00614: remove an unrelated inherited trial citation, use unique regimen-specific trial IDs, add the missing NCIS v8 reference, and regenerate affected source lists and journeys. Clinical endpoint estimates remain unchanged.
- 00281, 00304, 00310 and five 00849 backbone pages: resolve undeclared timeline citation anchors using each bundle's actual sources.
- Register three already-referenced supportive-care script aliases, resolving 13 references across nine lung codes while retaining their existing risk classifications.
- Correct release inventory bookkeeping and explicitly reconcile historical baseline records that were not part of the committed repository.

The repeated structural/source-reference audit reports **zero remaining findings within those checks**. The initial report is retained alongside the post-correction report. This does not imply all clinical content has independent approval.

## Patient information

Seven new complete patient routes have three-page guides. Page 1 distils purpose, broad treatment sequence, cycle schedule, intra-cycle expectations and before/during/after checks. Regimen-required, conditional and team-agreed tests are distinguished; no universal imaging or tumour-marker interval is invented. Page 2 provides anatomical toxicity information. Page 3 provides an 85.6 × 54 mm front/back wallet card, one-sided A4 print/cut/fold instructions, contacts, treatment QR and phone home-screen guidance.

Finite courses use cycle stamps; the weekly regimen uses W1–W7. Other courses use a rolling record. A stamp records completed treatment and does not approve another dose. The QR contains a public treatment URL, not patient details or live cycle tracking. Nintedanib phases have different QRs. The shared bevacizumab and cisplatin/etoposide QR routes include a scope check.

The five patient sections are My treatment, Between treatments, My tests and checks, My treatment passport, and Help and resources. The new template applies to this batch. Earlier lung and breast portal migration remains a separate rollout. EXAMPLE telephone numbers must be replaced before patient use; additional local resources await Paul’s supplied information.

## Verification

- **551 integrated source cases:** 153 RT21/weekly cases, 198 RT28 cases, and 200 bevacizumab/nintedanib cases.
- **259/259 CI leaf commands passed**, including the historical regression suites and deployable-site checks. The ZIP was also applied to a fresh checkout of the exact committed v0.84.29 baseline, where all 259 CI leaf commands passed.
- **66 PDFs / 131 pages**, identical canonical/download copies and **30 QR decoding checks**. All seven main packs have exactly three pages.
- **5652 existing patient files unchanged**, with 26 explicitly scoped existing-file changes and no unexpected patient-file changes.
- Browser checks verified patient tab navigation, phase selection and nintedanib treatment-day supportive-care switching. Rendered guide collages and representative detailed consent/passport/timeline/card pages were visually inspected; final wallet spacing was corrected and rechecked.

Physical printing/cutting, mobile home-screen installation and clinical/PPI usability have not been validated by these automated checks. Independent consultant, oncology-pharmacy and patient/PPI review remains pending.
