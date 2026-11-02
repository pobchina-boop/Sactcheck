# v0.84.28 lung backbone and patient-template audit

Baseline: committed v0.84.27, commit 527b0c12f840f3c4e78f48afc7537d434bb7a037. Source check date: 2 November 2026. Independent clinical/pharmacy and patient/PPI review pending.

Five new suites: 00281 gemcitabine/cisplatin; 00310 gemcitabine/carboplatin; 00304 carboplatin/paclitaxel; 00339 cisplatin/vinorelbine 21-day; 00343 cisplatin/vinorelbine 28-day.

Five retrospective assessments: 00317 and 00318 pemetrexed/platinum; 00271 and 00280 etoposide/platinum; 00621 weekly paclitaxel with a separately authored lung context. Clinical decision rules, active knowledge-base entries, consent content, relative monitoring journeys, patient tools and support-plan routes are integrated. The existing canonical 00621 shared patient content is preserved.

## Principal source findings

- Gemcitabine: distinguish baseline eligibility from on-treatment dose tables; restrict the historical haematological 75% reduction to gemcitabine; retain Day 8 omission/restart inequalities; display the cisplatin renal eligibility conflict and unassigned boundaries for clinician review. 00310 now uses the current v8 source.
- Carboplatin/paclitaxel: restore baseline ANC/indication-specific ECOG checks, first Grade 2 mucositis handling, current-toxicity holds and ambiguous hepatic boundaries. Standalone chemotherapy does not clear a nivolumab combination.
- Vinorelbine/cisplatin: reconcile day-specific schedules, ECOG 0–1, current counts versus prior events, renal and hepatic rules. Distinguish high-risk cisplatin days from minimal-risk vinorelbine-only days; do not infer a day when it is absent.
- Platinum retrospectives: retain the previously audited 156 rules while reviewing fresh source PDFs and improving patient summary, treatment-scope and monitoring explanations. Etoposide oral/IV and radiotherapy/ICI contexts remain explicit.
- Neoadjuvant wording: three 00849 carboplatin backbone explanations incorrectly said two planned doses. They now say up to three, one per neoadjuvant cycle before surgical review. The overall schedules were already correct; the separate 00712 two-dose regimen is unchanged.

Detailed source findings and acceptance cases are in gem/AUDIT.md, vino/AUDIT.md, taxane/AUDIT.md and platinum-retro/AUDIT.md (or the group's named audit document). Source manifests record retrieval method, version and hashes. The gemcitabine source check used web-extracted official PDF content because direct PDF retrieval was unavailable; it is not represented as fresh local PDF-byte verification. The other eight source PDFs were retrieved; four retrospective PDFs matched their previously audited versions byte for byte.

## Validation and regression migrations

The complete npm test:ci expansion passed all 251 commands, including 1,091 new integrated source cases (147 gemcitabine, 232 vinorelbine, 255 taxane and 457 platinum retrospective). PDF validation checked 93 documents / 176 pages and 44 QR destinations. Existing unrelated patient files are checked against the committed baseline; only approved codes and three named 00849 contexts may change.

Historical tests were updated narrowly for the new current coverage count, official HSE assets-domain URL, current source encoding, source-specific grading, exact renal boundaries, explicit treatment days, changed safe outcomes and audited file migrations. Assertions on incomplete inputs, formal approval state, individual rule outcomes, PDF copies and out-of-scope preservation remain active. Previous historical inventory reports retain their historical counts. Trial evidence is qualified by population and treatment setting; no patient-specific survival estimates are produced.

Lung catalogue coverage: 48 of 59 entries have authored service suites (including the selector-backed 00849 contexts). Eleven remain; see lung-coverage.json. Across the application there are 149 canonical records: 148 complete canonical bundles and one context selector, plus 11 separate complete context bundles, for 159 complete bundles. These are content-coverage counts, not clinical approval.

The patient-template rationale, findings, limitations and proposed patient testing are in patient-template/template-audit.md and patient-template/evidence-review.md. No commit, push or deployment was performed for this release.

The delivered overlay was also extracted onto a clean checkout of the exact v0.84.27 baseline, its manifest hashes verified, and all 251 CI commands passed there. See clean-apply-results.json. Final packaging adds this verification record without changing the tested application files.
