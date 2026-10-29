# Ceritinib source audit — v0.84.25

Checked 29 October 2026 against the freshly retrieved NCCP 00340 **version 4**, dated 23 February 2026 (review date 23 February 2031), the current EMA Zykadia product information, NCCP antiemetic classification V6 and NCIS antiemetic guidance V8. Official PDFs, text snapshots and source-table renders are retained in `research/`; hashes, URLs and page references are in `sources.json`.

The proposal retains `nccp-00340-v4`, all **14 original input fields**, and the original indication. It has **49 optional inputs and 52 source-linked rules**. Demonstration values are blank, not normal clinical findings. Independent consultant review, oncology-pharmacy review and clinical-use authorisation remain false.

## Material findings and changes

- **Regimen and indication:** 450 mg orally once daily **with food**, continuously, with no artificial chemotherapy cycle or fixed duration. NCCP 00340a covers adults with ALK-positive advanced NSCLC after crizotinib. The additional first-line EMA licence is described as a different fact and does not expand this suite or claim reimbursement.
- **Food matters:** the clinician-only fasting exception is represented separately. If unable to take food, 450 mg fed maps to 750 mg fasting; 300 mg fed maps to 450 mg fasting; 150 mg fed reaches discontinuation. These are review pathways, not automatic prescriptions. Patients are told not to alternate schedules. Missed-dose and vomiting instructions remain medicine-specific.
- **Hepatic source conflict:** NCCP p2 excludes moderate/severe hepatic impairment; its p3 Table 2 permits Child–Pugh A/B unchanged and C at 67% of the original dose. The EMA SmPC permits moderate impairment and a one-third reduction in severe impairment. The previous automatic 67% action is replaced by explicit Consultant/pharmacy reconciliation. The legacy combined A/B field also requests clarification. No multiplied renal/hepatic/interaction reduction is calculated.
- **Renal limitation:** NCCP expects no adjustment below CrCl 30 or during haemodialysis; EMA advises caution because severe-renal clinical experience is absent. Separate numeric CrCl and dialysis inputs preserve this limitation. Exactly 30 belongs to NCCP’s ≥30 row. Discordant old/new entries cannot suppress adverse evidence.
- **Liver injury:** >5 ×ULN ALT/AST with bilirubin ≤2 ×ULN has its own interruption/recovery pathway. >3 ×ULN transaminases plus >2 ×ULN bilirubin reaches permanent discontinuation only with **on-treatment context and confirmed absence of cholestasis/haemolysis**. Missing cause or timing prompts a hold/review rather than irreversible attribution. Established baseline liver abnormalities do not invoke the on-treatment toxicity rule.
- **Lung injury:** any-grade suspected ILD prompts interruption and investigation. Confirmed treatment-related ILD permanently stops treatment. A symptom grade alone no longer establishes attribution; the previous grade ≥2 automatic permanent-stop shortcut is removed.
- **QT:** the source uses strictly **>500 ms on at least two separate ECGs** for the specific reduced-restart pathway, with recovery to baseline or ≤480 ms and electrolyte correction. Serious arrhythmia plus QTc >500 or change >60 ms is the permanent-stop combination. Exactly 500 and exactly 60 do not satisfy those strict source inequalities. A single high ECG or serious arrhythmia with missing QT data remains independently actionable without claiming a completed source combination.
- **Bradycardia:** symptom severity, contributor status and recurrence determine the pathway. Non-life-threatening events can return to the previous dose only when a contributor is stopped/adjusted and recovery criteria are met. Life-threatening events without a contributor permanently stop; those with an adjusted contributor require the separate lower-dose/frequent-monitoring pathway. Recurrence permanently stops. A simultaneous symptomatic flag cannot incorrectly offer the non-life-threatening unchanged-dose route.
- **Metabolic and pancreatic toxicity:** persistent glucose **>250 mg/dL** despite optimal therapy triggers a hold; inability to achieve adequate control despite optimal management triggers permanent stopping. The source unit is retained to avoid rounding the strict boundary to 13.9 mmol/L. Lipase or amylase grade ≥3 requires interruption to grade ≤1 before a reviewed reduction. Pancreatitis symptoms independently prompt urgent assessment.
- **Dose floor and prolonged holds:** the fed ladder is 450 →300 →150 mg →discontinue. A qualifying further reduction at 150 mg reaches discontinuation; no smaller fed dose is generated. A toxicity interruption longer than 21 days prompts consideration of discontinuation rather than automatic stopping at day 21.
- **Interactions and unsupported borrowed rules:** current CYP3A, CYP2C9, P-gp, acid-reducer and cardiac interactions are reviewed explicitly. The inherited CK >5 ×ULN automatic hold rule has no ceritinib basis in NCCP/EMA and becomes contextual review. Severe rash remains actionable but does not borrow another TKI’s numerical restart table. Source grading is not falsely labelled CTCAE v5.
- **Support and monitoring:** the previous minimal/low oral emetic map is corrected to **oral moderate/high**. The support plan uses individual daily oral prophylaxis with QT/interaction review, not a copied infusion regimen. Liver monitoring is every 2 weeks for the **first 3 months**, then monthly; FBC/renal profile and fasting glucose every 4 weeks; ECG after 1 month then clinically indicated. Pulse/BP, electrolytes and pancreatic enzymes follow risk/symptom assessment.

## Evidence and service content

`authoring.json` supplies the full patient/reference, anatomy, consent aid content, monitoring table, relative treatment journey, practical guide, supportive plan, clinician KB rationale and evidence fields. The separate consent profile is `proposed/ceritinib-consent-profile.json`.

ASCEND-5 is the matched post-crizotinib/platinum phase III comparison: PFS 5.4 versus 1.6 months, HR 0.49 (95% CI 0.36–0.67), at median follow-up 16.5 months. It tested **750 mg fasting**, not the current fed schedule, and does not establish an overall-survival gain. ASCEND-8 separately supports the lower fed dose through pharmacokinetic/dose-optimisation work; its principal efficacy analysis was treatment-naive and is explicitly not represented as a post-crizotinib outcome. Patient-facing evidence contains no numerical prognosis or survival claim. Current therapy ranking, eligibility and prescribing still require individual clinical review.

## Validation

`node validation/targeted-lung-v08425/ceritinib/source-cases.cjs` passes **333/333** checks in proposed mode. Cases use the real assessment engine and dose-action renderer, with boundary negatives, missing-domain handling, old-field compatibility, competing findings, source conflicts, indication/food context, monitoring and evidence checks. The final proposal passes strict protocol validation. The latest integrated form also passes 333/333 checks after application, including the final explicit liver-context refinement.

The tests demonstrate encoded behaviour against these source-derived cases, not independent clinical validation. Final browser, document-layout, QR, suite integration and release checks are owned by the release integrator.

## Files for integration

- `proposed/00340-ceritinib-monotherapy.json`
- `proposed/ceritinib-consent-profile.json`
- `authoring.json`
- `source-cases.cjs`, `source-results.json`, `legacy-fields.json`
- `sources.json`, this audit, reproducible `build-proposal.py` and `build-authoring.py`

Historical migration assertions should now expect `RENAL_LT30_REVIEW` and `HEPATIC_C_CONFLICT` instead of the old `OF590_00340_CERI_RENAL` and `OF590_00340_CERI_CHILD_C` automatic actions. Unresolved sources require professional reconciliation; do not reinstate a quantified hepatic dose to satisfy a legacy test.
