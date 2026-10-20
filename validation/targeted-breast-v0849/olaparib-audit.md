# Olaparib source audit · v0.84.9

Checked 20 October 2026. Shared NCCP regimen 00588 v5b remains shared across gynaecology, GU, breast and GI. New authored patient material is limited to **00588h: adjuvant high-risk early breast cancer**. This is an AI-assisted source reconciliation and software scenario audit, not independent Consultant or oncology-pharmacy validation.

## Sources actually read

- Fresh NCCP v5b, seven pages, from the current catalogue destination: https://healthservice.hse.ie/documents/6397/olaparib_tablet_monotherapy_588.pdf (downloaded through its https://assets.hse.ie/media/documents/olaparib_tablet_monotherapy_588.pdf redirect).
- EMA Lynparza product information downloaded from https://www.ema.europa.eu/en/documents/product-information/lynparza-epar-product-information_en.pdf. Sections 4.2–4.4, 4.6, 4.8 and 5.1 inform administration, precautions, monitoring, mechanism and patient content.
- NCI CTCAE v5, page 4: anaemia and febrile-neutropenia grades. The numeric Hb boundary is grading, not a transfusion prescription.
- OlympiA primary trial: Tutt et al., NEJM 2021, DOI10.1056/NEJMoa2105215. Sequencing requires completion of local therapy before olaparib; the trial interval was at least two weeks and at most twelve weeks.
- Geyer et al., Ann Oncol 2022, PMID36228963, for the prespecified survival analysis.
- Garber et al., Ann Oncol 2026, DOI10.1016/j.annonc.2026.08.002, PMID42636977, for six-year follow-up. Evidence remains population-specific, not an individual prognosis.

SHA-256 digests of the actual downloaded NCCP and EMA PDFs are retained in `olaparib-source-brief.json`.

## Material findings and corrections

1. **Generic explanations were not adequate evidence.** All 15 prior rules used source-placeholder text or incomplete explanations. They are now reconciled; the protocol has 50 explicitly source-linked rules with dated references and olaparib component attribution.
2. **No-dose-adjustment previously emitted 300 mg twice daily.** Normal renal function or Child-Pugh A/B must not reverse an existing toxicity reduction. Those findings now say no new organ-related adjustment and preserve the current prescribed dose.
3. **Unresolved renal/hepatic differences were hidden.** NCCP includes CrCl30 in its 30–50 band, while EMA treats ≤30 as severe. NCCP suggests considering half the original dose in CrCl<30, dialysis and Child-Pugh C; EMA does not routinely recommend these populations (severe renal benefit–risk exception; severe hepatic not recommended). Separate exact30 UI band and source-conflict findings now require specialist reconciliation without an automatic numeric dose.
4. **CYP3A avoidance was lost.** Strong/moderate inhibitors must first be avoided where possible. Exact 100/150 mg twice-daily reductions appear only if co-administration is explicitly confirmed unavoidable. Multiple interaction/organ/toxicity restrictions require one reconciled prescription rather than stacked reductions. Strong/moderate inducers now trigger a distinct efficacy/interaction review.
5. **Febrile-neutropenia restart nuance was incomplete.** Grade4 requires consideration of a two-level reduction, not an automatic one-level restart. A missing grade does not block interruption. Fourth qualifying occurrence still requires cessation. Counts alone still cause the immediate hold, while restart details are reviewed after recovery.
6. **Material SmPC safety domains were absent.** Added severe anaemia/blood toxicity, transfusion dependence, persistent cytopenia after a four-week interruption, suspected/confirmed MDS/AML, suspected/confirmed pneumonitis and drug-induced liver injury pathways. VTE prompts urgent assessment without inventing a universal permanent-stop rule.
7. **Initial-start recovery differs from continuation thresholds.** EMA requires previous blood toxicity to recover to grade1 or better before starting. The NCCP on-treatment ANC≥1/platelets≥100 rule cannot substitute for that initial requirement. An explicit initial-recovery input prevents the inference.
8. **Breast eligibility was descriptive but not executable.** Added indication-gated rules for germline BRCA, HER2, prior chemotherapy, ECOG and the specific high-risk pathology definitions. TNBC and HR-positive pathways are separate. CPS+EG is used only in the relevant HR-positive neoadjuvant pathway; this is not an Oncotype engine.
9. **An ideal start window had been encoded as a hard criterion.** NCCP says ideally start within twelve weeks. A later start now prompts specialist review instead of declaring automatic ineligibility. The two-week radiotherapy/local-treatment gap is clearly attributed to OlympiA rather than labelled an NCCP numerical dose rule.
10. **Shared GU alias incorrectly said HRR-mutated.** Changed to NCCP's BRCA1/2-mutated mCRPC wording. Other tissue indications and their durations are preserved.
11. **Actual UI grading helpers inferred a different source.** ANC and platelet numeric inputs displayed CTCAE v6 bands even though NCCP Table 2 uses direct numeric treatment thresholds without naming a CTCAE version. They now show source-specific NCCP action guidance, with no inferred grades or value-based grading. The initial-start recovery confirmation similarly shows the actual SmPC requirement rather than generic severity anchors. Haemoglobin and the febrile-neutropenia boolean are explicitly pinned to CTCAE v5, matching the encoded Hb rules and the existing FN severity selector. Five regression checks invoke the real `SACTCheckCTCAE.guide` and `gradeForValue` helpers. No global helper or decision thresholds changed.
12. **Source link had changed.** The old mapped filename was inaccessible. Updated metadata to the current catalogue URL and retained its assets redirect as an alternative.

## Longitudinal and patient-content boundaries

- Breast: oral tablets twice daily continuously, up to one year; no planned rest week. Ovarian two-year/no-evidence-of-disease and other indefinite durations must not appear as the breast treatment plan.
- Local treatment and chemotherapy precede olaparib. Endocrine therapy may run alongside olaparib when indicated and can continue after it finishes.
- Baseline and every-four-week FBC, renal and liver profile during the twelve-month course; symptom-triggered extra investigations. Persistent abnormal counts after a four-week interruption need marrow/cytogenetic assessment.
- No olaparib-specific routine echo, ECG, DXA or fixed CT/tumour-marker timetable is introduced. Preserve tests required by prior/other treatments and the breast follow-up plan. Do not copy ovarian trial imaging into adjuvant breast surveillance.
- Oral moderate-to-high emetic risk is retained; supportive care explicitly warns that aprepitant is a moderate CYP3A inhibitor. No generic IV chemotherapy script, mandatory G-CSF or port/pump content is invented.
- Agent-specific anatomy content is limited to nausea/appetite, blood counts/energy, new respiratory symptoms and liver warning signs.

## Verification

`node validation/targeted-breast-v0849/olaparib-source-cases.cjs`: **126/126 passed**, exercising all 50 rules at least once, numerical boundaries, missing-context behaviour, numeric-dose suppression, shared-indication isolation and regimen-dose display.

`node tests/conditional-inputs.test.js`: **7/7 passed**, including immediate partial count/FN/renal results while dependent fields remain explicit gaps.

Strict protocol validation: **0 errors, 0 warnings**. These are engine/module checks, not a claim that browser click-through or independent clinical review is complete.

## Integration notes for the owning developer

- Patient routing must explicitly confirm breast indication before exposing the new00588 suite. A bare code-based registry cannot imply the breast course for ovarian/prostate/pancreatic patients.
- Historical `tests/catalogue-ui-v027.test.js` asserts the obsolete source filename; revise the test to the verified current link.
- Historical `tests/engine.test.js` marks a small old olaparib fixture as a complete assessment. Newly added unentered safety domains must remain unassessed, so this fixture should now expect a partial result; do not weaken actual missing-data behaviour to keep the old assertion.
- Source conflicts above remain deliberately unresolved for Consultant/pharmacist review. `clinical_use_authorised`, `consultant_reviewed` and `oncology_pharmacy_reviewed` remain false.
