# v0.84.46 retrospective patient/service audit

Reviewed 9 November 2026 against the five freshly retrieved official NCCP PDFs. The selected five repeat services are carboplatin 00261 in metastatic breast cancer and nivolumab 00483/00484 and pembrolizumab 00455/00558 in lung cancer. Four existing nivolumab melanoma routes receive the same shared-protocol correction and restart-history clarification; they are not counted as four extra selected retrospective audits.

## Findings and changes

| Finding | Source and decision | Affected output |
| --- | --- | --- |
| Four-weekly nivolumab repeatedly borrowed the two-weekly monthly thyroid wording | NCCP 00484 v13a p6 specifies thyroid-function testing before each cycle and when clinically indicated. NCCP 00483 v13a p6 instead specifies monthly testing. Keep the distinction. | 00484 lung and both melanoma profiles; proposed knowledge, support and longitudinal-map updates |
| Restart information could be read as resolved current toxicity allowing treatment again | NCCP 00483/00484 v13a dose-modification sections pp6–9 retain permanent-discontinuation criteria. Explicitly preserve the prior stop decision after symptoms improve; the clinical audit supplies the engine/history checks. | Both nivolumab lung roots and all four existing melanoma profiles; proposed knowledge/support updates |
| 00558 compact monitoring used TSH-only language | NCCP 00558 v13 p5 specifies thyroid-function tests every 3–6 weeks. Preserve the whole test category, including checks between six-weekly infusions when indicated. | 00558 lung compact monitoring |
| Pembrolizumab material-risk and restart wording had been appended twice | Exact duplicate risk entries and exact repeated consent-support sentences removed once, preserving every unique risk and condition. | 00455/00558 lung profiles, compact packs and consent source |
| Carboplatin breast root lacked the current compact three-page source model | Added `patient_summary` from its existing breast-specific content, with ongoing treatment and a rolling card record. The head/neck three-cycle course does not apply to this breast service. | 00261 guide/portal/card source; render required |
| Renal-test timing was too vague for carboplatin preparation | NCCP 00261 v7 p4 requires creatinine within 48 hours when Cockcroft–Gault/Wright is used. Added the timing and the need for trend/dose review with a measured GFR. No patient dose calculation added. | 00261 full reference and compact test map |
| A single-regimen question referred to “these two protocols” | Narrowed wording to this carboplatin regimen without changing the no-universal-heart-scan statement. | 00261 patient reference |

## Scope retained and checked

- Carboplatin breast: Day 1 every 21 days; renal/AUC dosing; no fixed breast course; no automatic borrowing of head/neck radiation or three-cycle plan; prescribed high-risk antiemetics; blood count, renal and liver tests each cycle; infection/bleeding/allergy/hearing/nerve advice; off-label breast discussion preserved. NCCP pp1–5.
- Nivolumab lung: 240 mg IV over 30 minutes or 600 mg SC every 14 days, versus 480 mg IV over 60 minutes or 1200 mg SC every 28 days. Formulations remain alternatives, not milligram equivalents. Progression review remains before cycle 8 versus cycle 4, and immune follow-up remains at least five months. NCCP pp2–6. New HN profiles must not borrow these lung-specific progression-cycle rules.
- Pembrolizumab lung: 200 mg IV every 21 days versus 400 mg IV every 42 days; metastatic first-line versus post-resection adjuvant criteria and duration remain distinct. The individual metastatic 24-month review is not an automatic stop. Thyroid checks remain every 3–6 weeks on both schedules. NCCP 00455 pp3–5 and 00558 pp3–5.
- Original detailed anatomical arrays, all unique agent-risk clauses, purpose, eligibility, administration, evidence and cited-source fields are retained. The consent forms were read: treatment aims, alternatives, material risks, fertility, monitoring and signature fields remain present. The repeated pembrolizumab risk/paragraph was present in generated consent HTML and is corrected at its source.
- Existing immune minimal-emetic-risk plans retain no routine cytotoxic prophylaxis. The freshly downloaded NCIS medical-oncology antiemetic v8 document, p4/Table 1, still has the dedicated carboplatin AUC≥4 triple regimen, without routine olanzapine. It does not specify an end day for the carboplatin-row metoclopramide; the existing prescription-required wording remains necessary.
- The linked HPRA carboplatin product PDF (2 July 2024), freshly retrieved, confirms women’s contraception for at least six months and men avoiding fathering a child for at least three months after treatment, §4.6/p6. The patient text remains product-qualified; this is not presented as a duration specified by NCCP or universal to all brands.
- Current EORTC primary sponsor report dated 27 October 2026 was rechecked for the retained KEYNOTE-091 statement: disease-free survival benefit persists but final overall-survival improvement was not statistically significant. The separate metastatic and adjuvant interpretations remain distinct. Primary CheckMate 017/057 PubMed abstract was also retrieved through web search and confirms the original 3 mg/kg q2-week randomized population, rather than claiming a separate fixed-dose/SC survival trial.

## Integration and verification

`patient-source-changes.json` binds the nine baseline/current patient source hashes. Baseline JSON is preserved under `baseline/`. `check-patients.cjs` passes **119 assertions** across nine profiles, including exact anatomical/unique-clause retention, cycle/thyroid distinctions and no invented finite breast/immune course.

Shared data are proposals for the release owner to merge without overwriting concurrent additions:

- `journey-proposals.json`: 00484 root and melanoma timelines.
- `knowledge-proposals.json`: complete existing nivolumab profiles, including context content; merge the new HN context into these rather than replacing them.
- `phase-support-proposals.json`: four immune root plans with restart-history wording and the 00484 thyroid correction.

The saved patient `suite_release` and prior `patient_summary.template_version` values were retained by this audit, except the newly authored 00261 compact model. A release-owner generator migration may deliberately change them. The new review metadata does not imply all historical trial sources were freshly re-audited.

## Limits

This is patient/service source reconciliation, not the separate clinical decision-engine boundary audit, independent clinician/pharmacy approval, or a claim of deployment. Final HTML regeneration, handbook/guide/consent PDF rendering, preserved-page comparisons, QR decoding, browser review and full regressions remain the release owner's checks. No PDF or browser pass is inferred from these JSON assertions.

Direct CLI requests to the three PubMed pages returned cookie challenges despite HTTP 200, recorded explicitly in `sources/trial-retrieval.json`; those challenge hashes are not article hashes. Previously authored TNT and KEYNOTE-024 quantitative clinician evidence is not newly certified by those failed direct requests. The patient profiles contain no numeric trial metrics and retain their existing evidence qualifications; primary-source evidence reconciliation remains separately reviewable.
