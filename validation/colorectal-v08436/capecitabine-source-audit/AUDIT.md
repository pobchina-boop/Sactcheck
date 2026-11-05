# Capecitabine monotherapy 00216: v0.84.36 source reconciliation

The current NCCP v8 PDF was freshly retrieved on 5 November 2026. Its SHA-256 is unchanged from the previously retained source. The current EMA Xeloda product information was also retrieved. The NCCP tables on pages 3–6 were rendered and visually checked; the PDFs, text extractions, table images and hashes are retained here.

This is a repeat audit of the existing breast/colorectal protocol, not a newly discovered regimen or a first audit. All existing indication IDs, including the shared breast contexts and legacy colorectal alias, and treatment phases are preserved. Independent clinical and oncology-pharmacy review remains pending; this audit does not authorise clinical use.

## Concrete findings and changes

- **Previous-dose protection:** the earlier engine could show a 75% or 50% restart target without knowing the prior prescribed dose. Narrative warnings did not prevent a numeric recommendation above a previously reduced dose. A new optional previous-dose field now gates every numerical toxicity restart. Missing or lower prior doses produce consultant review. Table percentages reference the documented starting prescription and are not compounded.
- **Worst episode and recovery:** numerical haematology restart now requires both current recovery counts and both nadirs for the same episode. A terminal recurrence remains a stop decision even when counts or symptoms have partly improved. A grade 3 episode improving to grade 2 no longer invokes the milder grade 2 recurrence row.
- **Renal starting-dose context:** the previous unconditional 75% output did not distinguish a 1250 mg/m² starting prescription from an individualised 1000 mg/m² start. NCCP table 2 and EMA SmPC 4.2 differ here. The tool now exposes this difference and requires consultant/pharmacy reconciliation for 1000, other or unknown starts. It retains the 50–51 mL/min decimal gap as a review boundary. A lower prior dose cannot be increased even if an inconsistent “baseline” context is supplied.
- **Baseline and hepatic attribution:** the baseline platelet threshold remains distinct from subsequent-cycle recovery. The output explicitly identifies NCCP's caution versus EMA's instruction not to treat below baseline ANC 1.5 or platelets 100. Elevated baseline or assessed non-treatment-related liver tests receive an attribution review rather than an assertion that treatment caused hepatotoxicity. Treatment-related/current uncertain elevations retain the existing hold threshold. Severe hepatic impairment remains a separate contraindication.
- **Additional source safety pathways:** current chest pain prompts interruption and urgent assessment; significant cardiac history prompts review. Grade 2 or greater dehydration, or rehydration with an uncontrolled precipitating cause, prevents restart. Severe skin reactions have a permanent-stop pathway. Coumarin and phenytoin monitoring interactions are explicit.
- **Rendered source attribution:** the production grading guide now explicitly recognises the four diarrhoea/HFS inputs as NCCP source tables, preserves their authored descriptions, and displays the exact table/page badge. This fixes malformed “CTCAE vNCCP…” badges without changing a decision threshold. Four production-guide checks were added.
- **Source grading:** the HFS descriptions now reflect the actual NCCP table 5 definitions. The table does not quantify the reduction after grade 3, so the tool does not invent one. Legacy diarrhoea bands are labelled as source-specific; the nocturnal-stool overlap remains explicit. Generic CTCAE v5 mucositis/other-toxicity UI aids are identified separately from NCCP table 3's CTCAE v4 attribution.

## What remains a clinical/source decision

The baseline-count wording discrepancy, renal adjustment for reduced starting prescriptions, source decimal gap, overlapping nocturnal-diarrhoea definitions, unquantified HFS reduction, and exceptional first grade 4/severe-count restart remain explicit. They are not resolved by silently choosing a generic threshold. Initial partial-DPD dose titration is a distinct source exception to the general prohibition on re-escalation after toxicity.

NCCP 00216d, e and f carry the off-label footnote. The adjuvant TNBC indication is explicitly listed as 00216f on page 1; it is not inferred from the treatment-duration paragraph. The patient/knowledge/support work retains this distinction. Baseline and per-cycle blood counts, kidney and liver tests and pre-treatment DPD testing are source requirements; a universal imaging, tumour-marker or echocardiogram interval is not added.

## Evidence and regression testing

- `source-cases.cjs`: **605/605** fixed source and safety scenarios pass against the production assessment/dose-model modules. All **152/152** rules are exercised. Coverage includes missing/null inputs, invalid types/ranges, exact boundaries, baseline/current/within-cycle distinctions, recurrence, recovery, dose history, source discrepancies and competing findings.
- The identical fixed scenarios run against `00216-before.json`: **411 passed; 194 did not meet the new expectations**. These are test outcomes across related boundaries and attribution checks, not 194 distinct clinical defects.
- The retained `tests/clinical-audit-v0834.test.cjs`: **292 cases pass**. Only 00216 positive fixtures gained explicit original-dose/history/nadir context; its missing-recovery case now expects explicit review. Other capecitabine combination fixtures and numerical-dose assertions remain intact.
- The retained three-regimen full-suite contract passes with `SACT_SUITE_CODES=00216,00586,00623`. Its exact 00216 version/layout fixture is migrated, and the legacy support builder delegates to the real current phase-support generation/check contract. Other regimens retain their existing assertions. The parent release workflow runs the unfiltered global generation check.
- Protocol publishing validation: **382 protocols passed**. CTCAE descriptor validation: **1,596 fields / 7,939 options passed**. These are software checks, not independent clinical approval.
- The source criteria matrix records source precedence and unresolved questions. The rule matrix links every final rule, its condition/action and matching test cases to its source. The before/after protocol hashes are recorded in `audit-summary.json`.

Run the scoped checks from the repository root:

```bash
node validation/colorectal-v08436/capecitabine-source-audit/source-cases.cjs
node tests/clinical-audit-v0834.test.cjs
```

`--before` intentionally reports failures against the preserved earlier JSON. `reconcile.py` recreates this bounded clinical change from that preserved file; do not rerun it after release integration has added newer metadata without reconciling those changes. `build-report.py` refreshes evidence summaries after validation.

Patient, consent, support, anatomy, PDF, QR and browser validation are integrated by the parent release workflow. Those stages are not claimed by this clinical-source report. No commit, push or deployment was performed by this task.
