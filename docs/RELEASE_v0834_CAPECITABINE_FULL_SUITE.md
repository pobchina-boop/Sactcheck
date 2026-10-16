# SACTCheck v0.83.4 — three capecitabine full-suite pathways

Base: v0.83.3, commit `d7af341ab215cdd4d1a6cc329407fedb786851b5`.

This overlay adds the next three colorectal pathways across the clinic and patient services. It is prepared locally; applying the ZIP, committing and pushing deploys it through the existing repository workflow.

| NCCP regimen | Source checked on 16 October 2026 | Schedule represented |
| --- | --- | --- |
| 00216 — capecitabine monotherapy | [Version 8](https://healthservice.hse.ie/documents/6558/216_v8_Capecitabine.pdf) | Oral treatment on Days 1–14 of a 21-day cycle; course depends on indication |
| 00586 — capecitabine + radiotherapy | [Version 3](https://healthservice.hse.ie/documents/6396/586_v3_Capecitabine_825_and_RT.pdf) | Oral treatment on Days 1–5 of a 7-day cycle, concurrent radiotherapy, maximum 5–6 cycles |
| 00623 — bevacizumab + capecitabine | [Version 3a](https://healthservice.hse.ie/documents/6686/623_v3a_Bevacizumab_Capecitabine.pdf) | Day-1 bevacizumab and Days 1–14 capecitabine, every 21 days |

## Connected services

Each pathway includes a source-linked clinical knowledge profile, patient reference with contextual trial evidence, eight-point bodymap, date-free cycle expectations graph, six illustrated logistics steps, discussion draft and printable consent form, two-page guide, treatment passport, SACT/QR card and dedicated oral supportive-care review. PDF copies are included at canonical and legacy deployment paths. Patients enter no dates to use the expectation graph.

The shared clinic workflow also displays a sourced capecitabine medication-review prompt, including warfarin, phenytoin, allopurinol, folate supplements and brivudine. This drug-level prompt applies to existing capecitabine regimens too; it is not a complete interaction-screening service.

Oral capecitabine is classified as minimal-to-low emetogenic risk. Supportive-care material prompts an individual rescue plan and local policy; it does not create an unverified prescription. Bevacizumab administration and relevant line care remain separate from the oral route. These three regimens do not use an ambulatory infusion pump. Radiotherapy logistics explain weekly treatment and cumulative effects without prescribing a radiation dose or subsequent surgical plan.

Trial context uses X-ACT, Hofheinz chemoradiation and AVEX. The patient and clinical profiles state population and schedule limits, including AVEX's older population and lower capecitabine trial dose, and the chemoradiation trial's different tablet schedule. X-ACT evidence is explicitly stage-III colon evidence, not proof of benefit for every indication in the shared monotherapy protocol. The breast library has not been upgraded by this colorectal batch.

## Clinical audit corrections

| Domain | Corrected behaviour | Evidence |
| --- | --- | --- |
| Counts and recurrence | Separate initiation, unscheduled within-cycle and subsequent-dose contexts where NCCP distinguishes them. Table-1 recurrence actions require both recovery counts before a reduced restart is displayed. Unknown timing retains an explicit provisional Table-1 hold and asks for context. | Tables 1; adjacent count guidance |
| General toxicity and diarrhoea | Current toxicity controls immediate interruption; highest prior grade and occurrence control the proposed later dose. Grade-4 exceptional restart requires consultant judgement. | Tables 3–4 |
| Hand-foot syndrome | Hold grade 2–3 until recovery; after grade 3, request the reduction the source leaves unquantified. No invented grade 4 or automatic percentage. | Table 5 |
| Liver tests | Actual results and local ULNs feed exact comparisons. Baseline AST and ALP are separate in 00623. Treatment-related hepatotoxicity is distinct from clinical hepatic impairment. | Table 6 and 00623 eligibility |
| Renal | Preserve exact source boundaries, dialysis limitations and unrounded boundary review. The 00623 discrepancy remains explicitly unresolved. | Tables 2 and supplementary SmPC §4.2 |
| Bevacizumab | Independent proteinuria, BP, bleeding, perforation/fistula, thromboembolism, wound/surgery and other named safety actions. A capecitabine hold does not authorise or stop bevacizumab automatically. | 00623 tables 7–8 and complications |
| Dose display | Percentages refer to the documented starting dose. Competing reductions use the lower percentage and never sum reductions. | NCCP dose tables |
| Missing data | Omitted clinical values remain unassessed. Explicit `missing`/`exists` conditions now work, including the existing temozolomide phase-context rule. Ordinary comparisons keep three-state behaviour. | Engine tests and synthetic assessments |

## Source issues requiring review

1. **00623 renal conflict:** its table 2 specifies 100% at CrCl ≥30, while the [supplementary capecitabine SmPC](https://www.medicines.org.uk/emc/product/14545/smpc) gives 75% at baseline CrCl 30–50 for a 1250 mg/m² starting dose and no reduction for a 1000 mg/m² start. No automatic percentage is chosen in that range. The displayed plan requests consultant/pharmacy reconciliation of the actual starting dose.
2. **Diarrhoea grading:** the NCCP legacy table repeats nocturnal stools across low-grade and grade-2 rows. This ambiguity is disclosed beside the selector; the software does not silently substitute modern stool-count grading.
3. **Severe hepatic impairment:** the supplementary SmPC contraindication is retained for all three regimens; the routine hepatic-adjustment text in 00216/00586 is not treated as permission to administer in severe impairment.
4. **Timing and recovery:** an absent treatment-timing value is not an inferred baseline or within-cycle status. Count-only holds explicitly ask for timing; numeric restart percentages require documented recovery. Reduction percentages do not resolve earlier individual reductions, tablet banding or prescribing decisions.

## Validation and release status

See `validation/colorectal-v0834/VALIDATION.md`, `AUDIT_RESULTS.html`, source-map and case JSONs. Browser testing uses synthetic values entered through actual controls. It is not a human audit, patient-specific treatment recommendation or proof of comparative accuracy over clinicians. Review flags remain false for consultant, oncology pharmacy and clinical-use authorisation. Patient/PPI review is also pending.

The existing colorectal cards and the 00568 reference pathway are retained. The one intentional existing patient-page change corrects the 00446 month-based evidence bar width using the shared renderer. The previous v0.83.3 clinical cases remain in the release gate. Confirm the live v0.83.4 version and the three clinic/patient routes after deployment.
