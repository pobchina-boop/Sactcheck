# NCCP00776 / Enhertu source reconciliation — v0.84.9

Checked 20 October2026 against NCCP00776v3b (revision21May2026,6pages), current EMA Enhertu product information (English webpage updated20October2026, downloaded59-page PDF) and the cited pivotal trial records. The JSON audit ledger records all42 rule sources and the EMA PDF hash.

This is a source-reconciliation and software audit. Independent consultant and oncology-pharmacy validation remains pending; clinical use is not authorised by this work.

## Material findings and corrections

| Finding | Correction | Source |
|---|---|---|
| Existing minimum-dose discontinuation rule required dose_level>2, but the selector allowed only0/1/2. It could never fire. | Discontinue when a further reduction is needed at3.2mg/kg, including Grade4 ANC, source-defined febrile neutropenia or late resolution of Grade1 ILD. Otherwise use the actual current level for the next lower dose; do not assume starting dose when absent. | NCCP p3Table1, p4Table3 |
| Grade1 ILD late-resolution action was attached to current Grade1 disease, while actual restarting requires Grade0. | Active Grade1 always remains withheld. After complete recovery: ≤28days may resume the same dose; >28days reduces one level. Previous symptomatic ILD cannot be rechallenged even after resolution. | NCCP p4; EMA §§4.2–4.4 |
| Suspected ILD without an assigned grade had no standalone action. | Withhold while promptly investigating with CT and appropriate respiratory review. Add source-specific clinician steroid examples and taper guidance for symptomatic ILD; patient content explicitly avoids self-treatment. | EMA §4.4 p7 |
| Baseline LVEF eligibility was not separated from ongoing cardiac-dose rules. | Baseline threshold≥50 is explicit. Ongoing40–45% small-decline continuation requires ongoing context. Correct10–20point upper boundary; add confirmed severe recheck and failed/recovered repeat pathways. | NCCP p2,p4 |
| Source monitoring was not expressed against the longitudinal treatment course. | Baseline echo/MUGA and every12weeks, approximately before cycles5/9 on an uninterrupted21-day schedule;4–8weekly if impairment. Specific dose-algorithm declines require reassessment within3weeks. | NCCP p2,p4 |
| No renal assessment domain. | CrCl≥30 follows source no-reduction advice; moderate impairment carries EMA ILD caution. CrCl<30/dialysis explicitly flag NCCP-versus-EMA uncertainty and suppress an automatic dose. | NCCP p3Table2; EMA §4.2 p6 |
| Moderate hepatic advice was an unqualified no-reduction output. | Explicit source discrepancy; bilirubin>1.5×ULN and moderate impairment require specialist reconciliation. NCCP severe-impairment restriction remains. | NCCP p3Table2; EMA §4.2 p6 |
| HER2/previous-treatment requirements were only descriptive. | Add HER2-positive prior anti-HER2 requirement and HER2-low prior metastatic chemotherapy OR early post-adjuvant recurrence condition. Unknown/ultralow/IHC0 categories do not receive automatic eligibility. | NCCP pp1–2 |
| Sparse administration and incomplete abbreviated supportive-medication list. | Add actual5.4/4.4/3.2mg/kg schedule,90/30min infusion, glucose/filter details, no substitution with trastuzumab/T-DM1, and high-risk antiemetic linkage. Dedicated supportive script is integrated by the release owner against current NCCP NCIS guidance. | NCCP pp1,3,5; EMA §4.2 |

## Differences retained for explicit review

- **Indications:** EMA now contains additional breast/tissue indications, including a first-line pertuzumab combination and HER2-ultralow/post-endocrine use. This NCCP00776v3b card remains the two NCCP monotherapy indications only. EU authorisation does not establish NCCP eligibility or Irish reimbursement.
- **Severe renal impairment/dialysis:** NCCP expects no adjustment based on Giraud2023. EMA says dose requirements cannot be established because data are absent. The application requests oncology/pharmacy reconciliation; it does not choose an unsupported numeric dose.
- **Moderate hepatic impairment:** NCCP expects no adjustment with close monitoring; EMA says requirements at bilirubin>1.5×ULN cannot be established. Severe impairment remains not recommended under NCCP.
- **Age18:** The NCCP indication says adults but eligibility literally says>18. The boundary is flagged for interpretation rather than quietly rewritten.
- **Platelets:** FBC monitoring is required, but neither mapped NCCP nor current EMA SmPC has a numerical platelet dose ladder. Platelets/Hb are retained for review without silently importing the US prescribing-information algorithm. The clinical assessment must still address any cytopenia and bleeding.
- **Imaging and markers:** No universal CT/PET or tumour-marker interval is dictated by this NCCP regimen. Response-imaging timing belongs to the documented disease plan. Symptom-triggered pulmonary CT is separate and urgent. No automatic Enhertu-specific DEXA schedule is invented.

## Verification

`node validation/targeted-breast-v0849/enhertu-source-cases.cjs`

**136/136 scenarios and structural checks passed.** The tests call the real assessment engine and dose-display model. They cover ANC and febrile boundaries, ILD resolution at28/29days, previous symptomatic ILD, dose levels0/1/2, first-dose versus ongoing LVEF and strict40/45/50 and10/20point boundaries, rechecks, numeric and selector renal categories, hepatic categories, bilirubin1.5×ULN, exclusions, indication branches and isolated optional inputs. All42 rules have page-specific source links. No missing input is assumed normal.

An isolated platelet value produces a partial/context-needed assessment, not a fabricated drug-specific dose decision. Missing current-dose level produces a request to confirm the level rather than a numeric restart. Permanent-stop findings suppress a simultaneously triggered reduction dose.

## Clinical-content handoff

`enhertu-suite-config.json` contains the complete patient/clinician content brief, source list, drug mechanism, specific anatomy pins, relative21-day cycle rows, baseline/early/ongoing longitudinal matrix, logistics, consent-risk material and two trial summaries. DESTINY-Breast03 uses the2024 long-term analysis with investigator-assessed PFS explicitly distinguished from its original central-review primary endpoint. DESTINY-Breast04 uses the original2022 analysis, checked against EMA SmPC§5.1 pp28–29. The HR-negative subgroup is identified as smaller, and trial medians are not presented as individual prognosis.

## Final rendered grading check

The actual CTCAE renderer initially displayed v6 ANC and platelet bands despite NCCP00776 using v5. Numeric blood and temperature inputs now explicitly bind to v5. Duration-in-hours was incorrectly eligible for the fever numeric calculator, and prior ILD resolution/history fields showed unrelated current-grade panels. Timing inputs now use named NCCP timing guidance with no grade calculator; the historical ILD boolean no longer triggers a current-grade panel. Five additional renderer/calculator tests cover these actual outputs.
